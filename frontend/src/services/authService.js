// frontend/src/services/authService.js
// MongoDB-only auth — all requests go through the backend API.
import { authAPI } from "../api/authAPI";

export const authService = {
  /**
   * Register a new student account via backend (stored in MongoDB).
   */
  async register(details) {
    const res = await authAPI.register({
      fullName: details.fullName,
      email: details.email,
      password: details.password,
      phone: details.phone,
      college: details.college,
      department: details.department,
      academicYear: details.role === "alumni" ? "Alumni" : (details.year ? `${details.year} Year` : "1st Year"),
      regNumber: details.regNumber,
      role: details.role || "student",
      graduationYear: details.graduationYear || "",
      organization: details.organization || "",
      designation: details.designation || "",
    });

    if (res.data || res.success) {
      return {
        success: true,
        requiresApproval: res.requiresApproval,
        applicationId: res.applicationId || res.data?.applicationId,
        studentId: res.applicationId || res.data?.applicationId,
        user: res.data,
        token: res.data?.token,
        message: res.message,
      };
    }

    throw new Error(res.message || "Registration failed. Please try again.");
  },

  /**
   * Login via backend (MongoDB). Throws on failure.
   */
  async login(identifier, password, role) {
    const res = await authAPI.login(identifier, password, role);
    if (res.data) {
      return {
        success: true,
        user: res.data,
        token: res.data.token,
      };
    }
    throw new Error("Login failed. Please check your credentials.");
  },
};

export default authService;
