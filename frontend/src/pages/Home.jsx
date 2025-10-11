import { useState, useEffect } from "react";
import api from "../api/axios";
import EventCard from "../components/EventCard";
import Loader from "../components/Loader";
// 🟢 NEW: Import the Socket.io client instance
import socket from "../utils/socket"; 

export default function Home() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  // 1. fetchEvents MUST be wrapped in useCallback to prevent infinite loop or performance issues
  //    when called from useEffect, but since you are just calling it on socket events, 
  //    we will make sure it has all its dependencies.

//  const fetchEvents = async () => {
//     // 🟢 SIMPLIFY: Always set loading true at the start of the fetch
//     setLoading(true); 
//     try {
//       // ... rest of your code ...
//       const res = await api.get("/events", { params });
//       setEvents(res.data);
//     } catch (err) {
//       // ...
//     } finally {
//       setLoading(false);
//     }
//   };


  const fetchEvents = async () => {
    setLoading(true); 
    try {
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;

      // The core fix to ensure we fetch all data from the public endpoint
      const res = await api.get("/events", { params }); 
      setEvents(res.data);
    } catch (err) {
      console.error(err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  }; 

  
  // 🟢 NEW: Socket.io Listeners useEffect
  useEffect(() => {
    // 2. Define the handler function that calls the logic
    const handleEventUpdate = (payload) => {
      // payload: { eventId, seatsAvailable, totalRegistered, etc. }
      // For simplicity and to ensure search/filter results are updated, we call fetchEvents.
      console.log("Socket: Event updated, refetching events:", payload);
      fetchEvents();
    };

    // 3. Set up listeners for all real-time events
    socket.on("eventUpdated", handleEventUpdate);
    socket.on("registrationCreated", handleEventUpdate);
    socket.on("promotion", handleEventUpdate);

    // 4. Cleanup function: runs when the component unmounts
    return () => {
      socket.off("eventUpdated", handleEventUpdate);
      socket.off("registrationCreated", handleEventUpdate);
      socket.off("promotion", handleEventUpdate);
    };
  
  // Dependencies: fetchEvents depends on search/category, so include them here.
  // When search/category changes, this effect runs again, re-subscribing socket listeners.
  }, [search, category]); 


  // 5. Existing Fetch Logic (runs on initial load and when search/category change)
  useEffect(() => {
    fetchEvents();
  }, [search, category]); // runs on initial mount and when search/category change

  return (
    <div className="mt-6">
      <h1 className="text-2xl font-bold text-center mb-6">Campus Events 🎓</h1>

      {/* Search + Filter */}
      <div className="flex flex-wrap justify-center gap-3 mb-6">
        <input
          type="text"
          placeholder="Search event..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-3 py-2 rounded w-64"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border px-3 py-2 rounded"
        >
          <option value="">All Categories</option>
          <option value="Technical">Technical</option>
          <option value="Cultural">Cultural</option>
          <option value="Sports">Sports</option>
          <option value="Academic">Academic</option>
          <option value="Social">Social</option>
        </select>

        <button
          onClick={() => { setSearch(""); setCategory(""); }}
          className="bg-gray-200 px-3 py-2 rounded hover:bg-gray-300"
        >
          Reset
        </button>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {events.length > 0 ? (
            // Pass fetchEvents down as refresh prop to EventCard
            events.map((event) => (
              <EventCard key={event._id} event={event} refresh={fetchEvents} />
            ))
          ) : (
            <p className="text-center col-span-full">No events found.</p>
          )}
        </div>
      )}
    </div>
  );
}