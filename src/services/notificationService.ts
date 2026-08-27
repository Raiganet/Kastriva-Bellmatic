type NotifType = 'success' | 'error' | 'info' | 'warning' | 'dismiss'; // <-- TAMBAHKAN 'dismiss'

type Listener = (n: { id: string; message: string; type: NotifType; ts: number }) => void;
const listeners = new Set<Listener>();

export function notify(message: string, type: NotifType = 'info') {
  const n = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), message, type, ts: Date.now() };
  listeners.forEach((l) => l(n));
  // Auto dismiss setelah 5 detik
  setTimeout(() => {
    listeners.forEach((l) => l({ ...n, type: 'dismiss' as any }));
  }, 5000);
}

export function subscribeNotification(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}
