/**
 * Web Audio API synthesizer for hospital clinical alerts and notifications.
 * Runs completely in-browser without external audio file dependencies.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Gentle 2-tone notification chime for routine assistance / status updates
export function playChimeSound(muted: boolean = false) {
  if (muted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(880.0, now + 0.12); // A5

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.5);
  } catch (err) {
    console.warn('Audio chime playback omitted:', err);
  }
}

// High-priority clinical emergency alert (3 gentle alternating pulses)
export function playEmergencyAlertSound(muted: boolean = false) {
  if (muted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    // Pulse 1
    osc.frequency.setValueAtTime(880, now); // A5
    osc.frequency.setValueAtTime(659.25, now + 0.15); // E5

    // Pulse 2
    osc.frequency.setValueAtTime(880, now + 0.3);
    osc.frequency.setValueAtTime(659.25, now + 0.45);

    // Pulse 3
    osc.frequency.setValueAtTime(987.77, now + 0.6); // B5

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.05);
    gain.gain.setValueAtTime(0.25, now + 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 1.0);
  } catch (err) {
    console.warn('Emergency alert audio omitted:', err);
  }
}
