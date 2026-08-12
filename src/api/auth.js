import client, { clearTokens, getRefreshToken, setTokens } from "./client";

export async function login(username, password) {
  const { data } = await client.post("/auth/login/", { username, password });
  setTokens({ access: data.access, refresh: data.refresh });
  return data;
}

export async function register(payload) {
  const { data } = await client.post("/auth/register/", payload);
  return data;
}

export async function fetchMe() {
  const { data } = await client.get("/auth/me/");
  return data;
}

export async function logout() {
  const refresh = getRefreshToken();
  try {
    if (refresh) await client.post("/auth/logout/", { refresh });
  } finally {
    clearTokens();
  }
}
