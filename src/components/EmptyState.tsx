interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-16 sm:py-20 px-4">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl surface-muted text-3xl mb-5">
        {icon}
      </div>
      <p className="font-semibold text-lg text-primary">{title}</p>
      <p className="text-sm text-secondary mt-2 max-w-sm mx-auto leading-relaxed">{description}</p>
      {action && <div className="mt-7">{action}</div>}
    </div>
  );
}
