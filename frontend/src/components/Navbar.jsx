import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-gray-800 text-white p-3 flex justify-between items-center rounded-xl">
      <Link to="/" className="text-lg font-semibold">Smart Campus</Link>
      <div className="flex gap-4 items-center">
        {user ? (
          <>
            {/* Standard Logged-in Links */}
            <Link to="/dashboard" className="hover:text-blue-400">Dashboard</Link>
            
            {/* 🟢 NEW: STUDENT LINKS (My Registrations) */}
            {user?.role === "student" && (
              <Link to="/my-registrations" className="hover:text-blue-400">
                My Registrations
              </Link>
            )}

            {/* 🟢 NEW: ORGANIZER LINKS (Create Event & Analytics) */}
            {user?.role === "organizer" && (
              <>
                <Link to="/create-event" className="hover:text-blue-400">
                  Create Event
                </Link>
                <Link to="/analytics" className="hover:text-blue-400">
                  Analytics
                </Link>
              </>
            )}
            
            {/* Logout Button */}
            <button 
              onClick={logout} 
              className="bg-red-500 px-3 py-1 rounded-md hover:bg-red-600 transition duration-150"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            {/* Public Links */}
            <Link to="/login" className="hover:text-blue-400">Login</Link>
            <Link to="/register" className="hover:text-blue-400">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}