import { useEffect, useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function OAuthCallback({ provider }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        if (provider === "google") {
          // Google returns id_token in URL hash fragment
          const hash = location.hash.substring(1);
          const params = new URLSearchParams(hash);
          const idToken = params.get("id_token");

          if (!idToken) {
            setError("No token received from Google");
            return;
          }

          const res = await api.post("/auth/google", { credential: idToken });
          login(res.data.user, res.data.token);
          navigate("/dashboard");
        } else if (provider === "github") {
          const code = searchParams.get("code");

          if (!code) {
            setError("No code received from GitHub");
            return;
          }

          const res = await api.post("/auth/github", { code });
          login(res.data.user, res.data.token);
          navigate("/dashboard");
        }
      } catch (err) {
        setError(err.response?.data?.message || `${provider} authentication failed`);
      }
    };

    handleCallback();
  }, [provider, location, searchParams]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-red-50 text-red-700 p-6 rounded-xl max-w-md text-center">
          <h2 className="text-lg font-bold mb-2">Authentication Failed</h2>
          <p className="text-sm">{error}</p>
          <button
            onClick={() => navigate("/login")}
            className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-gray-600">Authenticating with {provider}...</p>
    </div>
  );
}
