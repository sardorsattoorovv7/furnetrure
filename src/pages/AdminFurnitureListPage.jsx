import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteFurniture, listFurniture } from "../api/furniture";

export default function AdminFurnitureListPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    listFurniture({ page_size: 100 })
      .then((data) => setItems(data.results ?? data))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleDelete(id, name) {
    if (!window.confirm(`"${name}" o'chirilsinmi?`)) return;
    await deleteFurniture(id);
    load();
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Mebel boshqaruvi</h1>
        <Link to="/admin/furniture/new" className="btn-primary">
          + Mebel qo'shish
        </Link>
      </div>

      {loading ? (
        <div className="page-loading">Yuklanmoqda...</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Nomi</th>
              <th>SKU</th>
              <th>O'lcham</th>
              <th>Narx</th>
              <th>Status</th>
              <th>3D</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.sku}</td>
                <td>{item.dimensions_display}</td>
                <td>
                  {Number(item.price).toLocaleString("uz-UZ")} {item.currency}
                </td>
                <td>
                  <span className={`status-pill ${item.is_active ? "active" : "inactive"}`}>
                    {item.is_active ? "Faol" : "Nofaol"}
                  </span>
                </td>
                <td>{item.has_3d_model ? "✅" : "—"}</td>
                <td className="table-actions">
                  <Link to={`/admin/furniture/${item.id}/edit`}>Tahrirlash</Link>
                  <button className="link-danger" onClick={() => handleDelete(item.id, item.name)}>
                    O'chirish
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
