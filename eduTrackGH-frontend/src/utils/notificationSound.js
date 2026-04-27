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

const playBeep = (ctx, freq, start, duration, gainValue) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.value = freq;
  gain.gain.value = gainValue;
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
    // Louder triple pattern + repeat pulse for clearer notice.
    playBeep(ctx, 880, 0, 0.2, 0.95);
    playBeep(ctx, 1320, 0.24, 0.2, 0.95);
    playBeep(ctx, 1760, 0.48, 0.24, 0.95);
    playBeep(ctx, 1320, 0.82, 0.18, 0.9);
    playBeep(ctx, 1760, 1.04, 0.22, 0.9);
    return true;
  } catch {
    return false;
  }
};

