import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createProject, listProjects } from "../api/projects";

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [busy, setBusy] = useState(false);

  function load() {
    setLoading(true);
    listProjects()
      .then((data) => setProjects(data.results ?? data))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function handleCreate(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await createProject({ name, customer_name: customerName, customer_phone: customerPhone });
      setName("");
      setCustomerName("");
      setCustomerPhone("");
      setShowForm(false);
      load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Loyihalar</h1>
        <button className="btn-primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Bekor qilish" : "+ Yangi loyiha"}
        </button>
      </div>

      {showForm && (
        <form className="form-card inline-form" onSubmit={handleCreate}>
          <label>
            Loyiha nomi
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Mijoz ismi
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </label>
          <label>
            Telefon
            <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
          </label>
          <button className="btn-primary" type="submit" disabled={busy}>
            Yaratish
          </button>
        </form>
      )}

      {loading ? (
        <div className="page-loading">Yuklanmoqda...</div>
      ) : projects.length === 0 ? (
        <div className="empty-state">Hozircha loyihalar yo'q</div>
      ) : (
        <div className="project-list">
          {projects.map((p) => (
            <Link key={p.id} to={`/projects/${p.id}`} className="project-card">
              <h3>{p.name}</h3>
              {p.customer_name && <div className="muted">{p.customer_name}</div>}
              <div className="muted">{p.rooms?.length ?? 0} xona</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
