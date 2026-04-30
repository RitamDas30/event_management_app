import { Construction } from "lucide-react";
import { Link } from "react-router-dom";

export default function ComingSoon({ title = "Coming Soon", description = "This feature is under development." }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center mb-6">
        <Construction className="w-8 h-8 text-brand-600 dark:text-brand-400" />
      </div>
      <h1 className="text-2xl font-bold text-surface-950 dark:text-surface-50 mb-2">{title}</h1>
      <p className="text-surface-500 text-center max-w-md">{description}</p>
      <Link
        to="/explore"
        className="mt-6 text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:text-brand-300"
      >
        Browse Events Instead
      </Link>
    </div>
  );
}
