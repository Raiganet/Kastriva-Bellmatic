import { db } from '../database/db';
import type { AudioFile } from '../types';
import { uid } from '../utils/time';

let objectUrlCache = new Map<string, string>();

export function getObjectUrl(audio: AudioFile): string {
  const cached = objectUrlCache.get(audio.id);
  if (cached) return cached;
  const url = URL.createObjectURL(audio.blob);
  objectUrlCache.set(audio.id, url);
  return url;
}

export function revokeObjectUrl(id: string): void {
  const url = objectUrlCache.get(id);
  if (url) {
    URL.revokeObjectURL(url);
    objectUrlCache.delete(id);
  }
}

export async function getAudioDuration(blob: Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const url = URL.createObjectURL(blob);
    audio.addEventListener('loadedmetadata', () => {
      const d = audio.duration;
      URL.revokeObjectURL(url);
      resolve(isFinite(d) ? d : 0);
    });
    audio.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      reject(new Error('File audio tidak valid'));
    });
    audio.src = url;
  });
}

export async function saveAudioFile(file: File, displayName?: string): Promise<AudioFile> {
  const valid = file.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac)$/i.test(file.name);
  if (!valid) throw new Error('Hanya file audio (MP3, WAV, OGG, M4A) yang diperbolehkan');

  const duration = await getAudioDuration(file);
  const audio: AudioFile = {
    id: uid(),
    name: file.name,
    displayName: displayName || file.name.replace(/\.[^.]+$/, ''),
    blob: file,
    mimeType: file.type || 'audio/mpeg',
    size: file.size,
    duration,
    createdAt: Date.now(),
  };
  await db.audio.add(audio);
  return audio;
}

export async function deleteAudio(id: string): Promise<void> {
  revokeObjectUrl(id);
  await db.audio.delete(id);
}

export async function updateAudio(id: string, patch: Partial<AudioFile>): Promise<void> {
  await db.audio.update(id, patch);
}

export async function playAudio(audio: AudioFile, volume = 0.8): Promise<HTMLAudioElement> {
  const url = getObjectUrl(audio);
  const el = new Audio(url);
  el.volume = Math.max(0, Math.min(1, volume));
  el.preload = 'auto';
  await el.play();
  return el;
}

// Tunggu sampai audio selesai (ended) atau error
function waitForEnd(el: HTMLAudioElement): Promise<void> {
  return new Promise((resolve) => {
    const cleanup = () => {
      el.removeEventListener('ended', onEnd);
      el.removeEventListener('error', onErr);
    };
    const onEnd = () => { cleanup(); resolve(); };
    const onErr = () => { cleanup(); resolve(); };
    el.addEventListener('ended', onEnd);
    el.addEventListener('error', onErr);
  });
}

/**
 * BARU: Putar audio beruntun sebanyak N kali.
 * Return element terakhir (masih bermain) agar caller bisa attach listener.
 */
export async function playAudioRepeated(
  audio: AudioFile,
  volume = 0.8,
  times = 1,
): Promise<HTMLAudioElement> {
  const count = Math.max(1, Math.floor(times || 1));
  console.log('[AudioService] playAudioRepeated:', audio.displayName, 'x', count);

  let last: HTMLAudioElement | null = null;
  for (let i = 0; i < count; i++) {
    console.log(`[AudioService] Repeat ${i + 1}/${count}`);
    last = await playAudio(audio, volume);
    // Tunggu selesai sebelum mengulang (kecuali putaran terakhir)
    if (i < count - 1) {
      await waitForEnd(last);
    }
  }
  return last!;
}
