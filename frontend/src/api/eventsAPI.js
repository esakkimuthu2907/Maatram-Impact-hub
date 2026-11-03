// frontend/src/api/eventsAPI.js
import { api } from "./index";

export const eventsAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v && v !== "All"))
    ).toString();
    return api.get(`/events${qs ? "?" + qs : ""}`);
  },
  getById: (id) => api.get(`/events/${id}`),
  getVolunteers: (id) => api.get(`/events/${id}/volunteers`),
  create: (data) => api.post("/events", data),
  update: (id, data) => api.put(`/events/${id}`, data),
  remove: (id) => api.delete(`/events/${id}`),
};
