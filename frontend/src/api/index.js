
// frontend/src/api/index.js
// Central API wrapper for Maatram Impact Hub
// Supports Desktop, Mobile LAN and deployed environments.

// Backend API configuration - auto-detects localhost (5001, 5002, 5000), 127.0.0.1, or mobile LAN IP
let activeApiBase = null;

function resolveCandidateUrls() {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    // When running in the browser with Vite dev server or on local machine:
    // 1. '/api' uses Vite's proxy (same origin, zero CORS / network issues)
    // 2. Direct loopback URLs to port 5002, 5001, 5000 (127.0.0.1 prioritized over localhost to avoid IPv6 issues)
    if (host === "localhost" || host === "127.0.0.1") {
      return [
        "/api",
        "http://127.0.0.1:5001/api",
        "http://localhost:5001/api",
        "http://127.0.0.1:5002/api",
        "http://localhost:5002/api",
        "http://127.0.0.1:5000/api",
        "http://localhost:5000/api",
      ];
    }
    if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
      return [
        "/api",
        `http://${host}:5001/api`,
        `http://${host}:5002/api`,
        `http://${host}:5000/api`,
        "http://127.0.0.1:5001/api",
      ];
    }
  }
  const envUrl = (import.meta.env.VITE_API_URL || "http://127.0.0.1:5001").replace(/\/+$/, "");
  return [
    "/api",
    `${envUrl}/api`,
    "http://127.0.0.1:5001/api",
    "http://localhost:5001/api",
    "http://127.0.0.1:5002/api",
    "http://localhost:5002/api",
  ];
}

const BASE_URL = resolveCandidateUrls()[0] || "http://localhost:5001/api";

// Get authentication token
function getToken() {
  return localStorage.getItem("maatram_token") || "";
}

// Get logged-in user
function getUser() {
  try {
    return JSON.parse(
      localStorage.getItem("maatram_user") || "null"
    );
  } catch (error) {
    console.error("Error reading user data:", error);
    return null;
  }
}

// Central API request handler
async function request(method, path, body = null) {
  const headers = {
    "Content-Type": "application/json",
  };

  // Attach authentication token
  const token = getToken();

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Attach user information
  const user = getUser();

  if (user) {
    if (user.role) {
      headers["x-user-role"] = user.role;
    }

    if (user.id || user.applicationId) {
      headers["x-user-id"] = user.id || user.applicationId;
    }
  }

  const options = {
    method,
    headers,
  };

  if (body !== null && body !== undefined) {
    options.body = JSON.stringify(body);
  }

  let response;
  const candidateBases = activeApiBase
    ? [activeApiBase, ...resolveCandidateUrls().filter((u) => u !== activeApiBase)]
    : resolveCandidateUrls();

  let lastNetworkError = null;

  for (const base of candidateBases) {
    try {
      const res = await fetch(`${base}${path}`, options);
      // If Vite dev proxy returned 502/504 (proxy error or ECONNRESET), fall back to direct backend URL
      if ((res.status === 502 || res.status === 504) && base === "/api") {
        lastNetworkError = new Error(`Proxy status ${res.status}`);
        continue;
      }
      response = res;
      activeApiBase = base; // Cache successful connection
      break;
    } catch (netErr) {
      lastNetworkError = netErr;
    }
  }

  if (!response) {
    console.error("Maatram API Network Error (all candidate ports failed):", lastNetworkError);
    throw new Error(
      "Unable to connect to the server. Please check your network connection and ensure the backend is running."
    );
  }

  // Parse server response
  let data;

  try {
    const contentType =
      response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }
  } catch (error) {
    console.error("Maatram API Response Error:", error);

    throw new Error("Unable to process server response.");
  }

  // Handle API errors
  if (!response.ok) {
    let message = "Something went wrong. Please try again.";
    if (typeof data === "object" && data !== null) {
      message = data.message || data.error || data.msg || message;
    } else if (typeof data === "string" && data.trim()) {
      const clean = data.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (clean) message = clean.slice(0, 180);
    }

    const err = new Error(message);

    err.status = response.status;
    err.data = data;

    if (
      typeof data === "object" &&
      data?.isPendingApproval
    ) {
      err.isPendingApproval = true;
    }

    throw err;
  }

  return data;
}

// Export API methods
export const api = {
  get: (path) => request("GET", path),

  post: (path, body) =>
    request("POST", path, body),

  put: (path, body) =>
    request("PUT", path, body),

  delete: (path) =>
    request("DELETE", path),
};

// Export API configuration if required elsewhere
export const API_BASE_URL = BASE_URL;

export { eventsAPI } from "./eventsAPI";
export { adminAPI } from "./adminAPI";
export { applicationsAPI } from "./applicationsAPI";
export { authAPI } from "./authAPI";
export { connectionsAPI } from "./connectionsAPI";
export { notificationsAPI } from "./notificationsAPI";
export { usersAPI } from "./usersAPI";
export { badgesAPI } from "./badgesAPI";
export { certificatesAPI } from "./certificatesAPI";
export { hoursAPI } from "./hoursAPI";
export { postsAPI } from "./postsAPI";
export { messagesAPI } from "./messagesAPI";
export { gamesAPI } from "./gamesAPI";

export default api;
