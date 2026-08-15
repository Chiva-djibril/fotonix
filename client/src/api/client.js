import axios from "axios";

// ✅ Smart URL handling - works whether env var has /api or not
const rawUrl = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const baseURL = rawUrl.endsWith("/api") ? rawUrl : `${rawUrl}/api`;

console.log("🔌 API Base URL:", baseURL); // Debug log - remove later

const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("fotonix_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ✅ Global error normalizer - ensures errors are always readable
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Normalize error message to always be a string
    const message =
      (typeof error.response?.data?.error === "string" && error.response.data.error) ||
      (typeof error.response?.data?.message === "string" && error.response.data.message) ||
      (typeof error.message === "string" && error.message) ||
      "Something went wrong";
    
    error.displayMessage = message;
    return Promise.reject(error);
  }
);

export default api;