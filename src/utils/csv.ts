import Papa from 'papaparse';
import type { DayOfWeek } from '../types';

const DAY_MAP: Record<string, DayOfWeek> = {
  senin: 'senin', selasa: 'selasa', rabu: 'rabu',
  kamis: 'kamis', jumat: 'jumat', sabtu: 'sabtu', minggu: 'minggu',
  mon: 'senin', tue: 'selasa', wed: 'rabu', thu: 'kamis',
  fri: 'jumat', sat: 'sabtu', sun: 'minggu',
};

export function parseDay(raw: string): DayOfWeek | null {
  const k = raw.trim().toLowerCase();
  return DAY_MAP[k] || null;
}

export function parseCSV(text: string) {
  const result = Papa.parse<{ Hari?: string; Jam?: string; Kegiatan?: string; Audio?: string; Status?: string }>(text, {
    header: true,
    skipEmptyLines: true,
  });
  return result.data.map((row) => ({
    hari: row.Hari || '',
    jam: row.Jam || '',
    kegiatan: row.Kegiatan || '',
    audio: row.Audio || '',
    status: (row.Status || 'aktif').toLowerCase(),
  }));
}

export function exportCSV(rows: { Hari: string; Jam: string; Kegiatan: string; Audio: string; Status: string }[]): string {
  return Papa.unparse(rows);
}
