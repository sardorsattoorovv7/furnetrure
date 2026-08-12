import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

// ✅ Debug - muhim!
console.log('🔍 Environment:', import.meta.env.MODE);
console.log('🔍 VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
console.log('🔍 API_BASE_URL:', API_BASE_URL);

const client = axios.create({
  baseURL: API_BASE_URL,
});

// --- token storage helpers -------------------------------------------------
export function getAccessToken() {
  return localStorage.getItem("access_token");
}
export function getRefreshToken() {
  return localStorage.getItem("refresh_token");
}
export function setTokens({ access, refresh }) {
  if (access) localStorage.setItem("access_token", access);
  if (refresh) localStorage.setItem("refresh_token", refresh);
}
export function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

// --- attach access token to every request -----------------------------------
client.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // ✅ Debug
  console.log('🚀 Request:', {
    url: config.baseURL + config.url,
    method: config.method,
    data: config.data,
    headers: config.headers,
  });
  
  return config;
});

// --- auto-refresh on 401 -----------------------------------------------------
let isRefreshing = false;
let pendingQueue = [];

function processQueue(error, token = null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  pendingQueue = [];
}

client.interceptors.response.use(
  (response) => {
    // ✅ Debug
    console.log('✅ Response:', {
      status: response.status,
      data: response.data,
    });
    return response;
  },
  async (error) => {
    // ✅ Debug
    console.error('❌ Error:', {
      status: error.response?.status,
      data: error.response?.data,
      config: error.config,
      message: error.message,
    });
    
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      getRefreshToken()
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return client(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
          refresh: getRefreshToken(),
        });
        setTokens({ access: data.access });
        processQueue(null, data.access);
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return client(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearTokens();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default client;