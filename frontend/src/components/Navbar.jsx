import React, { useState } from "react"; // 🛑 FIX: Explicitly import React for JSX and Vite compatibility
import { Link, useLocation } from "react-router-dom"; 
import { useAuth } from "../context/AuthContext";
import { Menu, X } from 'lucide-react'; 

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation(); 

  // Helper function to apply active link styling
  const isActive = (path) => location.pathname === path 
    ? 'text-blue-600 font-semibold border-b-2 border-blue-600' 
    : 'text-gray-700 font-medium';

  const closeMenu = () => setIsOpen(false);

  // Helper function to render conditional links based on role
  const renderLoggedInLinks = (isMobile = false) => {
      const role = user?.role;
      const links = [];
      const baseClass = isMobile ? 'text-base' : 'text-sm font-medium';

      // 1. ADMIN PANEL (Highest priority link, exclusive to Admin)
      if (role === 'admin') {
          links.push(
              <Link key="admin-panel" to="/admin-panel" className={`${baseClass} text-red-600 hover:text-red-800 ${isActive('/admin-panel')}`} onClick={closeMenu}>
                  Admin Panel
              </Link>
          );
      } 
      
      // 2. ORGANIZER LINKS (Only visible if role is Organizer)
      if (role === 'organizer') {
          links.push(
              <Link key="dashboard" to="/dashboard" className={`${baseClass} hover:text-blue-600 ${isActive('/dashboard')}`} onClick={closeMenu}>Dashboard</Link>,
              <Link key="create" to="/create-event" className={`${baseClass} hover:text-blue-600 ${isActive('/create-event')}`} onClick={closeMenu}>Create Event</Link>,
              <Link key="analytics" to="/analytics" className={`${baseClass} hover:text-blue-600 ${isActive('/analytics')}`} onClick={closeMenu}>Analytics</Link>
          );
      }
      
      // 3. STUDENT LINKS (Default access links for general users)
      if (role === 'student') {
          links.push(
              <Link key="registrations" to="/my-registrations" className={`${baseClass} hover:text-blue-600 ${isActive('/my-registrations')}`} onClick={closeMenu}>My Registrations</Link>,
              <Link key="calendar" to="/calendar" className={`${baseClass} hover:text-blue-600 ${isActive('/calendar')}`} onClick={closeMenu}>Calendar</Link>
          );
      }

      return links;
  };

  const renderAuthButton = (isMobile = false) => (
      user ? (
          <button 
              onClick={() => { logout(); closeMenu(); }} 
              className={`bg-red-500 text-white px-3 py-1.5 rounded-lg ${isMobile ? 'w-full text-left' : 'text-sm font-medium'} hover:bg-red-600 transition`}
          >
              Logout
          </button>
      ) : (
          <>
              <Link to="/login" className={`text-sm font-medium hover:text-blue-600 ${isMobile ? 'text-base' : ''}`} onClick={closeMenu}>Login</Link>
              <Link 
                  to="/register" 
                  className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                  onClick={closeMenu}
              >
                  Register
              </Link>
          </>
      )
  );

  return (
    <nav className="bg-white shadow-md p-4 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        
        {/* Logo/Brand */}
        <Link 
          to="/" 
          className="text-xl font-bold text-blue-600 hover:text-blue-800 transition duration-150"
          onClick={closeMenu}
        >
          Evently
        </Link>
        
        {/* --- Desktop Links --- */}
        <div className="hidden md:flex gap-6 items-center text-gray-700">
          {renderLoggedInLinks()}
          {renderAuthButton()}
        </div>

        {/* --- Hamburger Button (Mobile) --- */}
        <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)} className="text-gray-700 hover:text-blue-600">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* --- Mobile Menu (Collapsible) --- */}
      <div 
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-96 opacity-100 mt-3 border-t pt-3' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="flex flex-col gap-3">
            {/* Render links for mobile */}
            {renderLoggedInLinks(true).map(link => 
                <React.Fragment key={link.key || link.props.to}>
                    {/* The list items are rendered directly, which avoids the map/clone issue */}
                    {link}
                </React.Fragment>
            )}

            <div className="w-full pt-2 border-t mt-2">
                {renderAuthButton(true)}
            </div>
        </div>
      </div>
    </nav>
  );
}