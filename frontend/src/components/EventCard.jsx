import React, { useState, useEffect } from "react"; 
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast"; 
import { CheckCircle, Clock, Share2, Calendar, MapPin } from 'lucide-react'; 

// ✅ Helper function to generate a professional placeholder image
const generatePlaceholderUrl = (category, width = 400, height = 200) => {
    let color = '2563EB'; // Default: Blue
    let textColor = 'FFFFFF';
    
    // Using placehold.co (reliable external placeholder service)
    switch (category) {
        case 'Technical':
            color = '10B981'; // Teal/Green
            break;
        case 'Cultural':
            color = 'F59E0B'; // Amber
            break;
        case 'Sports':
            color = 'EF4444'; // Red
            break;
        case 'Academic':
            color = '6366F1'; // Indigo
            break;
        case 'Social':
            color = 'EC4899'; // Pink
            break;
        case 'Workshop':
            color = '8B5CF6'; // Purple
            break;
        case 'Seminar':
            color = '06B6D4'; // Cyan
            break;
        case 'Conference':
            color = '14B8A6'; // Teal
            break;
        default:
            color = '4B5563'; // Gray
    }
    
    const text = encodeURIComponent(category.toUpperCase());
    
    // Construct the URL (placehold.co format)
    return `https://placehold.co/${width}x${height}/${color}/${textColor}?text=${text}`;
};

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

  // ✅ Get appropriate placeholder image
  const eventImage = event.imageUrl || generatePlaceholderUrl(event.category);

  // Initial Status Check
  useEffect(() => {
    const checkUserRegistration = async () => {
      if (!user || !event._id) {
          setRegistrationStatus(null); 
          return;
      }
      
      try {
        const res = await api.get("/registrations/me");
        const currentReg = res.data.find(reg => reg.event && reg.event._id === event._id);
        
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
  
  // Share Handler Function
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/events/${event._id}`; 
    const shareTitle = `Join me at ${event.title}!`;
    const shareText = `Check out this awesome event: ${event.title} happening at ${event.venueName || 'TBD'}.`;

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
      
      <div>
        
        {/* Share Button with Image */}
        <div className="relative">
            <img
                src={eventImage}
                alt={event.title}
                className="rounded-md w-full h-40 object-cover mb-3"
                onError={(e) => {
                    // Fallback if placehold.co also fails
                    e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200'%3E%3Crect fill='%234B5563' width='400' height='200'/%3E%3Ctext fill='%23FFF' font-size='24' font-family='Arial' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3E${event.category || 'EVENT'}%3C/text%3E%3C/svg%3E`;
                }}
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
        
        {/* Date/Time/Venue Section */}
        <div className="space-y-1 mt-2 text-sm text-gray-700">
            {/* Date */}
            <div className="flex items-center gap-2">
                <Calendar size={14} className="text-blue-500" />
                <span className="font-semibold text-gray-800">{formattedDate}</span>
            </div>
            
            {/* Time */}
            <div className="flex items-center gap-2">
                <Clock size={14} className="text-blue-500" />
                <span className="text-gray-600">{formattedTime}</span>
            </div>
            
            {/* Venue with Google Maps Link */}
            <div className="flex items-center gap-1 pt-1">
                <MapPin size={14} className="text-gray-500 flex-shrink-0" />
                <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.fullAddress || event.venueName)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-blue-600 hover:text-blue-700 transition cursor-pointer text-sm"
                    title="View on Google Maps"
                >
                    {event.venueName || event.fullAddress || 'Venue TBD'}
                </a>
            </div>

            {/* Category */}
            <p className="text-sm pt-1">
                Category: <span className="font-medium">{event.category}</span>
            </p>

            {/* Price */}
            <p className="font-semibold pt-1">
                {event.price > 0 ? `Price: ₹${event.price}` : 'Free'}
            </p>
            
            {/* Seats Left */}
            <p className="text-sm pt-2">
                Seats left: <span className="font-semibold">{event.seatsAvailable}</span>
            </p>
        </div>
      </div>

      {user && user.role === "student" && (
        renderStatusBlock() || ( 
            <button
              disabled={loading} 
              onClick={handleRegister}
              className={`mt-3 py-2 rounded transition text-white font-semibold 
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