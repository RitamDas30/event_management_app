import clsx from "clsx";

export default function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={clsx(
        "text-center py-12 px-6 bg-surface-100/50 dark:bg-surface-950/50 rounded-2xl border border-dashed border-border",
        className
      )}
    >
      {Icon && <Icon className="w-8 h-8 text-surface-400 mx-auto mb-3" />}
      {title && <p className="text-surface-900 dark:text-surface-50 font-medium mb-1">{title}</p>}
      {description && <p className="text-sm text-surface-500 mb-4">{description}</p>}
      {action}
    </div>
  );
}
