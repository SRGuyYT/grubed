import { AlertCircleIcon, XIcon } from './icons';

const TONE_STYLES = {
  error: 'border-[#ff7b7b]/30 bg-[#381416]/78 text-white',
  warning: 'border-[#f1c26d]/30 bg-[#37290f]/78 text-white',
  info: 'border-white/14 bg-black/62 text-white',
  success: 'border-[#69f0b5]/28 bg-[#0f2f22]/78 text-white',
};

export function NotificationCenter({ notifications, onDismiss }) {
  if (!notifications.length) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-4 top-4 z-50 mx-auto flex max-w-3xl flex-col gap-3">
      {notifications.map((notification) => (
        <section
          key={notification.id}
          className={`pointer-events-auto glass-panel-strong reveal-up rounded-[26px] border px-4 py-4 shadow-[0_18px_36px_rgba(0,0,0,0.35)] ${
            TONE_STYLES[notification.tone] ?? TONE_STYLES.info
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-white/82">
              <AlertCircleIcon className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {notification.code ? (
                  <span className="rounded-full border border-white/12 bg-white/[0.06] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/68">
                    {notification.code}
                  </span>
                ) : null}
                <h2 className="text-sm font-semibold text-white">{notification.title}</h2>
              </div>
              <p className="mt-2 text-sm leading-6 text-white/74">
                {notification.message}
              </p>
              {notification.help ? (
                <p className="mt-2 text-sm leading-6 text-white/58">{notification.help}</p>
              ) : null}
              {notification.actionLabel && notification.onAction ? (
                <button
                  type="button"
                  onClick={notification.onAction}
                  className="mt-3 rounded-full border border-white/14 bg-white/[0.05] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/78 transition-colors hover:text-white"
                >
                  {notification.actionLabel}
                </button>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(notification.id)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.05] text-white/65 transition-colors hover:text-white"
              aria-label="Dismiss notification"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        </section>
      ))}
    </div>
  );
}
