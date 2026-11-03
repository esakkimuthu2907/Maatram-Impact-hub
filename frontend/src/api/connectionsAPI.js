// frontend/src/api/connectionsAPI.js
import { api } from "./index";

export const connectionsAPI = {
  getMyConnections: () => api.get("/connections"),
  sendRequest: (recipientId, message = "") =>
    api.post("/connections/request", { recipientId, message }),
  acceptRequest: (id) => api.put(`/connections/${id}/accept`, {}),
  rejectRequest: (id) => api.put(`/connections/${id}/reject`, {}),
  removeConnection: (id) => api.delete(`/connections/${id}`),
};
