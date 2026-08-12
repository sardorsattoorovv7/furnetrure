import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { checkCompatibility, listFurniture } from "../api/furniture";
import { createProject, createRoom, createPlacement } from "../api/projects";
import { PlacedFurniture } from "../components/PlacedFurniture";
import { useCameraStream } from "../hooks/useCameraStream";

const STATUS_TEXT = {
  compatible: "🟢 Mos",
  warning: "🟡 Qisman mos",
  incompatible: "🔴 Mos emas",
  unchecked: "Tekshirilmoqda...",
};

// "project" mode: taps raycast onto a floor plane (y=0), so placements get
// x/z metre coordinates that feed the real compatibility engine and can be
// saved as a Loyiha - same semantics the old WebXR hit-test flow produced,
// just without a real detected floor (this floor is assumed, not measured).
// "quick" mode: taps raycast onto a vertical plane facing the camera, so a
// tap anywhere on screen places the model right there. No measurement
// pretence, no save/compatibility - purely "see it through the camera".
const FLOOR_Y = 0;
const CAMERA_PROJECT = { position: [0, 1.5, 3.2], lookAt: [0, 0, -1] };
const CAMERA_QUICK = { position: [0, 0, 0], lookAt: [0, 0, -1] };
const QUICK_PLANE_Z = -2.2;

let placementIdCounter = 1;

function raycastFromPointer(event, gl, camera, plane) {
  const rect = gl.domElement.getBoundingClientRect();
  const ndc = new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1
  );
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(ndc, camera);
  const point = new THREE.Vector3();
  const hit = raycaster.ray.intersectPlane(plane, point);
  return hit ? point : null;
}

function ARSceneContent({
  mode,
  selectedFurniture,
  placed,
  setPlaced,
  selectedPlacedId,
  setSelectedPlacedId,
  draggingId,
  setDraggingId,
}) {
  const { gl, camera } = useThree();

  const plane = useMemo(
    () =>
      mode === "project"
        ? new THREE.Plane(new THREE.Vector3(0, 1, 0), -FLOOR_Y)
        : new THREE.Plane(new THREE.Vector3(0, 0, 1), -QUICK_PLANE_Z),
    [mode]
  );

  const placeAt = useCallback(
    (point) => {
      if (!selectedFurniture) return;
      const newItem = {
        id: placementIdCounter++,
        furnitureId: selectedFurniture.id,
        name: selectedFurniture.name,
        glbUrl: selectedFurniture.model_3d?.glb_file,
        widthM: selectedFurniture.width_mm / 1000,
        depthM: selectedFurniture.depth_mm / 1000,
        heightM: selectedFurniture.height_mm / 1000,
        widthMm: selectedFurniture.width_mm,
        depthMm: selectedFurniture.depth_mm,
        heightMm: selectedFurniture.height_mm,
        x: point.x,
        y: mode === "quick" ? point.y : 0,
        z: mode === "quick" ? QUICK_PLANE_Z : point.z,
        rotationY: 0,
        compatibilityStatus: "unchecked",
        compatibilityReasons: [],
      };
      setPlaced((prev) => [...prev, newItem]);
      setSelectedPlacedId(newItem.id);
    },
    [mode, selectedFurniture, setPlaced, setSelectedPlacedId]
  );

  // Tap on empty space: place a new item (or drop the one being dragged).
  const handleBackgroundPointerDown = (event) => {
    const point = raycastFromPointer(event, gl, camera, plane);
    if (!point) return;
    if (draggingId != null) return; // ignore stray taps while dragging an object
    placeAt(point);
  };

  const handleBackgroundPointerMove = (event) => {
    if (draggingId == null) return;
    const point = raycastFromPointer(event, gl, camera, plane);
    if (!point) return;
    setPlaced((prev) =>
      prev.map((p) =>
        p.id === draggingId
          ? { ...p, x: point.x, z: mode === "quick" ? p.z : point.z, y: mode === "quick" ? point.y : 0 }
          : p
      )
    );
  };

  const endDrag = () => setDraggingId(null);

  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[2, 4, 2]} intensity={1} />

      {/* Invisible plane covering the view - catches taps for placing new
          items and pointer moves while dragging an existing one. */}
      <mesh
        rotation={mode === "project" ? [-Math.PI / 2, 0, 0] : [0, 0, 0]}
        position={mode === "project" ? [0, FLOOR_Y, 0] : [0, 0, QUICK_PLANE_Z]}
        visible={false}
        onPointerDown={handleBackgroundPointerDown}
        onPointerMove={handleBackgroundPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
      >
        <planeGeometry args={[40, 40]} />
        <meshBasicMaterial />
      </mesh>

      {placed.map((item) => (
        <PlacedFurniture
          key={item.id}
          item={item}
          isSelected={item.id === selectedPlacedId}
          showFootprint={mode === "project"}
          onSelect={setSelectedPlacedId}
          onDragStart={(id) => setDraggingId(id)}
        />
      ))}
    </>
  );
}

