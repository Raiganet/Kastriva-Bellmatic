import { useEffect, useState } from 'react';
import { subscribeNotification } from '../../services/notificationService';
import { X, CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';

type Notif = { id: string; message: string; type: string; ts: number };

export function ToastContainer() {
  const [items, setItems] = useState<Notif[]>([]);

  useEffect(() => {
    return subscribeNotification((n) => {
      if (n.type === 'dismiss') {
        setItems((prev) => prev.filter((x) => x.id !== n.id));
      } else {
        setItems((prev) => [...prev.slice(-4), { id: n.id, message: n.message, type: n.type, ts: n.ts }]);
      }
    });
  }, []);

  const remove = (id: string) => setItems((p) => p.filter((x) => x.id !== id));

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {items.map((n) => {
        const Icon = n.type === 'success' ? CheckCircle2 : n.type === 'error' ? XCircle : n.type === 'warning' ? AlertTriangle : Info;
        const color =
          n.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/40 dark:border-emerald-700 dark:text-emerald-200'
          : n.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-900/40 dark:border-rose-700 dark:text-rose-200'
          : n.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/40 dark:border-amber-700 dark:text-amber-200'
          : 'bg-sky-50 border-sky-200 text-sky-800 dark:bg-sky-900/40 dark:border-sky-700 dark:text-sky-200';
        return (
          <div key={n.id} className={`flex items-start gap-2 p-3 rounded-lg border shadow-md animate-in slide-in-from-right ${color}`}>
            <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">{n.message}</div>
            <button onClick={() => remove(n.id)} className="opacity-60 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
