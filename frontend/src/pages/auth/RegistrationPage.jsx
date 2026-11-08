import React, { useState } from "react";
import { Link } from "react-router-dom";

import {
  ArrowRight,
  CheckCircle2,
  Copy,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  GraduationCap,
} from "lucide-react";

import authService from "../../services/authService";
import transformationTree from "../../assets/transformation_tree_white.png";
import MaatramLogo from "../../components/common/MaatramLogo";
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
  role: "student",
  fullName: "",
  email: "",
  phone: "",
  college: "",
  zone: "Zone 1",
  batch: "2022-2026",
  customBatch: "",
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
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [registeredData, setRegisteredData] = useState(null);
  const [copied, setCopied] = useState(false);

  // PASSWORD STRENGTH

  const getPasswordStrength = (pwd) => {
    if (!pwd) {
      return { score: 0, label: "None", color: "#E2E8F0" };
    }

    let score = 0;

    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) {
      return { score: 1, label: "Weak", color: "#EF4444" };
    }

    if (score <= 3) {
      return { score: 2, label: "Medium", color: "#F59E0B" };
    }

    return { score: 3, label: "Strong", color: "#20A464" };
  };

  const strength = getPasswordStrength(formData.studentPassword);

  // HANDLE INPUT CHANGES

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

  // FORM VALIDATION

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.fullName.trim()) {
      nextErrors.fullName = "Please enter your full name.";
    }

    if (!formData.email.trim()) {
      nextErrors.email = "Please enter your college email address.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
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
        nextErrors.regNumber =
          "Enter your student registration / roll number.";
      }
    } else {
      if (!formData.organization.trim()) {
        nextErrors.organization =
          "Please enter your current company or organization.";
      }

      if (!formData.designation.trim()) {
        nextErrors.designation =
          "Please enter your designation / job role.";
      }
    }

    if (!formData.studentPassword) {
      nextErrors.studentPassword = "Please create a password.";
    } else if (formData.studentPassword.length < 8) {
      nextErrors.studentPassword =
        "Password must contain at least 8 characters.";
    }

    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your password.";
    } else if (
      formData.studentPassword !== formData.confirmPassword
    ) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    if (!formData.agreeTerms) {
      nextErrors.agreeTerms =
        "You must agree to the Terms and Privacy Policy.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  // SUBMIT REGISTRATION

  const handleSubmit = async (event) => {
    event.preventDefault();
    setApiError("");

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const finalBatch = formData.batch === "Other" && formData.customBatch.trim()
        ? formData.customBatch.trim()
        : formData.batch;

      const result = await authService.register({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        college: formData.college,
        zone: formData.zone,
        batch: finalBatch,
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
        throw new Error(
          result?.message || "Registration failed. Please try again."
        );
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
      setApiError(
        error.message || "Unable to complete registration. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // COPY APPLICATION ID

  const handleCopyId = async () => {
    if (!registeredData?.applicationId) return;

    try {
      await navigator.clipboard.writeText(
        registeredData.applicationId
      );

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setApiError("Unable to copy Application ID.");
    }
  };

  return (
    <main className="register-page">
      <div className="register-shell">

        {/* LEFT PANEL */}

        <aside
          className="register-sidebar"
          aria-label="Transformation through education"
        >
          {/* TREE BACKGROUND */}

          <div className="register-sidebar-image-wrap">
            <img
              src={transformationTree}
              alt="Transformation through education"
              className="register-sidebar-image"
            />
          </div>

          {/* CENTRED MAATRAM LOGO */}

          <div
            className="register-sidebar-logo"
            aria-label="Maatram Foundation"
          >
            <MaatramLogo size="L" showTagline={false} />
          </div>
        </aside>

        {/* RIGHT REGISTRATION PANEL */}

        <section className="register-form-panel">
          <div className="register-form-inner">

            {/* MOBILE BRAND */}

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
                  Thank you, <strong>{registeredData.fullName}</strong>!
                  Your{" "}
                  {registeredData.role === "alumni"
                    ? "alumni"
                    : "student volunteer"}{" "}
                  account has been created.
                </p>

                <div
                  className="app-id-box"
                  style={{
                    background: "#FFF7ED",
                    border: "1.5px solid #FED7AA",
                  }}
                >
                  <span
                    className="app-id-title"
                    style={{ color: "#C2410C" }}
                  >
                    ⏳ Pending Admin Approval
                  </span>

                  <p
                    style={{
                      fontSize: 13.5,
                      color: "#7C2D12",
                      marginTop: 6,
                      lineHeight: 1.6,
                    }}
                  >
                    Your account is now awaiting review by the Maatram
                    admin team. Once approved, you can log in using your{" "}
                    <strong>email</strong> and password on the sign-in page.
                  </p>
                </div>

                {registeredData.applicationId && (
                  <div className="app-id-box">

                    <span className="app-id-title">
                      Your Application ID
                    </span>

                    <div className="app-id-display">
                      <span className="app-id-number">
                        {registeredData.applicationId}
                      </span>

                      <button
                        type="button"
                        className="app-id-copy-btn"
                        onClick={handleCopyId}
                        aria-label="Copy Application ID"
                      >
                        {copied ? (
                          <>
                            <Check size={16} /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy size={16} /> Copy ID
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <div className="app-id-instruction">
                  <Sparkles size={18} className="instruction-icon" />

                  <span>
                    You will receive access after the admin verifies your
                    profile. Then sign in at the{" "}
                    <strong>Login page</strong> using your email and password.
                  </span>
                </div>

                <Link
                  to="/login"
                  className="register-submit proceed-btn"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    textDecoration: "none",
                  }}
                >
                  Go to Sign In Page
                  <ArrowRight size={19} />
                </Link>
              </div>
            ) : (
              <>

                {/* FORM HEADING */}

                <div className="register-form-heading">
                  <h2>
                    {formData.role === "alumni"
                      ? "Alumni"
                      : "Student Volunteer"}{" "}
                    Registration
                  </h2>

                  <p className="register-subtitle">
                    Empowering students. Building brighter futures together.
                  </p>
                </div>

                {/* ROLE SWITCH */}

                <div className="role-switch" style={{ marginBottom: 20 }}>
                  <button
                    type="button"
                    className={`role-btn ${
                      formData.role === "student" ? "active" : ""
                    }`}
                    onClick={() =>
                      setFormData((p) => ({ ...p, role: "student" }))
                    }
                  >
                    <GraduationCap size={16} /> Student
                  </button>

                  <button
                    type="button"
                    className={`role-btn ${
                      formData.role === "alumni" ? "active" : ""
                    }`}
                    onClick={() =>
                      setFormData((p) => ({ ...p, role: "alumni" }))
                    }
                  >
                    🎓 Alumni
                  </button>
                </div>

                {/* API ERROR */}

                {apiError && (
                  <div
                    className="register-alert register-alert-error"
                    role="alert"
                  >
                    {apiError}
                  </div>
                )}

                <form
                  className="register-form"
                  onSubmit={handleSubmit}
                  noValidate
                >

                  {/* SECTION 01: PERSONAL INFORMATION */}

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
                      placeholder="e.g. Your Name"
                      value={formData.fullName}
                      onChange={handleChange}
                      aria-invalid={Boolean(errors.fullName)}
                    />

                    {errors.fullName && (
                      <small className="register-field-error">
                        {errors.fullName}
                      </small>
                    )}
                  </div>

                  <div className="register-field-grid">

                    <div className="register-field">
                      <label htmlFor="email">Email Address</label>

                      <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Email Id"
                        value={formData.email}
                        onChange={handleChange}
                        aria-invalid={Boolean(errors.email)}
                      />

                      {errors.email && (
                        <small className="register-field-error">
                          {errors.email}
                        </small>
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
                        <small className="register-field-error">
                          {errors.phone}
                        </small>
                      )}
                    </div>

                  </div>

                  {/* SECTION 02: ACADEMIC / PROFESSIONAL */}

                  <div className="register-section-title register-section-spaced">
                    <span>02</span>

                    <h3>
                      College &amp;{" "}
                      {formData.role === "alumni"
                        ? "Professional"
                        : "Academic"}{" "}
                      Details
                    </h3>
                  </div>

                  <div className="register-field">
                    <label htmlFor="college">College / Institution</label>

                    <input
                      id="college"
                      name="college"
                      type="text"
                      placeholder="e.g. Velammal Engineering College, Chennai"
                      value={formData.college}
                      onChange={handleChange}
                      aria-invalid={Boolean(errors.college)}
                    />

                    {errors.college && (
                      <small className="register-field-error">
                        {errors.college}
                      </small>
                    )}
                  </div>

                  {/* ZONE & BATCH (Applicable to both Students and Alumni) */}
                  <div className="register-field-grid">
                    <div className="register-field">
                      <label htmlFor="zone">Operating Zone</label>
                      <select
                        id="zone"
                        name="zone"
                        value={formData.zone}
                        onChange={handleChange}
                      >
                        <option value="Zone 1">Zone 1 </option>
                        <option value="Zone 2">Zone 2 </option>
                        <option value="Zone 3">Zone 3 </option>
                      </select>
                    </div>

                    <div className="register-field">
                      <label htmlFor="batch">Academic Batch</label>
                      <select
                        id="batch"
                        name="batch"
                        value={formData.batch}
                        onChange={handleChange}
                      >
                        <option value="2020-2024">2020 - 2024</option>
                        <option value="2021-2025">2021 - 2025</option>
                        <option value="2022-2026">2022 - 2026</option>
                        <option value="2023-2027">2023 - 2027</option>
                        <option value="2024-2028">2024 - 2028</option>
                        <option value="2025-2029">2025 - 2029</option>
                        <option value="2026-2030">2026 - 2030</option>
                        <option value="Other">Other (Type Custom Batch)</option>
                      </select>
                    </div>
                  </div>

                  {formData.batch === "Other" && (
                    <div className="register-field">
                      <label htmlFor="customBatch">Type Your Custom Batch *</label>
                      <input
                        id="customBatch"
                        name="customBatch"
                        type="text"
                        placeholder="e.g. 2019-2023 or 2018-2022"
                        value={formData.customBatch}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  )}

                  {/* ALUMNI DETAILS */}

                  {formData.role === "alumni" ? (
                    <>

                      <div className="register-field-grid">

                        <div className="register-field">
                          <label htmlFor="graduationYear">
                            Graduation Year
                          </label>

                          <input
                            id="graduationYear"
                            name="graduationYear"
                            type="text"
                            placeholder="e.g. 2027"
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
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                        </div>

                      </div>

                      <div className="register-field">
                        <label htmlFor="organization">
                          Current Company / Organization
                        </label>

                        <input
                          id="organization"
                          name="organization"
                          type="text"
                          placeholder="e.g. Infosys, Ashok Leyland"
                          value={formData.organization}
                          onChange={handleChange}
                          aria-invalid={Boolean(errors.organization)}
                        />

                        {errors.organization && (
                          <small className="register-field-error">
                            {errors.organization}
                          </small>
                        )}
                      </div>

                      <div className="register-field">
                        <label htmlFor="designation">
                          Designation / Job Role
                        </label>

                        <input
                          id="designation"
                          name="designation"
                          type="text"
                          placeholder="e.g. Software Engineer, Project Manager"
                          value={formData.designation}
                          onChange={handleChange}
                          aria-invalid={Boolean(errors.designation)}
                        />

                        {errors.designation && (
                          <small className="register-field-error">
                            {errors.designation}
                          </small>
                        )}
                      </div>

                    </>
                  ) : (
                    <>

                      {/* STUDENT DETAILS */}

                      <div className="register-field-grid">

                        <div className="register-field">
                          <label htmlFor="department">Department</label>

                          <input
                            id="department"
                            name="department"
                            type="text"
                            placeholder="e.g. Mechanical Engineering"
                            value={formData.department}
                            onChange={handleChange}
                            aria-invalid={Boolean(errors.department)}
                          />

                          {errors.department && (
                            <small className="register-field-error">
                              {errors.department}
                            </small>
                          )}
                        </div>

                        <div className="register-field">
                          <label htmlFor="regNumber">
                            Student Roll / Reg Number
                          </label>

                          <input
                            id="regNumber"
                            name="regNumber"
                            type="text"
                            placeholder="e.g. Maatram ID"
                            value={formData.regNumber}
                            onChange={handleChange}
                            aria-invalid={Boolean(errors.regNumber)}
                          />

                          {errors.regNumber && (
                            <small className="register-field-error">
                              {errors.regNumber}
                            </small>
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
                            <option value="5">Alumni</option>
                            <option value="Postgraduate">
                              Postgraduate
                            </option>
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
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                        </div>

                      </div>

                    </>
                  )}

                  {/* SECTION 03: ACCOUNT SECURITY */}

                  <div className="register-section-title register-section-spaced">
                    <span>03</span>
                    <h3>Account Security</h3>
                  </div>

                  {/* CREATE PASSWORD */}

                  <div className="register-field">
                    <label htmlFor="studentPassword">
                      Create Password
                    </label>

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
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff size={19} />
                        ) : (
                          <Eye size={19} />
                        )}
                      </button>
                    </div>

                    {/* PASSWORD STRENGTH */}

                    {formData.studentPassword && (
                      <div className="password-strength-bar">
                        <div className="strength-indicators">

                          <span
                            className={`bar ${
                              strength.score >= 1 ? "active-1" : ""
                            }`}
                          />

                          <span
                            className={`bar ${
                              strength.score >= 2 ? "active-2" : ""
                            }`}
                          />

                          <span
                            className={`bar ${
                              strength.score >= 3 ? "active-3" : ""
                            }`}
                          />

                        </div>

                        <span
                          className="strength-label"
                          style={{ color: strength.color }}
                        >
                          {strength.label} password
                        </span>
                      </div>
                    )}

                    {errors.studentPassword && (
                      <small className="register-field-error">
                        {errors.studentPassword}
                      </small>
                    )}
                  </div>

                  {/* CONFIRM PASSWORD */}

                  <div className="register-field">
                    <label htmlFor="confirmPassword">
                      Confirm Password
                    </label>

                    <div className="register-password-wrap">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Re-Enter password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        aria-invalid={Boolean(errors.confirmPassword)}
                      />

                      <button
                        type="button"
                        className="register-password-toggle"
                        onClick={() =>
                          setShowConfirmPassword((v) => !v)
                        }
                        aria-label={
                          showConfirmPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={19} />
                        ) : (
                          <Eye size={19} />
                        )}
                      </button>
                    </div>

                    {errors.confirmPassword && (
                      <small className="register-field-error">
                        {errors.confirmPassword}
                      </small>
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
                      <small className="register-field-error">
                        {errors.agreeTerms}
                      </small>
                    )}
                  </div>

                  {/* CREATE ACCOUNT BUTTON */}

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
                        {formData.role === "alumni"
                          ? "Submit Alumni Application"
                          : "Create Student Account"}

                        <ArrowRight size={19} />
                      </>
                    )}
                  </button>

                </form>

                {/* SIGN-IN LINK */}

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