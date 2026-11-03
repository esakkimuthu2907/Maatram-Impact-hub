// frontend/src/api/applicationsAPI.js
import { api } from "./index";

export const applicationsAPI = {
  apply:          (data)         => api.post("/applications", data),
  getMy:          ()             => api.get("/applications/my"),
  getAll:         (params = {})  => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v && v !== "All"))
    ).toString();
    return api.get(`/applications/all${qs ? "?" + qs : ""}`);
  },
  updateStatus:   (id, status, notes) => api.put(`/applications/${id}/status`, { status, notes }),
  cancel:         (id)           => api.put(`/applications/${id}/cancel`, {}),
  remove:         (id)           => api.delete(`/applications/${id}`),
};
