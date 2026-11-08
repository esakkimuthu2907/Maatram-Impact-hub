// backend/models/Post.js
const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    authorId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    authorName: { type: String, required: true },
    authorRole: { type: String, default: "student" },
    avatar:     { type: String, default: "" },
    text:       { type: String, required: true, trim: true },
    image:      { type: String, default: null },
    likes:      [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [
      {
        userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        userName:  { type: String },
        avatar:    { type: String },
        text:      { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.models.Post || mongoose.model("Post", postSchema);
