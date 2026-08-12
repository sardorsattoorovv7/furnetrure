import client, { clearTokens, getRefreshToken, setTokens } from "./client";

// ✅ username va password
export async function login(username, password) {
  console.log('📧 Login API call:', { username, password: '***' });
  
  try {
    const { data } = await client.post("/auth/login/", { 
      username: username,   // ✅ username
      password: password 
    });
    
    console.log('✅ Login API success:', data);
    setTokens({ access: data.access, refresh: data.refresh });
    return data;
  } catch (error) {
    console.error('❌ Login API error:', error.response?.data);
    throw error;
  }
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