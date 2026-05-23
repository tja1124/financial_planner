import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSettings } from '../context/SettingsContext';
import { useMotion } from '../hooks/useMotion';
import type { CurrencyCode } from '../types';
import { CURRENCY_OPTIONS } from '../utils/settings';
import { X } from 'lucide-react';
import { Button } from './Button';
import { AppIcon } from './icons';

interface Props {
  open: boolean;
  onClose: () => void;
  onResetOnboarding: () => void;
  onStartTutorial: () => void;
}

export function SettingsModal({ open, onClose, onResetOnboarding, onStartTutorial }: Props) {
  const { settings, updateSettings, resetSettings } = useSettings();
  const motionProps = useMotion();

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-title"
        >
          <motion.button
            type="button"
            className="absolute inset-0 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm cursor-pointer"
            aria-label="Close settings"
            onClick={onClose}
            {...motionProps.modalBackdrop}
          />
          <motion.div
            className="relative surface-overlay rounded-2xl w-full max-w-md max-h-[min(90vh,640px)] overflow-y-auto overscroll-contain"
            {...motionProps.modalPanel}
          >
            <div className="p-6 sm:p-7">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 id="settings-title" className="text-lg font-semibold text-primary">
                    Settings
                  </h2>
                  <p className="text-sm text-secondary mt-1">
                    Preferences are saved locally in your browser.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-muted hover:text-primary p-2 -m-2 cursor-pointer rounded-lg accent-ring"
                  aria-label="Close"
                >
                  <AppIcon icon={X} size="md" />
                </button>
              </div>

              <div className="space-y-6">
                <Field label="Currency">
                  <select
                    value={settings.currency}
                    onChange={(e) =>
                      updateSettings({ currency: e.target.value as CurrencyCode })
                    }
                    className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--surface-secondary)] px-3 py-2.5 text-sm text-primary"
                  >
                    {CURRENCY_OPTIONS.map((o) => (
                      <option key={o.code} value={o.code}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Week starts on">
                  <div className="flex gap-2">
                    <ToggleChip
                      active={settings.weekStartsOn === 0}
                      onClick={() => updateSettings({ weekStartsOn: 0 })}
                    >
                      Sunday
                    </ToggleChip>
                    <ToggleChip
                      active={settings.weekStartsOn === 1}
                      onClick={() => updateSettings({ weekStartsOn: 1 })}
                    >
                      Monday
                    </ToggleChip>
                  </div>
                </Field>

                <ToggleRow
                  label="Compact mode"
                  description="Tighter spacing across the app"
                  checked={settings.compactMode}
                  onChange={(v) => updateSettings({ compactMode: v })}
                />

                <ToggleRow
                  label="Reduce motion"
                  description="Minimize animations (overrides system preference)"
                  checked={settings.reducedMotion}
                  onChange={(v) => updateSettings({ reducedMotion: v })}
                />

                <ToggleRow
                  label="Timestamp in export filename"
                  description="Include date-time when downloading backups"
                  checked={settings.exportIncludeTimestamp}
                  onChange={(v) => updateSettings({ exportIncludeTimestamp: v })}
                />
              </div>

              <div className="mt-8 pt-6 border-t divider space-y-3">
                <Button variant="secondary" className="w-full" onClick={onStartTutorial}>
                  Replay app tutorial
                </Button>
                <Button variant="secondary" className="w-full" onClick={resetSettings}>
                  Reset settings to defaults
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    if (
                      window.confirm(
                        'Show onboarding again? Your financial data will stay intact.',
                      )
                    ) {
                      onResetOnboarding();
                      onClose();
                    }
                  }}
                >
                  Reset onboarding
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">{label}</p>
      {children}
    </div>
  );
}

function ToggleChip({
  children,
  active,
  onClick,
}: {
  children: ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-2.5 min-h-[44px] rounded-xl text-sm font-medium border transition-colors cursor-pointer ${
        active
          ? 'bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500'
          : 'surface-muted text-secondary border-[var(--border-subtle)]'
      }`}
    >
      {children}
    </button>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 cursor-pointer">
      <div>
        <p className="text-sm font-medium text-primary">{label}</p>
        <p className="text-xs text-muted mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
          checked ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-zinc-300 dark:bg-zinc-700'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : ''
          }`}
        />
      </button>
    </label>
  );
}
