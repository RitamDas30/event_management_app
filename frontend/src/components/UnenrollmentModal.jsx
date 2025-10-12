import React, { useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

// Quick reasons array for the radio buttons
const REASONS = [
    "Schedule Conflict (New)",
    "Registered by Mistake",
    "Change of Plans",
    "Event Details Changed",
];

export default function UnenrollmentModal({ event, onClose, onUnenrollSuccess }) {
    const [selectedReason, setSelectedReason] = useState(REASONS[0]);
    const [otherDetails, setOtherDetails] = useState('');
    const [loading, setLoading] = useState(false);

    if (!event) return null; // Safety check

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Prepare the payload to send to the backend
            const payload = {
                reason: selectedReason,
                otherDetails: selectedReason === "Other" ? otherDetails : '',
            };

            // API call to the backend DELETE endpoint
            const res = await api.delete(`/registrations/${event._id}`, { data: payload });

            toast.success(res.data.message || `Successfully unenrolled from ${event.title}.`);
            
            // Call the callback function to update the parent component's state
            onUnenrollSuccess(); 

        } catch (err) {
            const errorMessage = err.response?.data?.message || "Failed to cancel registration.";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
            onClose(); // Close modal regardless of success/failure
        }
    };

    return (
        // Modal Backdrop
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex items-center justify-center p-4">
            
            {/* Modal Content */}
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
                <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-bold text-red-600">Cancel Registration: {event.title}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                        &times;
                    </button>
                </div>

                <p className="text-gray-600 mb-4 border-b pb-3">
                    We are sad to see you go! Please tell us why you are unenrolling.
                </p>

                <form onSubmit={handleSubmit}>
                    {/* Reason Selection (Radio Buttons) */}
                    <div className="space-y-2 mb-4">
                        <h3 className="text-sm font-medium text-gray-700">Select a Reason:</h3>
                        {REASONS.map((reason) => (
                            <label key={reason} className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    name="reason"
                                    value={reason}
                                    checked={selectedReason === reason}
                                    onChange={() => {
                                        setSelectedReason(reason);
                                        if (reason !== "Other") setOtherDetails('');
                                    }}
                                    className="text-red-600 focus:ring-red-500"
                                    required
                                />
                                <span className="text-gray-800 text-sm">{reason}</span>
                            </label>
                        ))}
                        
                        {/* 'Other' Option */}
                         <label className="flex items-center space-x-2">
                            <input
                                type="radio"
                                name="reason"
                                value="Other"
                                checked={selectedReason === "Other"}
                                onChange={() => setSelectedReason("Other")}
                                className="text-red-600 focus:ring-red-500"
                                required
                            />
                            <span className="text-gray-800 text-sm">Other</span>
                        </label>
                    </div>

                    {/* Other Details Textbox */}
                    {selectedReason === "Other" && (
                        <textarea
                            value={otherDetails}
                            onChange={(e) => setOtherDetails(e.target.value)}
                            placeholder="Please explain why you are cancelling..."
                            rows="3"
                            className="w-full border p-2 rounded-lg focus:ring-red-500 focus:border-red-500 mb-4"
                            required
                        ></textarea>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition"
                            disabled={loading}
                        >
                            Keep Registration
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-gray-400"
                            disabled={loading || (selectedReason === "Other" && !otherDetails)}
                        >
                            {loading ? "Cancelling..." : "Confirm Cancellation"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
