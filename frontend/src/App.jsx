// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast"; 

// 🛑 CORE COMPONENTS
import Navbar from "./components/Navbar";

// 🛑 PAGES (Ensure ALL pages are imported correctly)
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CreateEvent from "./pages/CreateEvent";
import StudentRegistrations from "./pages/StudentRegistrations";
import OrganizerAnalytics from "./pages/OrganizerAnalytics";
import NotFound from "./pages/NotFound";
import StudentCalendar from "./pages/StudentCalendar"; 
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import EventDetails from "./pages/EventDetails"; // Required for public sharing

// 🛑 AUTH CONTEXT
import { AuthProvider, useAuth } from "./context/AuthContext"; 

// 1. Protected Route (Requires any authenticated user)
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) return null; 
  
  return user ? children : <Navigate to="/login" replace />;
}

// 2. Organizer Route (Requires organizer or admin role)
function OrganizerRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  
  // Logic: Allow access if role is organizer OR admin
  if (user && (user.role === 'organizer' || user.role === 'admin')) {
    return children;
  }
  
  // Redirect non-organizers/non-admins to Home page.
  return <Navigate to="/" replace />; 
}

// 3. Admin Dashboard Placeholder (Needed for the route)
function AdminDashboard() {
    return (
        <div className="text-center mt-12 p-8 bg-gray-50 rounded-xl">
            <h1 className="text-3xl font-bold text-red-700">Admin Control Panel</h1>
            <p className="mt-3 text-gray-600">You have global superpowers. This panel is currently reserved for future User/System Management features.</p>
        </div>
    );
}


export default function App() {
  return (
    <AuthProvider> 
      <BrowserRouter>
        <Navbar />
        <div className="max-w-6xl mx-auto p-4">
          <Toaster position="top-right" />
          <Routes>
            
            {/* ==================================== */}
            {/* PUBLIC & PRIMARY ROUTES */}
            {/* ==================================== */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Public details page for social sharing */}
            <Route path="/events/:id" element={<EventDetails />} /> 
            
            {/* Password Reset Flow */}
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            
            {/* ==================================== */}
            {/* PROTECTED ROUTES */}
            {/* ==================================== */}

            {/* Admin/Organizer Management */}
            <Route path="/dashboard" element={<OrganizerRoute><Dashboard /></OrganizerRoute>} />
            <Route path="/admin-panel" element={<OrganizerRoute><AdminDashboard /></OrganizerRoute>} />

            {/* Organizer Tools */}
            <Route path="/create-event" element={<OrganizerRoute><CreateEvent /></OrganizerRoute>} />
            <Route path="/analytics" element={<OrganizerRoute><OrganizerAnalytics /></OrganizerRoute>} />

            {/* Student Tools */}
            <Route path="/my-registrations" element={<ProtectedRoute><StudentRegistrations /></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><StudentCalendar /></ProtectedRoute>} />

            {/* CATCH ALL */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}