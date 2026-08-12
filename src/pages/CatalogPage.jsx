import { useEffect, useState } from "react";
import { listCategories, listFurniture } from "../api/furniture";
import { FurnitureCard } from "../components/FurnitureCard";

export default function CatalogPage() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [ordering, setOrdering] = useState("");
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);

  useEffect(() => {
    listCategories().then((data) => setCategories(data.results ?? data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (categoryId) params.category = categoryId;
    if (ordering) params.ordering = ordering;

    const timeout = setTimeout(() => {
      listFurniture(params)
        .then((data) => {
          setItems(data.results ?? data);
          setCount(data.count ?? (data.results ?? data).length);
        })
        .finally(() => setLoading(false));
    }, 300); // debounce search

    return () => clearTimeout(timeout);
  }, [search, categoryId, ordering]);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Mebel katalogi</h1>
        <p className="muted">{count} ta mahsulot topildi</p>
      </div>

      <div className="catalog-filters">
        <input
          className="search-input"
          placeholder="Mebel qidirish..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">Barcha kategoriyalar</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select value={ordering} onChange={(e) => setOrdering(e.target.value)}>
          <option value="">Saralash</option>
          <option value="-created_at">Yangi</option>
          <option value="price">Narx: arzon</option>
          <option value="-price">Narx: qimmat</option>
        </select>
      </div>

      {loading ? (
        <div className="page-loading">Yuklanmoqda...</div>
      ) : items.length === 0 ? (
        <div className="empty-state">Hech narsa topilmadi</div>
      ) : (
        <div className="furniture-grid">
          {items.map((item) => (
            <FurnitureCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