function CameraBackground({ stream }) {
  const videoRef = useRef(null);
  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);
  return <video ref={videoRef} className="ar-camera-video" autoPlay playsInline muted />;
}

export default function ARPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const camera = useCameraStream();

  const [mode, setMode] = useState(null); // null | "quick" | "project"
  const [furnitureList, setFurnitureList] = useState([]);
  const [selectedFurnitureId, setSelectedFurnitureId] = useState(searchParams.get("furniture") || "");
  const [placed, setPlaced] = useState([]);
  const [selectedPlacedId, setSelectedPlacedId] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    listFurniture({ page_size: 100 }).then((data) => {
      const items = (data.results ?? data).filter((f) => f.has_3d_model);
      setFurnitureList(items);
    });
  }, []);

  const selectedFurniture = furnitureList.find((f) => f.id === Number(selectedFurnitureId));
  const sessionActive = camera.status === "granted";

  // Compatibility check only makes sense in "project" mode, where x/z are
  // real floor coordinates - reuses the same deterministic backend engine
  // used by the Projects flow (furniture/compatibility.py).
  useEffect(() => {
    if (mode !== "project" || placed.length === 0) return;
    let cancelled = false;

    async function runChecks() {
      const updated = await Promise.all(
        placed.map(async (item) => {
          const obstacles = placed
            .filter((o) => o.id !== item.id)
            .map((o) => ({
              center_x: o.x,
              center_z: o.z,
              width_mm: o.widthMm,
              depth_mm: o.depthMm,
              height_mm: o.heightMm,
              rotation_y_deg: (o.rotationY * 180) / Math.PI,
            }));
          try {
            const result = await checkCompatibility({
              furniture_id: item.furnitureId,
              position: { x: item.x, z: item.z },
              rotation: { y: (item.rotationY * 180) / Math.PI },
              room: {},
              obstacles,
            });
            return { ...item, compatibilityStatus: result.status, compatibilityReasons: result.reasons };
          } catch {
            return item;
          }
        })
      );
      if (!cancelled) setPlaced(updated);
    }

    const timeout = setTimeout(runChecks, 250);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, placed.map((p) => `${p.id}:${p.x}:${p.z}:${p.rotationY}`).join(",")]);

  function rotateSelected(deltaDeg) {
    setPlaced((prev) =>
      prev.map((p) =>
        p.id === selectedPlacedId ? { ...p, rotationY: p.rotationY + (deltaDeg * Math.PI) / 180 } : p
      )
    );
  }

  function removeSelected() {
    setPlaced((prev) => prev.filter((p) => p.id !== selectedPlacedId));
    setSelectedPlacedId(null);
  }

  async function handleSaveProject() {
    if (placed.length === 0) return;
    setSaving(true);
    setSaveMsg("");
    try {
      const project = await createProject({ name: `AR loyiha ${new Date().toLocaleDateString("uz-UZ")}` });
      const room = await createRoom({ project: project.id, name: "AR xona" });
      for (const item of placed) {
        await createPlacement({
          room: room.id,
          furniture: item.furnitureId,
          position_x: item.x,
          position_y: 0,
          position_z: item.z,
          rotation_x: 0,
          rotation_y: (item.rotationY * 180) / Math.PI,
          rotation_z: 0,
        });
      }
      setSaveMsg("Saqlandi!");
      setTimeout(() => navigate(`/projects/${project.id}`), 800);
    } catch {
      setSaveMsg("Saqlashda xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  }

  function exitSession() {
    camera.stop();
    setMode(null);
    setPlaced([]);
    setSelectedPlacedId(null);
    setDraggingId(null);
    setSaveMsg("");
  }

  const camConfig = mode === "quick" ? CAMERA_QUICK : CAMERA_PROJECT;

  if (!sessionActive) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>Kamera orqali ko'rish</h1>
        </div>
        <p className="muted">Mebel tanlang, rejimni belgilang va kamerani oching.</p>

        <FurniturePicker
          furnitureList={furnitureList}
          selectedFurnitureId={selectedFurnitureId}
          setSelectedFurnitureId={setSelectedFurnitureId}
        />

        <div className="ar-mode-choice">
          <button
            type="button"
            className={`ar-mode-btn ${mode === "quick" ? "active" : ""}`}
            onClick={() => setMode("quick")}
          >
            <strong>Oddiy ko'rish</strong>
            <span>Ekranning istalgan joyiga qo'yib ko'ring. Saqlanmaydi.</span>
          </button>
          <button
            type="button"
            className={`ar-mode-btn ${mode === "project" ? "active" : ""}`}
            onClick={() => setMode("project")}
          >
            <strong>Loyihaga joylashtirish</strong>
            <span>Moslik tekshiruvi ishlaydi, keyin Loyiha sifatida saqlash mumkin.</span>
          </button>
        </div>

        <button
          className="btn-primary"
          disabled={!selectedFurniture || !mode}
          onClick={() => camera.start()}
        >
          📷 {camera.status === "requesting" ? "Kamera ochilmoqda..." : "Kamerani ochish"}
        </button>

        {camera.status === "denied" && (
          <p className="ar-camera-error">
            Kameraga ruxsat berilmadi. Brauzer sozlamalaridan kamera ruxsatini yoqing va qayta urinib ko'ring.
          </p>
        )}
        {camera.status === "unsupported" && (
          <p className="ar-camera-error">Bu qurilma/brauzer kameraga kirishni qo'llab-quvvatlamaydi.</p>
        )}
      </div>
    );
  }

  return (
    <div className="ar-page">
      <CameraBackground stream={camera.stream} />

      <Canvas
        className="ar-canvas"
        gl={{ alpha: true }}
        camera={{ position: camConfig.position, fov: 60 }}
        onCreated={({ camera: cam }) => cam.lookAt(...camConfig.lookAt)}
      >
        <ARSceneContent
          mode={mode}
          selectedFurniture={selectedFurniture}
          placed={placed}
          setPlaced={setPlaced}
          selectedPlacedId={selectedPlacedId}
          setSelectedPlacedId={setSelectedPlacedId}
          draggingId={draggingId}
          setDraggingId={setDraggingId}
        />
      </Canvas>

      <ARHud
        mode={mode}
        placed={placed}
        selectedPlacedId={selectedPlacedId}
        onRotateLeft={() => rotateSelected(-15)}
        onRotateRight={() => rotateSelected(15)}
        onDelete={removeSelected}
        onExit={exitSession}
        onSave={handleSaveProject}
        saving={saving}
        saveMsg={saveMsg}
      />
    </div>
  );
}

