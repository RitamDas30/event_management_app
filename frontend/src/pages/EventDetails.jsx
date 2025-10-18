import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Clock, MapPin, Calendar, Users, DollarSign, Share2 } from 'lucide-react';

// ✅ Helper function for colored placeholders
const generatePlaceholderUrl = (category, width = 800, height = 400) => {
    let color = '2563EB';
    
    switch (category) {
        case 'Technical': color = '10B981'; break;
        case 'Cultural': color = 'F59E0B'; break;
        case 'Sports': color = 'EF4444'; break;
        case 'Academic': color = '6366F1'; break;
        case 'Social': color = 'EC4899'; break;
        case 'Workshop': color = '8B5CF6'; break;
        case 'Seminar': color = '06B6D4'; break;
        case 'Conference': color = '14B8A6'; break;
        default: color = '4B5563';
    }
    
    const text = encodeURIComponent(category?.toUpperCase() || 'EVENT');
    return `https://placehold.co/${width}x${height}/${color}/FFFFFF?text=${text}`;
};

export default function EventDetails() {
    const { id } = useParams();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEventDetails = async () => {
            try {
                const res = await api.get(`/events/${id}`); 
                setEvent(res.data);
            } catch (err) {
                console.error("Failed to fetch event details:", err);
                setError("Could not load event details. It might have been deleted.");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchEventDetails();
        }
    }, [id]);

    const handleShare = async () => {
        const shareUrl = window.location.href;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Check out ${event.title}!`,
                    url: shareUrl,
                });
            } catch (error) {
                console.error('Error using Web Share API:', error);
            }
        } else {
            try {
                await navigator.clipboard.writeText(shareUrl);
                toast.success("Event link copied to clipboard!");
            } catch (error) {
                toast.error("Failed to copy link.");
                console.error('Error copying:', error);
            }
        }
    };

    // ✅ Loading/Error states
    if (loading) return <div className="text-center mt-12 text-lg">Loading event details...</div>;
    if (error) return <div className="text-center mt-12 text-red-600 font-semibold">{error}</div>;
    if (!event) return <div className="text-center mt-12">Event not found.</div>;

    // ✅ Safe to access event properties now
    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);
    const totalDurationHours = Math.ceil((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60));
    const isWaitlistActive = event.seatsAvailable <= 0;
    const eventImage = event.imageUrl || generatePlaceholderUrl(event.category, 800, 400);

    return (
        <div className="max-w-3xl mx-auto p-4 mt-6">
            <div className="bg-white shadow-2xl rounded-xl overflow-hidden border border-gray-100">
                
                {/* Header Image and Share Button */}
                <div className="relative h-72">
                    <img 
                        src={eventImage}
                        alt={event.title} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='400'%3E%3Crect fill='%234B5563' width='800' height='400'/%3E%3Ctext fill='%23FFF' font-size='36' font-family='Arial' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3E${event.category || 'EVENT'}%3C/text%3E%3C/svg%3E`;
                        }}
                    />
                    <button 
                        onClick={handleShare}
                        className="absolute top-4 right-4 p-3 bg-black bg-opacity-60 rounded-full text-white hover:bg-opacity-80 transition shadow-lg"
                        title="Share Event Link"
                    >
                         <Share2 size={24} />
                    </button>
                    
                    {/* Price Badge */}
                    {event.price === 0 && (
                        <span className="absolute top-4 left-4 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                            FREE EVENT
                        </span>
                    )}
                </div>
                
                {/* Content */}
                <div className="p-6 space-y-8">
                    
                    {/* Title and Category */}
                    <div className="border-b pb-4">
                        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-2">{event.title}</h1>
                        <span className="inline-block bg-blue-100 text-blue-700 px-4 py-1 rounded-full text-sm font-medium">
                            {event.category}
                        </span>
                    </div>

                    {/* Meta Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                        
                        {/* Time & Date */}
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-gray-700 mb-1">When & Where</h3>
                            <div className="flex items-center gap-3 text-gray-700">
                                <Calendar size={18} className="text-blue-500 flex-shrink-0" />
                                <span>{startTime.toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-700">
                                <Clock size={18} className="text-blue-500 flex-shrink-0" />
                                <span>{startTime.toLocaleTimeString()} – {endTime.toLocaleTimeString()} ({totalDurationHours} hrs)</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-700">
                                <MapPin size={18} className="text-blue-500 flex-shrink-0" />
                                <a 
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.fullAddress || event.venueName)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline text-blue-600 hover:text-blue-700 transition"
                                >
                                    {event.venueName || event.fullAddress || 'Venue TBD'}
                                </a>
                            </div>
                        </div>

                        {/* Capacity & Price */}
                        <div className="space-y-2 pt-4 md:pt-0 border-t md:border-t-0">
                            <h3 className="text-lg font-bold text-gray-700 mb-1">Details</h3>
                            <div className="flex items-center gap-3 text-gray-700">
                                <Users size={18} className="text-green-500 flex-shrink-0" />
                                <span>Seats: {event.seatsAvailable} / {event.capacity}</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-700">
                                <DollarSign size={18} className="text-green-500 flex-shrink-0" />
                                <span>Price: {event.price > 0 ? `₹${event.price}` : 'Free'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 mb-3 border-b pb-1">About This Event</h2>
                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{event.description}</p>
                    </div>
                    
                    {/* CTA Section */}
                    <div className="pt-4 border-t bg-gray-50 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div>
                            <p className="text-lg font-bold text-gray-800">
                                Status: <span className={isWaitlistActive ? "text-orange-500" : "text-green-600"}>
                                    {isWaitlistActive ? "Waitlist Active" : "Seats Available"}
                                </span>
                            </p>
                            {isWaitlistActive && (
                                <p className="text-sm text-gray-600 mt-1">
                                    Join the waitlist and we'll notify you if a spot opens up!
                                </p>
                            )}
                        </div>
                        
                        <Link 
                            to="/" 
                            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition shadow-lg whitespace-nowrap"
                        >
                            {isWaitlistActive ? 'Join Waitlist' : 'Register Now'}
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
}