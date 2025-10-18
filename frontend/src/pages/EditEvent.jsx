import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function EditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Technical",
    fullAddress: "", 
    venueName: "",
    startTime: "",
    endTime: "",
    capacity: 50,
    price: 0,
    imageFile: null,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // 🟢 NEW: Store occupied seats for validation
  const [occupiedSeats, setOccupiedSeats] = useState(0);
  
  // 🟢 NEW: Inline capacity validation error
  const [capacityError, setCapacityError] = useState(null);

  // Fetch Existing Event Data on Component Mount
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        
        const res = await api.get(`/events/${id}`); 
        const event = res.data;

        // 🟢 Calculate occupied seats for validation
        const occupied = event.capacity - event.seatsAvailable;
        setOccupiedSeats(occupied);

        // Convert ISO date strings to format required by datetime-local input
        const formatDate = (isoString) => {
            if (!isoString) return '';
            return isoString.slice(0, 16); 
        };

        // Populate form state with fetched data
        setFormData({
            title: event.title,
            description: event.description,
            category: event.category,
            fullAddress: event.fullAddress || '', 
            venueName: event.venueName || '', 
            startTime: formatDate(event.startTime),
            endTime: formatDate(event.endTime),
            capacity: event.capacity,
            price: event.price,
            imageFile: null,
        });
      } catch (err) {
        const status = err.response?.status;
        console.error(`[EditEvent] Fetch Failed. Status: ${status}. Error:`, err.response?.data);
        
        if (status === 404) {
            setError("Event not found. It may have been deleted.");
        } else {
            setError(err.response?.data?.message || "Failed to load event for editing due to a server error.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
        fetchEvent();
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    // 🟢 Clear capacity error when user types
    if (name === 'capacity') {
        setCapacityError(null);
    }
    
    if (name === "imageFile" && files && files.length > 0) {
      setFormData({ ...formData, imageFile: files[0] });
    } else {
      const finalValue = (name === 'capacity' || name === 'price') ? (value === '' ? '' : Number(value)) : value;
      setFormData({ ...formData, [name]: finalValue });
    }
  };

  // 🟢 NEW: Validation wrapper that runs before submission
  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    const newCapacity = Number(formData.capacity);

    // Validate capacity is a valid number
    if (isNaN(newCapacity) || newCapacity < 1) {
        setCapacityError("Capacity must be at least 1.");
        return;
    }
    
    // 🛑 CRITICAL: Check if new capacity is less than occupied seats
    if (newCapacity < occupiedSeats) {
        setCapacityError(
          `New capacity (${newCapacity}) cannot be less than booked seats (${occupiedSeats}).`
        );
        return;
    }
    
    // If validation passes, proceed to actual submission
    handleSubmit();
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    // Determine if a new file was selected
    const isImageUpdated = formData.imageFile !== null;
    
    // Get clean text data for both scenarios
    const textData = { ...formData };
    delete textData.imageFile;

    try {
      let res;

      if (isImageUpdated) {
        // SCENARIO 1: IMAGE IS BEING UPDATED (Use FormData)
        const formToSend = new FormData();
        
        Object.entries(formData).forEach(([key, value]) => {
            if (key === 'imageFile' && value) {
                formToSend.append("image", value);
            } else if (key !== 'imageFile' && value !== null) {
                formToSend.append(key, value.toString());
            }
        });

        res = await api.put(`/events/${id}`, formToSend, {
          headers: { "Content-Type": "multipart/form-data" },
        });

      } else {
        // SCENARIO 2: NO IMAGE CHANGE (Use JSON)
        res = await api.put(`/events/${id}`, textData); 
      }
      
      toast.success("Event updated successfully!");
      navigate("/dashboard");
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Event update failed";
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center mt-12">Loading event data...</div>;
  if (error && id) return <div className="text-center mt-12 text-red-600 font-semibold">{error}</div>;

  return (
    <div className="flex justify-center items-center py-10">
      <form
        onSubmit={handleFormSubmit}
        className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-lg"
      >
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
          Edit Event: {formData.title || "Loading..."}
        </h2>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
            <input
              type="text"
              name="title"
              id="title"
              placeholder="Event Title"
              value={formData.title}
              onChange={handleChange}
              required
              className="border w-full p-3 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              id="description"
              placeholder="Event Description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="4"
              className="border w-full p-3 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                name="category"
                id="category"
                value={formData.category}
                onChange={handleChange}
                className="border w-full p-3 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500"
                >
                <option value="Technical">Technical</option>
                <option value="Cultural">Cultural</option>
                <option value="Sports">Sports</option>
                <option value="Academic">Academic</option>
                <option value="Social">Social</option>
                </select>
            </div>
            
            <div>
                <label htmlFor="venueName" className="block text-sm font-medium text-gray-700 mb-1">Local Venue Name (e.g., Hall 1)</label>
                <input
                type="text"
                name="venueName"
                id="venueName"
                placeholder="Specific Location Name"
                value={formData.venueName}
                onChange={handleChange}
                className="border w-full p-3 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
            </div>
        </div>

        <div className="mt-4">
            <label htmlFor="fullAddress" className="block text-sm font-medium text-gray-700 mb-1">Full Address (for Map Link)</label>
            <input
                type="text"
                name="fullAddress"
                id="fullAddress"
                placeholder="e.g., 123 Main St, Anytown, CA 90210"
                value={formData.fullAddress}
                onChange={handleChange}
                className="border w-full p-3 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time</label>
            <input
              type="datetime-local"
              name="startTime"
              id="startTime"
              value={formData.startTime}
              onChange={handleChange}
              className="border p-3 rounded-lg w-full focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">End Date & Time</label>
            <input
              type="datetime-local"
              name="endTime"
              id="endTime"
              value={formData.endTime}
              onChange={handleChange}
              className="border p-3 rounded-lg w-full focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
                <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
                  Capacity (Booked: {occupiedSeats})
                </label>
                <input
                    type="number"
                    name="capacity"
                    id="capacity"
                    placeholder="Min 1"
                    value={formData.capacity}
                    onChange={handleChange}
                    min="1"
                    className={`border w-full p-3 rounded-lg focus:ring-blue-500 focus:border-blue-500 ${
                      capacityError ? 'border-red-500' : ''
                    }`}
                />
                {capacityError && (
                    <p className="text-xs text-red-600 mt-1">⚠️ {capacityError}</p>
                )}
            </div>
            
            <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Ticket Price (₹)</label>
                <input
                    type="number"
                    name="price"
                    id="price"
                    placeholder="0 for free"
                    value={formData.price}
                    onChange={handleChange}
                    min="0"
                    className="border w-full p-3 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
            </div>
        </div>
        
        <div className="mt-4">
            <label htmlFor="imageFile" className="block text-sm font-medium text-gray-700 mb-1">
                Change Image (JPG, PNG, WEBP)
            </label>
            <input
                type="file"
                name="imageFile"
                id="imageFile"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleChange}
                className="w-full border p-3 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 rounded-lg bg-gray-50"
            />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-600 text-white py-3 rounded-lg mt-6 font-semibold hover:bg-orange-700 transition disabled:bg-gray-400"
        >
          {loading ? "Saving Changes..." : "Update Event"}
        </button>
      </form>
    </div>
  );
}