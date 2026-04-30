import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { User, Mail, Lock, Eye, EyeOff, GraduationCap, Megaphone, ArrowRight } from "lucide-react";
import clsx from "clsx";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "472957583895-16p5htkevj4tucqqdti547u0r9urh8sb.apps.googleusercontent.com";
const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || "Ov23liy9mz3Ay2JhocB3";

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
  });
  const [showPassword, setShowPassword] = useState(false);
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
      login(res.data.user, res.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const redirectUri = `${window.location.origin}/auth/google/callback`;
    const scope = "openid email profile";
    const state = crypto.randomUUID();
    sessionStorage.setItem("oauth_state", state);
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&state=${state}&access_type=offline&prompt=consent`;
  };

  const handleGithubLogin = () => {
    const redirectUri = `${window.location.origin}/auth/github/callback`;
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email`;
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-6 lg:p-12">
      <div className="w-full max-w-5xl bg-surface-50 dark:bg-surface-950 rounded-[2.5rem] shadow-elevated border border-border overflow-hidden flex flex-col md:flex-row-reverse">
        
        {/* Right Side (visually): Art / Branding */}
        <div className="hidden md:flex md:w-1/2 bg-brand-900 p-12 flex-col justify-between relative overflow-hidden text-white">
          {/* Abstract background shapes */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-brand-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

          <div className="relative z-10 flex justify-end">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-8 border border-white/20">
              <span className="font-semibold text-2xl text-white leading-none mt-1">E</span>
            </div>
          </div>
          
          <div className="relative z-10">
            <h2 className="font-semibold text-4xl leading-tight mb-4">
              Join the <span className="italic text-brand-300">community</span>.
            </h2>
            <p className="text-brand-100/80">Experience events designed with clarity and intention. Create an account to get started.</p>
          </div>
        </div>

        {/* Left Side (visually): Form */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center bg-surface-50 dark:bg-surface-950">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-surface-950 dark:text-surface-50 tracking-tight">Create Account</h2>
            <p className="text-surface-500 mt-2 text-sm">Fill in your details below.</p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm p-4 rounded-xl mb-6 border border-red-100 dark:border-red-500/20">
              {error}
            </motion.div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: "student" })}
              className={clsx(
                "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all text-sm font-medium",
                formData.role === "student"
                  ? "border-brand-500 bg-brand-50/50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 shadow-sm"
                  : "border-border text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-900"
              )}
            >
              <GraduationCap className="w-5 h-5" />
              Attend
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: "organizer" })}
              className={clsx(
                "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all text-sm font-medium",
                formData.role === "organizer"
                  ? "border-brand-500 bg-brand-50/50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 shadow-sm"
                  : "border-border text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-900"
              )}
            >
              <Megaphone className="w-5 h-5" />
              Organize
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">Full Name</label>
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 group-focus-within:text-brand-500 transition-colors" />
                <input
                  type="text" name="name" value={formData.name} onChange={handleChange} required
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-border rounded-xl text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">Email address</label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 group-focus-within:text-brand-500 transition-colors" />
                <input
                  type="email" name="email" value={formData.email} onChange={handleChange} required
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-border rounded-xl text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">Password</label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 group-focus-within:text-brand-500 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} required minLength={6}
                  className="w-full pl-10 pr-10 py-2.5 bg-surface-50 dark:bg-surface-900 border border-border rounded-xl text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                  placeholder="Min. 6 characters"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full mt-4 bg-brand-600 text-white py-3 rounded-xl font-medium hover:bg-brand-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 group"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Sign up <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
            </button>
          </form>

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
            <span className="relative bg-surface-50 dark:bg-surface-950 px-4 text-xs font-medium tracking-widest uppercase text-surface-400">or</span>
          </div>

          <div className="flex gap-3">
            <button onClick={handleGoogleLogin} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-surface-100 dark:hover:bg-surface-900 transition-colors">
              Google
            </button>
            <button onClick={handleGithubLogin} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-900 text-surface-50 hover:bg-surface-800 dark:bg-surface-100 dark:text-surface-950 dark:hover:bg-surface-200 text-sm font-medium transition-colors">
              GitHub
            </button>
          </div>

          <p className="text-center mt-8 text-sm text-surface-500">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-surface-950 dark:text-surface-50 hover:underline underline-offset-4">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
