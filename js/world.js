'use strict';
/* ============ Mundo: geração procedural, tiles, árvores, rochas, animais ============ */

let tiles = null; // 0 grama, 1 água, 2 areia

function tileAt(tx, ty) {
  if (tx < 0 || ty < 0 || tx >= WW || ty >= WH) return 1;
  return tiles[ty * WW + tx];
}
function isWaterPx(x, y) { return tileAt(Math.floor(x / TS), Math.floor(y / TS)) === 1; }

function insideBuildingPx(x, y, margem) {
  const m = margem || 0;
  for (const b of G.buildings) {
    if (x > b.tx * TS - m && x < (b.tx + b.w) * TS + m &&
        y > b.ty * TS - m && y < (b.ty + b.h) * TS + m) return b;
  }
  return null;
}
function walkable(x, y) {
  if (x < TS || y < TS || x > (WW - 1) * TS || y > (WH - 1) * TS) return false;
  if (isWaterPx(x, y)) return false;
  if (insideBuildingPx(x, y)) return false;
  return true;
}

const CENTRO = { x: WW * TS / 2, y: WH * TS / 2 };

/* ---------------- Geração ---------------- */
function genWorld() {
  const rng = mulberry32(G.seed);
  tiles = new Uint8Array(WW * WH);

  const gs = 12;
  const mk = () => { const g = []; for (let i = 0; i < (gs + 2) * (gs + 2); i++) g.push(rng()); return g; };
  const g1 = mk(), g2 = mk();
  const sample = (g, nx, ny) => {
    const x0 = Math.floor(nx), y0 = Math.floor(ny);
    const fx = nx - x0, fy = ny - y0;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const v = (gx, gy) => g[gy * (gs + 2) + gx];
    return lerp(lerp(v(x0, y0), v(x0 + 1, y0), sx), lerp(v(x0, y0 + 1), v(x0 + 1, y0 + 1), sx), sy);
  };

  for (let ty = 0; ty < WH; ty++) {
    for (let tx = 0; tx < WW; tx++) {
      let h = sample(g1, tx / WW * gs, ty / WH * gs);
      const dx = Math.abs(tx - WW / 2) / (WW / 2);
      const dy = Math.abs(ty - WH / 2) / (WH / 2);
      const d = Math.max(dx, dy);
      h -= Math.pow(d, 3.2) * 0.85;                       // bordas viram água
      const dc = dist(tx, ty, WW / 2, WH / 2);
      if (dc < 11) h = Math.max(h, 0.5);                   // centro sempre grama
      tiles[ty * WW + tx] = h < 0.30 ? 1 : (h < 0.355 ? 2 : 0);
    }
  }

  // objetos: florestas, rochas, arbustos
  G.objects = [];
  for (let ty = 1; ty < WH - 1; ty++) {
    for (let tx = 1; tx < WW - 1; tx++) {
      if (tiles[ty * WW + tx] !== 0) continue;
      const dc = dist(tx, ty, WW / 2, WH / 2);
      if (dc < 5) continue;                                // clareira inicial
      const f = sample(g2, tx / WW * gs, ty / WH * gs);
      const r = rng();
      const denso = dc < 9 ? 0.35 : 1;                     // menos denso perto do centro
      let kind = null;
      if (f > 0.58 && r < 0.34 * denso) kind = 'tree';
      else if (r < 0.022 * denso) kind = 'tree';
      else if (r < 0.040 * denso) kind = 'rock';
      else if (r < 0.062 * denso) kind = 'bush';
      if (kind) {
        G.objects.push(mkObj(kind,
          tx * TS + 16 + (rng() - 0.5) * 10,
          ty * TS + 24 + (rng() - 0.5) * 8, rng()));
      }
    }
  }

  // animais iniciais
  G.animals = [];
  for (let i = 0; i < 9; i++) spawnAnimal('coelho');
  for (let i = 0; i < 6; i++) spawnAnimal('javali');
}

