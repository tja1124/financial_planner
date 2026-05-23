interface Props {
  name: string;
}

/** Shown inside the form card while editing an existing item. */
export function CrudEditingBadge({ name }: Props) {
  if (!name.trim()) return null;
  return (
    <div className="mb-3 px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20">
      <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300 leading-snug">
        Editing: <span className="font-semibold">{name}</span>
      </p>
    </div>
  );
}
