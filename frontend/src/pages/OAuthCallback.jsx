import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function OAuthCallback({ provider }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, logout } = useAuth();
  const [error, setError] = useState("");
  const processedRef = useRef(false); // Prevent StrictMode double-invoke

  useEffect(() => {
    // Guard: only process once (React 19 StrictMode calls effects twice)
    if (processedRef.current) return;
    processedRef.current = true;

    const handleCallback = async () => {
      try {
        // Clear any existing session first — OAuth should always start fresh
        logout();

        const code = searchParams.get("code");
        if (!code) {
          setError(`No authorization code received from ${provider}`);
          return;
        }

        let res;
        if (provider === "google") {
          const redirectUri = `${window.location.origin}/auth/google/callback`;
          res = await api.post("/auth/google", { code, redirectUri });
        } else if (provider === "github") {
          res = await api.post("/auth/github", { code });
        }

        if (res.data.isNewUser) {
          navigate("/auth/select-role", {
            state: { oauthData: res.data.oauthData },
            replace: true,
          });
        } else {
          login(res.data.user, res.data.token);
          navigate("/dashboard", { replace: true });
        }
      } catch (err) {
        const msg = err.response?.data?.message || `${provider} authentication failed`;
        setError(msg);
      }
    };

    handleCallback();
  }, []); // Empty deps — run once on mount only

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