function FurniturePicker({ furnitureList, selectedFurnitureId, setSelectedFurnitureId }) {
  if (furnitureList.length === 0) {
    return <div className="empty-state">3D modeli bor mebel topilmadi. Avval admin panelda GLB yuklang.</div>;
  }
  return (
    <select
      className="ar-furniture-select"
      value={selectedFurnitureId}
      onChange={(e) => setSelectedFurnitureId(e.target.value)}
    >
      <option value="">Mebel tanlang...</option>
      {furnitureList.map((f) => (
        <option key={f.id} value={f.id}>
          {f.name} ({f.dimensions_display})
        </option>
      ))}
    </select>
  );
}

function ARHud({ mode, placed, selectedPlacedId, onRotateLeft, onRotateRight, onDelete, onExit, onSave, saving, saveMsg }) {
  const selected = placed.find((p) => p.id === selectedPlacedId);

  return (
    <div className="ar-hud">
      <div className="ar-hud-top">
        <button className="ar-hud-btn" onClick={onExit}>
          ✕ Chiqish
        </button>
        {!selected && (
          <div className="ar-hud-hint">
            {mode === "quick" ? "Ekranga bosing - mebel o'sha yerga qo'yiladi" : "Pol'ga qarating va bosing - mebel joylashadi"}
          </div>
        )}
      </div>

      {selected && (
        <div className="ar-hud-item-panel">
          <div className="ar-hud-item-name">{selected.name}</div>
          {mode === "project" && (
            <>
              <div className={`ar-hud-status status-${selected.compatibilityStatus}`}>
                {STATUS_TEXT[selected.compatibilityStatus]}
              </div>
              {selected.compatibilityReasons?.length > 0 && (
                <div className="ar-hud-reasons">{selected.compatibilityReasons[0]}</div>
              )}
            </>
          )}
          <div className="ar-hud-controls">
            <button className="ar-hud-btn" onClick={onRotateLeft}>
              ↺
            </button>
            <button className="ar-hud-btn" onClick={onRotateRight}>
              ↻
            </button>
            <button className="ar-hud-btn danger" onClick={onDelete}>
              🗑
            </button>
          </div>
        </div>
      )}

      {mode === "project" && placed.length > 0 && (
        <div className="ar-hud-bottom">
          <div className="ar-hud-count">{placed.length} ta mebel joylashtirildi</div>
          <button className="ar-hud-btn primary" onClick={onSave} disabled={saving}>
            {saving ? "Saqlanmoqda..." : "💾 Loyiha sifatida saqlash"}
          </button>
          {saveMsg && <div className="ar-hud-save-msg">{saveMsg}</div>}
        </div>
      )}
    </div>
  );
}