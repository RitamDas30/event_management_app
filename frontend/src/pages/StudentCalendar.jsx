// src/pages/StudentCalendar.jsx (NEW FILE)
import { useEffect, useState } from "react";
import api from "../api/axios";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import Loader from "../components/Loader";

// NOTE: You'll need to install date-fns: npm install date-fns

export default function StudentCalendar() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchCalendarData = async () => {
    try {
      // Fetches all user registrations (which includes populated event data)
      const res = await api.get("/registrations/me");
      
      const events = res.data
        .filter(r => r.event) // Filter out null events
        .map(r => ({
          ...r.event,
          registrationStatus: r.status,
          date: new Date(r.event.startTime),
        }));
        
      setRegistrations(events);
    } catch (err) {
      console.error(err);
      // Removed toast for brevity, but should be included
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, []);

  const start = startOfMonth(currentDate);
  const end = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start, end });

  const getEventsForDay = (day) => {
    return registrations.filter(event => isSameDay(event.date, day));
  };
  
  // RENDER LOGIC
  if (loading) return <Loader />;

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4 text-center">My Event Calendar</h1>
      <p className="text-center text-gray-600 mb-6">{format(currentDate, 'MMMM yyyy')}</p>
      
      {/* Navigation (simplified) */}
      <div className="flex justify-between mb-4">
        <button onClick={() => setCurrentDate(prev => new Date(prev.setMonth(prev.getMonth() - 1)))} className="px-3 py-1 text-blue-600">&lt; Previous</button>
        <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-gray-600">Today</button>
        <button onClick={() => setCurrentDate(prev => new Date(prev.setMonth(prev.getMonth() + 1)))} className="px-3 py-1 text-blue-600">Next &gt;</button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px border border-gray-300 rounded-lg overflow-hidden bg-gray-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="bg-gray-100 p-2 text-sm font-semibold text-center">{day}</div>
        ))}
        
        {daysInMonth.map((day, index) => {
          const events = getEventsForDay(day);
          const isToday = isSameDay(day, new Date());
          
          return (
            <div 
              key={index} 
              // Adjust styling for days before the 1st of the month's start week
              className={`min-h-[100px] p-2 text-sm bg-white border-b border-gray-200 ${isToday ? 'ring-2 ring-blue-500 z-10' : ''}`}
            >
              <div className={`font-semibold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                {format(day, 'd')}
              </div>
              
              {/* Event Listings for the Day */}
              <div className="space-y-1 mt-1">
                {events.map(event => (
                  <div 
                    key={event._id} 
                    title={event.title}
                    className={`text-xs font-medium truncate px-2 py-1 rounded-md cursor-pointer 
                      ${event.registrationStatus === 'registered' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                  >
                    {format(event.date, 'h:mm a')} - {event.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}