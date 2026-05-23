import { useRef, useState } from 'react';
import { Button } from './Button';
import { ConfirmDialog } from './ConfirmDialog';

interface Props {
  lastSaved: string | null;
  onLoadDemo: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onReset: () => void;
}

export function DataControls({
  lastSaved,
  onLoadDemo,
  onExport,
  onImport,
  onReset,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    onImport(file);
    e.target.value = '';
    setMenuOpen(false);
  }

  return (
    <>
      <div className="relative">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-haspopup="true"
        >
          Data
          <span className="text-slate-400 ml-0.5">▾</span>
        </Button>

        {menuOpen && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 cursor-default"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
              {lastSaved && (
                <p className="px-4 py-2 text-xs text-slate-500 border-b border-slate-100">
                  Last saved: <span className="font-medium text-slate-600">{lastSaved}</span>
                </p>
              )}
              <MenuItem onClick={() => { onExport(); setMenuOpen(false); }}>
                Export backup (JSON)
              </MenuItem>
              <MenuItem onClick={() => fileRef.current?.click()}>
                Import backup (JSON)
              </MenuItem>
              <MenuItem onClick={() => { onLoadDemo(); setMenuOpen(false); }}>
                Load demo data
              </MenuItem>
              <div className="border-t border-slate-100 mt-1 pt-1">
                <MenuItem
                  danger
                  onClick={() => {
                    setMenuOpen(false);
                    setResetOpen(true);
                  }}
                >
                  Reset all data…
                </MenuItem>
              </div>
            </div>
          </>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleFileChange}
      />

      {importError && (
        <p className="text-xs text-red-600 absolute top-full right-0 mt-1">{importError}</p>
      )}

      <ConfirmDialog
        open={resetOpen}
        title="Reset all data?"
        description="This permanently deletes your income, expenses, debts, and savings goals from this browser. Export a backup first if you want to keep your data."
        confirmLabel="Yes, delete everything"
        cancelLabel="Keep my data"
        variant="danger"
        onCancel={() => setResetOpen(false)}
        onConfirm={() => {
          setResetOpen(false);
          onReset();
        }}
      />
    </>
  );
}

function MenuItem({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
        danger
          ? 'text-red-600 hover:bg-red-50'
          : 'text-slate-700 hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  );
}
