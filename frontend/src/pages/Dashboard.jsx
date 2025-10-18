import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import Loader from "../components/Loader";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Users, Clock, Calendar, Edit, Trash2 } from 'lucide-react';
import EventDeleteModal from "../components/EventDeleteModal";

export default function Dashboard() {
  const { user } = useAuth();
  const [myEvents, setMyEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 🟢 NEW STATE: Tracks the event targeted for deletion
  const [deletionTarget, setDeletionTarget] = useState(null);

  const fetchMyEvents = async () => {
    try {
      setLoading(true);

      // Fetch all events and filter client-side
      const res = await api.get("/events");
      const mine = res.data.filter((e) => e.organizer._id === user.id);
      setMyEvents(mine);

    } catch (err) {
      console.error(err);
      toast.error("Failed to load events.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyEvents();
  }, [user]);

  // 🟢 NEW HANDLER: Called by the Modal when deletion is confirmed
  const handleDeleteSuccess = () => {
    setDeletionTarget(null); // Close modal
    fetchMyEvents(); // Refresh the event list
  };

  const roleTitle = user.role === "organizer" ? "My Organized Events" : "Admin Panel";
  const organizerCanCreate = user.role === "organizer" || user.role === "admin";
  
  if (loading) return <Loader />;

  return (
    <div className="mt-6">
      <h2 className="text-3xl font-extrabold text-center mb-8 text-gray-800">
        {roleTitle}
      </h2>

      {organizerCanCreate && (
        <div className="text-center mb-8">
          <Link
            to="/create-event"
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition shadow-lg"
          >
            + Create New Event
          </Link>
        </div>
      )}

      {myEvents.length > 0 ? (
        <div className="space-y-4">
          {myEvents.map((event) => (
            <div 
              key={event._id} 
              className="bg-white p-4 md:p-6 shadow-lg rounded-xl border border-gray-100 flex flex-col md:flex-row justify-between items-center transition hover:shadow-xl"
            >
              
              {/* 1. Event Details (Left Side) */}
              <div className="flex-1 min-w-0 mb-4 md:mb-0">
                <Link to={`/events/${event._id}`} className="text-xl font-bold text-gray-900 hover:text-blue-600 truncate block">
                    {event.title}
                </Link>
                
                {/* Meta Data Row */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                        <Calendar size={14} className="text-blue-500" />
                        <span>{new Date(event.startTime).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Clock size={14} className="text-blue-500" />
                        <span>{new Date(event.startTime).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Users size={14} className="text-green-500" />
                        <span>{event.capacity - event.seatsAvailable} booked / {event.capacity}</span>
                    </div>
                </div>
              </div>

              {/* 2. Management Buttons (Right Side) */}
              <div className="flex gap-3 justify-end items-center min-w-[200px]">
                
                {/* View Details Button */}
                {/* <Link 
                    to={`/events/${event._id}`} 
                    className="text-blue-600 text-sm font-medium hover:underline hidden md:block"
                >
                    View Details
                </Link> */}

                {/* Edit Button */}
                <Link
                  to={`/edit-event/${event._id}`}
                  className="p-2 bg-yellow-500 text-white rounded-lg shadow-md hover:bg-yellow-600 transition"
                  title="Edit Event"
                >
                  <Edit size={18} />
                </Link>
                
                {/* 🟢 MODIFIED: Delete Button opens modal */}
                <button
                  onClick={() => setDeletionTarget(event)}
                  className="p-2 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition"
                  title="Delete Event"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center mt-10 text-gray-500">
          No events found for your account. Start by creating a new one!
        </p>
      )}
      
      {/* 🟢 NEW: Render Delete Modal when deletionTarget is set */}
      {deletionTarget && (
          <EventDeleteModal 
              event={deletionTarget}
              onClose={() => setDeletionTarget(null)}
              onDeleteSuccess={handleDeleteSuccess}
          />
      )}
    </div>
  );
}