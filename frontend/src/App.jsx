import React, { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AppProvider, useApp } from "./context/AppContext";
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/common/ProtectedRoute";

import SplashScreen from "./components/SplashScreen";
import ErrorBoundary from "./components/common/ErrorBoundary";

// Auth Pages
import LoginPage from "./pages/auth/LoginPage";
import RegistrationPage from "./pages/auth/RegistrationPage";

// Student Pages
import StudentDashboard from "./pages/student/StudentDashboard";
import OpportunitiesPage from "./pages/student/OpportunitiesPage";
import OpportunityDetailPage from "./pages/student/OpportunityDetailPage";
import ApplyOpportunityPage from "./pages/student/ApplyOpportunityPage";
import MyApplicationsPage from "./pages/student/MyApplicationsPage";
import ProfilePage from "./pages/student/ProfilePage";
import LeaderboardPage from "./pages/student/LeaderboardPage";
import ContributionsPage from "./pages/student/ContributionsPage";
import ReportsPage from "./pages/student/ReportsPage";
import NotificationsPage from "./pages/student/NotificationsPage";
import SettingsPage from "./pages/student/SettingsPage";
import MissionsPage from "./pages/student/MissionsPage";
import ConnectPage from "./pages/student/ConnectPage";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminEventsPage from "./pages/admin/AdminEventsPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminReportsPage from "./pages/admin/AdminReportsPage";

function RootRedirect() {
  const { user, isAuthenticated } = useApp();
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role === "admin") {
    return <Navigate to="/admin/events" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <ErrorBoundary>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Authentication Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegistrationPage />} />

            {/* Root redirect */}
            <Route path="/" element={<RootRedirect />} />

            {/* Protected Student Routes wrapped in AppLayout */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <StudentDashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Volunteering Opportunities Module & Nested Category Routes */}
            <Route
              path="/opportunities"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <OpportunitiesPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/opportunities/sangamam"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <OpportunitiesPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/opportunities/school-visits"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <OpportunitiesPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/opportunities/outside-events"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <OpportunitiesPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/opportunities/karpom-karpipom"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <OpportunitiesPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/opportunities/maatram"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <OpportunitiesPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Opportunity Detail & Apply Routes */}
            <Route
              path="/opportunities/:id"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <OpportunityDetailPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/opportunities/:id/apply"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ApplyOpportunityPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Applications, Profile, Impact & Reporting Modules */}
            <Route
              path="/missions"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <MissionsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/applications"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <MyApplicationsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ProfilePage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/leaderboard"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LeaderboardPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/contributions"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ContributionsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ReportsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <NotificationsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <SettingsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/connect"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ConnectPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Admin Management Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly={true}>
                  <AppLayout>
                    <AdminDashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute adminOnly={true}>
                  <AppLayout>
                    <AdminDashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/events"
              element={
                <ProtectedRoute adminOnly={true}>
                  <AppLayout>
                    <AdminEventsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute adminOnly={true}>
                  <AppLayout>
                    <AdminUsersPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute adminOnly={true}>
                  <AppLayout>
                    <AdminReportsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Catch-all Fallback */}
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  );
}
