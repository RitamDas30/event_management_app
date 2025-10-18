import React, { useState, useEffect } from "react"; 
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast"; 
import { CheckCircle, Clock, Share2, DollarSign, Calendar, MapPin } from 'lucide-react';

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

  // Initial Status Check
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
      
      const res = await api.post(`/api/registrations/${event._id}`);
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
  
  // Share Handler Function
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/events/${event._id}`; 
    const shareTitle = `Join me at ${event.title}!`;
    const shareText = `Check out this awesome event: ${event.title} happening at ${event.venueName}.`;

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


  // Venue Link Integration
  const renderMapLink = () => {
      const address = event.fullAddress || event.venueName; 
      const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

      return (
          <p className="text-gray-500 text-sm pt-1 flex items-center gap-1">
              <MapPin size={14} className="text-gray-500 flex-shrink-0" />
              <a 
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-blue-600 hover:text-blue-700 transition cursor-pointer"
                  title={`View ${event.venueName} on Google Maps`}
              >
                  {event.venueName || event.fullAddress} 
              </a>
          </p>
      );
  };


  const renderStatusBlock = () => {
    const status = registrationStatus;
    
    if (status === "registered" || status === "waitlisted") {
        const isRegistered = status === "registered";
        
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
                            : `You're on the waitlist (Position: ${localWaitlistCount || 'N/A'})`
                        }
                    </p>
                </div>
            </div>
        );
    }
    
    return null;
  };


  // Main render
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Event Image */}
      <div className="relative h-48 overflow-hidden">
        <img 
          src={event.image || '/placeholder-event.jpg'} 
          alt={event.title}
          className="w-full h-full object-cover"
        />
        {event.price === 0 && (
          <span className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
            FREE
          </span>
        )}
      </div>

      {/* Event Details */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-xl font-bold text-gray-800 line-clamp-2">
            {event.title}
          </h3>
          <button 
            onClick={handleShare}
            className="ml-2 p-2 hover:bg-gray-100 rounded-full transition"
            title="Share event"
          >
            <Share2 size={18} className={copied ? 'text-green-600' : 'text-gray-600'} />
          </button>
        </div>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {event.description}
        </p>

        {/* Category Badge */}
        <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium mb-3">
          {event.category}
        </span>

        {/* Date & Time */}
        <div className="space-y-2 mb-3">
          <p className="text-gray-700 text-sm flex items-center gap-2">
            <Calendar size={16} className="text-gray-500" />
            <span className="font-medium">{formattedDate}</span>
          </p>
          <p className="text-gray-500 text-xs ml-6">
            {formattedTime}
          </p>
        </div>

        {/* Venue with Map Link */}
        {renderMapLink()}

        {/* Price & Seats */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-1 text-gray-700">
            <DollarSign size={16} />
            <span className="font-semibold">
              {event.price === 0 ? 'Free' : `₹${event.price}`}
            </span>
          </div>
          <div className={`text-sm ${isWaitlistActive ? 'text-red-600' : 'text-gray-600'}`}>
            {isWaitlistActive 
              ? '🔴 Waitlist Active' 
              : `${event.seatsAvailable} seats left`
            }
          </div>
        </div>

        {/* Registration Status Block */}
        {renderStatusBlock()}

        {/* Action Button */}
        {!registrationStatus && (
          <button
            onClick={handleRegister}
            disabled={loading}
            className={`w-full mt-4 py-3 rounded-lg font-semibold transition ${
              loading 
                ? 'bg-gray-300 cursor-not-allowed' 
                : isWaitlistActive 
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading 
              ? 'Processing...' 
              : isWaitlistActive 
                ? 'Join Waitlist' 
                : 'Register Now'
            }
          </button>
        )}

        {/* View Details Link */}
        <Link 
          to={`/events/${event._id}`}
          className="block text-center mt-3 text-blue-600 hover:text-blue-700 font-medium text-sm"
        >
          View Full Details →
        </Link>
      </div>
    </div>
  );
}