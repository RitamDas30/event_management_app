import { useState } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";

export default function DashboardLayout({ allowedRoles }) {
  const { user, loading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isLivePage = location.pathname.endsWith("/live");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const dashPath = user.role === "admin" ? "/admin/dashboard" : user.role === "organizer" ? "/organizer/dashboard" : "/student/dashboard";
    return <Navigate to={dashPath} replace />;
  }

  // ===== LIVE PAGE: Just sidebar + outlet (LiveEvent handles its own positioning) =====
  if (isLivePage) {
    return (
      <>
        <div className="hidden lg:block">
          <Sidebar collapsed={true} onToggle={() => {}} />
        </div>
        <Outlet />
      </>
    );
  }

  // ===== NORMAL PAGES =====
  return (
    <div className="min-h-screen bg-gray-50">
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      <div className="hidden lg:block">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      </div>

      <div className={`lg:hidden fixed inset-y-0 left-0 z-40 transition-transform duration-300 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <Sidebar collapsed={false} onToggle={() => setMobileMenuOpen(false)} />
      </div>

      <div className="hidden lg:block">
        <TopBar sidebarCollapsed={sidebarCollapsed} onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
      </div>
      <div className="lg:hidden">
        <TopBar sidebarCollapsed={true} onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
      </div>

      <main className={`min-h-screen pt-16 transition-all duration-300 ${sidebarCollapsed ? "lg:ml-[68px]" : "lg:ml-64"}`}>
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
