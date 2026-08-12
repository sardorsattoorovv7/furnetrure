import { useEffect, useState } from "react";
import { createCategory, listCategories } from "../api/furniture";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function load() {
    listCategories().then((data) => setCategories(data.results ?? data));
  }
  useEffect(load, []);

  function handleNameChange(e) {
    const value = e.target.value;
    setName(value);
    setSlug(
      value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await createCategory({ name, slug });
      setName("");
      setSlug("");
      load();
    } catch (err) {
      setError(err?.response?.data?.detail || "Xatolik yuz berdi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Kategoriyalar</h1>
      </div>

      <form className="form-card inline-form" onSubmit={handleSubmit}>
        <label>
          Nomi
          <input value={name} onChange={handleNameChange} required placeholder="Masalan: Divanlar" />
        </label>
        <label>
          Slug
          <input value={slug} onChange={(e) => setSlug(e.target.value)} required />
        </label>
        <button className="btn-primary" type="submit" disabled={busy}>
          Qo'shish
        </button>
      </form>
      {error && <div className="form-error">{error}</div>}

      <table className="data-table">
        <thead>
          <tr>
            <th>Nomi</th>
            <th>Slug</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{c.slug}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
