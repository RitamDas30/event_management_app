import { Construction } from "lucide-react";
import { Link } from "react-router-dom";

export default function ComingSoon({ title = "Coming Soon", description = "This feature is under development." }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
        <Construction className="w-8 h-8 text-blue-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
      <p className="text-gray-500 text-center max-w-md">{description}</p>
      <Link
        to="/explore"
        className="mt-6 text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        Browse Events Instead
      </Link>
    </div>
  );
}
