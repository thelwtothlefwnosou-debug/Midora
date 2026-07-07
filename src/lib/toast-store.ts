type ToastListener = (message: string | null) => void;

const listeners = new Set<ToastListener>();
let hideTimer: ReturnType<typeof setTimeout> | null = null;

export function subscribeToast(listener: ToastListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function showToast(message: string, durationMs = 2600) {
  listeners.forEach((listener) => listener(message));
  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    listeners.forEach((listener) => listener(null));
  }, durationMs);
}
