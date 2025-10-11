import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast"; 

export default function CreateEvent() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Technical", 
    venue: "",
    startTime: "",
    endTime: "",
    capacity: 50, 
    price: 0,    
    imageFile: null, 
  });

  const [loading, setLoading] = useState(false); 

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === "imageFile" && files.length > 0) {
      setForm({ ...form, imageFile: files[0] });
    } else {
      const finalValue = (name === 'capacity' || name === 'price') ? (value === '' ? '' : Number(value)) : value;
      setForm({ ...form, [name]: finalValue });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      
      if (form.imageFile) {
        formData.append("image", form.imageFile);
      }
      
      Object.entries(form).forEach(([key, value]) => {
          if (key !== 'imageFile' && value !== null) { 
              formData.append(key, value);
          }
      });
      
      await api.post("/events", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Event created successfully! 🎉");
      navigate("/dashboard");
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Event creation failed. Please check inputs.";
      console.error(err);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center py-10">
      <form
        onSubmit={handleSubmit}
        // 🟢 UI IMPROVEMENT 1: Increased max-width to lg, added subtle box shadow
        className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-lg"
      >
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
          Create New Event
        </h2>

        {/* --- Text and Description Fields --- */}
        <div className="space-y-4">
          
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
            <input
              type="text"
              name="title"
              id="title"
              placeholder="e.g., Annual Tech Fest 2026"
              value={form.title}
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
              placeholder="Describe the event details, activities, and purpose..."
              value={form.description}
              onChange={handleChange}
              required
              rows="4"
              className="border w-full p-3 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* --- Category and Venue --- */}
        <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                name="category"
                id="category"
                value={form.category}
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
                <label htmlFor="venue" className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
                <input
                type="text"
                name="venue"
                id="venue"
                placeholder="e.g., Main Hall, Zoom Link"
                value={form.venue}
                onChange={handleChange}
                required
                className="border w-full p-3 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
            </div>
        </div>
        
        {/* --- 🟢 UI IMPROVEMENT 2: Date and Time Grouping --- */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time</label>
            <input
              type="datetime-local"
              name="startTime"
              id="startTime"
              value={form.startTime}
              onChange={handleChange}
              required
              className="border p-3 rounded-lg w-full focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">End Date & Time</label>
            <input
              type="datetime-local"
              name="endTime"
              id="endTime"
              value={form.endTime}
              onChange={handleChange}
              required
              className="border p-3 rounded-lg w-full focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* --- Capacity and Price --- */}
        <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
                <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                <input
                    type="number"
                    name="capacity"
                    id="capacity"
                    placeholder="Min 1"
                    value={form.capacity}
                    onChange={handleChange}
                    required
                    min="1"
                    className="border w-full p-3 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
            </div>
            
            <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Ticket Price (₹)</label>
                <input
                    type="number"
                    name="price"
                    id="price"
                    placeholder="0 for free"
                    value={form.price}
                    onChange={handleChange}
                    min="0"
                    className="border w-full p-3 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
            </div>
        </div>
        
        {/* --- Image Upload --- */}
        <div className="mt-4">
            <label htmlFor="imageFile" className="block text-sm font-medium text-gray-700 mb-1">
                Event Image (JPG, PNG, WEBP)
            </label>
            <input
                type="file"
                name="imageFile"
                id="imageFile"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleChange}
                // 🟢 Added padding and styled for a cleaner file input look
                className="w-full border p-3 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 rounded-lg bg-gray-50"
            />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg mt-6 font-semibold hover:bg-blue-700 transition duration-200 disabled:bg-gray-400"
        >
          {loading ? "Creating Event..." : "Create Event"}
        </button>
      </form>
    </div>
  );
}