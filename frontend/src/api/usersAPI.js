// frontend/src/api/usersAPI.js
import { api } from "./index";

export const usersAPI = {
  getLeaderboard: () => api.get("/users/leaderboard"),
  getStats:       () => api.get("/users/stats"),
  getPointsHistory: () => api.get("/users/points/history"),
  updateProfile:  (data) => api.put("/users/profile", data),
  // For Connect page — returns all active students (excluding admin, excluding self)
  getStudents:    () => api.get("/users/students"),
};
