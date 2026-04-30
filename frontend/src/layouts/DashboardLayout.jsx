import { useState, useEffect } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";

export default function DashboardLayout({ allowedRoles }) {
  const { user, loading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Only match actual streaming pages: /*/events/:id/live (not /student/live which is the list page)
  const isLivePage = /\/events\/[^/]+\/live$/.test(location.pathname);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
        <div className="w-8 h-8 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const dashPath = user.role === "admin" ? "/admin/dashboard" : user.role === "organizer" ? "/organizer/dashboard" : "/student/dashboard";
    return <Navigate to={dashPath} replace />;
  }

  if (isLivePage) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-950 transition-colors">
        <div className="hidden lg:block fixed inset-y-0 left-0 z-40">
          <Sidebar collapsed={true} onToggle={() => {}} />
        </div>
        <div className="lg:ml-[72px] h-screen flex">
          <div className="w-full h-full relative">
            <Outlet />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 transition-colors duration-300 font-sans text-surface-950 dark:text-surface-50 selection:bg-brand-500 selection:text-white">
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-surface-950/20 dark:bg-surface-950/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="hidden lg:block fixed top-0 left-0 h-screen z-40">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      </div>

      <div className={`lg:hidden fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <Sidebar collapsed={false} onToggle={() => setMobileMenuOpen(false)} />
      </div>

      <TopBar sidebarCollapsed={sidebarCollapsed} onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />

      <main className={`min-h-screen pt-16 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${sidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-64"}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="p-6 lg:p-10 max-w-[1400px] mx-auto min-h-[calc(100vh-4rem)] flex flex-col"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
