/** Kleine Soundeffekte, per WebAudio erzeugt (keine Dateien nötig). */
let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(on: boolean) {
  enabled = on;
}

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = "sine", vol = 0.15) {
  const c = ac();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t = c.currentTime + start;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

export const sfx = {
  correct() {
    if (!enabled) return;
    tone(660, 0, 0.12, "triangle");
    tone(880, 0.1, 0.18, "triangle");
  },
  almost() {
    if (!enabled) return;
    tone(520, 0, 0.12, "triangle");
    tone(620, 0.1, 0.15, "triangle");
  },
  wrong() {
    if (!enabled) return;
    tone(240, 0, 0.18, "sawtooth", 0.07);
    tone(190, 0.12, 0.22, "sawtooth", 0.07);
  },
  tap() {
    if (!enabled) return;
    tone(500, 0, 0.05, "sine", 0.08);
  },
  flip() {
    if (!enabled) return;
    tone(380, 0, 0.06, "sine", 0.08);
    tone(520, 0.04, 0.06, "sine", 0.06);
  },
  win() {
    if (!enabled) return;
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.25, "triangle", 0.14));
  },
  levelUp() {
    if (!enabled) return;
    [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.08, 0.2, "square", 0.06));
  },
  coin() {
    if (!enabled) return;
    tone(988, 0, 0.08, "square", 0.06);
    tone(1319, 0.07, 0.2, "square", 0.06);
  },
};
