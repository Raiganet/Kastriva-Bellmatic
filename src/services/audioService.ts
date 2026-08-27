import { db } from '../database/db';
import type { AudioFile } from '../types';
import { uid } from '../utils/time';

let objectUrlCache = new Map<string, string>();

export function getObjectUrl(audio: AudioFile): string {
  const cached = objectUrlCache.get(audio.id);
  if (cached) return cached;
  
  const url = URL.createObjectURL(audio.blob);
  objectUrlCache.set(audio.id, url);
  
  console.log('[AudioService] Created blob URL:', url);
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

export async function saveAudioFile(
  file: File,
  displayName?: string,
): Promise<AudioFile> {
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
  console.log('[AudioService] Audio saved:', audio.displayName);
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
  console.log('[AudioService] Attempting to play:', audio.displayName);
  console.log('[AudioService] Audio size:', audio.size, 'bytes');
  console.log('[AudioService] Audio MIME:', audio.mimeType);
  
  const url = getObjectUrl(audio);
  const el = new Audio(url);
  el.volume = Math.max(0, Math.min(1, volume));
  el.preload = 'auto';
  
  el.addEventListener('error', (e) => {
    console.error('[AudioService] Audio error event:', e);
  });
  
  el.addEventListener('canplay', () => {
    console.log('[AudioService] Audio canplay event fired');
  });
  
  el.addEventListener('loadeddata', () => {
    console.log('[AudioService] Audio loadeddata event fired');
  });
  
  try {
    await el.play();
    console.log('[AudioService] Audio playing successfully');
    return el;
  } catch (err: any) {
    console.error('[AudioService] Play failed:', err);
    throw new Error('Gagal memutar audio: ' + (err?.message || 'Unknown error'));
  }
}

// Fallback method untuk browser yang strict
export async function playAudioFallback(audio: AudioFile, volume = 0.8): Promise<void> {
  console.log('[AudioService] Using fallback method');
  
  return new Promise((resolve, reject) => {
    const url = getObjectUrl(audio);
    const el = new Audio(url);
    el.volume = Math.max(0, Math.min(1, volume));
    
    el.addEventListener('ended', () => {
      console.log('[AudioService] Fallback: Audio ended');
      resolve();
    });
    
    el.addEventListener('error', (e) => {
      console.error('[AudioService] Fallback error:', e);
      reject(new Error('Audio playback failed'));
    });
    
    el.play().catch((err) => {
      console.error('[AudioService] Fallback play failed:', err);
      reject(err);
    });
  });
}
