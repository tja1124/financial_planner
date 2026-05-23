interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-16 sm:py-20 px-4">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 text-3xl mb-4">
        {icon}
      </div>
      <p className="font-semibold text-lg text-slate-700">{title}</p>
      <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
