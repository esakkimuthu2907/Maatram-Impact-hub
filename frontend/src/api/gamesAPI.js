// frontend/src/api/gamesAPI.js
import { api } from "./index";

export const gamesAPI = {
  getDailyChallenge: () => api.get("/games/daily"),
  submitZip: (data) => api.post("/games/zip/submit", data),
  submitWend: (data) => api.post("/games/wend/submit", data),
  getLeaderboard: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/games/leaderboard${qs ? "?" + qs : ""}`);
  },
  getBadges: () => api.get("/games/badges"),
  getHistory: () => api.get("/games/history"),
  getAdminPuzzles: () => api.get("/games/admin/puzzles"),
  saveAdminPuzzle: (data) => api.post("/games/admin/puzzles", data),
};
