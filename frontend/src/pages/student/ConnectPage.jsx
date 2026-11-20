// frontend/src/pages/student/ConnectPage.jsx
// Maatram Connect — Full featured social networking for students & alumni
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Users,
  UserPlus,
  Clock,
  Search,
  X,
  MessageSquare,
  GraduationCap,
  ShieldCheck,
  Send,
  Check,
  Phone,
  Video,
  Smile,
  Calendar,
  Rocket,
  Heart,
  Image,
  Trash2,
  Bell,
  UserMinus,
  Lock,
  Globe,
  Star,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { connectionsAPI } from "../../api/connectionsAPI";
import { usersAPI } from "../../api/usersAPI";
import { postsAPI } from "../../api/postsAPI";
import { messagesAPI } from "../../api/messagesAPI";
import "./ConnectPage.css";

const EMPTY_CONNECTIONS = { accepted: [], pendingIncoming: [], pendingOutgoing: [] };

// Backend may return _id instead of id — make sure every post has a usable id.
const normalizePost = (p) => ({ ...p, id: p.id || p._id });

// Hide the three legacy demo posts that were previously seeded into MongoDB.
// Match their distinctive text rather than author names, so genuine posts by
// users with the same names will continue to appear in the feed.
const LEGACY_DEMO_POST_TEXT = [
  "Proud to mentor 12 student volunteers at this weekend's drive.",
  "Proud to coordinate our upcoming School Outreach Drive this Saturday!",
  "Just completed the Digital Literacy Camp at Tambaram!",
];

const isLegacyDemoPost = (post) => {
  const text = String(post?.text || "").trim().toLowerCase();
  return LEGACY_DEMO_POST_TEXT.some((sample) =>
    text.startsWith(sample.toLowerCase())
  );
};

const normalizePosts = (arr) =>
  arr.filter((post) => !isLegacyDemoPost(post)).map(normalizePost);

const errMsg = (err) => err?.response?.data?.message || err?.message || "Unknown error";

