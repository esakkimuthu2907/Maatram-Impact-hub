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
  generateQRToken: (id, validityHours, force = false) => api.post(`/events/${id}/qr-token`, { validityHours, force }),
  invalidateQRToken: (id) => api.post(`/events/${id}/qr-invalidate`),
  checkInViaQR: (id, qrToken) => api.post(`/events/${id}/checkin`, { qrToken }),
  lockSession: (id, data = {}) => api.post(`/events/${id}/session/lock`, data),
  getMySession: (id) => api.get(`/events/${id}/session/my`),
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

  // AI Volunteer Selection
  getAIRecommendations: (id, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/events/${id}/ai-recommendations${qs ? "?" + qs : ""}`);
  },
  applyAISelection: (id, data) => api.post(`/events/${id}/apply-selection`, data),

  // Volunteer Feedbacks & Ratings
  submitFeedback: (id, data) => api.post(`/events/${id}/feedback`, data),
  getMyFeedback: (id) => api.get(`/events/${id}/feedback/my`),
  getFeedbacks: (id) => api.get(`/events/${id}/feedbacks`),
};
