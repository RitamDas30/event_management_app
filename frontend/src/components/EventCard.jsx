// src/components/EventCard.jsx

// Trailing line: // Start of file: src/components/EventCard.jsx
import React, { useState, useEffect } from "react"; 
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast"; 
import { CheckCircle, Clock, Share2 } from 'lucide-react'; 

export default function EventCard({ event, refresh }) {
  const { user } = useAuth(); // Access user object (which holds token status)
  const [loading, setLoading] = useState(false); 
  const [registrationStatus, setRegistrationStatus] = useState(null); 
  const [localWaitlistCount, setLocalWaitlistCount] = useState(0); 
  const [copied, setCopied] = useState(false); 
  
  const isWaitlistActive = event.seatsAvailable <= 0;

  // 1. Initial Status Check (Runs only when user object is confirmed logged in)
  useEffect(() => {
    const checkUserRegistration = async () => {
      // 🛑 CRITICAL FIX: Only proceed if the user object is NOT null
      if (!user || !event._id) {
          setRegistrationStatus(null); // Ensure status is clear if logged out
          return;
      }
      
      try {
        const res = await api.get("/registrations/me");
        const currentReg = res.data.find(reg => reg.event._id === event._id);
        
        if (currentReg) {
          setRegistrationStatus(currentReg.status);
          if (currentReg.status === 'waitlisted') {
              // NOTE: Since the registration/me endpoint doesn't return the rank/count,
              // we can't show it here, but we set the status correctly.
          }
        } else {
          setRegistrationStatus(null); 
        }
        
      } catch (error) {
        // We expect 401/403 if the token is expired, so we catch it gracefully.
        console.error("Failed to check user registration status:", error.message);
      }
    };
    
    // 🛑 CRITICAL: The dependency array must include 'user' to re-run on login/logout.
    checkUserRegistration();
  }, [user, event._id, refresh]); 


  const handleRegister = async () => {
    if (!user) {
      toast.error("Please log in to register for an event.");
      return;
    }

    try {
      setLoading(true);
      
      const res = await api.post(`/registrations/${event._id}`);
      const statusMessage = res.data.message || "Registration successful!";
      
      const isWaitlistedResponse = statusMessage.toLowerCase().includes("waitlisted");
      
      // Update local state with status and count from the successful response
      setRegistrationStatus(isWaitlistedResponse ? "waitlisted" : "registered"); 
      if (isWaitlistedResponse && res.data.waitlistCount) {
          setLocalWaitlistCount(res.data.waitlistCount);
      }

      toast.success(statusMessage);
      
      if (refresh) refresh(); 
      
    } catch (err) {
      const status = err.response?.status;
      const backendData = err.response?.data;
      
      let displayMessage = "Registration failed. Please check event details.";

      if (status === 409 || status === 400 || status === 403) {
          displayMessage = backendData.message;
          
          if (backendData?.message?.toLowerCase().includes("already waitlisted")) {
              setRegistrationStatus("waitlisted");
              setLocalWaitlistCount(backendData.waitlistCount); 
          } else if (backendData?.message?.toLowerCase().includes("already registered")) {
              setRegistrationStatus("registered");
          }
      }
      
      toast.error(displayMessage);
      
    } finally {
      setLoading(false);
    }
  };
  
  // Share Handler Function
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/events/${event._id}`; 
    const shareTitle = `Join me at ${event.title}!`;
    const shareText = `Check out this awesome event: ${event.title} happening at ${event.venue}.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied to clipboard! Share away!");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        toast.error("Failed to copy link.");
        console.error('Error copying:', error);
      }
    }
  };


  const renderStatusBlock = () => {
    const status = registrationStatus;
    
    // Only render status if not null (not registered or already checked)
    if (status === "registered" || status === "waitlisted") {
        const isRegistered = status === "registered";
        const isWaiting = status === "waitlisted";
        
        return (
            <div className={`mt-3 p-3 rounded-lg flex flex-col items-center border ${
                isRegistered ? 'bg-green-50 border-green-300' : 'bg-yellow-50 border-yellow-300'
            }`}>
                <div className="flex items-center gap-2">
                    {isRegistered ? (
                      <CheckCircle size={20} className="text-green-600" />
                    ) : (
                      <Clock size={20} className="text-yellow-600" />
                    )}
                    <p className={`font-semibold text-center ${isRegistered ? 'text-green-800' : 'text-yellow-800'}`}>
                        {isRegistered 
                            ? "Confirmed! You are registered." 
                            : `Waiting List: #${localWaitlistCount}` 
                        }
                    </p>
                </div>
                
                {isWaiting && localWaitlistCount > 0 && (
                    <p className="text-xs text-yellow-700 mt-1">
                        There are {localWaitlistCount} people ahead of you.
                    </p>
                )}

                <Link
                    to="/my-registrations"
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium underline"
                >
                    View Your Digital Ticket
                </Link>
            </div>
        );
    }
    return null;
  };


  return (
    <div className="bg-white shadow-md rounded-lg p-4 flex flex-col justify-between border">
      
      {/* 🛑 CORE CONTENT BLOCK 🛑 */}
      <div>
        
        {/* 🟢 SHARE BUTTON INTEGRATION */}
        <div className="relative">
            <img
                src={event.imageUrl || "https://via.placeholder.com/400x200"}
                alt={event.title}
                className="rounded-md w-full h-40 object-cover mb-3"
            />
            <button 
                onClick={handleShare}
                className="absolute top-2 right-2 p-2 bg-black bg-opacity-60 rounded-full text-white hover:bg-opacity-80 transition duration-150"
                title="Share Event"
            >
                {copied ? <CheckCircle size={20} className="text-green-400" /> : <Share2 size={20} />}
            </button>
        </div>
        
        <h3 className="text-lg font-semibold">{event.title}</h3>
        <p className="text-gray-600 text-sm mb-1">
          {new Date(event.startTime).toLocaleString()} –{" "}
          {new Date(event.endTime).toLocaleTimeString()}
        </p>
        <p className="text-gray-500 text-sm mb-2">📍 {event.venue}</p>
        <p className="text-sm text-gray-700 mb-2">
          Category: <span className="font-medium">{event.category}</span>
        </p>
        <p className="text-sm">
          Seats left: <span className="font-semibold">{event.seatsAvailable}</span>
        </p>
      </div>

      {user && user.role === "student" && (
        // Renders EITHER the Status Block OR the Register Button.
        renderStatusBlock() || ( 
            <button
              disabled={loading} 
              onClick={handleRegister}
              className={`mt-3 py-1 rounded transition text-white font-semibold 
                ${loading 
                    ? 'bg-gray-400 cursor-wait' 
                    : isWaitlistActive 
                        ? 'bg-orange-500 hover:bg-orange-600' 
                        : 'bg-blue-600 hover:bg-blue-700'
                }`}
            >
              {loading 
                ? "Processing..." 
                : isWaitlistActive 
                    ? "Join Waiting List" 
                    : "Register Now"
              }
            </button>
        )
      )}
    </div>
  );
}