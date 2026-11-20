// frontend/src/pages/admin/AdminChatbotPage.jsx
import React, { useState, useEffect, useRef } from "react";
import "./AdminChatbotPage.css";
import { api } from "../../api";

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

export default function AdminChatbotPage() {
  const [status, setStatus] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const [alert, setAlert] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const showAlert = (msg, type = "success") => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 5000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statusRes, docsRes] = await Promise.all([
        api.get("/chat/status"),
        api.get("/chat/admin/documents"),
      ]);
      if (statusRes.success) setStatus(statusRes.data);
      if (docsRes.success) setDocuments(docsRes.data || []);
    } catch (err) {
      showAlert("Failed to load chatbot data: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== "application/pdf") {
        showAlert("Only PDF files are allowed.", "error");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("document", selectedFile);

      const token = localStorage.getItem("maatram_token") || "";
      const user = JSON.parse(localStorage.getItem("maatram_user") || "null");

      const headers = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      if (user?.role) headers["x-user-role"] = user.role;
      if (user?.id) headers["x-user-id"] = user.id;

      // Find working API base
      const bases = ["/api", "http://localhost:5001/api", "http://localhost:5002/api"];
      let res = null;
      for (const base of bases) {
        try {
          const r = await fetch(`${base}/chat/admin/upload`, {
            method: "POST",
            headers,
            body: formData,
          });
          if (r.ok || r.status < 500) { res = await r.json(); break; }
        } catch (_) {}
      }

      if (res?.success) {
        showAlert(`✅ "${selectedFile.name}" uploaded and index rebuilt successfully!`);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        await fetchData();
      } else {
        showAlert(res?.message || "Upload failed.", "error");
      }
    } catch (err) {
      showAlert("Upload error: " + err.message, "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (filename) => {
    if (!window.confirm(`Delete "${filename}"? This will remove it from the knowledge base.`)) return;
    try {
      const res = await api.delete(`/chat/admin/documents/${encodeURIComponent(filename)}`);
      if (res.success) {
        showAlert("Document deleted successfully.");
        await fetchData();
      } else {
        showAlert(res.message || "Delete failed.", "error");
      }
    } catch (err) {
      showAlert("Delete error: " + err.message, "error");
    }
  };

  const handleRebuildIndex = async () => {
    if (!window.confirm("Rebuild the AI knowledge base index from all documents? This may take a moment.")) return;
    setRebuilding(true);
    try {
      const res = await api.post("/chat/admin/rebuild-index", {});
      if (res.success) {
        showAlert(`✅ Index rebuilt: ${res.result?.chunks || 0} chunks from ${res.result?.files || 0} documents.`);
        await fetchData();
      } else {
        showAlert(res.message || "Rebuild failed.", "error");
      }
    } catch (err) {
      showAlert("Rebuild error: " + err.message, "error");
    } finally {
      setRebuilding(false);
    }
  };

  const idxStatus = status?.indexStatus;
  const aiOk = status?.groqConfigured || status?.geminiConfigured;

  return (
    <div className="achat-page">
      <h1>🤖 AI Chatbot Management</h1>
      <p className="achat-subtitle">
        Manage the Maatram AI Assistant knowledge base, documents, and RAG pipeline configuration.
      </p>

      {alert && (
        <div className={`achat-alert ${alert.type}`}>
          <span>{alert.type === "success" ? "✅" : alert.type === "error" ? "❌" : "⚠️"}</span>
          {alert.msg}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#aaa" }}>Loading chatbot status...</div>
      ) : (
        <>
          {/* Status + Upload grid */}
          <div className="achat-grid">
            {/* System Status Card */}
            <div className="achat-card">
              <h3>🟢 System Status</h3>
              <div className="achat-status-row">
                <span>Groq AI API (LLM)</span>
                <span className={`achat-badge ${aiOk ? "ok" : "error"}`}>
                  {aiOk ? "✅ Configured (Active)" : "❌ Not Set"}
                </span>
              </div>
              <div className="achat-status-row">
                <span>Knowledge Index</span>
                <span className={`achat-badge ${idxStatus?.built ? "ok" : "warn"}`}>
                  {idxStatus?.built ? "✅ Built" : "⚠️ Not Built"}
                </span>
              </div>
              <div className="achat-status-row">
                <span>Total Chunks</span>
                <strong>{idxStatus?.chunks || 0} chunks</strong>
              </div>
              <div className="achat-status-row">
                <span>Documents Indexed</span>
                <strong>{idxStatus?.files || 0} PDFs</strong>
              </div>
              <div className="achat-status-row">
                <span>Last Built</span>
                <strong style={{ fontSize: 11 }}>{formatDate(idxStatus?.builtAt)}</strong>
              </div>

              {!aiOk && (
                <div className="achat-alert info" style={{ marginTop: 14, marginBottom: 0 }}>
                  ⚠️ Add your <strong>GROQ_API_KEY</strong> to <code>backend/.env</code> from{" "}
                  <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" style={{ color: "#f5a623" }}>
                    Groq Cloud Console
                  </a>
                </div>
              )}
            </div>

            {/* Upload Card */}
            <div className="achat-card">
              <h3>📤 Upload Document</h3>
              <div
                className="achat-upload-zone"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  accept=".pdf"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                />
                <div className="achat-upload-icon">📄</div>
                {selectedFile ? (
                  <>
                    <strong>{selectedFile.name}</strong>
                    <div style={{ fontSize: 11, color: "#aaa" }}>{formatBytes(selectedFile.size)}</div>
                  </>
                ) : (
                  <>
                    <div>Click to select a PDF file</div>
                    <div style={{ fontSize: 11, marginTop: 4, color: "#aaa" }}>
                      Max 20MB · PDF only
                    </div>
                  </>
                )}
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button
                  className="achat-btn primary"
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading}
                  style={{ flex: 1 }}
                >
                  {uploading ? "Uploading..." : "⬆️ Upload & Index"}
                </button>
                {selectedFile && (
                  <button
                    className="achat-btn secondary"
                    onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Documents Table */}
          <div className="achat-docs-section">
            <h3>📚 Knowledge Base Documents</h3>
            <div className="achat-docs-actions">
              <button
                className="achat-btn primary"
                onClick={handleRebuildIndex}
                disabled={rebuilding}
              >
                {rebuilding ? "⏳ Rebuilding..." : "🔄 Rebuild AI Index"}
              </button>
              <button className="achat-btn secondary" onClick={fetchData}>
                🔃 Refresh
              </button>
            </div>

            <table className="achat-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Document Name</th>
                  <th>Size</th>
                  <th>Uploaded</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.length === 0 ? (
                  <tr className="achat-empty-row">
                    <td colSpan={5}>No documents uploaded yet. Upload PDFs to build the knowledge base.</td>
                  </tr>
                ) : (
                  documents.map((doc, idx) => (
                    <tr key={doc.filename}>
                      <td style={{ color: "#aaa" }}>{idx + 1}</td>
                      <td>
                        <span style={{ fontWeight: 500 }}>📄</span>{" "}
                        {doc.filename}
                      </td>
                      <td>{formatBytes(doc.size)}</td>
                      <td style={{ fontSize: 12, color: "#777" }}>{formatDate(doc.uploadedAt)}</td>
                      <td>
                        <button
                          className="achat-btn danger"
                          style={{ padding: "5px 14px", fontSize: 12 }}
                          onClick={() => handleDelete(doc.filename)}
                        >
                          🗑 Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Instructions */}
          <div className="achat-card" style={{ marginTop: 20, background: "#fff8ee", borderColor: "#f5a62340" }}>
            <h3>💡 How to Configure the Chatbot</h3>
            <ol style={{ fontSize: 13, color: "#555", lineHeight: 1.8, margin: 0, paddingLeft: 18 }}>
              <li>Powered by high-speed <strong>Groq API (Llama / GPT-OSS)</strong></li>
              <li>Your API key is configured in <code>backend/.env</code> (<code>GROQ_API_KEY</code>)</li>
              <li>Upload your Maatram Foundation PDF documents above</li>
              <li>Click <strong>Rebuild AI Index</strong> to process new documents</li>
              <li>Test the chatbot using the floating 🌱 button on any student page</li>
            </ol>
          </div>
        </>
      )}
    </div>
  );
}
