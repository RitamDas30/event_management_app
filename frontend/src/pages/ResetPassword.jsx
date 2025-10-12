import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Extract token and email from URL query string
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [valid, setValid] = useState(false);
  
  useEffect(() => {
    // Check if token and email are present in the URL
    if (token && email) {
      setValid(true);
    } else {
      toast.error("Invalid or missing reset link parameters.");
      navigate('/login', { replace: true });
    }
  }, [token, email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      // 🛑 Hitting the new backend endpoint, passing token/email as query params
      const res = await api.patch(`/api/auth/resetPassword?token=${token}&email=${email}`, { 
        password 
      });

      toast.success(res.data.message || "Your password has been updated!");
      navigate('/login', { replace: true });
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Password reset failed. Link may have expired.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!valid) return null; // Wait until parameters are validated or redirection occurs

  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md border border-gray-100">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
          Set New Password
        </h2>
        <p className="text-gray-600 mb-6 text-center">
          Account: <span className="font-semibold text-blue-600">{email}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              required
              minLength="6"
              className="border w-full p-3 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              className="border w-full p-3 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white py-3 rounded-lg mt-4 font-semibold hover:bg-red-700 transition disabled:bg-gray-400"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
