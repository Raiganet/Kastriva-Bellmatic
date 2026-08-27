/**
 * Generate test tone untuk memastikan speaker berfungsi
 */

export function generateTestTone(frequency = 440, duration = 2): Blob {
  // Buat WAV file sederhana dengan tone 440Hz (A4)
  const sampleRate = 44100;
  const numSamples = Math.floor(duration * sampleRate);
  
  // Generate sine wave
  const samples = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    samples[i] = 0.5 * Math.sin(2 * Math.PI * frequency * i / sampleRate);
  }
  
  // Buat WAV header
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);
  
  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(view, 8, 'WAVE');
  
  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  
  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, numSamples * 2, true);
  
  // Write samples
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
    offset += 2;
  }
  
  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

export async function playTestTone(frequency = 440, duration = 2, volume = 0.8): Promise<boolean> {
  console.log('[AudioTest] Generating test tone:', frequency + 'Hz', duration + 's');
  
  try {
    const blob = generateTestTone(frequency, duration);
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.volume = volume;
    
    return new Promise((resolve, reject) => {
      audio.addEventListener('ended', () => {
        console.log('[AudioTest] Test tone finished');
        URL.revokeObjectURL(url);
        resolve(true);
      });
      
      audio.addEventListener('error', (e) => {
        console.error('[AudioTest] Test tone error:', e);
        URL.revokeObjectURL(url);
        reject(e);
      });
      
      audio.play().catch(reject);
    });
  } catch (err) {
    console.error('[AudioTest] Failed to play test tone:', err);
    return false;
  }
}
