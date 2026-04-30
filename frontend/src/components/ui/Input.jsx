import clsx from "clsx";
import { forwardRef } from "react";

const Input = forwardRef(function Input(
  { className, label, error, hint, type = "text", ...props },
  ref
) {
  return (
    <label className="block">
      {label && (
        <span className="block text-xs font-medium uppercase tracking-wider text-surface-500 mb-2">
          {label}
        </span>
      )}
      <input
        ref={ref}
        type={type}
        className={clsx(
          "w-full bg-surface-50 dark:bg-surface-900 border border-border rounded-xl px-4 py-3 text-sm",
          "text-surface-950 dark:text-surface-50 placeholder-surface-400 dark:placeholder-surface-500",
          "focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/50 transition-all",
          error && "border-rose-500/60 focus:ring-rose-500/30",
          className
        )}
        {...props}
      />
      {error && <span className="block text-xs text-rose-500 mt-1.5">{error}</span>}
      {hint && !error && <span className="block text-xs text-surface-500 mt-1.5">{hint}</span>}
    </label>
  );
});

export default Input;

export const Textarea = forwardRef(function Textarea(
  { className, label, error, hint, rows = 4, ...props },
  ref
) {
  return (
    <label className="block">
      {label && (
        <span className="block text-xs font-medium uppercase tracking-wider text-surface-500 mb-2">
          {label}
        </span>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={clsx(
          "w-full bg-surface-50 dark:bg-surface-900 border border-border rounded-xl px-4 py-3 text-sm",
          "text-surface-950 dark:text-surface-50 placeholder-surface-400 dark:placeholder-surface-500",
          "focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/50 transition-all resize-y",
          error && "border-rose-500/60 focus:ring-rose-500/30",
          className
        )}
        {...props}
      />
      {error && <span className="block text-xs text-rose-500 mt-1.5">{error}</span>}
      {hint && !error && <span className="block text-xs text-surface-500 mt-1.5">{hint}</span>}
    </label>
  );
});
