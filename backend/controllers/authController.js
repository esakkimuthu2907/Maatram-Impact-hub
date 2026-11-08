// backend/controllers/authController.js
const jwt = require("jsonwebtoken");
const Storage = require("../services/storage");

const { JWT_SECRET } = require("../middleware/auth");

const generateToken = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: "30d" });

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      phone,
      college,
      department,
      academicYear,
      regNumber,
      role = "student",
      graduationYear = "",
      organization = "",
      designation = "",
      zone = "Zone 1",
      batch = "",
    } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: "Full name, email and password are required." });
    }

    const existing = await Storage.findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ success: false, message: "An account with this email already exists. Please log in." });
    }

    const validRole = ["student", "alumni"].includes(role.toLowerCase()) ? role.toLowerCase() : "student";

    const user = await Storage.createUser({
      fullName,
      email,
      password,
      phone: phone || "",
      college: college || "",
      department: department || "",
      academicYear: validRole === "alumni" ? "Alumni" : (academicYear || "1st Year"),
      regNumber: regNumber || "",
      role: validRole,
      status: "pending_approval",
      zone: zone || "Zone 1",
      batch: batch || (validRole === "alumni" ? "2020-2024" : "2022-2026"),
      graduationYear: graduationYear || "",
      organization: organization || "",
      designation: designation || "",
    });

    // Notify admins of new pending registration
    try {
      await Storage.createNotification({
        userId: "admin",
        type: "system",
        title: `New ${validRole === "alumni" ? "Alumni" : "Student"} Registration Pending`,
        message: `${fullName} (${email}) has registered and is awaiting your verification.`,
        link: "/admin/users",
      });
    } catch (_) {}

    res.status(201).json({
      success: true,
      requiresApproval: true,
      message:
        "Registration submitted successfully! Your account is pending administrator approval. You will be able to log in once approved.",
      applicationId: user.applicationId,
      data: {
        id: user._id || user.id,
        applicationId: user.applicationId,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ success: false, message: err.message || "Registration failed." });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: "Email/ID and password are required." });
    }

    const user = await Storage.findUserByIdentifier(identifier);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Account not found. Please register first.",
      });
    }

    const isMatch = await Storage.verifyPassword(user, password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Incorrect password. Please try again." });
    }

    // Admin approval gate: Only active accounts can log in
    if (user.role !== "admin" && user.status === "pending_approval") {
      return res.status(403).json({
        success: false,
        isPendingApproval: true,
        message:
          "Your registration is awaiting administrator verification. You will be able to access your dashboard once an administrator approves your profile.",
      });
    }

    if (user.status === "inactive") {
      return res.status(403).json({
        success: false,
        message: "Your account is currently inactive. Please contact the administrator.",
      });
    }

    const token = generateToken(user._id || user.id);

    res.json({
      success: true,
      data: {
        id: user._id || user.id,
        applicationId: user.applicationId,
        fullName: user.fullName,
        name: user.fullName,
        email: user.email,
        phone: user.phone,
        college: user.college,
        department: user.department,
        academicYear: user.academicYear,
        role: user.role || "student",
        status: user.status || "active",
        zone: user.zone || "Zone 1",
        batch: user.batch || "",
        assignedWorks: user.assignedWorks || [],
        assignedEvent: user.assignedEvent || "",
        assignedRole: user.assignedRole || "",
        workDescription: user.workDescription || "",
        assignedDate: user.assignedDate || "",
        avatar: user.avatar || "",
        totalHours: user.totalHours || 0,
        eventsJoined: user.eventsJoined || 0,
        completedEventsCount: user.completedEventsCount || 0,
        badgesEarned: user.badgesEarned || 0,
        streakDays: user.streakDays || 0,
        points: user.points || 0,
        graduationYear: user.graduationYear || "",
        organization: user.organization || "",
        designation: user.designation || "",
        token,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: err.message || "Login failed." });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await Storage.findUserById(req.user?.id || req.user?._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { register, login, getMe };