// Resize + compress a photo in the browser so uploads are small and fast
// (note: lucide's `Image` icon shadows the global, so use window.Image)
const compressImage = (file, maxSize = 1080, quality = 0.72) =>
  new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Invalid image"));
    };
    img.src = url;
  });

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function ConnectPage() {
  const { user, showToast } = useApp();

  /* ─── Filter State ─────────────────────────────────────────────────────── */
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedYear, setSelectedYear] = useState("All");
  const [selectedSkill] = useState("");
  const [sortBy, setSortBy] = useState("Recently Active");

  /* ─── Section / Tab State ──────────────────────────────────────────────── */
  // Sections: "suggested" | "messages" | "requests" | "received" | "posts"
  const [activeSection, setActiveSection] = useState("suggested");
  const [userTypeTab, setUserTypeTab] = useState("All"); // All | Students | Alumni

  /* ─── Data State ───────────────────────────────────────────────────────── */
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [backendConnections, setBackendConnections] = useState(EMPTY_CONNECTIONS);
  const [loading, setLoading] = useState(true);

  /* ─── Modals ──────────────────────────────────────────────────────────── */
  const [viewProfile, setViewProfile] = useState(null);
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [connectPromptUser, setConnectPromptUser] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const chatBottomRef = useRef(null);

  /* ─── Chat Messages (localStorage) ────────────────────────────────────── */
  const [chatMessages, setChatMessages] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("maatram_connect_chat_v3")) || {};
    } catch {
      return {};
    }
  });
  const [readConvoIds, setReadConvoIds] = useState(new Set());

  /* ─── Posts State ──────────────────────────────────────────────────────── */
  const [posts, setPosts] = useState([]);
  const [newPostText, setNewPostText] = useState("");
  const [newPostImg, setNewPostImg] = useState("");
  const photoInputRef = useRef(null);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      showToast("Photo size must be less than 20MB", "error");
      return;
    }
    try {
      const compressed = await compressImage(file);
      setNewPostImg(compressed);
      showToast("📷 Photo attached! Click 'Share Post' to broadcast.");
    } catch {
      showToast("Could not read that photo. Try another one.", "error");
    }
  };

  /* ─── Load Data ────────────────────────────────────────────────────────── */
  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, connRes, postsRes] = await Promise.allSettled([
        usersAPI.getStudents(),
        connectionsAPI.getMyConnections(),
        postsAPI.getPosts(),
      ]);

      let backendUsers = [];
      if (usersRes.status === "fulfilled" && usersRes.value?.data) {
        backendUsers = usersRes.value.data;
      }

      if (connRes.status === "fulfilled" && connRes.value?.data) {
        safeSetBackendConnections(connRes.value.data);
      } else {
        setBackendConnections(EMPTY_CONNECTIONS);
      }

      if (postsRes.status === "fulfilled" && postsRes.value?.data && Array.isArray(postsRes.value.data)) {
        setPosts(normalizePosts(postsRes.value.data));
      }

      // Filter to all registered students and alumni who are active
      const allowedRoles = new Set(["student", "alumni"]);
      const filtered = backendUsers.filter(
        (u) =>
          allowedRoles.has(u.role) &&
          u.status !== "inactive" &&
          u.status !== "pending_approval"
      );
      setRegisteredUsers(filtered);
    } catch (err) {
      console.warn("Connect data error:", err);
      setRegisteredUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch real conversation from backend when activeChatUser opens and poll every 3s
  useEffect(() => {
    if (!activeChatUser) return;
    const partnerId = activeChatUser._id || activeChatUser.id || activeChatUser.applicationId;
    const chatKey = activeChatUser.id || activeChatUser.applicationId;
    let isMounted = true;

    async function fetchConversation() {
      try {
        const res = await messagesAPI.getConversation(partnerId);
        if (isMounted && res?.data) {
          setChatMessages((prev) => ({
            ...prev,
            [chatKey]: res.data,
          }));
        }
      } catch (err) {
        console.warn("Message history fetch note:", err.message);
      }
    }

    fetchConversation();
    const timer = setInterval(fetchConversation, 3000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [activeChatUser]);

  // Refresh posts when switching to posts tab
  useEffect(() => {
    if (activeSection === "posts") {
      postsAPI
        .getPosts()
        .then((res) => {
          if (res?.data && Array.isArray(res.data)) {
            setPosts(normalizePosts(res.data));
          }
        })
        .catch(() => { });
    }
  }, [activeSection]);

  useEffect(() => {
    if (activeChatUser && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeChatUser, chatMessages]);

  const currentUserId = user?.applicationId || user?.id || user?._id || "";

  /* ─── Safe Connection Setter ─────────────────────────────────────────── */
  function safeSetBackendConnections(d) {
    if (d && typeof d === "object" && !Array.isArray(d)) {
      setBackendConnections({
        accepted: Array.isArray(d.accepted) ? d.accepted : [],
        pendingIncoming: Array.isArray(d.pendingIncoming) ? d.pendingIncoming : [],
        pendingOutgoing: Array.isArray(d.pendingOutgoing) ? d.pendingOutgoing : [],
      });
    } else {
      setBackendConnections(EMPTY_CONNECTIONS);
    }
  }

  /* ─── Connection Helpers ────────────────────────────────────────────────── */
  const getUserConnectionInfo = (targetUser) => {
    if (!targetUser) return { status: "none" };
    const tid = targetUser.id || targetUser._id;
    const taid = targetUser.applicationId;
    const accepted = Array.isArray(backendConnections?.accepted) ? backendConnections.accepted : [];
    const pendingIncoming = Array.isArray(backendConnections?.pendingIncoming) ? backendConnections.pendingIncoming : [];
    const pendingOutgoing = Array.isArray(backendConnections?.pendingOutgoing) ? backendConnections.pendingOutgoing : [];

    const acceptedMatch = accepted.find(
      (c) => c.user?.id === tid || c.user?._id === tid || c.user?.applicationId === taid || c.connectionId === `conn_${tid}`
    );
    if (acceptedMatch) return { status: "connected", connectionId: acceptedMatch.connectionId };

    const incomingMatch = pendingIncoming.find(
      (c) => c.user?.id === tid || c.user?._id === tid || c.user?.applicationId === taid
    );
    if (incomingMatch) return { status: "pending_received", connectionId: incomingMatch.connectionId, message: incomingMatch.message };

    const outgoingMatch = pendingOutgoing.find(
      (c) => c.user?.id === tid || c.user?._id === tid || c.user?.applicationId === taid || c.connectionId === `req_${tid}`
    );
    if (outgoingMatch) return { status: "pending_sent", connectionId: outgoingMatch.connectionId };

    return { status: "none" };
  };

  /* ─── Actions ───────────────────────────────────────────────────────────── */
  const handleSendRequest = async (targetUser) => {
    const tid = targetUser._id || targetUser.id || targetUser.applicationId;
    try {
      await connectionsAPI.sendRequest(tid, `Hi ${targetUser.fullName}! I would love to connect with you on Maatram Connect.`);
      const res = await connectionsAPI.getMyConnections();
      if (res?.data) {
        safeSetBackendConnections(res.data);
      }
    } catch {
      setBackendConnections((prev) => ({
        accepted: Array.isArray(prev?.accepted) ? prev.accepted : [],
        pendingIncoming: Array.isArray(prev?.pendingIncoming) ? prev.pendingIncoming : [],
        pendingOutgoing: [
          ...(Array.isArray(prev?.pendingOutgoing) ? prev.pendingOutgoing : []),
          {
            connectionId: `req_${tid}`,
            message: "Connection request sent",
            createdAt: new Date().toISOString(),
            user: targetUser,
          },
        ],
      }));
    }
    showToast(`📨 Connection request sent to ${targetUser.fullName}! Waiting for acceptance.`);
  };

  // Only the RECEIVER of a request can accept it (from Requests tab / suggested card).
  // No local fallback: if the server call fails, nobody is marked as connected.
  const handleAcceptRequest = async (connectionId, targetUser) => {
    try {
      await connectionsAPI.acceptRequest(connectionId);
      const res = await connectionsAPI.getMyConnections();
      if (res?.data) {
        safeSetBackendConnections(res.data);
      }
      showToast(`🎉 You and ${targetUser.fullName} are now connected! Direct messaging unlocked.`);
    } catch {
      showToast("Could not accept the request. Please try again.", "error");
    }
  };

  const handleDeclineRequest = async (connectionId, targetUser) => {
    try {
      await connectionsAPI.rejectRequest(connectionId);
      const res = await connectionsAPI.getMyConnections();
      if (res?.data) {
        safeSetBackendConnections(res.data);
      }
    } catch {
      setBackendConnections((prev) => ({
        accepted: Array.isArray(prev?.accepted) ? prev.accepted : [],
        pendingOutgoing: Array.isArray(prev?.pendingOutgoing) ? prev.pendingOutgoing : [],
        pendingIncoming: (Array.isArray(prev?.pendingIncoming) ? prev.pendingIncoming : []).filter((p) => p.connectionId !== connectionId),
      }));
    }
    showToast(`Request from ${targetUser.fullName} declined.`);
  };

  const handleCancelRequest = async (connectionId) => {
    try {
      await connectionsAPI.removeConnection(connectionId);
      const res = await connectionsAPI.getMyConnections();
      if (res?.data) {
        safeSetBackendConnections(res.data);
      }
    } catch {
      setBackendConnections((prev) => ({
        accepted: Array.isArray(prev?.accepted) ? prev.accepted : [],
        pendingIncoming: Array.isArray(prev?.pendingIncoming) ? prev.pendingIncoming : [],
        pendingOutgoing: (Array.isArray(prev?.pendingOutgoing) ? prev.pendingOutgoing : []).filter((p) => p.connectionId !== connectionId),
      }));
    }
    showToast("Connection request withdrawn.");
  };

  const handleRemoveConnection = async (connectionId, targetUser) => {
    try {
      await connectionsAPI.removeConnection(connectionId);
      const res = await connectionsAPI.getMyConnections();
      if (res?.data) {
        safeSetBackendConnections(res.data);
      }
    } catch {
      setBackendConnections((prev) => ({
        pendingIncoming: Array.isArray(prev?.pendingIncoming) ? prev.pendingIncoming : [],
        pendingOutgoing: Array.isArray(prev?.pendingOutgoing) ? prev.pendingOutgoing : [],
        accepted: (Array.isArray(prev?.accepted) ? prev.accepted : []).filter((c) => c.connectionId !== connectionId),
      }));
    }
    showToast(`Removed connection with ${targetUser?.fullName || "user"}.`);
  };

  const handleOpenChat = (targetUser) => {
    const info = getUserConnectionInfo(targetUser);
    if (info.status !== "connected") {
      setConnectPromptUser(targetUser);
      return;
    }
    setActiveChatUser(targetUser);
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!messageInput.trim() || !activeChatUser) return;
    const partnerId = activeChatUser._id || activeChatUser.id || activeChatUser.applicationId;
    const chatKey = activeChatUser.id || activeChatUser.applicationId;
    const textToSend = messageInput.trim();
    setMessageInput("");

    const myMsg = {
      id: `m_${Date.now()}`,
      sender: "me",
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    const updated = { ...chatMessages, [chatKey]: [...(chatMessages[chatKey] || []), myMsg] };
    setChatMessages(updated);
    try {
      localStorage.setItem("maatram_connect_chat_v3", JSON.stringify(updated));
    } catch { }

    try {
      await messagesAPI.sendMessage({ recipientId: partnerId, text: textToSend });
      const convo = await messagesAPI.getConversation(partnerId);
      if (convo?.data) {
        setChatMessages((prev) => ({ ...prev, [chatKey]: convo.data }));
      }
    } catch (err) {
      console.warn("Message sending error:", err);
    }
  };

  /* ─── Post Actions ──────────────────────────────────────────────────────── */
  const handleLikePost = async (postId) => {
    try {
      await postsAPI.likePost(postId);
    } catch { }
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
      )
    );
  };

  // True only for posts written by the logged-in user
  const isMyPost = (post) => {
    const myIds = [user?._id, user?.id, user?.applicationId].filter(Boolean).map(String);
    const authorIds = [
      post.authorId,
      post.userId,
      post.author?._id,
      post.author?.id,
      post.user?._id,
      post.user?.id,
    ]
      .filter(Boolean)
      .map(String);
    return authorIds.some((id) => myIds.includes(id));
  };

  // Instant delete: the post disappears immediately, the server call runs in the
  // background, and the post is restored only if the server really refuses.
  const handleDeletePost = async (post) => {
    if (!window.confirm("Delete this post permanently? This cannot be undone.")) return;

    const postId = post.id || post._id;
    const snapshot = posts;
    setPosts((prev) => prev.filter((p) => p.id !== postId));

    // Still-uploading / never-saved posts only exist locally
    if (String(postId).startsWith("tmp_")) {
      showToast("🗑️ Post deleted.");
      return;
    }

    try {
      await postsAPI.deletePost(postId);
      showToast("🗑️ Post deleted permanently.");
    } catch (err) {
      if (err?.response?.status === 404) {
        // Already gone on the server — nothing more to do
        showToast("🗑️ Post deleted.");
        return;
      }
      setPosts(snapshot);
      showToast(`Delete failed: ${errMsg(err)}`, "error");
    }
  };

  // Instant post: shows in the feed right away, uploads in the background
  const handleCreatePost = async () => {
    const text = newPostText.trim();
    const image = newPostImg || null;
    if (!text && !image) return;

    const tempId = `tmp_${Date.now()}`;
    const optimistic = {
      id: tempId,
      authorId: currentUserId,
      author: user?.fullName || "You",
      avatar: user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.fullName || "me")}`,
      role: user?.role || "student",
      text,
      image,
      likes: 0,
      comments: 0,
      time: "Just now",
      liked: false,
    };
    setPosts((prev) => [optimistic, ...prev]);
    setNewPostText("");
    setNewPostImg("");
    showToast("🚀 Post shared with your connections!");

    try {
      const res = await postsAPI.createPost({ text, image });
      if (res?.data) {
        setPosts((prev) => prev.map((p) => (p.id === tempId ? normalizePost(res.data) : p)));
      }
    } catch (err) {
      // Upload failed: remove the temporary post and give the text back
      setPosts((prev) => prev.filter((p) => p.id !== tempId));
      setNewPostText(text);
      setNewPostImg(image || "");
      showToast(`Post failed to upload: ${errMsg(err)}`, "error");
    }
  };

  /* ─── Filtered users ────────────────────────────────────────────────────── */
  const filteredUsers = useMemo(() => {
    return registeredUsers
      .filter((u) => {
        // Exclude self
        if ((u.applicationId || u.id || u._id) === currentUserId || u.email === user?.email) return false;
        // Only student & alumni
        if (!["student", "alumni"].includes(u.role)) return false;
        // Type tab
        if (userTypeTab === "Students" && u.role !== "student") return false;
        if (userTypeTab === "Alumni" && u.role !== "alumni") return false;
        // Department filter
        if (selectedDept !== "All" && u.department && !u.department.toLowerCase().includes(selectedDept.toLowerCase())) return false;
        // Year filter
        if (selectedYear !== "All" && u.academicYear && !u.academicYear.toLowerCase().includes(selectedYear.toLowerCase())) return false;
        // Skill filter
        if (selectedSkill) {
          const userSkills = Array.isArray(u.skills) ? u.skills.map((s) => s.toLowerCase()) : [];
          if (!userSkills.some((s) => s.includes(selectedSkill.toLowerCase()))) return false;
        }
        // Search
        if (search.trim()) {
          const q = search.toLowerCase();
          const name = (u.fullName || "").toLowerCase();
          const college = (u.college || "").toLowerCase();
          const dept = (u.department || "").toLowerCase();
          if (!name.includes(q) && !college.includes(q) && !dept.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "A-Z") return (a.fullName || "").localeCompare(b.fullName || "");
        if (sortBy === "Most Connected") return (b.points || 0) - (a.points || 0);
        return (b.isOnline ? 1 : 0) - (a.isOnline ? 1 : 0);
      });
  }, [registeredUsers, currentUserId, user, userTypeTab, selectedDept, selectedYear, selectedSkill, search, sortBy]);

  const connectedUsers = Array.isArray(backendConnections?.accepted) ? backendConnections.accepted : [];
  const receivedRequests = Array.isArray(backendConnections?.pendingIncoming) ? backendConnections.pendingIncoming : [];
  const sentRequests = Array.isArray(backendConnections?.pendingOutgoing) ? backendConnections.pendingOutgoing : [];

  // Determine if a connection sent an unread message to current user
  const hasUnreadMessage = (u) => {
    if (!u) return false;
    const chatKey = u.id || u.applicationId || u._id;
    if (readConvoIds.has(chatKey)) return false;
    const isCurrentlyOpen = activeChatUser && (activeChatUser.id === u.id || activeChatUser.applicationId === u.applicationId);
    if (isCurrentlyOpen) return false;
    const msgs = chatMessages[chatKey] || [];
    if (!msgs.length) return false;
    const lastMsg = msgs[msgs.length - 1];
    const isIncoming =
      lastMsg.sender === "other" ||
      (lastMsg.senderId &&
        String(lastMsg.senderId) !== String(user?._id) &&
        String(lastMsg.senderId) !== String(user?.id) &&
        String(lastMsg.senderId) !== String(user?.applicationId));
    return Boolean(isIncoming);
  };

  // Sort: connections who messaged current user appear FIRST with round blue dot
  const sortedConnectedUsers = useMemo(() => {
    return [...connectedUsers].sort((a, b) => {
      const uA = a.user;
      const uB = b.user;
      if (!uA || !uB) return 0;
      const unreadA = hasUnreadMessage(uA) ? 1 : 0;
      const unreadB = hasUnreadMessage(uB) ? 1 : 0;
      if (unreadA !== unreadB) return unreadB - unreadA;
      return 0;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectedUsers, chatMessages, activeChatUser, readConvoIds]);

  const unreadMsgCount = useMemo(() => {
    return connectedUsers.filter((c) => hasUnreadMessage(c.user)).length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectedUsers, chatMessages, activeChatUser, readConvoIds]);

  const DEPTS = ["All", "CSE", "ECE", "EEE", "Civil", "Mechanical", "Mechatronics"];
  const YEARS = ["All", "1st Year", "2nd Year", "3rd Year", "4th Year", "Alumni"];
  const SORTS = ["Recently Active", "Most Connected", "A-Z"];

  /* ─── Section config ────────────────────────────────────────────────────── */
  const SECTIONS = [
    { key: "suggested", label: "Suggested", icon: null, badge: filteredUsers.length },
    { key: "messages", label: "Messages", icon: MessageSquare, badge: unreadMsgCount > 0 ? unreadMsgCount : connectedUsers.length },
    { key: "requests", label: "Sent", icon: Clock, badge: sentRequests.length },
    { key: "received", label: "Requests", icon: Bell, badge: receivedRequests.length },
    { key: "posts", label: "Posts", icon: Globe, badge: posts.length },
  ];

  /* ══════════════════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="mc2-page">
      {/* ── HERO BANNER ─────────────────────────────────────────────────── */}
      <div className="mc2-hero">
        <div className="mc2-hero-content">
          <div className="mc2-hero-icon">
            <Users size={28} />
          </div>
          <div>
            <h1>Maatram Connect</h1>
            <p>Meet · Collaborate · Grow Together — Students &amp; Alumni Only</p>
          </div>
        </div>
        <div className="mc2-hero-stats">
          <div className="mc2-hstat">
            <strong>{registeredUsers.length}+</strong>
            <span>Members</span>
          </div>
          <div className="mc2-hstat">
            <strong>{connectedUsers.length}</strong>
            <span>Connections</span>
          </div>
          <div className="mc2-hstat">
            <strong>{receivedRequests.length}</strong>
            <span>Pending</span>
          </div>
        </div>
      </div>

      {/* ── HORIZONTAL FILTER BAR ───────────────────────────────────────── */}
      <div className="mc2-filter-bar">
        {/* Search */}
        <div className="mc2-search-wrap">
          <Search size={15} />
          <input
            type="text"
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Department */}
        <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className="mc2-select">
          {DEPTS.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>

        {/* Year */}
        <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="mc2-select">
          {YEARS.map((y) => (
            <option key={y}>{y}</option>
          ))}
        </select>

        {/* Sort */}
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="mc2-select">
          {SORTS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>

        {/* Clear */}
        {(selectedDept !== "All" || selectedYear !== "All" || search) && (
          <button
            type="button"
            className="mc2-clear-btn"
            onClick={() => {
              setSelectedDept("All");
              setSelectedYear("All");
              setSearch("");
            }}
          >
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {/* ── SECTION NAV BUTTONS (ROW) ────────────────────────────────────── */}
      <div className="mc2-section-nav">
        {SECTIONS.map(({ key, label, icon: Icon, badge }) => (
          <button
            key={key}
            type="button"
            className={`mc2-section-btn ${activeSection === key ? "active" : ""}`}
            onClick={() => setActiveSection(key)}
          >
            {Icon && <Icon size={15} />}
            <span>{label}</span>
            {badge > 0 && <span className="mc2-nav-badge">{badge}</span>}
          </button>
        ))}

        {/* User type pills */}
        <div className="mc2-type-pills">
          {["All", "Students", "Alumni"].map((t) => (
            <button
              key={t}
              type="button"
              className={`mc2-type-pill ${userTypeTab === t ? "active" : ""}`}
              onClick={() => setUserTypeTab(t)}
            >
              {t === "Students" ? <GraduationCap size={12} /> : t === "Alumni" ? <ShieldCheck size={12} /> : <Users size={12} />}
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION: SUGGESTED PROFILES
      ══════════════════════════════════════════════════════════════════ */}
      {activeSection === "suggested" && (
        <div className="mc2-section">
          {loading ? (
            <div className="mc2-loading">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="mc2-skeleton-card" />
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="mc2-empty-state">
              <Users size={40} />
              <h3>No members found</h3>
              <p>Try adjusting your filters to find students and alumni.</p>
            </div>
          ) : (
            <div className="mc2-profiles-grid">
              {filteredUsers.map((u) => {
                const info = getUserConnectionInfo(u);
                return (
                  <div key={u.id || u.applicationId} className="mc2-profile-card">
                    {/* Cover / Banner */}
                    <div className="mc2-card-cover">
                      <div className="mc2-card-cover-gradient" />
                      {u.isOnline && <span className="mc2-card-online-dot" />}
                      <span className={`mc2-card-role-badge ${u.role === "alumni" ? "alumni" : "student"}`}>
                        {u.role === "alumni" ? "Alumni" : "Student"}
                      </span>
                    </div>

                    {/* Avatar */}
                    <div className="mc2-card-avatar-wrap">
                      <img
                        src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.fullName)}`}
                        alt={u.fullName}
                        className="mc2-card-avatar"
                        onClick={() => setViewProfile(u)}
                      />
                    </div>

                    {/* Info */}
                    <div className="mc2-card-body">
                      <h3 className="mc2-card-name" onClick={() => setViewProfile(u)}>
                        {u.fullName}
                      </h3>
                      <div className="mc2-card-degree">{u.degree || `B.E. ${u.department}`}</div>
                      <div className="mc2-card-college">{u.college}</div>

                      {/* Skill chips */}
                      {Array.isArray(u.skills) && u.skills.length > 0 && (
                        <div className="mc2-card-skills">
                          {u.skills.slice(0, 3).map((sk) => (
                            <span key={sk} className="mc2-card-skill-tag">
                              {sk}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Stats */}
                      <div className="mc2-card-stats">
                        <span>
                          <Star size={11} /> {u.points || 0} pts
                        </span>
                        <span>
                          <Clock size={11} /> {u.totalHours || 0}h
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="mc2-card-actions">
                        {info.status === "connected" ? (
                          <div style={{ display: "flex", gap: 5, flex: 1 }}>
                            <button className="mc2-btn mc2-btn-connected" disabled style={{ flex: 1 }}>
                              <Check size={13} /> Connected
                            </button>
                            <button
                              type="button"
                              className="mc2-btn"
                              style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA", padding: "6px 8px" }}
                              onClick={() => handleRemoveConnection(info.connectionId, u)}
                              title={`Remove ${u.fullName} from connections`}
                            >
                              <UserMinus size={13} />
                            </button>
                          </div>
                        ) : info.status === "pending_sent" ? (
                          <button
                            className="mc2-btn mc2-btn-pending"
                            onClick={() => handleCancelRequest(info.connectionId)}
                            title="Cancel request"
                          >
                            <Clock size={13} /> Pending
                          </button>
                        ) : info.status === "pending_received" ? (
                          <button className="mc2-btn mc2-btn-accept-sm" onClick={() => handleAcceptRequest(info.connectionId, u)}>
                            <Check size={13} /> Accept
                          </button>
                        ) : (
                          <button className="mc2-btn mc2-btn-connect" onClick={() => handleSendRequest(u)}>
                            <UserPlus size={13} /> Connect
                          </button>
                        )}

                        {/* Message button — only if connected */}
                        <button
                          className={`mc2-btn mc2-btn-msg ${info.status !== "connected" ? "disabled" : ""}`}
                          onClick={() => handleOpenChat(u)}
                          title={info.status !== "connected" ? "Connect first to message" : `Message ${u.fullName}`}
                        >
                          <MessageSquare size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SECTION: MESSAGES (connected people list + chat)
      ══════════════════════════════════════════════════════════════════ */}
      {activeSection === "messages" && (
        <div className="mc2-section mc2-messages-section">
          {connectedUsers.length === 0 ? (
            <div className="mc2-empty-state">
              <Lock size={40} />
              <h3>No connections yet</h3>
              <p>Connect with students and alumni to unlock direct messaging.</p>
              <button className="mc2-btn mc2-btn-connect" style={{ marginTop: 14 }} onClick={() => setActiveSection("suggested")}>
                <UserPlus size={14} /> Find People
              </button>
            </div>
          ) : (
            <div className="mc2-msg-layout">
              {/* Left: conversation list */}
              <div className="mc2-conv-list">
                <div className="mc2-conv-list-header">
                  <MessageSquare size={15} /> Conversations ({connectedUsers.length})
                  {unreadMsgCount > 0 && (
                    <span style={{ marginLeft: "auto", fontSize: 11, background: "#2563EB", color: "#fff", padding: "2px 7px", borderRadius: 10, fontWeight: 700 }}>
                      {unreadMsgCount} new
                    </span>
                  )}
                </div>
                {sortedConnectedUsers.map((conn) => {
                  const u = conn.user;
                  if (!u) return null;
                  const chatKey = u.id || u.applicationId;
                  const msgs = chatMessages[chatKey] || [];
                  const lastMsg = msgs[msgs.length - 1];
                  const isActive = activeChatUser && (activeChatUser.id === u.id || activeChatUser.applicationId === u.applicationId);
                  const isUnread = hasUnreadMessage(u);
                  return (
                    <div
                      key={conn.connectionId || chatKey}
                      className={`mc2-conv-item ${isActive ? "active" : ""} ${isUnread ? "has-unread" : ""}`}
                      onClick={() => {
                        setActiveChatUser(u);
                        setReadConvoIds((prev) => new Set(prev).add(chatKey));
                      }}
                    >
                      <div className="mc2-conv-avatar-wrap">
                        <img
                          src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.fullName)}`}
                          alt={u.fullName}
                        />
                        {u.isOnline && <span className="mc2-conv-online" />}
                      </div>
                      <div className="mc2-conv-info">
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                          <div className="mc2-conv-name">{u.fullName}</div>
                          {isUnread && (
                            <span
                              className="mc2-unread-blue-dot"
                              title="New message received"
                              style={{
                                width: 9,
                                height: 9,
                                borderRadius: "50%",
                                background: "#2563EB",
                                display: "inline-block",
                                flexShrink: 0,
                                boxShadow: "0 0 0 2px rgba(37,99,235,0.25)",
                              }}
                            />
                          )}
                        </div>
                        <div
                          className="mc2-conv-last"
                          style={{
                            fontWeight: isUnread ? 600 : 400,
                            color: isUnread ? "#0F172A" : "#64748B",
                          }}
                        >
                          {lastMsg?.text?.slice(0, 36) || "Start the conversation..."}
                        </div>
                      </div>
                      {lastMsg && <div className="mc2-conv-time">{lastMsg.time}</div>}
                    </div>
                  );
                })}
              </div>

              {/* Right: chat window or placeholder */}
              {activeChatUser ? (
                <div className="mc2-chat-pane">
                  <div className="mc2-chat-pane-header">
                    <div className="mc2-chat-user-info">
                      <div className="mc2-chat-av-wrap">
                        <img src={activeChatUser.avatar} alt={activeChatUser.fullName} />
                        {activeChatUser.isOnline && <span className="mc2-conv-online" />}
                      </div>
                      <div>
                        <div className="mc2-chat-pane-name">{activeChatUser.fullName}</div>
                        <div className="mc2-chat-pane-sub">
                          {activeChatUser.isOnline ? "● Active now" : activeChatUser.degree || activeChatUser.department}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className="mc2-chat-icon-btn"
                        title={`Remove ${activeChatUser.fullName} from connections`}
                        onClick={() => {
                          const conn = connectedUsers.find(
                            (c) => c.user?.id === activeChatUser.id || c.user?.applicationId === activeChatUser.applicationId
                          );
                          handleRemoveConnection(conn?.connectionId, activeChatUser);
                        }}
                        style={{ color: "#EF4444" }}
                      >
                        <UserMinus size={15} />
                      </button>
                      <button className="mc2-chat-icon-btn" title="Voice call" onClick={() => showToast(`Calling ${activeChatUser.fullName}...`)}>
                        <Phone size={15} />
                      </button>
                      <button className="mc2-chat-icon-btn" title="Video call" onClick={() => showToast(`Video call with ${activeChatUser.fullName}...`)}>
                        <Video size={15} />
                      </button>
                      <button className="mc2-chat-icon-btn" onClick={() => setActiveChatUser(null)}>
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="mc2-chat-pane-body">
                    <div className="mc2-chat-system-note">🔒 You and {activeChatUser.fullName} are connected friends on Maatram</div>
                    {!chatMessages[activeChatUser.id || activeChatUser.applicationId] ||
                      chatMessages[activeChatUser.id || activeChatUser.applicationId].length === 0 ? (
                      <div style={{ textAlign: "center", color: "#64748B", padding: "48px 16px", fontSize: "0.9rem" }}>
                        <div style={{ fontSize: "1.8rem", marginBottom: 8 }}>💬</div>
                        <strong>No messages yet</strong>
                        <p style={{ margin: "4px 0 0", color: "#94A3B8", fontSize: "0.82rem" }}>
                          Type below to send a real text message directly to {activeChatUser.fullName}.
                        </p>
                      </div>
                    ) : (
                      (chatMessages[activeChatUser.id || activeChatUser.applicationId] || []).map((msg) => {
                        const isMe =
                          msg.sender === "me" ||
                          String(msg.senderId) === String(user?._id) ||
                          String(msg.senderId) === String(user?.id) ||
                          String(msg.senderId) === String(user?.applicationId);
                        const timeStr =
                          msg.time ||
                          (msg.createdAt
                            ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                            : "Now");
                        return (
                          <div key={msg._id || msg.id} className={`mc2-msg-row ${isMe ? "outgoing" : "incoming"}`}>
                            {!isMe && <img src={activeChatUser.avatar} alt={activeChatUser.fullName} className="mc2-msg-av" />}
                            <div className="mc2-msg-content">
                              <div className="mc2-msg-bubble">{msg.text}</div>
                              <span className="mc2-msg-time">
                                {timeStr}
                                {isMe && <Check size={11} color="#2563EB" />}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  <form onSubmit={handleSendMessage} className="mc2-chat-input-bar">
                    <button type="button" className="mc2-chat-attach-btn" onClick={() => setMessageInput((p) => p + " 😊 ")}>
                      <Smile size={18} />
                    </button>
                    <input
                      type="text"
                      className="mc2-chat-input-field"
                      placeholder="Type a message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                    />
                    <button type="submit" className="mc2-chat-send-btn" disabled={!messageInput.trim()}>
                      <Send size={15} />
                    </button>
                  </form>
                </div>
              ) : (
                <div className="mc2-chat-placeholder">
                  <MessageSquare size={48} color="#CBD5E1" />
                  <p>Select a conversation to start messaging</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SECTION: SENT REQUESTS  (sender can only withdraw)
      ══════════════════════════════════════════════════════════════════ */}
      {activeSection === "requests" && (
        <div className="mc2-section">
          <div className="mc2-section-title">
            <Clock size={18} /> Sent Connection Requests ({sentRequests.length})
          </div>
          {sentRequests.length === 0 ? (
            <div className="mc2-empty-state">
              <Clock size={40} />
              <h3>No pending sent requests</h3>
              <p>Go to Suggested to discover and connect with volunteers.</p>
            </div>
          ) : (
            <div className="mc2-req-list">
              {sentRequests.map((req) => {
                const u = req.user;
                if (!u) return null;
                return (
                  <div key={req.connectionId} className="mc2-req-card">
                    <img
                      src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.fullName)}`}
                      alt={u.fullName}
                      className="mc2-req-av"
                      onClick={() => setViewProfile(u)}
                    />
                    <div className="mc2-req-info">
                      <div className="mc2-req-name">{u.fullName}</div>
                      <div className="mc2-req-sub">
                        {u.degree || u.department} · {u.college || "Tamil Nadu"}
                      </div>
                      <div className="mc2-req-sent-time">
                        <Clock size={11} /> Sent {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : "recently"}
                      </div>
                    </div>
                    <div className="mc2-req-actions">
                      <span className="mc2-req-status-pill pending">Pending Approval</span>
                      <button type="button" className="mc2-btn mc2-btn-outline-sm" onClick={() => handleCancelRequest(req.connectionId)}>
                        <X size={12} /> Withdraw
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SECTION: RECEIVED REQUESTS  (only the receiver can accept)
      ══════════════════════════════════════════════════════════════════ */}
      {activeSection === "received" && (
        <div className="mc2-section">
          <div className="mc2-section-title">
            <Bell size={18} /> Connection Requests Received ({receivedRequests.length})
            {receivedRequests.length > 0 && (
              <span style={{ marginLeft: 8, fontSize: 12, color: "#16A34A", fontWeight: 600 }}>Accept to unlock direct messaging</span>
            )}
          </div>
          {receivedRequests.length === 0 ? (
            <div className="mc2-empty-state">
              <Bell size={40} />
              <h3>No connection requests</h3>
              <p>When someone sends you a request, it will appear here.</p>
            </div>
          ) : (
            <div className="mc2-req-list">
              {receivedRequests.map((req) => {
                const u = req.user;
                if (!u) return null;
                return (
                  <div key={req.connectionId} className="mc2-req-card mc2-req-card-incoming">
                    <img
                      src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.fullName)}`}
                      alt={u.fullName}
                      className="mc2-req-av"
                      onClick={() => setViewProfile(u)}
                    />
                    <div className="mc2-req-info">
                      <div className="mc2-req-name">{u.fullName}</div>
                      <div className="mc2-req-sub">
                        {u.degree || u.department} · {u.college || "Tamil Nadu"}
                      </div>
                      {req.message && <div className="mc2-req-msg">"{req.message}"</div>}
                    </div>
                    <div className="mc2-req-actions">
                      <button type="button" className="mc2-btn mc2-btn-accept-sm" onClick={() => handleAcceptRequest(req.connectionId, u)}>
                        <Check size={13} /> Accept
                      </button>
                      <button type="button" className="mc2-btn mc2-btn-outline-sm" onClick={() => handleDeclineRequest(req.connectionId, u)}>
                        <X size={12} /> Decline
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SECTION: POSTS
      ══════════════════════════════════════════════════════════════════ */}
      {activeSection === "posts" && (
        <div className="mc2-section mc2-posts-section">
          {/* Create post */}
          <div className="mc2-post-composer">
            <img
              src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.fullName || "me")}`}
              alt="Me"
              className="mc2-composer-av"
            />
            <div className="mc2-composer-box">
              <textarea
                className="mc2-composer-input"
                placeholder="Share your volunteering experience, event highlights, or milestone..."
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                rows={3}
              />

              {/* Photo preview if chosen */}
              {newPostImg && (
                <div style={{ position: "relative", margin: "8px 0 12px", borderRadius: 12, overflow: "hidden", border: "1.5px solid #CBD5E1", maxWidth: 320 }}>
                  <img src={newPostImg} alt="Attached Preview" style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }} />
                  <button
                    type="button"
                    onClick={() => setNewPostImg("")}
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      background: "rgba(15,23,42,0.8)",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: "50%",
                      width: 24,
                      height: 24,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    title="Remove attached photo"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Hidden file input for photo upload */}
              <input type="file" ref={photoInputRef} accept="image/*" style={{ display: "none" }} onChange={handlePhotoUpload} />

              <div className="mc2-composer-actions">
                <div className="mc2-composer-tools">
                  <button
                    type="button"
                    className="mc2-composer-tool"
                    title="Upload and attach a photo"
                    onClick={() => photoInputRef.current?.click()}
                    style={{ color: newPostImg ? "#2563EB" : undefined, fontWeight: newPostImg ? 700 : 500 }}
                  >
                    <Image size={16} /> {newPostImg ? "Photo Added ✓" : "Photo"}
                  </button>
                  <button type="button" className="mc2-composer-tool" title="Attach event">
                    <Calendar size={16} /> Event
                  </button>
                </div>
                <button
                  type="button"
                  className="mc2-btn mc2-btn-connect"
                  onClick={handleCreatePost}
                  disabled={!newPostText.trim() && !newPostImg}
                >
                  <Send size={14} /> Share Post
                </button>
              </div>
            </div>
          </div>

          {/* Feed */}
          <div className="mc2-posts-feed">
            {posts.length === 0 ? (
              <div className="mc2-empty-state">
                <Globe size={40} />
                <h3>No posts yet!</h3>
                <p>Be the first to share your volunteering experience, achievements, and Maatram activities.</p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="mc2-post-card">
                  <div className="mc2-post-header">
                    <img src={post.avatar} alt={post.author} className="mc2-post-av" />
                    <div className="mc2-post-author-info">
                      <div className="mc2-post-author-name">
                        {post.author}
                        <span className={`mc2-post-role-pill ${post.role}`}>{post.role === "alumni" ? "Alumni" : "Student"}</span>
                      </div>
                      <div className="mc2-post-time">{post.time}</div>
                    </div>

                    {/* Delete — visible only on your own posts */}
                    {isMyPost(post) && (
                      <button
                        type="button"
                        className="mc2-post-more-btn mc2-post-delete-btn"
                        onClick={() => handleDeletePost(post)}
                        title="Delete post"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="mc2-post-text">{post.text}</div>

                  {post.image && (
                    <div className="mc2-post-img-wrap">
                      <img src={post.image} alt="Post" className="mc2-post-img" />
                    </div>
                  )}

                  <div className="mc2-post-footer">
                    <button
                      type="button"
                      className={`mc2-post-action-btn ${post.liked ? "liked" : ""}`}
                      onClick={() => handleLikePost(post.id)}
                    >
                      <Heart size={15} fill={post.liked ? "#EF4444" : "none"} /> {post.likes} Likes
                    </button>
                    <button type="button" className="mc2-post-action-btn">
                      <MessageSquare size={15} /> {post.comments} Comments
                    </button>
                    <button type="button" className="mc2-post-action-btn">
                      <Rocket size={15} /> Share
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          CHAT MODAL (floating, when opened from suggested/elsewhere)
      ══════════════════════════════════════════════════════════════════ */}
      {activeSection !== "messages" && activeChatUser && (
        <div className="mc2-chat-modal-overlay" onClick={() => setActiveChatUser(null)}>
          <div className="mc2-chat-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mc2-chat-pane-header">
              <div className="mc2-chat-user-info">
                <img src={activeChatUser.avatar} alt={activeChatUser.fullName} style={{ width: 36, height: 36, borderRadius: "50%" }} />
                <div>
                  <div className="mc2-chat-pane-name">{activeChatUser.fullName}</div>
                  <div className="mc2-chat-pane-sub">Connected friend</div>
                </div>
              </div>
              <button className="mc2-chat-icon-btn" onClick={() => setActiveChatUser(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="mc2-chat-pane-body" style={{ maxHeight: 320 }}>
              <div className="mc2-chat-system-note">🔒 You are connected friends on Maatram</div>
              {!chatMessages[activeChatUser.id || activeChatUser.applicationId] ||
                chatMessages[activeChatUser.id || activeChatUser.applicationId].length === 0 ? (
                <div style={{ textAlign: "center", color: "#64748B", padding: "32px 16px", fontSize: "0.85rem" }}>
                  <div style={{ fontSize: "1.5rem", marginBottom: 6 }}>💬</div>
                  <strong>No messages yet</strong>
                  <p style={{ margin: "4px 0 0", color: "#94A3B8", fontSize: "0.78rem" }}>
                    Type a message below to chat with {activeChatUser.fullName}.
                  </p>
                </div>
              ) : (
                (chatMessages[activeChatUser.id || activeChatUser.applicationId] || []).map((msg) => {
                  const isMe =
                    msg.sender === "me" ||
                    String(msg.senderId) === String(user?._id) ||
                    String(msg.senderId) === String(user?.id) ||
                    String(msg.senderId) === String(user?.applicationId);
                  const timeStr =
                    msg.time ||
                    (msg.createdAt
                      ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : "Now");
                  return (
                    <div key={msg._id || msg.id} className={`mc2-msg-row ${isMe ? "outgoing" : "incoming"}`}>
                      {!isMe && <img src={activeChatUser.avatar} alt={activeChatUser.fullName} className="mc2-msg-av" />}
                      <div className="mc2-msg-content">
                        <div className="mc2-msg-bubble">{msg.text}</div>
                        <span className="mc2-msg-time">{timeStr}</span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>
            <form onSubmit={handleSendMessage} className="mc2-chat-input-bar">
              <input
                type="text"
                className="mc2-chat-input-field"
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
              />
              <button type="submit" className="mc2-chat-send-btn">
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          PROFILE MODAL
      ══════════════════════════════════════════════════════════════════ */}
      {viewProfile && (
        <div className="mc2-chat-modal-overlay" onClick={() => setViewProfile(null)}>
          <div className="mc2-profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mc2-profile-banner">
              <button className="mc2-profile-close" onClick={() => setViewProfile(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="mc2-profile-body">
              <div className="mc2-profile-top">
                <img
                  src={viewProfile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(viewProfile.fullName)}`}
                  alt={viewProfile.fullName}
                  className="mc2-profile-avatar"
                />
                <span className={`mc2-card-role-badge ${viewProfile.role === "alumni" ? "alumni" : "student"}`}>
                  {viewProfile.role === "alumni" ? "Alumni" : "Student"}
                </span>
              </div>
              <h2 className="mc2-profile-name">{viewProfile.fullName}</h2>
              <p className="mc2-profile-degree">
                {viewProfile.degree || viewProfile.department} · {viewProfile.college}
              </p>
              <p className="mc2-profile-bio">{viewProfile.bio || "Passionate Maatram volunteer committed to community impact."}</p>

              {/* Stats */}
              <div className="mc2-profile-stats">
                <div className="mc2-pstat">
                  <strong>{viewProfile.points || 0}</strong>
                  <span>Points</span>
                </div>
                <div className="mc2-pstat">
                  <strong>{viewProfile.totalHours || 0}h</strong>
                  <span>Service</span>
                </div>
                <div className="mc2-pstat">
                  <strong>4.8★</strong>
                  <span>Rating</span>
                </div>
              </div>

              {/* Skills */}
              {Array.isArray(viewProfile.skills) && viewProfile.skills.length > 0 && (
                <div className="mc2-profile-skills">
                  {viewProfile.skills.map((sk) => (
                    <span key={sk} className="mc2-card-skill-tag">
                      {sk}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="mc2-profile-actions">
                {(() => {
                  const info = getUserConnectionInfo(viewProfile);
                  if (info.status === "connected")
                    return (
                      <>
                        <button
                          className="mc2-btn mc2-btn-connect"
                          onClick={() => {
                            setViewProfile(null);
                            handleOpenChat(viewProfile);
                          }}
                        >
                          <MessageSquare size={14} /> Message
                        </button>
                        <button className="mc2-btn mc2-btn-connected" disabled>
                          <Check size={13} /> Connected
                        </button>
                      </>
                    );
                  if (info.status === "pending_sent")
                    return (
                      <button className="mc2-btn mc2-btn-pending" onClick={() => handleCancelRequest(info.connectionId)}>
                        <Clock size={13} /> Pending — Cancel
                      </button>
                    );
                  if (info.status === "pending_received")
                    return (
                      <button
                        className="mc2-btn mc2-btn-accept-sm"
                        onClick={() => {
                          handleAcceptRequest(info.connectionId, viewProfile);
                          setViewProfile(null);
                        }}
                      >
                        <Check size={13} /> Accept Request
                      </button>
                    );
                  return (
                    <button
                      className="mc2-btn mc2-btn-connect"
                      onClick={() => {
                        handleSendRequest(viewProfile);
                        setViewProfile(null);
                      }}
                    >
                      <UserPlus size={14} /> Send Connection Request
                    </button>
                  );
                })()}
                <button className="mc2-btn mc2-btn-outline-sm" onClick={() => setViewProfile(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          CONNECT PROMPT MODAL (WHEN TRYING TO MESSAGE UNCONNECTED USER)
      ══════════════════════════════════════════════════════════════════ */}
      {connectPromptUser && (
        <div className="mc2-chat-modal-overlay" onClick={() => setConnectPromptUser(null)}>
          <div className="mc2-profile-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="mc2-profile-banner" style={{ height: 70 }}>
              <button className="mc2-profile-close" onClick={() => setConnectPromptUser(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="mc2-profile-body" style={{ textAlign: "center", paddingTop: 10 }}>
              <div style={{ display: "flex", justifyContent: "center", marginTop: -40, marginBottom: 12, position: "relative", zIndex: 2 }}>
                <img
                  src={connectPromptUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(connectPromptUser.fullName)}`}
                  alt={connectPromptUser.fullName}
                  style={{ width: 72, height: 72, borderRadius: "50%", border: "3px solid #fff", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
                />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 4px", color: "#0F172A" }}>
                Connect with {connectPromptUser.fullName}
              </h3>
              <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 16px" }}>
                {connectPromptUser.degree || connectPromptUser.department} · {connectPromptUser.college}
              </p>
              <div style={{ background: "#EFF6FF", border: "1.5px solid #BFDBFE", borderRadius: 12, padding: 14, marginBottom: 20, textAlign: "left" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "#1D4ED8", marginBottom: 4 }}>
                  <Lock size={15} /> Messaging is Protected
                </div>
                <p style={{ fontSize: 12, color: "#2563EB", margin: 0, lineHeight: 1.5 }}>
                  To ensure safe volunteer collaboration, you must send a connection request to <strong>{connectPromptUser.fullName}</strong>. Once they accept your request, you become connected friends and direct messaging is unlocked!
                </p>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                {(() => {
                  const info = getUserConnectionInfo(connectPromptUser);
                  if (info.status === "pending_sent") {
                    return (
                      <button
                        type="button"
                        className="mc2-btn mc2-btn-pending"
                        onClick={() => {
                          handleCancelRequest(info.connectionId);
                          setConnectPromptUser(null);
                        }}
                      >
                        Cancel Request
                      </button>
                    );
                  }
                  if (info.status === "pending_received") {
                    return (
                      <button
                        type="button"
                        className="mc2-btn mc2-btn-accept-sm"
                        onClick={() => {
                          handleAcceptRequest(info.connectionId, connectPromptUser);
                          setConnectPromptUser(null);
                        }}
                      >
                        <Check size={13} /> Accept Request
                      </button>
                    );
                  }
                  return (
                    <button
                      type="button"
                      className="mc2-btn mc2-btn-connect"
                      style={{ padding: "9px 18px" }}
                      onClick={() => {
                        handleSendRequest(connectPromptUser);
                        setConnectPromptUser(null);
                      }}
                    >
                      <UserPlus size={15} /> Send Connection Request
                    </button>
                  );
                })()}
                <button type="button" className="mc2-btn mc2-btn-outline-sm" onClick={() => setConnectPromptUser(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}