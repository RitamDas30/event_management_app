import { Outlet, Link } from "react-router-dom";
import { Calendar } from "lucide-react";
import Footer from "../components/Footer";

export default function GuestLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Minimal top bar for guests */}
      <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
          <Calendar className="w-6 h-6 text-blue-600" />
          Evently
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-blue-600 px-3 py-2 rounded-lg transition-colors">
            Log in
          </Link>
          <Link to="/register" className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors shadow-sm">
            Sign up
          </Link>
        </div>
      </nav>
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
