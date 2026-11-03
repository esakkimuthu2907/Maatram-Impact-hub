import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  GraduationCap,
} from "lucide-react";

import authService from "../../services/authService";
import transformationTree from "../../assets/transformation_tree_white.png";
import MaatramLogo from "../../components/common/MaatramLogo";
import { useApp } from "../../context/AppContext";
import "./RegistrationPage.css";

const districts = [
  "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore",
  "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kancheepuram",
  "Kanniyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai",
  "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai",
  "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi",
  "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli",
  "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur",
  "Vellore", "Viluppuram", "Virudhunagar",
];

const initialForm = {
  role: "student", // "student" | "alumni"
  fullName: "",
  email: "",
  phone: "",
  college: "",
  district: "Chennai",
  department: "",
  year: "3",
  regNumber: "",
  graduationYear: "2024",
  organization: "",
  designation: "",
  studentPassword: "",
  confirmPassword: "",
  agreeTerms: false,
};

export default function RegistrationPage() {
  const navigate = useNavigate();
  const { login } = useApp();

  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [registeredData, setRegisteredData] = useState(null);
  const [copied, setCopied] = useState(false);

  // Password strength calculation
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: "None", color: "#E2E8F0" };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { score: 1, label: "Weak", color: "#EF4444" };
    if (score <= 3) return { score: 2, label: "Medium", color: "#F59E0B" };
    return { score: 3, label: "Strong", color: "#20A464" };
  };

  const strength = getPasswordStrength(formData.studentPassword);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : name === "phone"
          ? value.replace(/\D/g, "").slice(0, 10)
          : value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));

    setApiError("");
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.fullName.trim()) {
      nextErrors.fullName = "Please enter your full name.";
    }

    if (!formData.email.trim()) {
      nextErrors.email = "Please enter your college email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (!/^\d{10}$/.test(formData.phone)) {
      nextErrors.phone = "Enter a valid 10-digit mobile number.";
    }

    if (!formData.college.trim()) {
      nextErrors.college = "Please enter your college name.";
    }

    if (formData.role === "student") {
      if (!formData.department.trim()) {
        nextErrors.department = "Please enter your department.";
      }
      if (!formData.regNumber.trim()) {
        nextErrors.regNumber = "Enter your student registration / roll number.";
      }
    } else {
      if (!formData.organization.trim()) {
        nextErrors.organization = "Please enter your current company or organization.";
      }
      if (!formData.designation.trim()) {
        nextErrors.designation = "Please enter your designation / job role.";
      }
    }

    if (!formData.studentPassword) {
      nextErrors.studentPassword = "Please create a password.";
    } else if (formData.studentPassword.length < 8) {
      nextErrors.studentPassword = "Password must contain at least 8 characters.";
    }

    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your password.";
    } else if (formData.studentPassword !== formData.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    if (!formData.agreeTerms) {
      nextErrors.agreeTerms = "You must agree to the Terms and Privacy Policy.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setApiError("");

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const result = await authService.register({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        college: formData.college,
        district: formData.district,
        department: formData.department,
        year: formData.year,
        regNumber: formData.regNumber,
        role: formData.role,
        graduationYear: formData.graduationYear,
        organization: formData.organization,
        designation: formData.designation,
        password: formData.studentPassword,
      });

      if (!result || !result.success) {
        throw new Error(result?.message || "Registration failed. Please try again.");
      }

      const generatedId = result.applicationId || result.studentId;

      setRegisteredData({
        applicationId: generatedId,
        fullName: formData.fullName,
        email: formData.email,
        role: formData.role,
        requiresApproval: true,
      });
    } catch (error) {
      setApiError(error.message || "Unable to complete registration. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyId = () => {
    if (!registeredData?.applicationId) return;
    navigator.clipboard.writeText(registeredData.applicationId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="register-page">
      <div className="register-shell">
        {/* LEFT PANEL */}
        {/* LEFT PANEL */}
<aside
  className="register-sidebar"
  aria-label="Transformation through education"
>
  <div className="register-sidebar-image-wrap">
    <img
      src={transformationTree}
      alt="Transformation through education"
      className="register-sidebar-image"
    />
  </div>
</aside>

        {/* RIGHT REGISTRATION PANEL */}
        <section className="register-form-panel">
          <div className="register-form-inner">
            <div className="register-mobile-brand">
              <MaatramLogo size="sm" showTagline={true} />
            </div>

            {/* SUCCESS / PENDING APPROVAL CARD */}
            {registeredData ? (
              <div className="register-success-card" role="status">
                <div className="success-icon-badge">
                  <CheckCircle2 size={42} />
                </div>

                <h2>Registration Submitted! 🎉</h2>
                <p className="success-subtext">
                  Thank you, <strong>{registeredData.fullName}</strong>! Your{" "}
                  {registeredData.role === "alumni" ? "alumni" : "student volunteer"} account has been created.
                </p>

                <div className="app-id-box" style={{ background: "#FFF7ED", border: "1.5px solid #FED7AA" }}>
                  <span className="app-id-title" style={{ color: "#C2410C" }}>⏳ Pending Admin Approval</span>
                  <p style={{ fontSize: 13.5, color: "#7C2D12", marginTop: 6, lineHeight: 1.6 }}>
                    Your account is now awaiting review by the Maatram admin team. Once approved, you can log in
                    using your <strong>email</strong> and password on the sign-in page.
                  </p>
                </div>

                {registeredData.applicationId && (
                  <div className="app-id-box">
                    <span className="app-id-title">Your Application ID</span>
                    <div className="app-id-display">
                      <span className="app-id-number">{registeredData.applicationId}</span>
                      <button
                        type="button"
                        className="app-id-copy-btn"
                        onClick={handleCopyId}
                        aria-label="Copy Application ID"
                      >
                        {copied ? (
                          <><Check size={16} /> Copied!</>
                        ) : (
                          <><Copy size={16} /> Copy ID</>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <div className="app-id-instruction">
                  <Sparkles size={18} className="instruction-icon" />
                  <span>
                    You will receive access after the admin verifies your profile. Then sign in at the{" "}
                    <strong>Login page</strong> using your email and password.
                  </span>
                </div>

                <Link
                  to="/login"
                  className="register-submit proceed-btn"
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}
                >
                  Go to Sign In Page
                  <ArrowRight size={19} />
                </Link>
              </div>
            ) : (
              <>
                <div className="register-form-heading">
                  <h2>{formData.role === "alumni" ? "Alumni" : "Student Volunteer"} Registration</h2>
                  <p className="register-subtitle">
                    Empowering students. Building brighter futures together.
                  </p>
                </div>

                {/* Role Toggle: Student / Alumni */}
                <div className="role-switch" style={{ marginBottom: 20 }}>
                  <button
                    type="button"
                    className={`role-btn ${formData.role === "student" ? "active" : ""}`}
                    onClick={() => setFormData((p) => ({ ...p, role: "student" }))}
                  >
                    <GraduationCap size={16} /> Student
                  </button>
                  <button
                    type="button"
                    className={`role-btn ${formData.role === "alumni" ? "active" : ""}`}
                    onClick={() => setFormData((p) => ({ ...p, role: "alumni" }))}
                  >
                    🎓 Alumni
                  </button>
                </div>

                {apiError && (
                  <div className="register-alert register-alert-error" role="alert">
                    {apiError}
                  </div>
                )}

                <form className="register-form" onSubmit={handleSubmit} noValidate>
                  {/* SECTION 01: PERSONAL */}
                  <div className="register-section-title">
                    <span>01</span>
                    <h3>Personal Information</h3>
                  </div>

                  <div className="register-field">
                    <label htmlFor="fullName">Full Name</label>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      placeholder="e.g. Priya Sharma"
                      value={formData.fullName}
                      onChange={handleChange}
                      aria-invalid={Boolean(errors.fullName)}
                    />
                    {errors.fullName && (
                      <small className="register-field-error">{errors.fullName}</small>
                    )}
                  </div>

                  <div className="register-field-grid">
                    <div className="register-field">
                      <label htmlFor="email">College Email Address</label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="you@college.edu.in"
                        value={formData.email}
                        onChange={handleChange}
                        aria-invalid={Boolean(errors.email)}
                      />
                      {errors.email && (
                        <small className="register-field-error">{errors.email}</small>
                      )}
                    </div>

                    <div className="register-field">
                      <label htmlFor="phone">Mobile Number</label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="10-digit number"
                        maxLength={10}
                        value={formData.phone}
                        onChange={handleChange}
                        aria-invalid={Boolean(errors.phone)}
                      />
                      {errors.phone && (
                        <small className="register-field-error">{errors.phone}</small>
                      )}
                    </div>
                  </div>

                  {/* SECTION 02: ACADEMIC / PROFESSIONAL */}
                  <div className="register-section-title register-section-spaced">
                    <span>02</span>
                    <h3>College &amp; {formData.role === "alumni" ? "Professional" : "Academic"} Details</h3>
                  </div>

                  <div className="register-field">
                    <label htmlFor="college">College / Institution</label>
                    <input
                      id="college"
                      name="college"
                      type="text"
                      placeholder="e.g. College of Engineering, Guindy, Chennai"
                      value={formData.college}
                      onChange={handleChange}
                      aria-invalid={Boolean(errors.college)}
                    />
                    {errors.college && (
                      <small className="register-field-error">{errors.college}</small>
                    )}
                  </div>

                  {formData.role === "alumni" ? (
                    <>
                      <div className="register-field-grid">
                        <div className="register-field">
                          <label htmlFor="graduationYear">Graduation Year</label>
                          <input
                            id="graduationYear"
                            name="graduationYear"
                            type="text"
                            placeholder="e.g. 2022"
                            value={formData.graduationYear}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="register-field">
                          <label htmlFor="district">District</label>
                          <select
                            id="district"
                            name="district"
                            value={formData.district}
                            onChange={handleChange}
                          >
                            {districts.map((d) => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="register-field">
                        <label htmlFor="organization">Current Company / Organization</label>
                        <input
                          id="organization"
                          name="organization"
                          type="text"
                          placeholder="e.g. TCS, Infosys, Google"
                          value={formData.organization}
                          onChange={handleChange}
                          aria-invalid={Boolean(errors.organization)}
                        />
                        {errors.organization && (
                          <small className="register-field-error">{errors.organization}</small>
                        )}
                      </div>

                      <div className="register-field">
                        <label htmlFor="designation">Designation / Job Role</label>
                        <input
                          id="designation"
                          name="designation"
                          type="text"
                          placeholder="e.g. Software Engineer, Product Manager"
                          value={formData.designation}
                          onChange={handleChange}
                          aria-invalid={Boolean(errors.designation)}
                        />
                        {errors.designation && (
                          <small className="register-field-error">{errors.designation}</small>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="register-field-grid">
                        <div className="register-field">
                          <label htmlFor="department">Department</label>
                          <input
                            id="department"
                            name="department"
                            type="text"
                            placeholder="e.g. Computer Science / Mechanical"
                            value={formData.department}
                            onChange={handleChange}
                            aria-invalid={Boolean(errors.department)}
                          />
                          {errors.department && (
                            <small className="register-field-error">{errors.department}</small>
                          )}
                        </div>

                        <div className="register-field">
                          <label htmlFor="regNumber">Student Roll / Reg Number</label>
                          <input
                            id="regNumber"
                            name="regNumber"
                            type="text"
                            placeholder="e.g. 2023CS1042"
                            value={formData.regNumber}
                            onChange={handleChange}
                            aria-invalid={Boolean(errors.regNumber)}
                          />
                          {errors.regNumber && (
                            <small className="register-field-error">{errors.regNumber}</small>
                          )}
                        </div>
                      </div>

                      <div className="register-field-grid">
                        <div className="register-field">
                          <label htmlFor="year">Academic Year</label>
                          <select
                            id="year"
                            name="year"
                            value={formData.year}
                            onChange={handleChange}
                          >
                            <option value="1">1st Year</option>
                            <option value="2">2nd Year</option>
                            <option value="3">3rd Year</option>
                            <option value="4">4th Year</option>
                            <option value="Postgraduate">Postgraduate</option>
                          </select>
                        </div>

                        <div className="register-field">
                          <label htmlFor="district">District</label>
                          <select
                            id="district"
                            name="district"
                            value={formData.district}
                            onChange={handleChange}
                          >
                            {districts.map((d) => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </>
                  )}

                  {/* SECTION 03: SECURITY */}
                  <div className="register-section-title register-section-spaced">
                    <span>03</span>
                    <h3>Account Security</h3>
                  </div>

                  <div className="register-field">
                    <label htmlFor="studentPassword">Create Password</label>
                    <div className="register-password-wrap">
                      <input
                        id="studentPassword"
                        name="studentPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="At least 8 characters"
                        value={formData.studentPassword}
                        onChange={handleChange}
                        aria-invalid={Boolean(errors.studentPassword)}
                      />
                      <button
                        type="button"
                        className="register-password-toggle"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {formData.studentPassword && (
                      <div className="password-strength-bar">
                        <div className="strength-indicators">
                          <span className={`bar ${strength.score >= 1 ? "active-1" : ""}`} />
                          <span className={`bar ${strength.score >= 2 ? "active-2" : ""}`} />
                          <span className={`bar ${strength.score >= 3 ? "active-3" : ""}`} />
                        </div>
                        <span className="strength-label" style={{ color: strength.color }}>
                          {strength.label} password
                        </span>
                      </div>
                    )}

                    {errors.studentPassword && (
                      <small className="register-field-error">{errors.studentPassword}</small>
                    )}
                  </div>

                  <div className="register-field">
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <div className="register-password-wrap">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Re-enter password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        aria-invalid={Boolean(errors.confirmPassword)}
                      />
                      <button
                        type="button"
                        className="register-password-toggle"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <small className="register-field-error">{errors.confirmPassword}</small>
                    )}
                  </div>

                  {/* TERMS CHECKBOX */}
                  <div className="register-consent-wrap">
                    <label className="register-checkbox-label">
                      <input
                        type="checkbox"
                        name="agreeTerms"
                        checked={formData.agreeTerms}
                        onChange={handleChange}
                      />
                      <span>
                        I agree to Maatram Foundation's{" "}
                        <a href="#terms">Volunteer Code of Conduct</a> and{" "}
                        <a href="#privacy">Privacy Policy</a>.
                      </span>
                    </label>
                    {errors.agreeTerms && (
                      <small className="register-field-error">{errors.agreeTerms}</small>
                    )}
                  </div>

                  {/* SUBMIT BUTTON */}
                  <button
                    type="submit"
                    className="register-submit"
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                  >
                    {isSubmitting ? (
                      "Submitting..."
                    ) : (
                      <>
                        {formData.role === "alumni" ? "Submit Alumni Application" : "Create Student Account"}
                        <ArrowRight size={19} />
                      </>
                    )}
                  </button>
                </form>

                <p className="register-signin-link">
                  Already have an account?{" "}
                  <Link to="/login">Sign in here</Link>
                </p>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
