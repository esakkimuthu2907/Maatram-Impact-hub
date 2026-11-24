// frontend/src/api/meetingsAPI.js
import { api } from "./index";

export const meetingsAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v && v !== "All"))
    ).toString();
    return api.get(`/meetings${qs ? "?" + qs : ""}`);
  },
  getById: (id) => api.get(`/meetings/${id}`),
  create: (data) => api.post("/meetings", data),
  update: (id, data) => api.put(`/meetings/${id}`, data),
  remove: (id) => api.delete(`/meetings/${id}`),
  submitAvailability: (id, data) => api.post(`/meetings/${id}/availability`, data),
  getAvailabilities: (id) => api.get(`/meetings/${id}/availabilities`),
};
