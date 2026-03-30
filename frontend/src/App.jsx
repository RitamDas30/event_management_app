import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Layouts
import PublicLayout from "./layouts/PublicLayout";
import DashboardLayout from "./layouts/DashboardLayout";

// Public Pages
import LandingPage from "./pages/LandingPage";
import Explore from "./pages/Explore";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import EventDetails from "./pages/EventDetails";
import NotFound from "./pages/NotFound";

// Student Pages
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentRegistrations from "./pages/StudentRegistrations";
import StudentCalendar from "./pages/StudentCalendar";

// Organizer Pages
import OrganizerDashboard from "./pages/organizer/OrganizerDashboard";
import Dashboard from "./pages/Dashboard";
import CreateEvent from "./pages/CreateEvent";
import EditEvent from "./pages/EditEvent";
import OrganizerAnalytics from "./pages/OrganizerAnalytics";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";

// Shared
import ComingSoon from "./pages/ComingSoon";

// Smart redirect: sends logged-in users to their role-specific dashboard
function DashboardRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case "admin":
      return <Navigate to="/admin/dashboard" replace />;
    case "organizer":
      return <Navigate to="/organizer/dashboard" replace />;
    default:
      return <Navigate to="/student/dashboard" replace />;
  }
}

// Redirect logged-in users away from auth pages
function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <DashboardRedirect />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          {/* ========================================= */}
          {/* PUBLIC ROUTES — PublicLayout (Navbar + Footer) */}
          {/* ========================================= */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/events/:id" element={<EventDetails />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route
              path="/login"
              element={<GuestOnly><Login /></GuestOnly>}
            />
            <Route
              path="/register"
              element={<GuestOnly><Register /></GuestOnly>}
            />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>

          {/* ========================================= */}
          {/* DASHBOARD REDIRECT */}
          {/* ========================================= */}
          <Route path="/dashboard" element={<DashboardRedirect />} />

          {/* ========================================= */}
          {/* STUDENT ROUTES — DashboardLayout */}
          {/* ========================================= */}
          <Route element={<DashboardLayout allowedRoles={["student"]} />}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/registrations" element={<StudentRegistrations />} />
            <Route path="/student/tickets" element={<ComingSoon title="My Tickets" description="Digital tickets with QR codes are coming soon." />} />
            <Route path="/student/calendar" element={<StudentCalendar />} />
            <Route path="/student/saved" element={<ComingSoon title="Saved Events" description="Bookmark your favorite events. Coming soon." />} />
            <Route path="/student/notifications" element={<ComingSoon title="Notifications" description="In-app notification center is coming soon." />} />
            <Route path="/student/profile" element={<ComingSoon title="Profile" description="User profile editor is coming soon." />} />
            <Route path="/student/settings" element={<ComingSoon title="Settings" description="Account settings are coming soon." />} />
          </Route>

          {/* ========================================= */}
          {/* ORGANIZER ROUTES — DashboardLayout */}
          {/* ========================================= */}
          <Route element={<DashboardLayout allowedRoles={["organizer", "admin"]} />}>
            <Route path="/organizer/dashboard" element={<OrganizerDashboard />} />
            <Route path="/organizer/events" element={<Dashboard />} />
            <Route path="/organizer/events/create" element={<CreateEvent />} />
            <Route path="/organizer/events/:id/edit" element={<EditEvent />} />
            <Route path="/organizer/analytics" element={<OrganizerAnalytics />} />
            <Route path="/organizer/revenue" element={<ComingSoon title="Revenue" description="Payment tracking and revenue dashboard coming soon." />} />
            <Route path="/organizer/announcements" element={<ComingSoon title="Announcements" description="Send updates to your event attendees. Coming soon." />} />
            <Route path="/organizer/profile" element={<ComingSoon title="Profile" description="Organizer profile editor is coming soon." />} />
            <Route path="/organizer/settings" element={<ComingSoon title="Settings" description="Account settings are coming soon." />} />
          </Route>

          {/* ========================================= */}
          {/* ADMIN ROUTES — DashboardLayout */}
          {/* ========================================= */}
          <Route element={<DashboardLayout allowedRoles={["admin"]} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<ComingSoon title="User Management" description="Manage users, roles, and permissions. Coming soon." />} />
            <Route path="/admin/events" element={<ComingSoon title="Event Moderation" description="Review and moderate platform events. Coming soon." />} />
            <Route path="/admin/categories" element={<ComingSoon title="Categories" description="Manage event categories. Coming soon." />} />
            <Route path="/admin/reports" element={<ComingSoon title="Reports" description="Platform-wide analytics and reports. Coming soon." />} />
            <Route path="/admin/announcements" element={<ComingSoon title="Announcements" description="Platform-wide announcements. Coming soon." />} />
            <Route path="/admin/audit" element={<ComingSoon title="Audit Log" description="Admin action history. Coming soon." />} />
            <Route path="/admin/settings" element={<ComingSoon title="Platform Settings" description="Platform configuration. Coming soon." />} />
          </Route>

          {/* ========================================= */}
          {/* LEGACY ROUTE REDIRECTS */}
          {/* ========================================= */}
          <Route path="/my-registrations" element={<Navigate to="/student/registrations" replace />} />
          <Route path="/calendar" element={<Navigate to="/student/calendar" replace />} />
          <Route path="/create-event" element={<Navigate to="/organizer/events/create" replace />} />
          <Route path="/analytics" element={<Navigate to="/organizer/analytics" replace />} />
          <Route path="/edit-event/:id" element={<Navigate to="/organizer/events/:id/edit" replace />} />
          <Route path="/admin-panel" element={<Navigate to="/admin/dashboard" replace />} />

          {/* ========================================= */}
          {/* 404 CATCH-ALL */}
          {/* ========================================= */}
          <Route path="*" element={<PublicLayout />}>
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
