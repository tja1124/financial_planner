interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-8 sm:mb-10">
      <div className="max-w-2xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-secondary text-sm sm:text-[15px] mt-2 leading-relaxed">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
