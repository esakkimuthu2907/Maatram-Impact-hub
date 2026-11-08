// frontend/src/api/certificatesAPI.js
import { api } from "./index";

export const certificatesAPI = {
  getMy: () => api.get("/certificates/my"),
  getAll: (search = "") => api.get(`/certificates/all${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  getById: (id) => api.get(`/certificates/${id}`),
  issue: (data) => api.post("/certificates/issue", data),
};
