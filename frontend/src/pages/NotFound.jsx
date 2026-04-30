// src/pages/NotFound.jsx
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="h-screen flex flex-col items-center justify-center text-center">
      <h1 className="text-5xl font-bold text-surface-700 dark:text-surface-300 mb-3">404</h1>
      <p className="text-lg text-surface-500 mb-6">Page not found</p>
      <Link
        to="/"
        className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition"
      >
        Go Home
      </Link>
    </div>
  );
}
