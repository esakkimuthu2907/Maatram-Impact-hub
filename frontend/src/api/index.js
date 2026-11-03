
// frontend/src/api/index.js
// Central API wrapper for Maatram Impact Hub
// Supports Desktop, Mobile LAN and deployed environments.

// Backend API configuration - auto-detects localhost, 127.0.0.1, or mobile LAN IP
function resolveApiUrl() {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://localhost:5000/api";
    }
    if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
      return `http://${host}:5000/api`;
    }
  }
  const envUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
  return `${envUrl.replace(/\/+$/, "")}/api`;
}

const BASE_URL = resolveApiUrl();

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

  try {
    console.log("Maatram API Request:", {
      method,
      url: `${BASE_URL}${path}`,
    });

    response = await fetch(`${BASE_URL}${path}`, options);

  } catch (error) {
    console.error("Maatram API Network Error:", error);

    throw new Error(
      "Unable to connect to the server. Please check your internet or network connection."
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
    const message =
      typeof data === "object" && data?.message
        ? data.message
        : "Something went wrong. Please try again.";

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

export default api;
