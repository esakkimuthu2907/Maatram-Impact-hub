// frontend/src/api/authAPI.js
import { api } from "./index";

export const authAPI = {
  register: (data)                    => api.post("/auth/register", data),
  login:    (identifier, password, role) => api.post("/auth/login", { identifier, password, role }),
  getMe:    ()                        => api.get("/auth/me"),
};
