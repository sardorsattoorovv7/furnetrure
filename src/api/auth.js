import client, { clearTokens, getRefreshToken, setTokens } from "./client";

export async function login(email, password) {
  console.log('📧 Login attempt:', { email, password: '***' });
  console.log('🔍 API_BASE_URL:', client.defaults.baseURL);
  
  try {
    const { data } = await client.post("/auth/login/", { 
      email: email,
      password: password 
    });
    
    console.log('✅ Login success:', data);
    setTokens({ access: data.access, refresh: data.refresh });
    return data;
  } catch (error) {
    console.error('❌ Login error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
}

export async function register(payload) {
  console.log('📝 Register:', payload);
  
  try {
    const { data } = await client.post("/auth/register/", payload);
    console.log('✅ Register success:', data);
    return data;
  } catch (error) {
    console.error('❌ Register error:', error.response?.data);
    throw error;
  }
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