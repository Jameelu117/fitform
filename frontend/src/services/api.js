import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("fitform_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config.url.includes("/auth/")) {
      localStorage.removeItem("fitform_token");
      window.location.href = "/login";
    }
    const message =
      err.response?.data?.detail ||
      (err.code === "ECONNABORTED" || !err.response
        ? "Server unavailable. Please check your connection and try again."
        : "Something went wrong.");
    return Promise.reject(new Error(message));
  }
);

export const authApi = {
  login: (email, password) => api.post("/api/auth/login", { email, password }).then(r => r.data),
  signup: (name, email, password) => api.post("/api/auth/signup", { name, email, password }).then(r => r.data),
};
export const exerciseApi = {
  list: () => api.get("/api/workouts/exercises").then(r => r.data),
  get: (id) => api.get(`/api/workouts/exercises/${id}`).then(r => r.data),
};
export const aiApi = {
  start: (exercise) => api.post("/api/workout/start", { exercise }).then(r => r.data),
  analyzeFrame: (payload) => api.post("/api/analyze-frame", payload).then(r => r.data),
  end: (sessionId) => api.post(`/api/workout/end?session_id=${sessionId}`).then(r => r.data),
};
export const workoutApi = {
  save: (data) => api.post("/api/workouts", data).then(r => r.data),
  history: () => api.get("/api/workouts").then(r => r.data),
  detail: (id) => api.get(`/api/workouts/${id}`).then(r => r.data),
};
export const progressApi = { get: () => api.get("/api/progress").then(r => r.data) };
export const profileApi = {
  get: () => api.get("/api/profile").then(r => r.data),
  update: (data) => api.put("/api/profile", data).then(r => r.data),
};
export default api;