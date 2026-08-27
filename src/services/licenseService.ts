// ============================================================
// LICENSE SERVICE - Scramble activation
// ALGORITMA SAMA dengan kunci-generator.js & Admin Panel:
//   h = (x * 2654435761) ^ SECRET; h = (h >>> 0) % 1000000
// SECRET = 918273 (di-obfuscate menjadi _s1 + _s2)
// ============================================================

const _s1 = 318273;               // bagian 1 (jangan diubah)
const _s2 = 600000;               // bagian 2 (_s1 + _s2 = 918273)
const _m = 2654435761;            // konstanta Knuth

const LS_DEV = 'kb_device_code';
const LS_LIC = 'kb_license_v1';

/** Kode perangkat unik 6 digit (per browser/perangkat) */
export function getDeviceCode(): string {
  try {
    let d = localStorage.getItem(LS_DEV);
    if (!d || !/^\d{6}$/.test(d)) {
      d = String(Math.floor(100000 + Math.random() * 900000));
      localStorage.setItem(LS_DEV, d);
    }
    return d;
  } catch {
    return '000000';
  }
}

/** Hitung kode aktivasi dari kode perangkat (scramble liKey) */
export function computeActivation(deviceCode: string): string {
  const x = parseInt(deviceCode, 10) || 0;
  let h = (x * _m) ^ (_s1 + _s2);
  h = (h >>> 0) % 1000000;
  let s = String(h);
  while (s.length < 6) s = '0' + s;
  return s;
}

/** Cek apakah perangkat ini sudah diaktivasi */
export function isActivated(): boolean {
  try {
    const raw = localStorage.getItem(LS_LIC);
    if (!raw) return false;
    const lic = JSON.parse(raw);
    const dev = getDeviceCode();
    // Kode aktivasi terikat ke kode perangkat → tidak bisa dipindah perangkat
    return !!lic && lic.dev === dev && lic.code === computeActivation(dev);
  } catch {
    return false;
  }
}

/** Aktivasi dengan kode dari penjual. Return true jika valid */
export function activate(code: string): boolean {
  const dev = getDeviceCode();
  const clean = (code || '').trim();
  if (clean === computeActivation(dev)) {
    try {
      localStorage.setItem(LS_LIC, JSON.stringify({ dev, code: clean, at: Date.now() }));
    } catch {}
    return true;
  }
  return false;
}

/** Kunci ulang aplikasi (hapus lisensi) */
export function deactivate(): void {
  try {
    localStorage.removeItem(LS_LIC);
  } catch {}
}
