import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student", // Default role
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/register", formData);
      toast.success(res.data.message || "Registration successful!");
      
      // Log in immediately upon successful registration
      login(res.data.user, res.data.token);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 shadow-lg rounded-xl w-96"
      >
        <h2 className="text-2xl font-semibold mb-4 text-center">Register</h2>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          required
          className="border w-full p-2 mb-3 rounded"
        />

        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={handleChange}
          required
          className="border w-full p-2 mb-3 rounded"
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
          className="border w-full p-2 mb-3 rounded"
        />

        {/* 🛑 FIX: Role Selection with Admin Option */}
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="border w-full p-2 mb-3 rounded"
        >
          <option value="student">Student</option>
          <option value="organizer">Organizer</option>
          <option value="admin">Admin (SETUP ONLY)</option>
        </select>
        {/* 🛑 IMPORTANT: REMOVE the "Admin" option after creating your first Admin account! */}
        
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white w-full py-2 rounded mt-2 hover:bg-blue-700"
        >
          {loading ? "Registering..." : "Register"}
        </button>

        <p className="text-sm text-center mt-3">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600">Login</Link>
        </p>
      </form>
    </div>
  );
}