function mkObj(kind, x, y, seed) {
  const hp = kind === 'tree' ? 3 : kind === 'rock' ? 5 : 1;
  return { kind, x, y, seed: seed || Math.random(), hp, maxhp: hp, dead: false, respawn: 0, shake: 0 };
}

function findGrassSpot(minDistPlayer) {
  for (let i = 0; i < 60; i++) {
    const tx = randi(2, WW - 3), ty = randi(2, WH - 3);
    if (tiles[ty * WW + tx] !== 0) continue;
    const x = tx * TS + 16, y = ty * TS + 16;
    if (insideBuildingPx(x, y, 16)) continue;
    if (minDistPlayer && dist(x, y, G.player.x, G.player.y) < minDistPlayer) continue;
    return { x, y };
  }
  return null;
}

/* ---------------- Animais ---------------- */
const ANIMAL_INFO = {
  coelho: { hp: 2, carne: 1, vel: 92, xp: 3 },
  javali: { hp: 4, carne: 3, vel: 66, xp: 6 },
};
function spawnAnimal(kind, longe) {
  const p = findGrassSpot(longe ? 350 : 0);
  if (!p) return;
  G.animals.push({
    kind, x: p.x, y: p.y, hp: ANIMAL_INFO[kind].hp,
    dir: 1, t: rand(1, 3), vx: 0, vy: 0, hopT: 0, moving: false, hurt: 0,
  });
}

function updateAnimals(dt) {
  const pl = G.player;
  for (const a of G.animals) {
    const info = ANIMAL_INFO[a.kind];
    a.hurt = Math.max(0, a.hurt - dt);
    const d = dist(a.x, a.y, pl.x, pl.y);
    let sp = 0;
    if (d < 115 && !isNight()) {
      // foge do jogador
      const ang = Math.atan2(a.y - pl.y, a.x - pl.x) + Math.sin(G.now * 3 + a.x) * 0.5;
      a.vx = Math.cos(ang); a.vy = Math.sin(ang);
      sp = info.vel;
    } else {
      a.t -= dt;
      if (a.t <= 0) {
        a.t = rand(1.5, 4);
        if (Math.random() < 0.55) { const ang = rand(TAU); a.vx = Math.cos(ang); a.vy = Math.sin(ang); }
        else { a.vx = 0; a.vy = 0; }
      }
      if (a.vx || a.vy) sp = info.vel * 0.3;
    }
    a.moving = sp > 0;
    if (a.moving) {
      a.hopT += dt * (a.kind === 'coelho' ? 11 : 7);
      const nx = a.x + a.vx * sp * dt, ny = a.y + a.vy * sp * dt;
      if (walkable(nx, ny)) { a.x = nx; a.y = ny; }
      else { a.vx = -a.vx; a.vy = -a.vy; a.t = 0.3; }
      if (a.vx) a.dir = a.vx > 0 ? 1 : -1;
    }
  }
  // repovoamento
  if (!G._animalT) G._animalT = 0;
  G._animalT += dt;
  if (G._animalT > 7) {
    G._animalT = 0;
    const nc = G.animals.filter(a => a.kind === 'coelho').length;
    const nj = G.animals.filter(a => a.kind === 'javali').length;
    if (nc < 9) spawnAnimal('coelho', true);
    if (nj < 6) spawnAnimal('javali', true);
  }
}

function hitAnimal(a, dmg, hunterX, hunterY, giveToPlayer) {
  a.hp -= dmg; a.hurt = 0.25;
  const v = giveToPlayer ? 1 : 0.08;   // som de NPC bem baixo
  spawnParts(a.x, a.y - 8, { color: '#c0554a', n: 5 });
  sfx('hit', v);
  if (a.hp <= 0) {
    const info = ANIMAL_INFO[a.kind];
    spawnParts(a.x, a.y - 6, { emoji: '💥', n: 1, g: 0, size: 5 });
    addRes('carne', info.carne, a.x, a.y - 10, !giveToPlayer);
    if (giveToPlayer) { addXP(info.xp); G.stats.hunts++; }
    G.animals.splice(G.animals.indexOf(a), 1);
  }
}

