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
import PublicDashboard from "./pages/public/Dashboard";

// Student Pages
import StudentDashboard from "./pages/student/StudentDashboard";
import OpportunitiesPage from "./pages/student/OpportunitiesPage";
import OpportunityDetailPage from "./pages/student/OpportunityDetailPage";
import ApplyOpportunityPage from "./pages/student/ApplyOpportunityPage";
import MyApplicationsPage from "./pages/student/MyApplicationsPage";
import ProfilePage from "./pages/student/ProfilePage";
import LeaderboardPage from "./pages/student/LeaderboardPage";
import ContributionsPage from "./pages/student/ContributionsPage";
import NotificationsPage from "./pages/student/NotificationsPage";
import SettingsPage from "./pages/student/SettingsPage";
import ConnectPage from "./pages/student/ConnectPage";
import AlumniPage from "./pages/student/AlumniPage";
import AlumniDashboard from "./pages/student/AlumniDashboard";
// Games Pages
import GamesDashboard from "./pages/games/GamesDashboard";
import ZipGame from "./pages/games/ZipGame";
import WendGame from "./pages/games/WendGame";
import GamesLeaderboard from "./pages/games/GamesLeaderboard";
import GamesBadges from "./pages/games/GamesBadges";
import GamesHistory from "./pages/games/GamesHistory";
import UserGameProfile from "./pages/games/UserGameProfile";
import AdminGameManagement from "./pages/games/AdminGameManagement";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminEventsPage from "./pages/admin/AdminEventsPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminStudentProfilePage from "./pages/admin/AdminStudentProfilePage";
import AdminAlumniPage from "./pages/admin/AdminAlumniPage";
import AdminReportsPage from "./pages/admin/AdminReportsPage";
import AdminChatbotPage from "./pages/admin/AdminChatbotPage";
import MaatramChatbot from "./components/common/MaatramChatbot";


// Alumni Pages

function DashboardRouter() {
  const { user } = useApp();
  if (user?.role === "alumni") {
    return <AlumniDashboard />;
  }
  return <StudentDashboard />;
}

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
            <Route path="/volunteering" element={<PublicDashboard />} />
            <Route path="/register" element={<RegistrationPage />} />


            {/* Root redirect */}
            <Route path="/" element={<RootRedirect />} />

            {/* Protected Student / Alumni Routes wrapped in AppLayout */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <DashboardRouter />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/alumni/dashboard"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <AlumniDashboard />
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
              path="/opportunities/admissions"
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
              path="/opportunities/alumni-connect"
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
              path="/opportunities/special-projects"
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
              path="/opportunities/skill-development"
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
            <Route
              path="/opportunities/maatram-core"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <OpportunitiesPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/opportunities/category/:categorySlug"
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
            {/* Games & Challenges System */}
            <Route
              path="/games"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <GamesDashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/games/zip"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ZipGame />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/games/wend"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <WendGame />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/games/leaderboard"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <GamesLeaderboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/games/badges"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <GamesBadges />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/games/history"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <GamesHistory />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/games/profile"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <UserGameProfile />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route path="/learning" element={<Navigate to="/games" replace />} />
            <Route path="/ai-learning" element={<Navigate to="/games" replace />} />
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
            <Route
              path="/alumni"
              element={<Navigate to="/dashboard" replace />}
            />
            <Route
              path="/admin/alumni"
              element={
                <ProtectedRoute adminOnly={true}>
                  <AppLayout>
                    <AdminAlumniPage />
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
              path="/admin/users/:id"
              element={
                <ProtectedRoute adminOnly={true}>
                  <AppLayout>
                    <AdminStudentProfilePage />
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
            <Route
              path="/admin/games"
              element={
                <ProtectedRoute adminOnly={true}>
                  <AppLayout>
                    <AdminGameManagement />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route path="/admin/learning" element={<Navigate to="/admin/games" replace />} />
            <Route
              path="/admin/chatbot"
              element={
                <ProtectedRoute adminOnly={true}>
                  <AppLayout>
                    <AdminChatbotPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Catch-all Fallback */}
            <Route path="*" element={<RootRedirect />} />
          </Routes>
          <MaatramChatbot />
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  );
}