// frontend/src/components/common/MaatramChatbot.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import "./MaatramChatbot.css";
import { api } from "../../api";
import { useApp } from "../../context/AppContext";

const QUICK_ACTIONS = [
  { label: "Our Activities", icon: "👥", q: "What activities does Maatram Foundation do?" },
  { label: "Get Involved", icon: "❤️", q: "How can I volunteer with Maatram Foundation?" },
  { label: "FAQ", icon: "❓", q: "What are the most common questions about Maatram Foundation?" },
  { label: "School Visit", icon: "🏫", q: "What are the school visit guidelines?" },
  { label: "Points & Rewards", icon: "🏆", q: "How does the points and rewards system work?" },
];

const BOT_AVATAR = (
  <div className="mchat-avatar">
    <span style={{ fontSize: 18 }}>🌱</span>
  </div>
);

const USER_AVATAR = (
  <div className="mchat-avatar user-av">
    <span style={{ fontSize: 18 }}>👤</span>
  </div>
);

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const WELCOME_MSG = {
  id: "welcome",
  role: "bot",
  content:
    "Hi! I'm your Maatram Foundation Assistant. I can help you with volunteering programs, guidelines, events, and platform features. How can I help you today? 😊",
  timestamp: new Date().toISOString(),
  sources: [],
};

export default function MaatramChatbot() {
  const { user, isAuthenticated } = useApp();

  // Only show chatbot for students — hide for admin and alumni
  const userRole = (user?.role || "").toLowerCase();
  if (userRole === "admin" || userRole === "administrator" || userRole === "alumni") {
    return null;
  }
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [maatramId, setMaatramId] = useState("");
  const [idInputVal, setIdInputVal] = useState("");
  const [idPromptDone, setIdPromptDone] = useState(false);
  const [showIdPrompt, setShowIdPrompt] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, open]);

  // Auto-focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200);
      // Show MAA ID prompt if not authenticated and not done yet
      if (!isAuthenticated && !idPromptDone) {
        setShowIdPrompt(true);
      }
    }
  }, [open, isAuthenticated, idPromptDone]);

  // Pre-fill from logged-in user
  useEffect(() => {
    if (user?.applicationId) {
      setMaatramId(user.applicationId);
      setIdPromptDone(true);
    }
  }, [user]);

  const handleIdSubmit = () => {
    if (idInputVal.trim()) {
      setMaatramId(idInputVal.trim());
      addBotMessage(`Thanks! I've noted your Maatram ID: **${idInputVal.trim()}**. How can I assist you today? 😊`);
    } else {
      addBotMessage("No worries! You can still ask me questions about Maatram Foundation. 😊");
    }
    setIdPromptDone(true);
    setShowIdPrompt(false);
  };

  function addBotMessage(content, sources = []) {
    setMessages(prev => [
      ...prev,
      { id: Date.now() + "_bot", role: "bot", content, timestamp: new Date().toISOString(), sources },
    ]);
  }

  const sendMessage = useCallback(async (msgText) => {
    const text = (msgText || input).trim();
    if (!text || loading) return;

    const userMsg = {
      id: Date.now() + "_user",
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Build conversation history for context (last 10 messages)
    const history = messages
      .filter(m => m.id !== "welcome")
      .slice(-10)
      .map(m => ({ role: m.role === "user" ? "user" : "model", content: m.content }));

    try {
      const res = await api.post("/chat/message", {
        message: text,
        maatramId: maatramId || user?.applicationId || "",
        conversationHistory: history,
      });

      if (res.success) {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + "_bot",
            role: "bot",
            content: res.reply,
            timestamp: res.timestamp || new Date().toISOString(),
            sources: res.sources || [],
          },
        ]);
      } else {
        addBotMessage("I encountered an issue processing your request. Please try again.");
      }
    } catch (err) {
      let errMsg = "I encountered an error. Please try again in a moment.";
      if (err.message?.includes("connect") || err.message?.includes("network") || err.message?.includes("Failed to fetch")) {
        errMsg = "⚠️ Cannot connect to the server. Please make sure the backend is running (npm run dev in backend folder).";
      } else if (err.message?.includes("401") || err.message?.includes("Authorization") || err.message?.includes("log in")) {
        errMsg = "🔒 Please log in to your student account to use the assistant.";
      } else if (err.message) {
        errMsg = `Notice: ${err.message}`;
      }
      addBotMessage(errMsg);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, maatramId, user]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([WELCOME_MSG]);
    setMaatramId(user?.applicationId || "");
    setIdPromptDone(!!user?.applicationId);
    setShowIdPrompt(!isAuthenticated && !user?.applicationId);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        className="mchat-fab"
        onClick={() => setOpen(o => !o)}
        title="Maatram AI Assistant"
        aria-label="Open Maatram AI Assistant"
      >
        <span className="mchat-fab-icon">🌱</span>
      </button>

      {/* Chat Window */}
      {open && (
        <div className="mchat-window" role="dialog" aria-label="Maatram AI Assistant">
          {/* Header */}
          <div className="mchat-header">
            <div className="mchat-header-logo">
              <span style={{ fontSize: 22 }}>🌱</span>
            </div>
            <div className="mchat-header-divider" />
            <div className="mchat-header-info">
              <div className="mchat-header-title">Maatram AI Assistant</div>
              <div className="mchat-header-sub">Ask • Learn • Get Inspired</div>
            </div>
            <div className="mchat-header-status">
              <span className="mchat-status-dot" />
              Online
            </div>
            <button
              className="mchat-close-btn"
              onClick={() => setOpen(false)}
              aria-label="Close chatbot"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="mchat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`mchat-msg ${msg.role}`}>
                {msg.role === "bot" ? BOT_AVATAR : USER_AVATAR}
                <div className="mchat-bubble-wrap">
                  <div className="mchat-bubble">{msg.content}</div>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mchat-sources">
                      {msg.sources.map((s, i) => (
                        <span key={i} className="mchat-source-tag">
                          📄 {s.label || s.source}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mchat-time">{formatTime(msg.timestamp)}</div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="mchat-msg bot">
                {BOT_AVATAR}
                <div className="mchat-bubble-wrap">
                  <div className="mchat-typing">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}

            {/* MAA ID prompt */}
            {showIdPrompt && (
              <div className="mchat-id-prompt">
                <strong>🪪 Enter your Maatram ID</strong> (e.g. MAA001) for personalized guidance:
                <input
                  value={idInputVal}
                  onChange={e => setIdInputVal(e.target.value)}
                  placeholder="Your Maatram ID..."
                  onKeyDown={e => e.key === "Enter" && handleIdSubmit()}
                />
                <button onClick={handleIdSubmit}>Submit</button>
                <button className="mchat-skip-btn" onClick={() => { setIdPromptDone(true); setShowIdPrompt(false); }}>
                  Skip
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Chips */}
          <div className="mchat-quick-actions">
            {QUICK_ACTIONS.map((qa) => (
              <button
                key={qa.label}
                className="mchat-chip"
                onClick={() => sendMessage(qa.q)}
                disabled={loading}
              >
                {qa.icon} {qa.label}
              </button>
            ))}
            <button className="mchat-clear-btn" onClick={clearChat} title="Clear chat">
              🗑 Clear
            </button>
          </div>

          {/* Input Bar */}
          <div className="mchat-input-bar">
            <textarea
              ref={inputRef}
              className="mchat-input"
              placeholder="Type your question..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={loading}
            />
            <button
              className="mchat-send-btn"
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              aria-label="Send"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
