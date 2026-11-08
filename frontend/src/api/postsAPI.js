// frontend/src/api/postsAPI.js
import { api } from "./index";

export const postsAPI = {
  getPosts:    ()            => api.get("/posts"),
  createPost:  (data)        => api.post("/posts", data),
  likePost:    (id)          => api.post(`/posts/${id}/like`),
  addComment:  (id, text)    => api.post(`/posts/${id}/comment`, { text }),
};
