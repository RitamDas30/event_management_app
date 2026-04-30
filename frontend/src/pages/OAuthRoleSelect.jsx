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
      <div className="bg-surface-50 dark:bg-surface-900 p-8 shadow-lg rounded-2xl w-full max-w-lg border border-border">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-brand-100 dark:bg-brand-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl font-bold text-brand-600 dark:text-brand-400">
              {oauthData.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <h2 className="text-xl font-bold text-surface-950 dark:text-surface-50">Welcome, {oauthData.name}!</h2>
          <p className="text-sm text-surface-500 mt-1">
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
                    : "border-border hover:border-border"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isSelected
                        ? `bg-${role.color}-100 text-${role.color}-600`
                        : "bg-surface-100 dark:bg-surface-800 text-surface-500"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className={`font-semibold ${isSelected ? "text-surface-950 dark:text-surface-50" : "text-surface-700 dark:text-surface-300"}`}>
                      {role.name}
                    </p>
                    <p className="text-sm text-surface-500 mt-0.5">{role.description}</p>
                    {role.note && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">{role.note}</p>
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
          className="w-full bg-brand-600 text-white py-3 rounded-xl font-semibold hover:bg-brand-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {loading ? "Creating account..." : "Continue"}
        </button>
      </div>
    </div>
  );
}
