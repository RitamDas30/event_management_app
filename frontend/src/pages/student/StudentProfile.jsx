import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { UserCircle, Save, Plus, X } from "lucide-react";

const availableInterests = [
  "Technical", "Cultural", "Sports", "Academic", "Social",
  "Workshops", "Hackathons", "Music", "Art", "Networking",
];

export default function StudentProfile() {
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    bio: "",
    interests: [],
    socialLinks: { website: "", github: "", linkedin: "", twitter: "" },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/auth/me");
        const u = res.data;
        setForm({
          name: u.name || "",
          bio: u.bio || "",
          interests: u.interests || [],
          socialLinks: {
            website: u.socialLinks?.website || "",
            github: u.socialLinks?.github || "",
            linkedin: u.socialLinks?.linkedin || "",
            twitter: u.socialLinks?.twitter || "",
          },
        });
      } catch (err) {
        console.error(err);
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put("/users/profile", form);
      // Update auth context with new user data
      const token = localStorage.getItem("token");
      login(
        { ...user, name: res.data.user.name, bio: res.data.user.bio, interests: res.data.user.interests, socialLinks: res.data.user.socialLinks },
        token
      );
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (interest) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Profile</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Preview */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center text-3xl font-bold">
            {form.name?.charAt(0).toUpperCase() || "?"}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{form.name || "Your Name"}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={3}
            maxLength={500}
            placeholder="Tell us about yourself..."
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none resize-none"
          />
          <p className="text-xs text-gray-400 mt-1">{form.bio.length}/500</p>
        </div>

        {/* Interests */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Interests</label>
          <div className="flex flex-wrap gap-2">
            {availableInterests.map((interest) => (
              <button
                key={interest}
                type="button"
                onClick={() => toggleInterest(interest)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  form.interests.includes(interest)
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {form.interests.includes(interest) && <span className="mr-1">&#10003;</span>}
                {interest}
              </button>
            ))}
          </div>
        </div>

        {/* Social Links */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Social Links</label>
          <div className="space-y-3">
            {[
              { key: "website", label: "Website", placeholder: "https://yoursite.com" },
              { key: "github", label: "GitHub", placeholder: "https://github.com/username" },
              { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/username" },
              { key: "twitter", label: "Twitter/X", placeholder: "https://x.com/username" },
            ].map((field) => (
              <div key={field.key} className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-500 w-20">{field.label}</span>
                <input
                  type="url"
                  value={form.socialLinks[field.key]}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      socialLinks: { ...form.socialLinks, [field.key]: e.target.value },
                    })
                  }
                  placeholder={field.placeholder}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
