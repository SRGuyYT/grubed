import { BookOpenIcon, SlidersIcon } from './icons';

const THEME_OPTIONS = [
  { value: 'crimson', label: 'Crimson', swatch: 'bg-[#e50914]' },
  { value: 'ice', label: 'Ice', swatch: 'bg-[#7dd3fc]' },
  { value: 'emerald', label: 'Emerald', swatch: 'bg-[#34d399]' },
];

const DENSITY_OPTIONS = [
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'compact', label: 'Compact' },
];

const MOTION_OPTIONS = [
  { value: 'full', label: 'Smooth Motion' },
  { value: 'reduced', label: 'Reduced Motion' },
];

const PROVIDER_FLOW_OPTIONS = [
  {
    value: 'blocked',
    label: 'Safe Default',
    description: 'Block provider popups and redirects inside the player.',
  },
  {
    value: 'enabled',
    label: 'Allow Provider Flow',
    description: 'Permit provider popups and redirects when a stream depends on them.',
  },
];

function SegmentedOption({
  label,
  options,
  value,
  onChange,
  renderOption,
  columnsClass = 'sm:grid-cols-3',
}) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-white">{label}</div>
      <div className={`grid gap-3 ${columnsClass}`}>
        {options.map((option) => {
          const isActive = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`rounded-[24px] border px-4 py-4 text-left transition-colors ${
                isActive
                  ? 'border-white/20 bg-white/[0.09] text-white'
                  : 'border-white/10 bg-white/[0.03] text-white/62 hover:text-white'
              }`}
            >
              {renderOption ? renderOption(option) : option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SettingsPage({
  preferences,
  onChangePreference,
  onSavePreferences,
  isSaving,
  syncStatus,
  onOpenDocs,
  accountNode,
}) {
  return (
    <section className="space-y-7">
      <section className="reveal-up liquid-panel rounded-[34px] p-5 md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-white/38">
              Settings
            </div>
            <h1 className="mt-2 text-3xl font-black text-white md:text-5xl">
              Tune the interface to your device.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/58">
              UI preferences save locally for guests and sync to your account when Firebase is available.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenDocs}
            className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-4 py-3 text-sm font-semibold text-white/78 transition-colors hover:text-white"
          >
            <BookOpenIcon className="h-4 w-4" />
            Developer Docs
          </button>
        </div>
      </section>

      <section className="reveal-up liquid-panel rounded-[34px] p-5 md:p-7">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.06] text-white/72">
            <SlidersIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.24em] text-white/40">
              UI Preferences
            </div>
            <div className="text-lg font-semibold text-white">Look and feel</div>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          <SegmentedOption
            label="Theme accent"
            options={THEME_OPTIONS}
            value={preferences.theme}
            onChange={(value) => onChangePreference('theme', value)}
            renderOption={(option) => (
              <div className="flex items-center gap-3">
                <div className={`h-5 w-5 rounded-full ${option.swatch}`} />
                <div className="text-sm font-medium">{option.label}</div>
              </div>
            )}
          />

          <SegmentedOption
            label="Layout density"
            options={DENSITY_OPTIONS}
            value={preferences.density}
            onChange={(value) => onChangePreference('density', value)}
          />

          <SegmentedOption
            label="Motion"
            options={MOTION_OPTIONS}
            value={preferences.motion}
            onChange={(value) => onChangePreference('motion', value)}
          />

          <SegmentedOption
            label="Playback safety"
            options={PROVIDER_FLOW_OPTIONS}
            value={preferences.providerFlow}
            onChange={(value) => onChangePreference('providerFlow', value)}
            columnsClass="sm:grid-cols-2"
            renderOption={(option) => (
              <div>
                <div className="text-sm font-medium text-white">{option.label}</div>
                <div className="mt-2 text-xs leading-5 text-white/52">
                  {option.description}
                </div>
              </div>
            )}
          />
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="rounded-[22px] border border-white/10 bg-black/[0.24] px-4 py-3 text-sm text-white/58">
            {syncStatus}
          </div>
          <button
            type="button"
            onClick={onSavePreferences}
            disabled={isSaving}
            className="rounded-full bg-[#e50914] px-5 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </section>

      {accountNode}
    </section>
  );
}
