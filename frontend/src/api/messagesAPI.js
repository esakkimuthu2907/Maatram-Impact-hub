// frontend/src/api/messagesAPI.js
import { api } from "./index";

export const messagesAPI = {
  getConversation: (partnerId) => api.get(`/messages/${partnerId}`),
  sendMessage:     (data)      => api.post("/messages", data),
};
