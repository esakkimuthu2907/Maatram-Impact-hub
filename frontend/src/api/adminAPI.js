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
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  toggleUserStatus: (id, status) => api.put(`/admin/users/${id}/status`, { status }),
  approveUser: (id) => api.put(`/admin/users/${id}/approve`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  adjustPoints: (id, data) => api.post(`/admin/users/${id}/points/adjust`, data),
  deductPoints: (id, data) => api.post(`/admin/users/${id}/points/deduct`, data),
  getGradingLevels: () => api.get("/admin/grading"),
  updateGradingLevels: (levels) => api.put("/admin/grading", { levels }),
  trackAttendance: (eventId, attendanceRecords) =>
    api.post(`/admin/events/${eventId}/attendance`, { attendanceRecords }),
  awardEventPoints: (eventId, points, reason) =>
    api.post(`/admin/events/${eventId}/award-points`, { points, reason }),
  assignWork: (id, data) => api.post(`/admin/users/${id}/assign-work`, data),
  broadcastNotification: (data) => api.post("/admin/notifications/broadcast", data),
  getReports: () => api.get("/admin/reports"),
  getEmailLogs: (limit = 100) => api.get(`/admin/emails?limit=${limit}`),
  sendTestEmail: (data) => api.post("/admin/emails/test", data),
};