/* ---------------- Colheita de objetos ---------------- */
function hitObject(o, dmg, byPlayer) {
  o.hp -= dmg; o.shake = 1;
  const v = byPlayer ? 1 : 0.08;   // som de NPC bem baixo
  if (o.kind === 'tree') { spawnParts(o.x, o.y - 26, { color: '#6fae62', n: 7 }); sfx('chop', v); }
  else if (o.kind === 'rock') { spawnParts(o.x, o.y - 8, { color: '#9a9a9a', n: 6 }); sfx('mine', v); }
  else { spawnParts(o.x, o.y - 8, { color: '#7fb069', n: 5 }); sfx('rustle', v); }
  if (o.hp <= 0) {
    o.dead = true;
    if (o.kind === 'tree') {
      o.respawn = 50;
      addRes('madeira', 3, o.x, o.y - 20, !byPlayer);
      if (byPlayer) { G.stats.chops++; addXP(2); }
      sfx('fall', v);
    } else if (o.kind === 'rock') {
      o.respawn = 65;
      addRes('pedra', 3, o.x, o.y - 8, !byPlayer);
      if (byPlayer) { G.stats.mines++; addXP(2); }
    } else {
      o.respawn = 28;
      addRes('fruta', 2, o.x, o.y - 8, !byPlayer);
      if (byPlayer) { G.stats.coletas++; addXP(1); }
    }
  }
}

function updateObjects(dt) {
  for (const o of G.objects) {
    if (o.shake > 0) o.shake = Math.max(0, o.shake - dt * 4);
    if (o.dead) {
      o.respawn -= dt;
      if (o.respawn <= 0 && !insideBuildingPx(o.x, o.y, 8)) {
        o.dead = false; o.hp = o.maxhp;
        spawnParts(o.x, o.y - 10, { color: '#8fc177', n: 5, g: 80 });
      }
    }
  }
}

/* alvo mais próximo para colher (jogador ou NPC) */
function nearestHarvest(x, y, r, kinds) {
  let best = null, bd = r;
  for (const o of G.objects) {
    if (o.dead) continue;
    if (kinds && !kinds.includes(o.kind)) continue;
    const d = dist(x, y, o.x, o.y);
    if (d < bd) { bd = d; best = { type: 'obj', ref: o, d }; }
  }
  if (!kinds || kinds.includes('animal')) {
    for (const a of G.animals) {
      const d = dist(x, y, a.x, a.y);
      if (d < bd) { bd = d; best = { type: 'animal', ref: a, d }; }
    }
  }
  return best;
}

/* ---------------- Desenho do mundo ---------------- */
// tons de grama bem próximos entre si -> campo suave, sem "xadrez"
const COR_GRAMA = ['#8ebd76', '#8fc177', '#91c079'];
function drawWorldTiles(ctx) {
  const x0 = Math.max(0, Math.floor(cam.x / TS));
  const y0 = Math.max(0, Math.floor(cam.y / TS));
  const x1 = Math.min(WW - 1, Math.ceil((cam.x + cam.w) / TS));
  const y1 = Math.min(WH - 1, Math.ceil((cam.y + cam.h) / TS));
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const t = tiles[ty * WW + tx];
      const px = Math.round(tx * TS - cam.x), py = Math.round(ty * TS - cam.y);
      const OV = TS + 1; // sobrepõe 1px o vizinho -> elimina frestas/bordas pretas
      const h = hash2(tx, ty);
      if (t === 0) {
        ctx.fillStyle = COR_GRAMA[Math.floor(h * 3)];
        ctx.fillRect(px, py, OV, OV);
        if (h > 0.96) { // florzinha
          ctx.fillStyle = h > 0.98 ? '#f7e884' : '#fdf6e3';
          ctx.fillRect(px + 8 + h * 14, py + 10, 3, 3);
          ctx.fillStyle = '#e8a13c';
          ctx.fillRect(px + 9 + h * 14, py + 11, 1, 1);
        } else if (h < 0.05) { // tufo de grama
          ctx.fillStyle = '#79ab63';
          ctx.fillRect(px + 6, py + 18, 2, 5);
          ctx.fillRect(px + 10, py + 16, 2, 7);
          ctx.fillRect(px + 14, py + 19, 2, 4);
        }
      } else if (t === 1) {
        ctx.fillStyle = '#6fb0d6';
        ctx.fillRect(px, py, OV, OV);
        const w = Math.sin(G.now * 1.6 + tx * 0.9 + ty * 1.3);
        if (w > 0.75) {
          ctx.fillStyle = 'rgba(255,255,255,0.25)';
          ctx.fillRect(px + 4, py + 12 + Math.floor(h * 10), 16, 2);
        }
      } else {
        ctx.fillStyle = h > 0.5 ? '#e3d09a' : '#e1cd95';
        ctx.fillRect(px, py, OV, OV);
      }
    }
  }
}

