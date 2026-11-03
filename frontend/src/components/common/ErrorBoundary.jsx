import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/dashboard";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "70vh",
            padding: "2rem",
            textAlign: "center",
            fontFamily: "Inter, sans-serif",
            backgroundColor: "#F7F8FA",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              backgroundColor: "#FFF7D1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
              marginBottom: "1rem",
            }}
          >
            ⚠️
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#151515", marginBottom: "0.5rem" }}>
            Something didn't load smoothly
          </h2>
          <p style={{ color: "#717784", maxWidth: "460px", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
            We've caught an unexpected issue. Don't worry, your data and progress are safe.
          </p>
          <button
            onClick={this.handleReload}
            style={{
              padding: "10px 24px",
              backgroundColor: "#FFD629",
              color: "#151515",
              border: "none",
              borderRadius: "8px",
              fontWeight: 700,
              fontSize: "0.95rem",
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
            }}
          >
            Reload Dashboard
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
