import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Clock, MapPin, Calendar, Users, DollarSign, Share2 } from 'lucide-react'; 

export default function EventDetails() {
    const { id } = useParams();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEventDetails = async () => {
            try {
                // Fetch event details using the public endpoint. 
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


    if (loading) return <div className="text-center mt-12">Loading event details...</div>;
    if (error) return <div className="text-center mt-12 text-red-600 font-semibold">{error}</div>;
    if (!event) return <div className="text-center mt-12">Event not found.</div>;

    // Format times and dates
    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);
    const totalDurationHours = Math.ceil((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60));


    return (
        // 🟢 UI IMPROVEMENT 1: Changed max-w-4xl to max-w-3xl for better focus
        <div className="max-w-3xl mx-auto p-4 mt-6">
            <div className="bg-white shadow-2xl rounded-xl overflow-hidden border border-gray-100">
                
                {/* Header Image and Share Button */}
                <div className="relative h-72">
                    <img 
                        src={event.imageUrl || "https://via.placeholder.com/800x400/818CF8/FFFFFF?text=Event+Image"} 
                        alt={event.title} 
                        className="w-full h-full object-cover" 
                    />
                    <button 
                        onClick={handleShare}
                        className="absolute top-4 right-4 p-3 bg-black bg-opacity-60 rounded-full text-white hover:bg-opacity-80 transition shadow-lg"
                        title="Share Event Link"
                    >
                         <Share2 size={24} />
                    </button>
                </div>
                
                {/* Content */}
                <div className="p-6 space-y-8">
                    
                    {/* Title and Category */}
                    <div className="border-b pb-4">
                        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-1">{event.title}</h1>
                        <p className="text-base text-blue-600 font-medium">{event.category}</p>
                    </div>

                    {/* 🟢 UI IMPROVEMENT 2: Meta Section - Stacked Layout */}
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
                                <span>{event.venue}</span>
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
                        <h2 className="text-xl font-bold text-gray-800 mb-3 border-b pb-1">About</h2>
                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{event.description}</p>
                    </div>
                    
                    {/* 🟢 CTA (Call To Action) - Always stick to the bottom */}
                    <div className="pt-4 border-t bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                        <p className="text-lg font-bold text-gray-800">
                            Status: <span className={event.seatsAvailable > 0 ? "text-green-600" : "text-orange-500"}>
                                {event.seatsAvailable > 0 ? "Available" : "Waitlist Active"}
                            </span>
                        </p>
                        
                        <Link 
                            to="/" 
                            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition shadow-lg"
                        >
                            Register Now
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
}