import { useState } from 'react';
import { getDeviceCode, isActivated, activate } from '../services/licenseService';
import { LockKeyhole, Copy, Check, KeyRound, ShieldCheck } from 'lucide-react';

export function LicenseGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState<boolean>(() => isActivated());
  if (unlocked) return <>{children}</>;
  return <LockScreen onUnlocked={() => setUnlocked(true)} />;
}

function LockScreen({ onUnlocked }: { onUnlocked: () => void }) {
  const dev = getDeviceCode();
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);

  const copyDev = async () => {
    try {
      await navigator.clipboard.writeText(dev);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const submit = () => {
    const c = code.trim();
    if (!/^\d{6}$/.test(c)) {
      setErr('Kode aktivasi harus 6 digit angka');
      return;
    }
    if (activate(c)) {
      onUnlocked();
    } else {
      setErr('Kode aktivasi salah untuk perangkat ini. Hubungi penjual untuk kode yang benar.');
      setCode('');
    }
  };

  return (
    <div className="fixed inset-0 z-[999] bg-slate-950 flex items-center justify-center p-4 overflow-y-auto">
      {/* Dekorasi latar */}
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary-700/20 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-indigo-700/20 blur-3xl" />

      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 my-8">
        {/* Header brand */}
        <div className="bg-brand p-7 text-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
          <div className="relative w-16 h-16 mx-auto rounded-2xl bg-white shadow-pop flex items-center justify-center overflow-hidden mb-3">
            <img src="/icons/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="relative text-xl font-bold text-white tracking-tight">Kastriva Bellmatic</h1>
          <p className="relative text-[10px] text-primary-200 uppercase tracking-widest mt-1">
            Smart School Bell System
          </p>
        </div>

        <div className="p-7">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center">
              <LockKeyhole className="w-4.5 h-4.5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">Aplikasi Terkunci</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Aktivasi lisensi diperlukan untuk menggunakan aplikasi ini.</div>
            </div>
          </div>

          {/* Kode perangkat */}
          <div className="rounded-2xl border-2 border-dashed border-primary-300 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 p-4 text-center mb-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400 mb-1">
              Kode Perangkat Anda
            </div>
            <div className="font-mono tabular text-3xl font-bold tracking-[0.3em] text-primary-800 dark:text-primary-300">
              {dev}
            </div>
            <button
              onClick={copyDev}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-primary-200 dark:border-primary-700 text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-slate-700 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Tersalin!' : 'Salin Kode'}
            </button>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
              Kirim kode perangkat ini ke penjual untuk mendapatkan <b>kode aktivasi</b>.
            </p>
          </div>

          {/* Input aktivasi */}
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
            <KeyRound className="w-3.5 h-3.5" /> Kode Aktivasi
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setErr(''); }}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            placeholder="______"
            className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-center font-mono text-2xl font-bold tracking-[0.4em] text-slate-900 dark:text-white focus:outline-none focus:border-primary-500"
          />
          {err && (
            <div className="mt-2 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg px-3 py-2">
              ⚠️ {err}
            </div>
          )}

          <button
            onClick={submit}
            className="mt-4 w-full py-3.5 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-bold text-sm tracking-widest hover:opacity-90 active:scale-[.98] transition shadow-lift"
          >
            🔓 AKTIFKAN APLIKASI
          </button>

          <div className="flex items-center justify-center gap-1.5 mt-4 text-[10px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            Lisensi terikat ke perangkat • © 2026 Kastriva
          </div>
        </div>
      </div>
    </div>
  );
}
