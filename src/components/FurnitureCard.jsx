import { Link } from "react-router-dom";

export function FurnitureCard({ item }) {
  return (
    <Link to={`/furniture/${item.slug}`} className="furniture-card">
      <div className="furniture-card-image">
        {item.main_image ? (
          <img src={item.main_image} alt={item.name} loading="lazy" />
        ) : (
          <div className="furniture-card-placeholder">🪑</div>
        )}
        {item.has_3d_model && <span className="badge badge-3d">3D</span>}
      </div>
      <div className="furniture-card-body">
        <h3>{item.name}</h3>
        <div className="furniture-card-sku">{item.sku}</div>
        <div className="furniture-card-dims">{item.dimensions_display}</div>
        <div className="furniture-card-footer">
          <span className="price">
            {Number(item.price).toLocaleString("uz-UZ")} {item.currency}
          </span>
        </div>
      </div>
    </Link>
  );
}
