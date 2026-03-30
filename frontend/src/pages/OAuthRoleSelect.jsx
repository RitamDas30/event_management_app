import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";
import { GraduationCap, Megaphone } from "lucide-react";

export default function OAuthRoleSelect() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);

  // Get the pending OAuth data from location state
  const oauthData = location.state?.oauthData;

  if (!oauthData) {
    navigate("/login");
    return null;
  }

  const handleSubmit = async () => {
    if (!selected) return toast.error("Please select a role");

    setLoading(true);
    try {
      const res = await api.post("/auth/oauth/complete", {
        ...oauthData,
        role: selected,
      });
      login(res.data.user, res.data.token);
      toast.success("Account created!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    {
      id: "student",
      name: "Student / Attendee",
      description: "Browse and register for events, leave reviews, and manage your tickets.",
      icon: GraduationCap,
      color: "blue",
    },
    {
      id: "organizer",
      name: "Event Organizer",
      description: "Create and manage events, track analytics, and build your audience.",
      icon: Megaphone,
      color: "purple",
      note: "Requires admin approval before you can create events",
    },
  ];

  return (
    <div className="flex justify-center items-center min-h-[80vh] px-4">
      <div className="bg-white p-8 shadow-lg rounded-2xl w-full max-w-lg border border-gray-100">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl font-bold text-blue-600">
              {oauthData.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Welcome, {oauthData.name}!</h2>
          <p className="text-sm text-gray-500 mt-1">
            Choose how you'd like to use Evently
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {roles.map((role) => {
            const Icon = role.icon;
            const isSelected = selected === role.id;
            return (
              <button
                key={role.id}
                onClick={() => setSelected(role.id)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? `border-${role.color}-500 bg-${role.color}-50`
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isSelected
                        ? `bg-${role.color}-100 text-${role.color}-600`
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className={`font-semibold ${isSelected ? "text-gray-900" : "text-gray-700"}`}>
                      {role.name}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">{role.description}</p>
                    {role.note && (
                      <p className="text-xs text-amber-600 mt-1 font-medium">{role.note}</p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!selected || loading}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {loading ? "Creating account..." : "Continue"}
        </button>
      </div>
    </div>
  );
}
