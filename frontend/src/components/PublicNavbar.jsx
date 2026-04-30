import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Menu, X, Sun, Moon } from "lucide-react";
import clsx from "clsx";

export default function PublicNavbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeMobile = () => setMobileOpen(false);

  const handleLogout = () => {
    logout();
    closeMobile();
    navigate("/");
  };

  const getDashboardPath = () => {
    if (!user) return "/login";
    switch (user.role) {
      case "admin": return "/admin/dashboard";
      case "organizer": return "/organizer/dashboard";
      default: return "/student/dashboard";
    }
  };

  const navLinks = [
    { name: "Explore", path: "/explore" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <nav
      className={clsx(
        "fixed top-0 inset-x-0 z-50 transition-all duration-500 border-b",
        scrolled
          ? "bg-surface-50/80 dark:bg-surface-950/80 backdrop-blur-xl border-border"
          : "bg-transparent border-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 group outline-none focus-visible:ring-2 ring-brand-500/50 rounded-lg p-1"
            onClick={closeMobile}
          >
            <div className="w-8 h-8 rounded-lg bg-surface-900 dark:bg-surface-100 flex items-center justify-center transition-transform group-hover:scale-105 duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]">
              <span className="font-semibold text-xl text-surface-50 dark:text-surface-950 leading-none mt-1.5">
                E
              </span>
            </div>
            <span className="font-sans font-semibold text-lg tracking-tight text-surface-950 dark:text-surface-50">
              Evently
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const active = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={clsx(
                    "relative px-4 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 ring-brand-500/50 rounded-full",
                    active
                      ? "text-surface-950 dark:text-surface-50"
                      : "text-surface-500 hover:text-surface-900 dark:text-surface-400 dark:hover:text-surface-100"
                  )}
                >
                  {link.name}
                  {active && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute inset-0 bg-surface-200/50 dark:bg-surface-800/50 rounded-full -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-surface-500 hover:text-surface-900 dark:text-surface-400 dark:hover:text-surface-100 hover:bg-surface-200/50 dark:hover:bg-surface-800/50 transition-all outline-none focus-visible:ring-2 ring-brand-500/50"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {user ? (
              <div className="flex items-center gap-4 pl-4 border-l border-border">
                <Link
                  to={getDashboardPath()}
                  className="text-sm font-medium text-surface-600 hover:text-surface-900 dark:text-surface-300 dark:hover:text-surface-50 transition-colors"
                >
                  Dashboard
                </Link>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center text-sm font-medium shadow-glow">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-sm font-medium text-surface-500 hover:text-red-500 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 pl-4 border-l border-border">
                <Link
                  to="/login"
                  className="text-sm font-medium text-surface-600 hover:text-surface-900 dark:text-surface-300 dark:hover:text-surface-50 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-medium bg-surface-900 text-surface-50 hover:bg-surface-800 dark:bg-surface-100 dark:text-surface-950 dark:hover:bg-surface-200 px-5 py-2.5 rounded-full transition-all hover:scale-105 duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-sm"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleTheme}
              className="p-2 text-surface-500 dark:text-surface-400"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 text-surface-900 dark:text-surface-50"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden bg-surface-50 dark:bg-surface-950 border-b border-border"
          >
            <div className="px-6 py-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="text-lg font-medium text-surface-900 dark:text-surface-50"
                  onClick={closeMobile}
                >
                  {link.name}
                </Link>
              ))}
              <div className="h-px w-full bg-border my-2" />
              {user ? (
                <>
                  <Link
                    to={getDashboardPath()}
                    className="text-lg font-medium text-surface-900 dark:text-surface-50"
                    onClick={closeMobile}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-lg font-medium text-left text-red-500"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-lg font-medium text-surface-600 dark:text-surface-300"
                    onClick={closeMobile}
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    className="text-lg font-medium text-brand-600 dark:text-brand-400"
                    onClick={closeMobile}
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
