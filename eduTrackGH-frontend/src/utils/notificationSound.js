const SOUND_ENABLED_KEY = 'parent_notification_sound_enabled';

let audioCtx = null;

const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  return audioCtx;
};

export const isNotificationSoundEnabled = () => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(SOUND_ENABLED_KEY) === 'true';
};

export const setNotificationSoundEnabled = (enabled) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SOUND_ENABLED_KEY, enabled ? 'true' : 'false');
};

export const unlockNotificationSound = async () => {
  const ctx = getAudioContext();
  if (!ctx) return false;
  try {
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    return true;
  } catch {
    return false;
  }
};

const playBeep = (ctx, freq, start, duration, gainValue, type = 'sine') => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  
  // Smooth envelope for natural sound
  gain.gain.setValueAtTime(0, ctx.currentTime + start);
  gain.gain.linearRampToValueAtTime(gainValue, ctx.currentTime + start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + duration);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime + start);
  osc.stop(ctx.currentTime + start + duration);
};

export const playParentNotificationSound = async () => {
  const ctx = getAudioContext();
  if (!ctx) return false;
  try {
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    // Pleasant, gentle notification sound - soft ascending melody
    // Using sine waves for smooth, non-harsh tones
    playBeep(ctx, 523.25, 0, 0.15, 0.3, 'sine');      // C5 - soft start
    playBeep(ctx, 659.25, 0.12, 0.15, 0.35, 'sine');  // E5 - gentle rise
    playBeep(ctx, 783.99, 0.24, 0.25, 0.4, 'sine');   // G5 - pleasant finish
    return true;
  } catch {
    return false;
  }
};

