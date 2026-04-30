import clsx from "clsx";

export function Card({ as: Tag = "div", className, children, hover = false, ...props }) {
  return (
    <Tag
      className={clsx(
        "bg-surface-50 dark:bg-surface-900 border border-border rounded-2xl",
        hover && "transition-all hover:shadow-surface hover:-translate-y-0.5 hover:border-brand-500/30 dark:hover:border-brand-400/30",
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div className={clsx("flex items-center justify-between border-b border-border pb-4 mb-6", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }) {
  return (
    <h2 className={clsx("text-lg font-medium text-surface-950 dark:text-surface-50", className)} {...props}>
      {children}
    </h2>
  );
}
