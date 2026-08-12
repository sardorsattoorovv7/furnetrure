import client from "./client";

// --- Projects ----------------------------------------------------------
export async function listProjects() {
  const { data } = await client.get("/projects/");
  return data;
}

export async function getProject(id) {
  const { data } = await client.get(`/projects/${id}/`);
  return data;
}

export async function createProject(payload) {
  const { data } = await client.post("/projects/", payload);
  return data;
}

export async function updateProject(id, payload) {
  const { data } = await client.patch(`/projects/${id}/`, payload);
  return data;
}

export async function deleteProject(id) {
  await client.delete(`/projects/${id}/`);
}

// --- Rooms ---------------------------------------------------------------
export async function createRoom(payload) {
  const { data } = await client.post("/rooms/", payload);
  return data;
}

export async function updateRoom(id, payload) {
  const { data } = await client.patch(`/rooms/${id}/`, payload);
  return data;
}

export async function deleteRoom(id) {
  await client.delete(`/rooms/${id}/`);
}

// --- Placements ------------------------------------------------------------
// NOTE: scale_x/y/z are intentionally never sent as anything other than 1 -
// the backend rejects non-1.0 scale to prevent faking a fit by shrinking
// furniture. See furniture/compatibility.py on the backend.
export async function createPlacement(payload) {
  const { data } = await client.post("/placements/", payload);
  return data;
}

export async function updatePlacement(id, payload) {
  const { data } = await client.patch(`/placements/${id}/`, payload);
  return data;
}

export async function deletePlacement(id) {
  await client.delete(`/placements/${id}/`);
}

// --- Quotation items ---------------------------------------------------
export async function addQuotationItem(payload) {
  const { data } = await client.post("/quotation-items/", payload);
  return data;
}

export async function deleteQuotationItem(id) {
  await client.delete(`/quotation-items/${id}/`);
}
