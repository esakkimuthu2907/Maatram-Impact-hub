// frontend/src/api/badgesAPI.js
import { api } from "./index";

export const badgesAPI = {
  getAll: () => api.get("/badges"),
  getMy: () => api.get("/badges/my"),
  create: (data) => api.post("/badges", data),
  update: (id, data) => api.put(`/badges/${id}`, data),
  remove: (id) => api.delete(`/badges/${id}`),
};
