// backend/controllers/postController.js
const Post = require("../models/Post");
const User = require("../models/User");
const Storage = require("../services/storage");

// Initial sample posts to seed if empty
const INITIAL_POSTS = [
  {
    authorName: "Priya Krishnan",
    authorRole: "student",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    text: "Just completed the Digital Literacy Camp at Tambaram! 🎉 Helped 60+ students learn basic computer skills. So grateful to be part of this Maatram journey!",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80",
  },
  {
    authorName: "Anand Kumar",
    authorRole: "student",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80",
    text: "Proud to coordinate our upcoming School Outreach Drive this Saturday! Excited to mentor 100+ high school students on career opportunities. Connect with me to volunteer together! 🤝",
    image: null,
  },
  {
    authorName: "Karthik Rajan",
    authorRole: "alumni",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    text: "Proud to mentor 12 student volunteers at this weekend's drive. The energy and dedication of young volunteers gives me so much hope! 🙌 #MaatramImpact",
    image: null,
  },
];

// GET /api/posts
const getPosts = async (req, res) => {
  try {
    let posts = await Post.find().sort({ createdAt: -1 }).lean();

    // Seed if empty
    if (posts.length === 0) {
      let dummyUser = await User.findOne({ role: "student" });
      if (!dummyUser) {
        dummyUser = await User.findOne();
      }
      if (dummyUser) {
        for (const item of INITIAL_POSTS) {
          await Post.create({
            ...item,
            authorId: dummyUser._id,
            likes: [],
            comments: [],
          });
        }
        posts = await Post.find().sort({ createdAt: -1 }).lean();
      }
    }

    const currentUserId = req.user?._id?.toString() || req.user?.id?.toString();

    const mapped = posts.map((p) => ({
      id: p._id.toString(),
      authorId: p.authorId?.toString(),
      author: p.authorName,
      role: p.authorRole,
      avatar: p.avatar,
      text: p.text,
      image: p.image,
      likes: p.likes?.length || 0,
      comments: p.comments?.length || 0,
      commentsList: p.comments || [],
      time: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "Recently",
      liked: p.likes?.some((lid) => lid?.toString() === currentUserId) || false,
    }));

    res.json({ success: true, data: mapped });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/posts
const createPost = async (req, res) => {
  try {
    const { text, image } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "Post text is required." });
    }

    const user = req.user;
    const authorId = user?._id || user?.id;
    const authorName = user?.fullName || user?.name || "Student Volunteer";
    const authorRole = user?.role || "student";
    const avatar =
      user?.avatar ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(authorName)}`;

    const post = await Post.create({
      authorId,
      authorName,
      authorRole,
      avatar,
      text: text.trim(),
      image: image?.trim() || null,
      likes: [],
      comments: [],
    });

    // Notify all accepted connections about the new post
    let notifiedCount = 0;
    try {
      const connectionsData = await Storage.getConnections(authorId.toString());
      const accepted = connectionsData?.accepted || [];
      const postSnippet = text.trim().slice(0, 70) + (text.trim().length > 70 ? "..." : "");

      for (const conn of accepted) {
        const friendId = conn.user?._id || conn.user?.id;
        if (friendId) {
          await Storage.createNotification({
            userId: friendId.toString(),
            type: "connect",
            title: `New Post from ${authorName} 📝`,
            message: `${authorName}: "${postSnippet}"`,
            link: "/connect",
          });
          notifiedCount++;
        }
      }
    } catch (notifErr) {
      console.warn("Post connection notifications warning:", notifErr.message);
    }

    res.status(201).json({
      success: true,
      data: {
        id: post._id.toString(),
        authorId: post.authorId.toString(),
        author: post.authorName,
        role: post.authorRole,
        avatar: post.avatar,
        text: post.text,
        image: post.image,
        likes: 0,
        comments: 0,
        time: "Just now",
        liked: false,
        notifiedCount,
      },
      message: `Post published and sent to ${notifiedCount} connection(s)!`,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// POST /api/posts/:id/like
const toggleLikePost = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found." });
    }

    const index = post.likes.findIndex((id) => id.toString() === userId.toString());
    let liked = false;
    if (index > -1) {
      post.likes.splice(index, 1);
      liked = false;
    } else {
      post.likes.push(userId);
      liked = true;
    }

    await post.save();
    res.json({
      success: true,
      data: { likes: post.likes.length, liked },
      message: liked ? "Post liked!" : "Post unliked.",
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// POST /api/posts/:id/comment
const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "Comment text is required." });
    }

    const user = req.user;
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found." });
    }

    const comment = {
      userId: user?._id || user?.id,
      userName: user?.fullName || "Volunteer",
      avatar: user?.avatar || "",
      text: text.trim(),
      createdAt: new Date(),
    };

    post.comments.push(comment);
    await post.save();

    res.status(201).json({
      success: true,
      data: comment,
      message: "Comment added!",
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = {
  getPosts,
  createPost,
  toggleLikePost,
  addComment,
};
