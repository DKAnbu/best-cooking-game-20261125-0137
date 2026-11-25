// Warung Rush — audio: semua bunyi dibuat dengan WebAudio, tanpa file.
// Dipanggil dari logika permainan; tidak ada bunyi sebelum interaksi pertama
// (kebijakan autoplay browser), jadi ensure() dipanggil di input pertama.
let context = null;
let muted = false;

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function ensure() {
  if (context === null) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    context = new AudioContext();
  }
  if (context.state === 'suspended') void context.resume();
  return context;
}

export function unlockAudio() {
  ensure();
}

/** Satu nada pendek: frekuensi, durasi detik, jenis gelombang, volume. */
function blip(freq, seconds, type, volume, when = 0) {
  if (muted) return;
  const ctx = ensure();
  if (!ctx) return;
  const start = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + seconds);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + seconds + 0.02);
}

export function playChop() {
  blip(180, 0.07, 'square', 0.12);
  blip(90, 0.09, 'triangle', 0.16, 0.02);
}

export function playPick() {
  blip(520, 0.08, 'sine', 0.12);
}

export function playPlace() {
  blip(340, 0.08, 'sine', 0.12);
  blip(440, 0.06, 'sine', 0.08, 0.05);
}

export function playSizzle() {
  if (muted) return;
  const ctx = ensure();
  if (!ctx) return;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.25, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * 0.05;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.25, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}

export function playDing() {
  blip(880, 0.12, 'sine', 0.16);
  blip(1318, 0.18, 'sine', 0.14, 0.09);
}

export function playServe() {
  blip(523, 0.1, 'triangle', 0.16);
  blip(659, 0.1, 'triangle', 0.16, 0.09);
  blip(784, 0.16, 'triangle', 0.16, 0.18);
  blip(1046, 0.22, 'sine', 0.12, 0.27);
}

export function playFail() {
  blip(220, 0.18, 'sawtooth', 0.1);
  blip(165, 0.25, 'sawtooth', 0.1, 0.12);
}

export function playTick() {
  blip(1200, 0.04, 'sine', 0.07);
}

export function playBurnt() {
  blip(140, 0.3, 'square', 0.12);
}
