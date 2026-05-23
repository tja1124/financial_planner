import { useState } from 'react';
import { Button } from './Button';

interface Props {
  onLoadDemo: () => void;
  onReset: () => void;
}

export function DataControls({ onLoadDemo, onReset }: Props) {
  const [confirmReset, setConfirmReset] = useState(false);

  function handleReset() {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    onReset();
    setConfirmReset(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="secondary" size="sm" onClick={onLoadDemo}>
        <span className="hidden sm:inline">Load demo data</span>
        <span className="sm:hidden">Demo</span>
      </Button>
      <Button
        variant={confirmReset ? 'danger' : 'ghost'}
        size="sm"
        onClick={handleReset}
        onBlur={() => setTimeout(() => setConfirmReset(false), 150)}
      >
        {confirmReset ? (
          'Confirm?'
        ) : (
          <>
            <span className="hidden sm:inline">Reset all data</span>
            <span className="sm:hidden">Reset</span>
          </>
        )}
      </Button>
    </div>
  );
}
