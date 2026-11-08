// backend/routes/posts.js
const express = require("express");
const router = express.Router();
const {
  getPosts,
  createPost,
  toggleLikePost,
  addComment,
} = require("../controllers/postController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/", getPosts);
router.post("/", createPost);
router.post("/:id/like", toggleLikePost);
router.post("/:id/comment", addComment);

module.exports = router;
