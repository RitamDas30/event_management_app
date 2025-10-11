// // src/App.jsx
// import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// import { Toaster } from "react-hot-toast"; // Added Toaster

// // Core Components
// import Navbar from "./components/Navbar";

// // Pages
// import Home from "./pages/Home";
// import Login from "./pages/Login";
// import Register from "./pages/Register";
// import Dashboard from "./pages/Dashboard";
// import CreateEvent from "./pages/CreateEvent";
// // New Pages
// import StudentRegistrations from "./pages/StudentRegistrations";
// import OrganizerAnalytics from "./pages/OrganizerAnalytics";
// import NotFound from "./pages/NotFound";

// // 🛑 RESTORED: Auth Context and Provider
// import { AuthProvider, useAuth } from "./context/AuthContext"; 

// // 🛑 RESTORED: Protected Route Component
// function ProtectedRoute({ children }) {
//   const { user, loading } = useAuth();
  
//   // NOTE: Added 'loading' check. Show a loader or null while checking auth status
//   if (loading) return null; // Or <Loader />
  
//   return user ? children : <Navigate to="/login" />;
// }

// // 🛑 ADDED: Role Restriction Component (Recommended)
// // Since you have a '/analytics' route (likely for organizers), 
// // it's best to wrap it in a component that checks the user's role.
// function OrganizerRoute({ children }) {
//   const { user, loading } = useAuth();
  
//   if (loading) return null;
  
//   // Assuming 'organizer' is a role field on your user object
//   if (user && user.role === 'organizer') {
//     return children;
//   }
//   // Redirect non-organizers to dashboard or home
//   return <Navigate to="/dashboard" replace />;
// }


// export default function App() {
//   return (
//     // 🛑 WRAPPED: App must be wrapped in AuthProvider
//     <AuthProvider> 
//       <BrowserRouter>
//         <Navbar />
//         <div className="max-w-6xl mx-auto p-4">
//           <Toaster position="top-right" /> {/* Added Toaster */}
//           <Routes>
            
//             {/* PUBLIC ROUTES */}
//             <Route path="/" element={<Home />} />
//             <Route path="/login" element={<Login />} />
//             <Route path="/register" element={<Register />} />
            
//             {/* STUDENT/USER PROTECTED ROUTES */}
//             {/* All routes requiring a logged-in user use ProtectedRoute */}
//             <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
//             <Route path="/create-event" element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
//             <Route path="/my-registrations" element={<ProtectedRoute><StudentRegistrations /></ProtectedRoute>} />
            
//             {/* ORGANIZER PROTECTED ROUTE (Requires login AND specific role) */}
//             <Route path="/analytics" element={<OrganizerRoute><OrganizerAnalytics /></OrganizerRoute>} />

//             {/* CATCH ALL / NOT FOUND ROUTE */}
//             <Route path="*" element={<NotFound />} />
//           </Routes>
//         </div>
//       </BrowserRouter>
//     </AuthProvider>
//   );
// }
// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast"; 

// Core Components
import Navbar from "./components/Navbar";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CreateEvent from "./pages/CreateEvent";
import StudentRegistrations from "./pages/StudentRegistrations";
import OrganizerAnalytics from "./pages/OrganizerAnalytics";
import NotFound from "./pages/NotFound";

// Auth Context
import { AuthProvider, useAuth } from "./context/AuthContext"; 

// 1. Protected Route (Requires any authenticated user)
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) return null; 
  
  return user ? children : <Navigate to="/login" replace />;
}

// 2. Organizer Route (Requires organizer role)
function OrganizerRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  
  // 🛑 Logic: If user is logged in AND is an organizer, grant access.
  if (user && user.role === 'organizer') {
    return children;
  }
  
  // Redirect non-organizers and unauthenticated users to the Home page.
  return <Navigate to="/" replace />; 
}

// 3. 🟢 NEW: Organiser/Student Dashboard Route (Directs Student to My Registrations)
function OrganizerDashboardRoute({ children }) {
    const { user, loading } = useAuth();
    
    if (loading) return null;
    
    // If user is a student, redirect them immediately to their dedicated page.
    if (user && user.role === 'student') {
        return <Navigate to="/my-registrations" replace />;
    }
    
    // If user is an organizer, ensure they are logged in before showing the Dashboard.
    return user ? children : <Navigate to="/login" replace />;
}


export default function App() {
  return (
    <AuthProvider> 
      <BrowserRouter>
        <Navbar />
        <div className="max-w-6xl mx-auto p-4">
          <Toaster position="top-right" />
          <Routes>
            
            {/* PUBLIC / PRIMARY ROUTE: Student Landing Page */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* 🛑 MODIFIED: DASHBOARD - Organizer Management & Student Redirect */}
            <Route 
              path="/dashboard" 
              element={<OrganizerDashboardRoute><Dashboard /></OrganizerDashboardRoute>} 
            />

            {/* PROTECTED STUDENT/USER ROUTES (Require simple login) */}
            <Route path="/my-registrations" element={<ProtectedRoute><StudentRegistrations /></ProtectedRoute>} />
            
            {/* ORGANIZER PROTECTED ROUTES (Require organizer role) */}
            <Route path="/create-event" element={<OrganizerRoute><CreateEvent /></OrganizerRoute>} />
            <Route path="/analytics" element={<OrganizerRoute><OrganizerAnalytics /></OrganizerRoute>} />

            {/* CATCH ALL */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}