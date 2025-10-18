import React, { useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Trash2, AlertTriangle } from 'lucide-react'; // Icons for visual emphasis

// Predefined reasons for event cancellation/deletion
const REASONS = [
    "Venue or Date Change (Unavoidable)",
    "Insufficient Registrations/Low Interest",
    "Speaker/Performer Cancellation",
    "Technical or Resource Issues",
    "Other"
];

export default function EventDeleteModal({ event, onClose, onDeleteSuccess }) {
    const [selectedReason, setSelectedReason] = useState(REASONS[0]);
    const [otherDetails, setOtherDetails] = useState('');
    const [loading, setLoading] = useState(false);

    if (!event) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // 1. Finalize the reason to send to the backend
        const finalReason = selectedReason === "Other" ? otherDetails : selectedReason;
        
        if (!finalReason) {
            toast.error("Please select or specify a reason.");
            setLoading(false);
            return;
        }

        try {
            // 2. Prepare payload (backend expects reason/otherDetails in the body)
            const payload = {
                reason: selectedReason,
                otherDetails: selectedReason === "Other" ? otherDetails : '',
            };

            // 3. API call to the protected DELETE endpoint
            // NOTE: We send the reason in the request body, which is essential for the backend notification logic.
            const res = await api.delete(`/events/${event._id}`, { data: payload });

            toast.success(res.data.message || `Successfully deleted ${event.title}. All attendees have been notified.`);
            
            // 4. Call the success handler to update the parent component's list
            onDeleteSuccess(); 

        } catch (err) {
            const errorMessage = err.response?.data?.message || "Event deletion failed.";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
            onClose(); // Close modal
        }
    };

    return (
        // Modal Backdrop
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex items-center justify-center p-4">
            
            {/* Modal Content */}
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 transform transition-all">
                <div className="flex justify-between items-start mb-4 border-b pb-3">
                    <div className="flex items-center gap-2">
                        <AlertTriangle size={24} className="text-red-600" />
                        <h2 className="text-xl font-bold text-gray-800">Confirm Deletion</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
                </div>

                <p className="text-red-700 font-medium mb-4">
                    Deleting **{event.title}** is permanent and will notify all registered attendees.
                </p>

                <form onSubmit={handleSubmit}>
                    {/* Reason Selection (Radio Buttons) */}
                    <div className="space-y-3 mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                        <h3 className="text-sm font-semibold text-red-800">Reason for Cancellation (Required for Audit):</h3>
                        {REASONS.map((reason) => (
                            <label key={reason} className="flex items-center space-x-2 text-sm text-gray-800">
                                <input
                                    type="radio"
                                    name="reason"
                                    value={reason}
                                    checked={selectedReason === reason}
                                    onChange={(e) => {
                                        setSelectedReason(e.target.value);
                                        if (e.target.value !== "Other") setOtherDetails('');
                                    }}
                                    className="text-red-600 focus:ring-red-500"
                                    required
                                />
                                <span>{reason}</span>
                            </label>
                        ))}
                    </div>

                    {/* Other Details Textbox */}
                    {selectedReason === "Other" && (
                        <textarea
                            value={otherDetails}
                            onChange={(e) => setOtherDetails(e.target.value)}
                            placeholder="Please provide details for the cancellation..."
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
                            No, Keep Event
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-gray-400 flex items-center gap-2"
                            disabled={loading || (selectedReason === "Other" && !otherDetails)}
                        >
                            {loading ? "Deleting..." : <><Trash2 size={16} /> Delete Permanently</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
