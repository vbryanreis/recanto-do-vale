'use strict';
/* ============ Trilha sonora e efeitos — 100% sintetizados via WebAudio ============
   Estilo: "folk de vale" — plucks pentatônicos suaves, pads quentinhos e um
   baixo redondo. De dia é maior e saltitante; de noite fica lento e menor. */

const AU = { ctx: null, master: null, musicGain: null, on: true, started: false, nextNote: 0, step: 0 };

function audioStart() {
  if (AU.started) return;
  try {
    AU.ctx = new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) { return; }
  AU.master = AU.ctx.createGain();
  AU.master.gain.value = 0.55;
  AU.master.connect(AU.ctx.destination);
  AU.musicGain = AU.ctx.createGain();
  AU.musicGain.gain.value = 0.75;
  AU.musicGain.connect(AU.master);
  AU.started = true;
  AU.nextNote = AU.ctx.currentTime + 0.1;
  setInterval(musicScheduler, 90);
}

function audioToggle() {
  AU.on = !AU.on;
  if (AU.master) AU.master.gain.value = AU.on ? 0.55 : 0;
  return AU.on;
}

/* ---------------- instrumentos ---------------- */
function pluck(freq, t, vol, dur) {
  const o = AU.ctx.createOscillator();
  o.type = 'triangle';
  o.frequency.value = freq;
  const g = AU.ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 0.55));
  o.connect(g); g.connect(AU.musicGain);
  o.start(t); o.stop(t + (dur || 0.55) + 0.05);
}
function pad(freqs, t, dur, vol) {
  for (const f of freqs) {
    for (const det of [-4, 4]) {
      const o = AU.ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      o.detune.value = det;
      const g = AU.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vol, t + dur * 0.3);
      g.gain.linearRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(AU.musicGain);
      o.start(t); o.stop(t + dur + 0.05);
    }
  }
}
function bass(freq, t, dur) {
  const o = AU.ctx.createOscillator();
  o.type = 'sine';
  o.frequency.value = freq;
  const g = AU.ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.12, t + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(AU.musicGain);
  o.start(t); o.stop(t + dur + 0.05);
}
function shaker(t) {
  const len = 0.06;
  const buf = AU.ctx.createBuffer(1, AU.ctx.sampleRate * len, AU.ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = AU.ctx.createBufferSource();
  src.buffer = buf;
  const f = AU.ctx.createBiquadFilter();
  f.type = 'highpass'; f.frequency.value = 6000;
  const g = AU.ctx.createGain(); g.gain.value = 0.05;
  src.connect(f); f.connect(g); g.connect(AU.musicGain);
  src.start(t);
}

/* ---------------- composição procedural ---------------- */
// dia: Dó maior pentatônica / noite: Lá menor pentatônica (mais grave)
const ESCALA_DIA = [261.6, 293.7, 329.6, 392.0, 440.0, 523.3, 587.3, 659.3];
const ESCALA_NOITE = [220.0, 261.6, 293.7, 329.6, 392.0, 440.0, 523.3];
const ACORDES_DIA = [[130.8, 196.0, 261.6], [110.0, 164.8, 220.0], [87.3, 130.8, 174.6], [98.0, 146.8, 196.0]];
const ACORDES_NOITE = [[110.0, 164.8, 220.0], [87.3, 130.8, 174.6], [98.0, 146.8, 196.0], [82.4, 123.5, 164.8]];
let melodiaIdx = 3, compasso = 0;

function musicScheduler() {
  if (!AU.started || !AU.on) return;
  if (typeof G !== 'undefined' && G.mode === 'pausa') {
    AU.nextNote = AU.ctx.currentTime + 0.1; // não acumula notas durante a pausa
    return;
  }
  const noite = isNight();
  const bpm = noite ? 62 : 86;
  const oitava = 60 / bpm / 2; // colcheia
  while (AU.nextNote < AU.ctx.currentTime + 0.35) {
    const t = AU.nextNote;
    const passo = AU.step % 8;       // 8 colcheias por compasso
    const escala = noite ? ESCALA_NOITE : ESCALA_DIA;
    const acordes = noite ? ACORDES_NOITE : ACORDES_DIA;

    if (passo === 0) {
      compasso++;
      const ac = acordes[compasso % 4];
      pad(ac, t, oitava * 16, noite ? 0.035 : 0.028);
      bass(ac[0] / 2, t, oitava * 7);
    }
    if (passo === 4) bass(acordes[compasso % 4][0] / 2, t, oitava * 3);
    if (!noite && (passo === 2 || passo === 6)) shaker(t);

    // melodia: passeio aleatório na pentatônica, com pausas
    const chance = noite ? 0.42 : 0.62;
    if (Math.random() < chance) {
      melodiaIdx = clamp(melodiaIdx + randi(-2, 2), 0, escala.length - 1);
      pluck(escala[melodiaIdx], t, noite ? 0.055 : 0.075, noite ? 1.1 : 0.6);
      if (!noite && Math.random() < 0.18) pluck(escala[melodiaIdx] * 2, t + oitava / 2, 0.03, 0.3);
    }
    AU.nextNote += oitava;
    AU.step++;
  }
}

/* ---------------- efeitos sonoros ---------------- */
function sfx(nome, mult) {
  if (!AU.started || !AU.on) return;
  const vm = mult === undefined ? 1 : mult;   // multiplicador de volume (ex.: sons de NPC bem baixos)
  if (vm <= 0.001) return;
  const t = AU.ctx.currentTime;
  const tone = (freq, dur, vol, type, slide) => {
    vol *= vm;
    const o = AU.ctx.createOscillator();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    const g = AU.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(AU.master);
    o.start(t); o.stop(t + dur + 0.05);
  };
  const noise = (dur, vol, freq) => {
    vol *= vm;
    const buf = AU.ctx.createBuffer(1, AU.ctx.sampleRate * dur, AU.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = AU.ctx.createBufferSource(); src.buffer = buf;
    const f = AU.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq || 1200;
    const g = AU.ctx.createGain(); g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(AU.master);
    src.start(t);
  };
  switch (nome) {
    case 'chop':    tone(120, 0.1, 0.15, 'square', 70); noise(0.08, 0.1, 900); break;
    case 'mine':    tone(320, 0.07, 0.1, 'square', 180); noise(0.06, 0.12, 2400); break;
    case 'rustle':  noise(0.12, 0.08, 1600); break;
    case 'fall':    noise(0.3, 0.16, 500); tone(80, 0.25, 0.12, 'sine', 45); break;
    case 'hit':     tone(200, 0.08, 0.1, 'square', 120); break;
    case 'arrow':   noise(0.12, 0.09, 3200); tone(900, 0.14, 0.05, 'sine', 300); break;
    case 'pop':     tone(620, 0.09, 0.07, 'sine', 950); break;
    case 'build':   noise(0.1, 0.1, 800); tone(150, 0.1, 0.08, 'square', 100); break;
    case 'done':    tone(392, 0.12, 0.09); setTimeout(() => AU.on && tonePost(523.3, 0.2, 0.09), 100); break;
    case 'coin':    tone(880, 0.07, 0.08); setTimeout(() => AU.on && tonePost(1318.5, 0.12, 0.07), 60); break;
    case 'heart':   tone(659.3, 0.1, 0.06); setTimeout(() => AU.on && tonePost(880, 0.16, 0.06), 90); break;
    case 'harvest': tone(523.3, 0.08, 0.07, 'triangle', 780); break;
    case 'ui':      tone(440, 0.05, 0.05); break;
    case 'no':      tone(180, 0.15, 0.08, 'square', 120); break;
    case 'levelup':
      [523.3, 659.3, 784.0, 1046.5].forEach((f, i) => setTimeout(() => AU.on && tonePost(f, 0.25, 0.08), i * 110));
      break;
    case 'sino':
      [784, 988, 784, 1175].forEach((f, i) => setTimeout(() => AU.on && tonePost(f, 0.6, 0.09, 'triangle'), i * 260));
      break;
  }
}
function tonePost(freq, dur, vol, type) {
  if (!AU.started) return;
  const t = AU.ctx.currentTime;
  const o = AU.ctx.createOscillator();
  o.type = type || 'sine'; o.frequency.value = freq;
  const g = AU.ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(AU.master);
  o.start(t); o.stop(t + dur + 0.05);
}
