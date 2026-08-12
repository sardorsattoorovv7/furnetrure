import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createFurniture,
  getFurniture,
  listCategories,
  updateFurniture,
  uploadFurnitureImage,
  uploadFurnitureModel,
} from "../api/furniture";

const EMPTY_FORM = {
  name: "",
  sku: "",
  category_id: "",
  width_mm: "",
  depth_mm: "",
  height_mm: "",
  weight_kg: "",
  material: "",
  color: "",
  finish: "",
  price: "",
  currency: "UZS",
  description: "",
  is_active: true,
  is_featured: false,
  status: "DRAFT",
};

export default function AdminFurnitureFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [categories, setCategories] = useState([]);
  const [existing, setExisting] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [glbFile, setGlbFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    listCategories().then((data) => setCategories(data.results ?? data));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    getFurniture(id).then((data) => {
      setExisting(data);
      setForm({
        name: data.name,
        sku: data.sku,
        category_id: data.category?.id ?? "",
        width_mm: data.width_mm,
        depth_mm: data.depth_mm,
        height_mm: data.height_mm,
        weight_kg: data.weight_kg ?? "",
        material: data.material ?? "",
        color: data.color ?? "",
        finish: data.finish ?? "",
        price: data.price,
        currency: data.currency,
        description: data.description ?? "",
        is_active: data.is_active,
        is_featured: data.is_featured,
        status: data.status,
      });
    });
  }, [id, isEdit]);

  function update(field) {
    return (e) => {
      const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
      setForm((f) => ({ ...f, [field]: value }));
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const payload = {
        ...form,
        width_mm: Number(form.width_mm),
        depth_mm: Number(form.depth_mm),
        height_mm: Number(form.height_mm),
        weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
        price: form.price,
      };

      let furnitureId = id;
      if (isEdit) {
        await updateFurniture(id, payload);
      } else {
        const created = await createFurniture(payload);
        furnitureId = created.id;
      }

      if (imageFile) {
        await uploadFurnitureImage(furnitureId, imageFile, true);
      }
      if (glbFile) {
        await uploadFurnitureModel(furnitureId, glbFile);
      }

      navigate("/admin/furniture");
    } catch (err) {
      const data = err?.response?.data;
      const msg = data ? Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(" | ") : "Xatolik yuz berdi";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>{isEdit ? "Mebelni tahrirlash" : "Yangi mebel qo'shish"}</h1>
      </div>

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-row">
          <label>
            Nomi
            <input value={form.name} onChange={update("name")} required />
          </label>
          <label>
            SKU
            <input value={form.sku} onChange={update("sku")} required />
          </label>
        </div>

        <label>
          Kategoriya
          <select value={form.category_id} onChange={update("category_id")} required>
            <option value="">Tanlang...</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <fieldset>
          <legend>O'lchamlar (mm)</legend>
          <div className="form-row three">
            <label>
              Kenglik
              <input type="number" min="1" value={form.width_mm} onChange={update("width_mm")} required />
            </label>
            <label>
              Chuqurlik
              <input type="number" min="1" value={form.depth_mm} onChange={update("depth_mm")} required />
            </label>
            <label>
              Balandlik
              <input type="number" min="1" value={form.height_mm} onChange={update("height_mm")} required />
            </label>
          </div>
        </fieldset>

        <div className="form-row three">
          <label>
            Material
            <input value={form.material} onChange={update("material")} />
          </label>
          <label>
            Rang
            <input value={form.color} onChange={update("color")} />
          </label>
          <label>
            Og'irligi (kg)
            <input type="number" step="0.1" value={form.weight_kg} onChange={update("weight_kg")} />
          </label>
        </div>

        <div className="form-row">
          <label>
            Narx
            <input type="number" step="0.01" value={form.price} onChange={update("price")} required />
          </label>
          <label>
            Valyuta
            <select value={form.currency} onChange={update("currency")}>
              <option value="UZS">UZS</option>
              <option value="USD">USD</option>
            </select>
          </label>
        </div>

        <label>
          Tavsif
          <textarea rows={4} value={form.description} onChange={update("description")} />
        </label>

        <div className="form-row">
          <label>
            Status
            <select value={form.status} onChange={update("status")}>
              <option value="DRAFT">Qoralama</option>
              <option value="ACTIVE">Faol</option>
              <option value="ARCHIVED">Arxivlangan</option>
            </select>
          </label>
          <label className="checkbox-label">
            <input type="checkbox" checked={form.is_active} onChange={update("is_active")} />
            Faol (katalogda ko'rinadi)
          </label>
          <label className="checkbox-label">
            <input type="checkbox" checked={form.is_featured} onChange={update("is_featured")} />
            Tavsiya etilgan
          </label>
        </div>

        <fieldset>
          <legend>Rasm</legend>
          <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />
          {existing?.images?.length > 0 && (
            <div className="existing-images">
              {existing.images.map((img) => (
                <img key={img.id} src={img.image} alt="" className="thumb-preview" />
              ))}
            </div>
          )}
        </fieldset>

        <fieldset>
          <legend>3D model (GLB/glTF)</legend>
          <input type="file" accept=".glb,.gltf" onChange={(e) => setGlbFile(e.target.files[0])} />
          {existing?.model_3d && (
            <div className="model-status">
              Yuklangan: {(existing.model_3d.file_size / 1024).toFixed(0)} KB
              {existing.model_3d.dimension_mismatch && (
                <span className="warning-text"> ⚠ Model o'lchami bazadagi o'lchamdan farq qiladi</span>
              )}
            </div>
          )}
        </fieldset>

        {error && <div className="form-error">{error}</div>}

        <div className="form-actions">
          <button className="btn-primary" type="submit" disabled={busy}>
            {busy ? "Saqlanmoqda..." : "Saqlash"}
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate("/admin/furniture")}>
            Bekor qilish
          </button>
        </div>
      </form>
    </div>
  );
}
