'use strict';
/* ============ Recanto do Vale — utilitários e estado global ============ */
const TAU = Math.PI * 2;
const TS = 32, WW = 110, WH = 110;          // tile size e tamanho do mundo
const DAY_LEN = 205;                          // segundos por dia (ciclo levemente mais lento)
const cam = { x: 0, y: 0, w: 0, h: 0 };

function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function lerp(a, b, t) { return a + (b - a) * t; }
function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }
function rand(a, b) { if (b === undefined) { b = a; a = 0; } return a + Math.random() * (b - a); }
function randi(a, b) { return Math.floor(rand(a, b + 1)); }
function choice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function hash2(x, y) {
  let h = (x * 374761393 + y * 668265263) >>> 0;
  h = (h ^ (h >>> 13)) * 1274126177 >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) % 1000 / 1000;
}
function rr(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* ---------------- Recursos ---------------- */
const RES_LIST = ['madeira', 'pedra', 'carne', 'fruta', 'colheita', 'moeda'];
const RES_INFO = {
  madeira:  { icon: '🪵', nome: 'Madeira' },
  pedra:    { icon: '🪨', nome: 'Pedra' },
  carne:    { icon: '🍖', nome: 'Carne' },
  fruta:    { icon: '🫐', nome: 'Frutas' },
  colheita: { icon: '🌾', nome: 'Colheita' },
  moeda:    { icon: '🪙', nome: 'Moedas' },
};
const PRECOS = { madeira: 1, pedra: 2, carne: 4, fruta: 2, colheita: 3 };

/* níveis da vila: XP necessário para ALCANÇAR o nível (índice = nível-1) */
const XP_NIVEIS = [0, 60, 150, 300, 500, 800, 1200, 1700, 2400, 3300];
const NIVEL_MAX = 10;

/* ---------------- Estado global ---------------- */
const G = {
  versao: 1,
  slot: 0,
  seed: Math.floor(Math.random() * 1e9),
  day: 1, t: 0.28, now: 0,
  res: { madeira: 0, pedra: 0, carne: 0, fruta: 0, colheita: 0, moeda: 0 },
  tools: { machado: 1, picareta: 1 },
  weapons: { facao: true, espada: false, arco: false },
  armaAtiva: 'facao',
  arrows: [],
  anel: false,
  xp: 0, level: 1, charm: 0,
  player: { x: 0, y: 0, dir: 1, walkT: 0, moving: false, swing: 0, cores: null, hp: 100, maxhp: 100, hurt: 0 },
  objects: [], animals: [], npcs: [], buildings: [],
  particles: [], flys: [], enemies: [],
  questIdx: 0,
  stats: { chops: 0, mines: 0, hunts: 0, harvests: 0, sold: 0, coletas: 0, defesas: 0 },
  dating: null, married: null,
  mode: 'jogo', buildSel: null,
  visitTimer: 45, enemyTimer: 8, noiteAnunciada: false,
};

const PLAYER_MAXHP = 100;
const NPC_MAXHP = 50;

function isNight() { return G.t > 0.74 || G.t < 0.06; }

/* ---------------- XP / nível ---------------- */
function addXP(n) {
  G.xp += n;
  while (G.level < NIVEL_MAX && G.xp >= XP_NIVEIS[G.level]) {
    G.level++;
    const novos = Object.entries(BUILD_DEFS)
      .filter(([id, d]) => d.nivel === G.level && d.menu !== false)
      .map(([id, d]) => d.icon + ' ' + d.nome);
    toast('⭐ A vila alcançou o nível ' + G.level + '!' +
      (novos.length ? ' Desbloqueado: ' + novos.join(', ') : ''));
    sfx('levelup');
  }
}

/* ---------------- Custos ---------------- */
function canAfford(custo) {
  for (const k in custo) if ((G.res[k] || 0) < custo[k]) return false;
  return true;
}
function spend(custo) {
  if (!canAfford(custo)) return false;
  for (const k in custo) G.res[k] -= custo[k];
  return true;
}
function custoTxt(custo) {
  return Object.entries(custo).map(([k, v]) => RES_INFO[k].icon + v).join(' ');
}

/* ---------------- Recursos voadores (estilo anúncio) ---------------- */
// quiet=true para coletas de NPC (som bem baixo, para não poluir o áudio)
function addRes(res, n, wx, wy, quiet) {
  if (n <= 0) return;
  if (wx === undefined || typeof chipScreenPos !== 'function') {
    G.res[res] += n;
    if (typeof bumpChip === 'function') bumpChip(res);
    return;
  }
  const p = chipScreenPos(res);
  G.flys.push({
    res, n,
    sx: wx - cam.x, sy: wy - cam.y,
    tx: p.x, ty: p.y, t: 0,
    arc: rand(30, 70),
    quiet: !!quiet,
  });
}
function updateFlys(dt) {
  for (let i = G.flys.length - 1; i >= 0; i--) {
    const f = G.flys[i];
    f.t += dt * 1.5;
    if (f.t >= 1) {
      G.res[f.res] += f.n;
      bumpChip(f.res);
      sfx('pop', f.quiet ? 0.06 : 1);
      G.flys.splice(i, 1);
    }
  }
}
function drawFlys(ctx) {
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const f of G.flys) {
    const e = ease(clamp(f.t, 0, 1));
    const x = lerp(f.sx, f.tx, e);
    const y = lerp(f.sy, f.ty, e) - Math.sin(e * Math.PI) * f.arc;
    ctx.font = '22px "Segoe UI Emoji", sans-serif';
    ctx.fillText(RES_INFO[f.res].icon, x, y);
    if (f.n > 1) {
      ctx.font = '800 13px "Segoe UI", sans-serif';
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = 'rgba(60,45,30,0.9)'; ctx.lineWidth = 3;
      ctx.strokeText('+' + f.n, x + 14, y - 8);
      ctx.fillText('+' + f.n, x + 14, y - 8);
    }
  }
}

/* ---------------- Partículas ---------------- */
function spawnParts(x, y, opts) {
  const n = opts.n || 6;
  for (let i = 0; i < n; i++) {
    G.particles.push({
      x: x + rand(-6, 6), y: y + rand(-6, 6),
      vx: rand(-60, 60), vy: rand(-110, -30),
      g: opts.g !== undefined ? opts.g : 260,
      life: rand(0.4, 0.8), max: 0.8,
      size: opts.size || rand(2, 4.5),
      color: opts.color || '#c9a06b',
      emoji: opts.emoji || null,
    });
  }
}
function updateParts(dt) {
  for (let i = G.particles.length - 1; i >= 0; i--) {
    const p = G.particles[i];
    p.life -= dt;
    if (p.life <= 0) { G.particles.splice(i, 1); continue; }
    p.vy += p.g * dt;
    p.x += p.vx * dt; p.y += p.vy * dt;
  }
}
function drawParts(ctx) {
  for (const p of G.particles) {
    const a = clamp(p.life / p.max, 0, 1);
    if (p.emoji) {
      ctx.globalAlpha = a;
      ctx.font = Math.round(p.size * 4) + 'px "Segoe UI Emoji"';
      ctx.textAlign = 'center';
      ctx.fillText(p.emoji, p.x - cam.x, p.y - cam.y);
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = a;
      ctx.fillRect(p.x - cam.x - p.size / 2, p.y - cam.y - p.size / 2, p.size, p.size);
      ctx.globalAlpha = 1;
    }
  }
}
