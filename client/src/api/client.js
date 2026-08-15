import axios from "axios";

// Get base URL from env, ensure /api suffix
const rawUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";
const baseURL = rawUrl.endsWith("/api") ? rawUrl : `${rawUrl}/api`;

const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("fotonix_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ✅ BONUS: Global error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Extract clean error message
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      "Something went wrong";
    
    // Attach clean message to error
    error.displayMessage = message;
    
    // Handle 401 - auto logout
    if (error.response?.status === 401) {
      localStorage.removeItem("fotonix_token");
      // Optionally redirect to login
      // window.location.href = "/login";
    }
    
    return Promise.reject(error);
  }
);

export default api;