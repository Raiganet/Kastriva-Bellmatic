import { db } from '../database/db';
import type { AudioFile } from '../types';
import { uid } from '../utils/time';

let objectUrlCache = new Map<string, string>();

export function getObjectUrl(audio: AudioFile): string {
  const cached = objectUrlCache.get(audio.id);
  if (cached) return cached;
  
  console.log('[AudioService] Creating blob URL for:', audio.displayName);
  console.log('[AudioService] Blob type:', audio.blob.type);
  console.log('[AudioService] Blob size:', audio.blob.size);
  
  const url = URL.createObjectURL(audio.blob);
  objectUrlCache.set(audio.id, url);
  
  console.log('[AudioService] Blob URL created:', url);
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

  console.log('[AudioService] Saving audio:', file.name, 'size:', file.size, 'type:', file.type);
  
  const duration = await getAudioDuration(file);
  console.log('[AudioService] Duration:', duration);
  
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
  console.log('[AudioService] Audio saved with ID:', audio.id);
  return audio;
}

export async function deleteAudio(id: string): Promise<void> {
  revokeObjectUrl(id);
  await db.audio.delete(id);
}

export async function updateAudio(id: string, patch: Partial<AudioFile>): Promise<void> {
  await db.audio.update(id, patch);
}

// Main play function dengan multiple fallback methods
export async function playAudio(audio: AudioFile, volume = 0.8): Promise<HTMLAudioElement> {
  console.log('[AudioService] === PLAY AUDIO START ===');
  console.log('[AudioService] Audio ID:', audio.id);
  console.log('[AudioService] Audio name:', audio.displayName);
  console.log('[AudioService] Audio size:', audio.size);
  console.log('[AudioService] Audio MIME:', audio.mimeType);
  console.log('[AudioService] Volume:', volume);
  
  const url = getObjectUrl(audio);
  
  const el = new Audio();
  el.volume = Math.max(0, Math.min(1, volume));
  el.preload = 'auto';
  
  // Event listeners untuk debug
  el.addEventListener('loadstart', () => console.log('[AudioService] Event: loadstart'));
  el.addEventListener('loadedmetadata', () => console.log('[AudioService] Event: loadedmetadata, duration:', el.duration));
  el.addEventListener('loadeddata', () => console.log('[AudioService] Event: loadeddata'));
  el.addEventListener('canplay', () => console.log('[AudioService] Event: canplay'));
  el.addEventListener('canplaythrough', () => console.log('[AudioService] Event: canplaythrough'));
  el.addEventListener('play', () => console.log('[AudioService] Event: play'));
  el.addEventListener('playing', () => console.log('[AudioService] Event: playing'));
  el.addEventListener('ended', () => console.log('[AudioService] Event: ended'));
  el.addEventListener('pause', () => console.log('[AudioService] Event: pause'));
  el.addEventListener('error', (e) => {
    console.error('[AudioService] Event: error', e);
    console.error('[AudioService] Error code:', el.error?.code);
    console.error('[AudioService] Error message:', el.error?.message);
  });
  
  // Method 1: Set src langsung
  el.src = url;
  
  try {
    console.log('[AudioService] Attempting to play...');
    await el.play();
    console.log('[AudioService] === PLAY SUCCESS ===');
    return el;
  } catch (err: any) {
    console.error('[AudioService] Play failed:', err);
    
    // Method 2: Coba dengan load() dulu
    try {
      console.log('[AudioService] Trying method 2: load() then play()');
      el.load();
      await new Promise((resolve) => setTimeout(resolve, 100));
      await el.play();
      console.log('[AudioService] === PLAY SUCCESS (method 2) ===');
      return el;
    } catch (err2: any) {
      console.error('[AudioService] Method 2 failed:', err2);
      
      // Method 3: Buat Audio baru dengan src di constructor
      try {
        console.log('[AudioService] Trying method 3: new Audio(url)');
        const el2 = new Audio(url);
        el2.volume = volume;
        await el2.play();
        console.log('[AudioService] === PLAY SUCCESS (method 3) ===');
        return el2;
      } catch (err3: any) {
        console.error('[AudioService] Method 3 failed:', err3);
        throw new Error('Semua metode pemutaran gagal: ' + (err?.message || 'Unknown error'));
      }
    }
  }
}

// Test function untuk debug
export async function testAudioPlayback(audio: AudioFile): Promise<string> {
  console.log('[AudioService] === TEST PLAYBACK ===');
  
  try {
    const el = await playAudio(audio, 0.8);
    return '✅ Audio berhasil diputar';
  } catch (err: any) {
    console.error('[AudioService] Test failed:', err);
    return '❌ Gagal: ' + (err?.message || 'Unknown error');
  }
}
