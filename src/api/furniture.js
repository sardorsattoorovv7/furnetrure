import client from "./client";

export async function listFurniture(params = {}) {
  const { data } = await client.get("/furniture/", { params });
  return data; // paginated: { count, next, previous, results }
}

export async function getFurniture(idOrSlug) {
  const { data } = await client.get(`/furniture/${idOrSlug}/`);
  return data;
}

export async function createFurniture(payload) {
  const { data } = await client.post("/furniture/", payload);
  return data;
}

export async function updateFurniture(id, payload) {
  const { data } = await client.patch(`/furniture/${id}/`, payload);
  return data;
}

export async function deleteFurniture(id) {
  await client.delete(`/furniture/${id}/`);
}

export async function uploadFurnitureModel(id, file, dims = {}) {
  const form = new FormData();
  form.append("glb_file", file);
  if (dims.width_mm) form.append("model_width_mm", dims.width_mm);
  if (dims.depth_mm) form.append("model_depth_mm", dims.depth_mm);
  if (dims.height_mm) form.append("model_height_mm", dims.height_mm);
  const { data } = await client.post(`/furniture/${id}/upload-model/`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function uploadFurnitureImage(id, file, isMain = false) {
  const form = new FormData();
  form.append("image", file);
  form.append("is_main", isMain ? "true" : "false");
  const { data } = await client.post(`/furniture/${id}/upload-image/`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function listCategories() {
  const { data } = await client.get("/categories/");
  return data;
}

export async function createCategory(payload) {
  const { data } = await client.post("/categories/", payload);
  return data;
}

export async function checkCompatibility(payload) {
  const { data } = await client.post("/compatibility/check/", payload);
  return data;
}
