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

  // QR Attendance
  generateQRToken: (id, validityHours) => api.post(`/events/${id}/qr-token`, { validityHours }),
  invalidateQRToken: (id) => api.post(`/events/${id}/qr-invalidate`),
  checkInViaQR: (id, qrToken) => api.post(`/events/${id}/checkin`, { qrToken }),
  getAttendance: (id) => api.get(`/events/${id}/attendance`),

  // Module 1 & 3: Selection Confirmation and Attendance Close & Verification
  confirmSelection: (id, data = {}) => api.post(`/events/${id}/confirm-selection`, data),
  closeAttendance: (id, data = {}) => {
    if (typeof api.patch === "function") {
      return api.patch(`/events/${id}/attendance/close`, data);
    }
    return api.post(`/events/${id}/attendance/close`, data);
  },
  retryFailedEmails: (id) => api.post(`/events/${id}/retry-failed-emails`),

  // Email reminders blast
  sendReminder: (id) => api.post(`/events/${id}/remind`),
};
