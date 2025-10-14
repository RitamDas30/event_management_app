import React, { useState, useEffect } from "react"; 
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast"; 
// import { CheckCircle, Clock, Share2, MapPin } from 'lucide-react'; // 🟢 Ensure MapPin is imported
import { CheckCircle, Clock, Share2, Calendar, DollarSign, MapPin } from 'lucide-react'; 

export default function EventCard({ event, refresh }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false); 
  const [registrationStatus, setRegistrationStatus] = useState(null); 
  const [localWaitlistCount, setLocalWaitlistCount] = useState(0); 
  const [copied, setCopied] = useState(false); 
  
  const isWaitlistActive = event.seatsAvailable <= 0;

  // Date/Time Formatting Variables
  const startTime = new Date(event.startTime);
  const endTime = new Date(event.endTime);
  const formattedDate = startTime.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  const formattedTime = `${startTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} – ${endTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;

  // 1. Initial Status Check (omitted for brevity)
  useEffect(() => {
    const checkUserRegistration = async () => {
      if (!user || !event._id) {
          setRegistrationStatus(null); 
          return;
      }
      
      try {
        const res = await api.get("/registrations/me");
        const currentReg = res.data.find(reg => reg.event._id === event._id);
        
        if (currentReg) {
          setRegistrationStatus(currentReg.status);
        } else {
          setRegistrationStatus(null); 
        }
        
      } catch (error) {
        if (error.response?.status !== 403 && error.response?.status !== 401) {
            console.error("Failed to check user registration status:", error.message);
        }
      }
    };
    
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
  
  // Share Handler Function (omitted for brevity)
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
    // ... (omitted status rendering logic) ...
    const status = registrationStatus;
    
    if (status === "registered" || status === "waitlisted") {
        const isRegistered = status === "registered";
        // const isWaiting = status === "waitlisted";
        
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
                
                {registrationStatus === "waitlisted" && localWaitlistCount > 0 && (
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
        
        {/* 🟢 UI FIX: Redesigned Date/Time/Price Section */}
        <div className="space-y-1 mt-2 text-sm text-gray-700">
            {/* Date and Time Block */}
            <div className="flex items-center gap-2">
                <Calendar size={14} className="text-blue-500" />
                <span className="font-semibold text-gray-800">{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
                <Clock size={14} className="text-blue-500" />
                <span className="text-gray-600">{formattedTime}</span>
            </div>
            
            {/* 🛑 NEW: Venue Link Integration */}
            <p className="text-gray-500 text-sm pt-1 flex items-center gap-1">
                <MapPin size={14} className="text-gray-500 flex-shrink-0" />
                {/* Encode the venue string for use in a Google Maps query */}
                <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-blue-600 hover:text-blue-700 transition cursor-pointer"
                >
                    {event.venue}
                </a>
            </p>

            {/* Category */}
            <p className="text-sm">
                Category: <span className="font-medium">{event.category}</span>
            </p>

            {/* Price Block */}
            <div className="flex items-center gap-2 pt-1">
                {/* <DollarSign size={14} className={event.price > 0 ? "text-green-600" : "text-gray-500"} /> */}
                <p className="font-semibold">
                    {event.price > 0 ? `Price: ₹${event.price}` : 'Free'}
                </p>
            </div>
            
            {/* Seats Left */}
            <p className="text-sm pt-2">
                Seats left: <span className="font-semibold">{event.seatsAvailable}</span>
            </p>
        </div>

        
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