import clsx from "clsx";

const variants = {
  primary:
    "bg-surface-950 text-surface-50 dark:bg-surface-50 dark:text-surface-950 hover:scale-[1.02] active:scale-[0.98] shadow-sm",
  brand:
    "bg-brand-600 text-white hover:bg-brand-500 active:scale-[0.98] shadow-glow",
  secondary:
    "bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-surface-100 hover:bg-surface-200 dark:hover:bg-surface-700 border border-border",
  ghost:
    "text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800",
  danger:
    "bg-rose-600 text-white hover:bg-rose-500 active:scale-[0.98]",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export default function Button({
  as: Tag = "button",
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}) {
  return (
    <Tag
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
