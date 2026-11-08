// frontend/src/api/hoursAPI.js
import { api } from "./index";

export const hoursAPI = {
  submit: (data) => api.post("/hours/submit", data),
  getMy: () => api.get("/hours/my"),
  getAll: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v && v !== "All"))
    ).toString();
    return api.get(`/hours/all${qs ? "?" + qs : ""}`);
  },
  verify: (id, data) => api.put(`/hours/${id}/verify`, data),
};
