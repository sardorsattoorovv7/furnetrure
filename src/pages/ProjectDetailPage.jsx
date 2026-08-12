import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getProject, createRoom, createPlacement, deletePlacement } from "../api/projects";
import { listFurniture } from "../api/furniture";

const STATUS_LABEL = {
  compatible: { text: "🟢 Mos", cls: "ok" },
  warning: { text: "🟡 Qisman mos", cls: "warn" },
  incompatible: { text: "🔴 Mos emas", cls: "fail" },
  unchecked: { text: "Tekshirilmagan", cls: "" },
};

function RoomBlock({ room, furnitureOptions, onChanged }) {
  const [furnitureId, setFurnitureId] = useState("");
  const [x, setX] = useState(1);
  const [z, setZ] = useState(1);
  const [busy, setBusy] = useState(false);

  async function handleAdd(e) {
    e.preventDefault();
    if (!furnitureId) return;
    setBusy(true);
    try {
      await createPlacement({
        room: room.id,
        furniture: Number(furnitureId),
        position_x: Number(x),
        position_y: 0,
        position_z: Number(z),
        rotation_x: 0,
        rotation_y: 0,
        rotation_z: 0,
      });
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(id) {
    await deletePlacement(id);
    onChanged();
  }

  return (
    <div className="room-block">
      <h3>{room.name}</h3>
      {(room.width_mm || room.height_mm) && (
        <div className="muted">
          {room.width_mm && `${room.width_mm}×${room.depth_mm}mm`} {room.height_mm && `· shift ${room.height_mm}mm`}
        </div>
      )}

      <table className="data-table compact">
        <thead>
          <tr>
            <th>Mebel</th>
            <th>Pozitsiya (X, Z metr)</th>
            <th>Compatibility</th>
            <th>Ball</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {room.placements?.map((p) => (
            <tr key={p.id}>
              <td>{p.furniture_detail?.name}</td>
              <td>
                {p.position_x.toFixed(2)}, {p.position_z.toFixed(2)}
              </td>
              <td>
                <span className={`status-pill ${STATUS_LABEL[p.compatibility_status]?.cls}`}>
                  {STATUS_LABEL[p.compatibility_status]?.text}
                </span>
                {p.compatibility_reasons?.length > 0 && (
                  <div className="reasons">
                    {p.compatibility_reasons.map((r, i) => (
                      <div key={i} className="reason-line">
                        {r}
                      </div>
                    ))}
                  </div>
                )}
              </td>
              <td>{p.compatibility_score ?? "—"}</td>
              <td>
                <button className="link-danger" onClick={() => handleRemove(p.id)}>
                  O'chirish
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <form className="placement-form" onSubmit={handleAdd}>
        <select value={furnitureId} onChange={(e) => setFurnitureId(e.target.value)} required>
          <option value="">Mebel tanlang...</option>
          {furnitureOptions.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name} ({f.dimensions_display})
            </option>
          ))}
        </select>
        <input type="number" step="0.1" value={x} onChange={(e) => setX(e.target.value)} placeholder="X (m)" />
        <input type="number" step="0.1" value={z} onChange={(e) => setZ(e.target.value)} placeholder="Z (m)" />
        <button className="btn-secondary" type="submit" disabled={busy}>
          + Joylashtirish
        </button>
      </form>
      <p className="muted small">
        Eslatma: bu qo'lda kiritish formasi. Haqiqiy kamera orqali AR joylashtirish keyingi bosqichda (Phase 4)
        qo'shiladi — u yerda pozitsiya avtomatik WebXR'dan olinadi.
      </p>
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [furnitureOptions, setFurnitureOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newRoomName, setNewRoomName] = useState("");
  const [ceilingHeight, setCeilingHeight] = useState("");

  function load() {
    setLoading(true);
    Promise.all([getProject(id), listFurniture({ page_size: 100 })])
      .then(([proj, furn]) => {
        setProject(proj);
        setFurnitureOptions(furn.results ?? furn);
      })
      .finally(() => setLoading(false));
  }
  useEffect(load, [id]);

  async function handleAddRoom(e) {
    e.preventDefault();
    if (!newRoomName) return;
    await createRoom({
      project: Number(id),
      name: newRoomName,
      height_mm: ceilingHeight ? Number(ceilingHeight) : null,
    });
    setNewRoomName("");
    setCeilingHeight("");
    load();
  }

  if (loading) return <div className="page-loading">Yuklanmoqda...</div>;
  if (!project) return <div className="empty-state">Loyiha topilmadi</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>{project.name}</h1>
        <p className="muted">
          {project.customer_name} {project.customer_phone && `· ${project.customer_phone}`}
        </p>
      </div>

      {project.rooms?.map((room) => (
        <RoomBlock key={room.id} room={room} furnitureOptions={furnitureOptions} onChanged={load} />
      ))}

      <form className="form-card inline-form" onSubmit={handleAddRoom}>
        <label>
          Yangi xona nomi
          <input value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} placeholder="Yotoqxona" />
        </label>
        <label>
          Shift balandligi (mm, ixtiyoriy)
          <input type="number" value={ceilingHeight} onChange={(e) => setCeilingHeight(e.target.value)} />
        </label>
        <button className="btn-primary" type="submit">
          + Xona qo'shish
        </button>
      </form>

      {project.quotation_items?.length > 0 && (
        <div className="quotation-block">
          <h3>Smeta</h3>
          <table className="data-table compact">
            <thead>
              <tr>
                <th>Mebel</th>
                <th>Soni</th>
                <th>Narx</th>
                <th>Jami</th>
              </tr>
            </thead>
            <tbody>
              {project.quotation_items.map((item) => (
                <tr key={item.id}>
                  <td>{item.furniture_detail?.name}</td>
                  <td>{item.quantity}</td>
                  <td>{Number(item.unit_price).toLocaleString("uz-UZ")}</td>
                  <td>{Number(item.total).toLocaleString("uz-UZ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="quotation-total">Jami: {Number(project.quotation_total).toLocaleString("uz-UZ")}</div>
        </div>
      )}
    </div>
  );
}
