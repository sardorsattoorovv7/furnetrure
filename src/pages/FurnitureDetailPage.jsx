import { useEffect, useState, lazy, Suspense as ReactSuspense, useRef, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { useGLTF, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { getFurniture } from "../api/furniture";
import { useCameraStream } from "../hooks/useCameraStream";

const FurnitureViewer3D = lazy(() =>
  import("../components/FurnitureViewer3D").then((m) => ({ default: m.FurnitureViewer3D }))
);

export default function FurnitureDetailPage() {
  const { idOrSlug } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [viewMode, setViewMode] = useState("image");
  const [arMode, setArMode] = useState(false);
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  
  // AR boshqaruv holatlari
  const [arPosition, setArPosition] = useState({ x: 0, y: 0, z: -0.8 });
  const [arRotation, setArRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  
  // Drag uchun refs
  const dragStartRef = useRef({ x: 0, y: 0 });
  const posStartRef = useRef({ x: 0, y: 0, z: 0 });
  const arPositionRef = useRef(arPosition);
  const arRotationRef = useRef(arRotation);

  useEffect(() => { arPositionRef.current = arPosition; }, [arPosition]);
  useEffect(() => { arRotationRef.current = arRotation; }, [arRotation]);

  const camera = useCameraStream();

  // Mebel yuklash
  useEffect(() => {
    setLoading(true);
    setViewMode("image");
    setArMode(false);
    getFurniture(idOrSlug)
      .then((data) => {
        setItem(data);
        const savedAR = localStorage.getItem(`ar_pos_${idOrSlug}`);
        if (savedAR) {
          try {
            const parsed = JSON.parse(savedAR);
            if (parsed.position) {
              setArPosition(parsed.position);
              arPositionRef.current = parsed.position;
            }
            if (parsed.rotation !== undefined) {
              setArRotation(parsed.rotation);
              arRotationRef.current = parsed.rotation;
            }
          } catch (e) {
            console.error("Saqlangan AR holatini o'qishda xato:", e);
          }
        }
      })
      .finally(() => setLoading(false));
  }, [idOrSlug]);

  // AR video stream
  useEffect(() => {
    if (arMode && camera.stream && videoRef.current) {
      videoRef.current.srcObject = camera.stream;
      videoRef.current.play()
        .then(() => console.log('✅ AR video playing'))
        .catch(err => console.error('❌ AR video error:', err));
    }
  }, [arMode, camera.stream]);

  // AR holatini saqlash
  const saveARTransform = useCallback((pos, rot) => {
    if (!idOrSlug) return;
    localStorage.setItem(`ar_pos_${idOrSlug}`, JSON.stringify({ position: pos, rotation: rot }));
  }, [idOrSlug]);

  // AR dan chiqish
  const closeAR = useCallback(() => {
    camera.stop();
    setArMode(false);
    setIsDragging(false);
  }, [camera]);

  // AR ni ochish
  const openAR = useCallback(async () => {
    if (!item?.model_3d) return;
    const stream = await camera.start();
    if (stream) {
      const heightM = item.height_mm / 1000;
      let defaultZ = -0.8;
      if (heightM > 1.5) defaultZ = -1.2;
      if (heightM > 2.0) defaultZ = -1.8;
      
      setArPosition({ x: 0, y: 0, z: defaultZ });
      setArRotation(0);
      setArMode(true);
      
      console.log('📏 Real size (m):', 
        (item.width_mm / 1000).toFixed(2), '×',
        (item.height_mm / 1000).toFixed(2), '×',
        (item.depth_mm / 1000).toFixed(2)
      );
    }
  }, [item, camera]);

  // ===== POINTER EVENTLAR =====
  const handlePointerDown = useCallback((e) => {
    e.stopPropagation();
    setIsDragging(true);
    const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
    const clientY = e.clientY || e.touches?.[0]?.clientY || 0;
    
    dragStartRef.current = { x: clientX, y: clientY };
    posStartRef.current = { 
      x: arPositionRef.current.x, 
      y: arPositionRef.current.y,
      z: arPositionRef.current.z 
    };
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (!isDragging) return;

    const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
    const clientY = e.clientY || e.touches?.[0]?.clientY || 0;

    const dx = (clientX - dragStartRef.current.x) * 0.008;
    const dy = -(clientY - dragStartRef.current.y) * 0.008;
    const dz = dy * 0.3;

    const newPos = {
      x: posStartRef.current.x + dx,
      y: posStartRef.current.y + dy,
      z: posStartRef.current.z + dz
    };

    setArPosition(newPos);
    saveARTransform(newPos, arRotationRef.current);
  }, [isDragging, saveARTransform]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // ===== SCROLL =====
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !arMode) return;

    const onWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.15 : 0.15;
      setArPosition(prev => {
        const newPos = { ...prev, z: prev.z + delta };
        saveARTransform(newPos, arRotationRef.current);
        return newPos;
      });
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [arMode, saveARTransform]);

  // ===== FUNKSIYALAR =====
  const resetPosition = useCallback(() => {
    const heightM = item?.height_mm / 1000 || 1;
    let defaultZ = -0.8;
    if (heightM > 1.5) defaultZ = -1.2;
    if (heightM > 2.0) defaultZ = -1.8;
    
    const defaultPos = { x: 0, y: 0, z: defaultZ };
    const defaultRot = 0;
    setArPosition(defaultPos);
    setArRotation(defaultRot);
    saveARTransform(defaultPos, defaultRot);
  }, [item, saveARTransform]);

  const moveX = useCallback((step) => {
    setArPosition(prev => {
      const newPos = { ...prev, x: prev.x + step };
      saveARTransform(newPos, arRotationRef.current);
      return newPos;
    });
  }, [saveARTransform]);

  const moveY = useCallback((step) => {
    setArPosition(prev => {
      const newPos = { ...prev, y: prev.y + step };
      saveARTransform(newPos, arRotationRef.current);
      return newPos;
    });
  }, [saveARTransform]);

  const moveZ = useCallback((step) => {
    setArPosition(prev => {
      const newPos = { ...prev, z: prev.z + step };
      saveARTransform(newPos, arRotationRef.current);
      return newPos;
    });
  }, [saveARTransform]);

  const rotateY = useCallback((step) => {
    setArRotation(prev => {
      const newRot = prev + step;
      saveARTransform(arPositionRef.current, newRot);
      return newRot;
    });
  }, [saveARTransform]);

  if (loading) return <div className="page-loading">Yuklanmoqda...</div>;
  if (!item) return <div className="empty-state">Mebel topilmadi</div>;

  const images = item.images || [];
  const hasModel = !!item.model_3d;
  const heightM = item.height_mm / 1000;
  const widthM = item.width_mm / 1000;
  const depthM = item.depth_mm / 1000;

  // ===== AR REJIMI =====
  if (arMode) {
    return (
      <div 
        ref={containerRef}
        style={{
          position: 'fixed',
          top: 0, left: 0,
          width: '100%', height: '100%',
          zIndex: 9999, background: '#000',
          overflow: 'hidden', touchAction: 'none',
          userSelect: 'none'
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* CAMERA VIDEO */}
        <video
          ref={videoRef}
          autoPlay playsInline muted
          style={{
            position: 'absolute',
            top: 0, left: 0,
            width: '100%', height: '100%',
            objectFit: 'cover', zIndex: 1,
            backgroundColor: '#000'
          }}
        />

        {/* 3D SAHNA */}
        <div 
          style={{
            position: 'absolute',
            top: 0, left: 0,
            width: '100%', height: '100%',
            zIndex: 2, background: 'transparent',
            pointerEvents: 'auto'
          }}
        >
          <Canvas
            camera={{ position: [0, 0.6, 0.6], fov: 45 }}
            style={{ width: '100%', height: '100%', background: 'transparent' }}
            gl={{ 
              alpha: true, 
              antialias: true, 
              powerPreference: "high-performance"
            }}
          >
            {/* LIGHTING */}
            <ambientLight intensity={0.7} />
            <directionalLight position={[3, 5, 3]} intensity={1.5} />
            <directionalLight position={[-3, 4, -2]} intensity={0.8} />
            
            <ReactSuspense fallback={
              <mesh position={[arPosition.x, heightM/2, arPosition.z]}>
                <boxGeometry args={[widthM, heightM, depthM]} />
                <meshStandardMaterial color="#4a90d9" transparent opacity={0.7} />
              </mesh>
            }>
              <RealisticARFurniture 
                item={item}
                glbUrl={item.model_3d.glb_file}
                position={arPosition}
                rotation={arRotation}
                onPointerDown={handlePointerDown}
                isDragging={isDragging}
                showGrid={showGrid}
              />
            </ReactSuspense>
          </Canvas>
        </div>

        {/* BOSHQARUV TUGMALARI */}
        <div style={{
          position: 'absolute',
          bottom: 30, left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 3,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 5,
          background: 'rgba(0,0,0,0.85)',
          padding: '10px 14px',
          borderRadius: 20,
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
          maxWidth: '95%'
        }}>
          <button style={btnStyle} onClick={() => rotateY(-0.3)} title="Chapga aylantirish">↺</button>
          <button style={btnStyle} onClick={() => rotateY(0.3)} title="O'ngga aylantirish">↻</button>
          
          <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.1)' }} />
          
          <button style={btnStyle} onClick={() => moveX(-0.15)} title="Chapga">◀</button>
          <button style={btnStyle} onClick={() => moveX(0.15)} title="O'ngga">▶</button>
          <button style={btnStyle} onClick={() => moveY(0.15)} title="Tepaga">▲</button>
          <button style={btnStyle} onClick={() => moveY(-0.15)} title="Pastga">▼</button>
          
          <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.1)' }} />
          
          <button style={{...btnStyle, background: 'rgba(46,204,113,0.25)'}} onClick={() => moveZ(-0.15)} title="Yaqinroq">🔍+</button>
          <button style={{...btnStyle, background: 'rgba(46,204,113,0.25)'}} onClick={() => moveZ(0.15)} title="Uzoqroq">🔍−</button>
          
          <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.1)' }} />
          
          <button style={{...btnStyle, background: 'rgba(46,204,113,0.4)'}} onClick={resetPosition} title="Markazga qaytarish">⟲</button>
          <button style={{...btnStyle, background: 'rgba(255,165,0,0.3)'}} onClick={() => setShowGrid(!showGrid)} title="To'rni ko'rsatish/yashirish">⊞</button>
          <button style={{...btnStyle, background: 'rgba(231,76,60,0.6)'}} onClick={closeAR} title="Chiqish">✕</button>
        </div>

        {/* MEBEL MA'LUMOTLARI */}
        <div style={{
          position: 'absolute',
          top: 20, left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 3,
          background: 'rgba(0,0,0,0.8)',
          padding: '8px 20px',
          borderRadius: 14,
          color: 'white',
          textAlign: 'center',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(15px)'
        }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>🪑 {item.name}</div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>
            <span style={{ color: '#4a90d9', fontWeight: 500 }}>
              {widthM.toFixed(2)}m × {depthM.toFixed(2)}m × {heightM.toFixed(2)}m
            </span>
            <span style={{ margin: '0 8px', opacity: 0.3 }}>|</span>
            <span style={{ opacity: 0.4, fontSize: 11 }}>
              X:{arPosition.x.toFixed(2)} Y:{arPosition.y.toFixed(2)} Z:{arPosition.z.toFixed(2)}
            </span>
          </div>
        </div>

        {/* BOSHQARUV KO'RSATMASI */}
        <div style={{
          position: 'absolute',
          bottom: 105,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 3,
          color: 'rgba(255,255,255,0.3)',
          fontSize: 11,
          background: 'rgba(0,0,0,0.3)',
          padding: '4px 16px',
          borderRadius: 20,
          backdropFilter: 'blur(5px)',
          pointerEvents: 'none',
          whiteSpace: 'nowrap'
        }}>
          🖱️ Sudrab istalgan tomonga · G'ildirak yaqin/uzoq
        </div>
      </div>
    );
  }

  // ===== ODDIY DETAL SAHIFASI =====
  return (
    <div className="page furniture-detail">
      <div className="furniture-detail-gallery">
        {viewMode === "3d" && hasModel ? (
          <ReactSuspense fallback={<div className="viewer3d-empty">3D ko'rinish yuklanmoqda...</div>}>
            <FurnitureViewer3D
              glbUrl={item.model_3d.glb_file}
              heightMm={item.height_mm}
              className="furniture-detail-main-image"
            />
          </ReactSuspense>
        ) : (
          <div className="furniture-detail-main-image">
            {images[activeImage] ? (
              <img src={images[activeImage].image} alt={item.name} />
            ) : (
              <div className="furniture-card-placeholder large">🪑</div>
            )}
          </div>
        )}

        {viewMode === "image" && images.length > 1 && (
          <div className="furniture-detail-thumbs">
            {images.map((img, i) => (
              <button
                key={img.id}
                className={`thumb ${i === activeImage ? "active" : ""}`}
                onClick={() => setActiveImage(i)}
              >
                <img src={img.image} alt="" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="furniture-detail-info">
        <h1>{item.name}</h1>
        <div className="muted">SKU: {item.sku}</div>

        <div className="furniture-detail-price">
          {Number(item.price).toLocaleString("uz-UZ")} {item.currency}
        </div>

        <table className="spec-table">
          <tbody>
            <tr><td>O'lcham</td><td>{item.dimensions_display}</td></tr>
            {item.material && <tr><td>Material</td><td>{item.material}</td></tr>}
            {item.color && <tr><td>Rang</td><td>{item.color}</td></tr>}
            {item.weight_kg && <tr><td>Og'irligi</td><td>{item.weight_kg} kg</td></tr>}
          </tbody>
        </table>

        {item.description && <p className="furniture-description">{item.description}</p>}

        <div className="furniture-detail-actions">
          {hasModel ? (
            <button
              className="btn-primary"
              onClick={() => setViewMode((m) => (m === "3d" ? "image" : "3d"))}
            >
              {viewMode === "3d" ? "🖼 Rasmga qaytish" : "🧊 3D ko'rish"}
            </button>
          ) : (
            <button className="btn-primary" disabled>3D model mavjud emas</button>
          )}
          <button
            className="btn-secondary"
            disabled={!hasModel}
            onClick={openAR}
            style={{
              background: 'linear-gradient(135deg, #4a90d9, #357abd)',
              color: 'white',
              padding: '14px 32px',
              fontSize: '18px',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(74,144,217,0.5)',
              transition: 'all 0.3s'
            }}
          >
            📷 AR da ko'rish
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== REALISTIC AR FURNITURE =====
function RealisticARFurniture({ 
  item, 
  glbUrl, 
  position, 
  rotation,
  onPointerDown,
  isDragging,
  showGrid
}) {
  const { scene } = useGLTF(glbUrl);
  const cloned = useMemo(() => scene?.clone(true), [scene]);
  const [scaleFactor, setScaleFactor] = useState(1);

  useEffect(() => {
    if (!cloned) return;
    try {
      const box = new THREE.Box3().setFromObject(cloned);
      const size = new THREE.Vector3();
      box.getSize(size);
      
      if (size.y > 0 && item.height_mm > 0) {
        const targetHeight = item.height_mm / 1000;
        let baseScale = targetHeight / size.y;
        if (baseScale < 0.001) baseScale = baseScale * 1000;
        if (baseScale > 100) baseScale = baseScale / 100;
        setScaleFactor(baseScale);
        console.log('📏 Real scale factor:', baseScale);
      }
    } catch (err) {
      console.error('❌ Scale error:', err);
      setScaleFactor(1);
    }
  }, [cloned, item.height_mm]);

  if (!scene || !cloned) {
    const heightM = item.height_mm / 1000;
    const widthM = item.width_mm / 1000;
    const depthM = item.depth_mm / 1000;
    return (
      <mesh position={[position.x, heightM/2, position.z]}>
        <boxGeometry args={[widthM, heightM, depthM]} />
        <meshStandardMaterial color="#4a90d9" transparent opacity={0.6} />
      </mesh>
    );
  }

  const heightM = item.height_mm / 1000;
  const widthM = item.width_mm / 1000;
  const depthM = item.depth_mm / 1000;

  return (
    <group 
      position={[position.x, 0, position.z]}
      rotation={[0, rotation, 0]}
    >
      {/* FURNITURE MODEL */}
      <primitive 
        object={cloned} 
        scale={scaleFactor}
        position={[0, heightM / 2, 0]}
        onPointerDown={onPointerDown}
      />
      
      {/* SHADOW */}
      <ContactShadows
        position={[0, -0.01, 0]}
        opacity={isDragging ? 0.5 : 0.35}
        scale={Math.max(widthM, depthM) * 2}
        blur={1.5}
        far={2}
        color="#000000"
      />
      
      {/* FLOOR GRID */}
      {showGrid && (
        <mesh 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, -0.002, 0]}
          onPointerDown={onPointerDown}
        >
          <planeGeometry args={[Math.max(widthM, depthM) * 3, Math.max(widthM, depthM) * 3]} />
          <meshStandardMaterial 
            color={isDragging ? "#2ecc71" : "#4a90d9"} 
            transparent 
            opacity={isDragging ? 0.15 : 0.06}
            depthWrite={false}
            side={THREE.DoubleSide}
            roughness={0.5}
            metalness={0.1}
          />
        </mesh>
      )}
      
      {/* OUTLINE - DRAG HOLATIDA */}
      {isDragging && (
        <mesh 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, 0.001, 0]}
        >
          <planeGeometry args={[widthM * 1.4, depthM * 1.4]} />
          <meshBasicMaterial 
            color="#2ecc71" 
            transparent 
            opacity={0.2}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}

// ===== STYLE =====
const btnStyle = {
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'white',
  padding: '6px 10px',
  borderRadius: '8px',
  fontSize: '14px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  pointerEvents: 'auto',
  minWidth: '34px',
  minHeight: '34px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backdropFilter: 'blur(5px)'
};