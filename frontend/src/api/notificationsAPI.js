// frontend/src/api/notificationsAPI.js
import { api } from "./index";

export const notificationsAPI = {
  getAll:     () => api.get("/notifications"),
  markRead:   () => api.put("/notifications/read", {}),
};
