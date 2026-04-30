import { Link } from "react-router-dom";
import clsx from "clsx";

export default function StatCard({ title, value, icon: Icon, link, accent = "brand", loading = false }) {
  if (loading) {
    return <div className="bg-surface-50 dark:bg-surface-900 border border-border rounded-2xl p-6 h-32 animate-pulse" />;
  }

  const accentMap = {
    brand: "text-brand-500",
    emerald: "text-emerald-500",
    amber: "text-amber-500",
    violet: "text-violet-500",
    rose: "text-rose-500",
  };

  const Wrapper = link ? Link : "div";
  const wrapperProps = link ? { to: link } : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={clsx(
        "block bg-surface-50 dark:bg-surface-900 border border-border rounded-2xl p-6 group transition-all",
        link && "hover:shadow-surface hover:-translate-y-0.5 hover:border-brand-500/30 dark:hover:border-brand-400/30"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-surface-500 group-hover:text-surface-900 dark:group-hover:text-surface-50 transition-colors">
          {title}
        </span>
        {Icon && <Icon className={clsx("w-4 h-4 text-surface-400 transition-colors", link && `group-hover:${accentMap[accent]}`)} />}
      </div>
      <p className="text-3xl font-semibold text-surface-950 dark:text-surface-50">{value}</p>
    </Wrapper>
  );
}
