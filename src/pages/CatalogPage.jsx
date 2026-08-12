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
    listCategories()
      .then((data) => {
        console.log('Categories data:', data);
        console.log('Is array?', Array.isArray(data));
        
        // ✅ Agar object bo'lsa, array ga o'tkazish
        let categoriesData = data.results ?? data;
        if (!Array.isArray(categoriesData)) {
          categoriesData = Object.values(categoriesData);
        }
        setCategories(categoriesData);
      })
      .catch((error) => {
        console.error('Error fetching categories:', error);
        setCategories([]);
      });
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
          console.log('Furniture data:', data);
          
          // ✅ Agar object bo'lsa, array ga o'tkazish
          let itemsData = data.results ?? data;
          if (!Array.isArray(itemsData)) {
            itemsData = Object.values(itemsData);
          }
          
          setItems(itemsData);
          setCount(data.count ?? itemsData.length);
        })
        .catch((error) => {
          console.error('Error fetching furniture:', error);
          setItems([]);
        })
        .finally(() => setLoading(false));
    }, 300);

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
          {/* ✅ Array bo'lsa map ishlatish */}
          {Array.isArray(categories) && categories.map((c) => (
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
          {/* ✅ Array bo'lsa map ishlatish */}
          {Array.isArray(items) && items.map((item) => (
            <FurnitureCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}