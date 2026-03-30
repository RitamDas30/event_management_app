import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Layouts
import GuestLayout from "./layouts/GuestLayout";
import DashboardLayout from "./layouts/DashboardLayout";

// Guest-only Pages
import LandingPage from "./pages/LandingPage";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import OAuthCallback from "./pages/OAuthCallback";
import OAuthRoleSelect from "./pages/OAuthRoleSelect";
import NotFound from "./pages/NotFound";

// Shared Pages (used across roles)
import Explore from "./pages/Explore";
import EventDetails from "./pages/EventDetails";
import LiveEvent from "./pages/LiveEvent";
import Profile from "./pages/shared/Profile";
import Settings from "./pages/shared/Settings";
import LiveEvents from "./pages/shared/LiveEvents";

// Student Pages
import StudentDashboard from "./pages/student/StudentDashboard";
import MyEvents from "./pages/student/MyEvents";
import StudentCalendar from "./pages/StudentCalendar";
import SavedEvents from "./pages/student/SavedEvents";
import StudentNotifications from "./pages/student/StudentNotifications";

// Organizer Pages
import OrganizerDashboard from "./pages/organizer/OrganizerDashboard";
import OrganizerEvents from "./pages/organizer/OrganizerEvents";
import OrganizerRevenue from "./pages/organizer/OrganizerRevenue";
import OrganizerAnnouncements from "./pages/organizer/OrganizerAnnouncements";
import CreateEvent from "./pages/CreateEvent";
import EditEvent from "./pages/EditEvent";
import OrganizerAnalytics from "./pages/OrganizerAnalytics";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminReports from "./pages/admin/AdminReports";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";
import AdminAuditLog from "./pages/admin/AdminAuditLog";
import AdminSettings from "./pages/admin/AdminSettings";

function DashboardRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  switch (user.role) {
    case "admin": return <Navigate to="/admin/dashboard" replace />;
    case "organizer": return <Navigate to="/organizer/dashboard" replace />;
    default: return <Navigate to="/student/dashboard" replace />;
  }
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <DashboardRedirect />;
  return children;
}

function ExploreRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Explore />;
  switch (user.role) {
    case "admin": return <Navigate to="/admin/explore" replace />;
    case "organizer": return <Navigate to="/organizer/explore" replace />;
    default: return <Navigate to="/student/explore" replace />;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          {/* ========================================= */}
          {/* GUEST ROUTES */}
          {/* ========================================= */}
          <Route element={<GuestLayout />}>
            <Route path="/" element={<GuestOnly><LandingPage /></GuestOnly>} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
            <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth/google/callback" element={<OAuthCallback provider="google" />} />
            <Route path="/auth/github/callback" element={<OAuthCallback provider="github" />} />
            <Route path="/auth/select-role" element={<OAuthRoleSelect />} />
            <Route path="/explore" element={<ExploreRedirect />} />
            <Route path="/events/:id" element={<EventDetails />} />
          </Route>

          {/* ========================================= */}
          {/* REDIRECTS */}
          {/* ========================================= */}
          <Route path="/dashboard" element={<DashboardRedirect />} />

          {/* ========================================= */}
          {/* STUDENT */}
          {/* ========================================= */}
          <Route element={<DashboardLayout allowedRoles={["student"]} />}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/explore" element={<Explore />} />
            <Route path="/student/events/:id" element={<EventDetails />} />
            <Route path="/student/events/:id/live" element={<LiveEvent />} />
            <Route path="/student/my-events" element={<MyEvents />} />
            <Route path="/student/live" element={<LiveEvents />} />
            <Route path="/student/calendar" element={<StudentCalendar />} />
            <Route path="/student/saved" element={<SavedEvents />} />
            <Route path="/student/notifications" element={<StudentNotifications />} />
            <Route path="/student/profile" element={<Profile />} />
            <Route path="/student/settings" element={<Settings />} />
          </Route>

          {/* ========================================= */}
          {/* ORGANIZER */}
          {/* ========================================= */}
          <Route element={<DashboardLayout allowedRoles={["organizer", "admin"]} />}>
            <Route path="/organizer/dashboard" element={<OrganizerDashboard />} />
            <Route path="/organizer/explore" element={<Explore />} />
            <Route path="/organizer/events/:id" element={<EventDetails />} />
            <Route path="/organizer/events" element={<OrganizerEvents />} />
            <Route path="/organizer/live" element={<LiveEvents />} />
            <Route path="/organizer/events/create" element={<CreateEvent />} />
            <Route path="/organizer/events/:id/edit" element={<EditEvent />} />
            <Route path="/organizer/events/:id/live" element={<LiveEvent />} />
            <Route path="/organizer/analytics" element={<OrganizerAnalytics />} />
            <Route path="/organizer/revenue" element={<OrganizerRevenue />} />
            <Route path="/organizer/announcements" element={<OrganizerAnnouncements />} />
            <Route path="/organizer/profile" element={<Profile />} />
            <Route path="/organizer/settings" element={<Settings />} />
          </Route>

          {/* ========================================= */}
          {/* ADMIN */}
          {/* ========================================= */}
          <Route element={<DashboardLayout allowedRoles={["admin"]} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/explore" element={<Explore />} />
            <Route path="/admin/events/:id" element={<EventDetails />} />
            <Route path="/admin/live" element={<LiveEvents />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/events" element={<AdminEvents />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/announcements" element={<AdminAnnouncements />} />
            <Route path="/admin/audit" element={<AdminAuditLog />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
          </Route>

          {/* ========================================= */}
          {/* LEGACY REDIRECTS */}
          {/* ========================================= */}
          <Route path="/my-registrations" element={<Navigate to="/student/my-events" replace />} />
          <Route path="/calendar" element={<Navigate to="/student/calendar" replace />} />
          <Route path="/create-event" element={<Navigate to="/organizer/events/create" replace />} />
          <Route path="/analytics" element={<Navigate to="/organizer/analytics" replace />} />
          <Route path="/admin-panel" element={<Navigate to="/admin/dashboard" replace />} />

          {/* 404 */}
          <Route path="*" element={<GuestLayout />}>
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