/* ---------------- Desenho dos objetos ---------------- */
function drawObj(ctx, o) {
  const x = o.x - cam.x, y = o.y - cam.y;
  const shake = o.shake > 0 ? Math.sin(o.shake * 30) * o.shake * 3 : 0;
  if (o.kind === 'tree') {
    if (o.dead) { // toco
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.beginPath(); ctx.ellipse(x, y, 9, 4, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#9a6a44'; rr(ctx, x - 6, y - 8, 12, 8, 3); ctx.fill();
      ctx.fillStyle = '#c99a6b'; ctx.beginPath(); ctx.ellipse(x, y - 8, 6, 3, 0, 0, TAU); ctx.fill();
      return;
    }
    const sway = Math.sin(G.now * 1.1 + o.seed * 9) * 1.6 + shake;
    ctx.fillStyle = 'rgba(0,0,0,0.14)';
    ctx.beginPath(); ctx.ellipse(x, y, 13, 5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#8a5a3b';
    rr(ctx, x - 4, y - 22, 8, 22, 3); ctx.fill();
    const tipo = o.seed;
    const c1 = tipo < 0.25 ? '#d98f4a' : tipo < 0.4 ? '#c9764a' : '#5e9c56'; // algumas árvores outonais
    const c2 = tipo < 0.25 ? '#e8a75f' : tipo < 0.4 ? '#d98a5c' : '#6fae62';
    ctx.fillStyle = c1;
    ctx.beginPath(); ctx.arc(x + sway, y - 34, 15, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(x - 9 + sway * 0.7, y - 26, 11, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 9 + sway * 0.7, y - 26, 11, 0, TAU); ctx.fill();
    ctx.fillStyle = c2;
    ctx.beginPath(); ctx.arc(x - 3 + sway, y - 36, 9, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 6 + sway, y - 31, 7, 0, TAU); ctx.fill();
  } else if (o.kind === 'rock') {
    if (o.dead) {
      ctx.fillStyle = '#a9a9a3';
      ctx.fillRect(x - 6, y - 3, 5, 4); ctx.fillRect(x + 2, y - 4, 6, 5);
      return;
    }
    ctx.fillStyle = 'rgba(0,0,0,0.14)';
    ctx.beginPath(); ctx.ellipse(x, y + 1, 12, 4.5, 0, 0, TAU); ctx.fill();
    ctx.save(); ctx.translate(shake, 0);
    ctx.fillStyle = '#9a9a94';
    ctx.beginPath(); ctx.moveTo(x - 11, y); ctx.lineTo(x - 7, y - 12); ctx.lineTo(x + 2, y - 15);
    ctx.lineTo(x + 10, y - 8); ctx.lineTo(x + 11, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#b5b5ae';
    ctx.beginPath(); ctx.moveTo(x - 7, y - 12); ctx.lineTo(x + 2, y - 15); ctx.lineTo(x + 4, y - 7);
    ctx.lineTo(x - 4, y - 6); ctx.closePath(); ctx.fill();
    ctx.restore();
  } else { // bush
    if (o.dead) {
      ctx.fillStyle = '#79ab63';
      ctx.fillRect(x - 3, y - 4, 2, 4); ctx.fillRect(x + 1, y - 5, 2, 5);
      return;
    }
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath(); ctx.ellipse(x, y + 1, 11, 4, 0, 0, TAU); ctx.fill();
    ctx.save(); ctx.translate(shake, 0);
    ctx.fillStyle = '#5e9c56';
    ctx.beginPath(); ctx.arc(x - 5, y - 5, 7, 0, TAU); ctx.arc(x + 5, y - 5, 7, 0, TAU);
    ctx.arc(x, y - 9, 7, 0, TAU); ctx.fill();
    ctx.fillStyle = '#5560a8';
    const bx = [x - 6, x + 1, x + 6, x - 1];
    const by = [y - 5, y - 11, y - 4, y - 6];
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(bx[i], by[i], 1.8, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
}

function drawAnimal(ctx, a) {
  const x = a.x - cam.x;
  const hop = a.moving ? Math.abs(Math.sin(a.hopT)) * (a.kind === 'coelho' ? 5 : 2) : 0;
  const y = a.y - cam.y - hop;
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath(); ctx.ellipse(a.x - cam.x, a.y - cam.y + 1, a.kind === 'coelho' ? 8 : 13, 3.5, 0, 0, TAU); ctx.fill();
  ctx.save();
  if (a.hurt > 0 && Math.floor(G.now * 20) % 2) ctx.globalAlpha = 0.5;
  if (a.kind === 'coelho') {
    ctx.fillStyle = hash2(Math.floor(a.x), 7) > 0.5 ? '#efe9dc' : '#cbb79b';
    ctx.beginPath(); ctx.ellipse(x, y - 5, 8, 6, 0, 0, TAU); ctx.fill();          // corpo
    ctx.beginPath(); ctx.arc(x + a.dir * 6, y - 8, 4.5, 0, TAU); ctx.fill();      // cabeça
    rr(ctx, x + a.dir * 5 - 1.5, y - 18, 3, 8, 1.5); ctx.fill();                  // orelha 1
    rr(ctx, x + a.dir * 8 - 1.5, y - 17, 3, 7, 1.5); ctx.fill();                  // orelha 2
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x - a.dir * 7, y - 5, 2.5, 0, TAU); ctx.fill();      // rabinho
    ctx.fillStyle = '#3b2b20';
    ctx.beginPath(); ctx.arc(x + a.dir * 8, y - 9, 1, 0, TAU); ctx.fill();        // olho
  } else {
    ctx.fillStyle = '#7a5238';
    ctx.beginPath(); ctx.ellipse(x, y - 7, 14, 9, 0, 0, TAU); ctx.fill();         // corpo
    ctx.fillStyle = '#5f3d28';
    rr(ctx, x - 10, y - 16, 20, 5, 2); ctx.fill();                                // crina
    ctx.fillStyle = '#7a5238';
    ctx.beginPath(); ctx.arc(x + a.dir * 12, y - 7, 6, 0, TAU); ctx.fill();       // cabeça
    ctx.fillStyle = '#8f6a4c';
    ctx.beginPath(); ctx.arc(x + a.dir * 16, y - 5, 3, 0, TAU); ctx.fill();       // focinho
    ctx.fillStyle = '#fdf6e3';
    ctx.fillRect(x + a.dir * 14, y - 3, 2, 4);                                    // presa
    ctx.fillStyle = '#2b1d12';
    ctx.beginPath(); ctx.arc(x + a.dir * 12, y - 9, 1.2, 0, TAU); ctx.fill();     // olho
    ctx.fillStyle = '#5f3d28';
    ctx.fillRect(x - 8, y - 1, 4, 4); ctx.fillRect(x + 4, y - 1, 4, 4);           // patas
  }
  ctx.restore();
  // barra de vida
  const info = ANIMAL_INFO[a.kind];
  if (a.hp < info.hp) {
    ctx.fillStyle = 'rgba(40,30,20,0.55)';
    ctx.fillRect(x - 11, y - 24, 22, 4);
    ctx.fillStyle = '#e0655a';
    ctx.fillRect(x - 10, y - 23, 20 * (a.hp / info.hp), 2);
  }
}
