// frontend/src/api/adminAPI.js
import { api } from "./index";

export const adminAPI = {
  getStats: () => api.get("/admin/stats"),
  getUsers: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v && v !== "All"))
    ).toString();
    return api.get(`/admin/users${qs ? "?" + qs : ""}`);
  },
  getUserById: (id) => api.get(`/admin/users/${id}`),
  toggleUserStatus: (id, status) => api.put(`/admin/users/${id}/status`, { status }),
  approveUser: (id) => api.put(`/admin/users/${id}/approve`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  adjustPoints: (id, data) => api.post(`/admin/users/${id}/points/adjust`, data),
  getGradingLevels: () => api.get("/admin/grading"),
  updateGradingLevels: (levels) => api.put("/admin/grading", { levels }),
  trackAttendance: (eventId, attendanceRecords) =>
    api.post(`/admin/events/${eventId}/attendance`, { attendanceRecords }),
  broadcastNotification: (data) => api.post("/admin/notifications/broadcast", data),
  getReports: () => api.get("/admin/reports"),
};
