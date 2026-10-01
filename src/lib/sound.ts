// New-order alert. Tries /assets/order-alert.mp3 (drop the file into public/assets/),
// otherwise plays a ~3s two-tone siren with the Web Audio API. Never loops.
let ctx: AudioContext | null = null;

export function unlockAudio() {
  if (typeof window === "undefined") return;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AC) ctx = new AC();
  }
  void ctx?.resume();
}

function synthSiren() {
  if (!ctx) return;
  const now = ctx.currentTime;
  const gain = ctx.createGain();
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.35, now + 0.05);
  gain.gain.setValueAtTime(0.35, now + 2.8);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.1);
  const osc = ctx.createOscillator();
  osc.type = "square";
  for (let i = 0; i < 6; i++) {
    osc.frequency.setValueAtTime(880, now + i * 0.5);
    osc.frequency.linearRampToValueAtTime(1320, now + i * 0.5 + 0.25);
    osc.frequency.linearRampToValueAtTime(880, now + i * 0.5 + 0.5);
  }
  osc.connect(gain);
  osc.start(now);
  osc.stop(now + 3.2);
}

export async function playOrderAlert() {
  try {
    const audio = new Audio("/assets/order-alert.mp3");
    audio.loop = false;
    await audio.play();
    setTimeout(() => audio.pause(), 4000);
  } catch {
    synthSiren();
  }
}
