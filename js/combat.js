'use strict';
/* ============ Combate: inimigos noturnos, vida e defesa da vila ============
   - ladrão (humano): rouba plantações prontas e estoques de serraria/mina/pomar
   - lobo (animal): ataca diretamente os humanos (player e NPCs)
   Seguranças e caçadores defendem; o player luta com sua arma. */

const ENEMY_INFO = {
  ladrao: { hp: 6, vel: 54, xp: 8 },
  lobo:   { hp: 5, vel: 90, dano: 7, xp: 6 },
};

/* ---------------- Spawn ----------------
   surgem num anel caminhável ao redor da vila (as bordas do mapa são água) */
function spawnEnemy(tipo) {
  let p = null;
  for (let i = 0; i < 60; i++) {
    const ang = rand(TAU), r = rand(430, 560);
    const x = CENTRO.x + Math.cos(ang) * r, y = CENTRO.y + Math.sin(ang) * r;
    if (walkable(x, y)) { p = { x, y }; break; }
  }
  if (!p) { // fallback: qualquer grama longe do centro
    const g = findGrassSpot(360);
    if (g) p = g; else return;
  }
  const info = ENEMY_INFO[tipo];
  G.enemies.push({
    tipo, x: p.x, y: p.y, hp: info.hp, maxhp: info.hp,
    dir: 1, walkT: 0, moving: false, atkT: 0, hurt: 0,
    estado: 'ativo', alvo: null, loot: 0, wanderT: 0, fugaT: 0,
  });
}

/* ---------------- Alvos de roubo ---------------- */
function alvosRoubaveis() {
  const alvos = [];
  for (const b of G.buildings) {
    if (b.prog < 1) continue;
    if (b.id === 'campo' && b.stage >= 3) alvos.push(b);
    else if (BUILD_DEFS[b.id].gera && b.stock >= 1) alvos.push(b);
  }
  return alvos;
}
function bcx(b) { return (b.tx + b.w / 2) * TS; }
function bcy(b) { return (b.ty + b.h / 2) * TS; }

/* ---------------- Humanos (alvos dos lobos) ---------------- */
function humanoMaisProximo(x, y) {
  let best = G.player, bd = dist(x, y, G.player.x, G.player.y);
  if (G.player.hp <= 0) { best = null; bd = 1e9; }
  for (const n of G.npcs) {
    if (n.desmaiado || n.estado === 'chegando') continue;
    const d = dist(x, y, n.x, n.y);
    if (d < bd) { bd = d; best = n; }
  }
  return best;
}
function humanoInvalido(h) {
  if (!h) return true;
  if (h === G.player) return G.player.hp <= 0;
  return h.desmaiado || !G.npcs.includes(h);
}

/* ---------------- Movimento de inimigo (reusa desvio de água) ---------------- */
function moverInimigo(e, tx, ty, sp, dt) {
  const d = dist(e.x, e.y, tx, ty);
  if (d < 6) { e.moving = false; return true; }
  const vx = (tx - e.x) / d, vy = (ty - e.y) / d, step = sp * dt;
  if (!isWaterPx(e.x + vx * step, e.y + vy * step)) { e.x += vx * step; e.y += vy * step; }
  else if (!isWaterPx(e.x + vy * step, e.y - vx * step)) { e.x += vy * step; e.y -= vx * step; }
  else if (!isWaterPx(e.x - vy * step, e.y + vx * step)) { e.x -= vy * step; e.y += vx * step; }
  else return false;
  e.moving = true; e.walkT += dt;
  if (Math.abs(vx) > 0.15) e.dir = vx > 0 ? 1 : -1;
  return false;
}

/* ---------------- Dano ---------------- */
function danoNoHumano(h, dano) {
  h.hp -= dano; h.hurt = 0.3;
  spawnParts(h.x, h.y - 12, { color: '#c0554a', n: 4 });
  if (h === G.player) {
    sfx('hit');
    if (h.hp <= 0) { h.hp = 0; desmaiarPlayer(); }
  } else {
    sfx('hit', 0.12);
    if (h.hp <= 0) {
      h.hp = 0; h.desmaiado = true; h.workObj = null; h.alvoInimigo = null;
      spawnParts(h.x, h.y - 10, { emoji: '💫', n: 1, g: 0, size: 4 });
      toast('😵 ' + h.nome + ' desmaiou num ataque!');
    }
  }
}
function danoNoInimigo(e, dano, byPlayer) {
  e.hp -= dano; e.hurt = 0.25;
  spawnParts(e.x, e.y - 8, { color: '#c0554a', n: 4 });
  sfx('hit', byPlayer ? 1 : 0.14);
  if (e.hp <= 0 && byPlayer) { addXP(ENEMY_INFO[e.tipo].xp); G.stats.defesas++; }
}
function desmaiarPlayer() {
  const casa = G.buildings.find(b => b.id === 'casa');
  if (casa) { G.player.x = bcx(casa); G.player.y = (casa.ty + casa.h) * TS + 16; }
  else { G.player.x = CENTRO.x; G.player.y = CENTRO.y + 60; }
  G.player.hp = Math.round(G.player.maxhp * 0.5);
  cam.x = clamp(G.player.x - cam.w / 2, 0, WW * TS - cam.w);
  cam.y = clamp(G.player.y - cam.h / 2, 0, WH * TS - cam.h);
  const f = document.getElementById('fade');
  if (f) { f.style.opacity = 1; setTimeout(() => f.style.opacity = 0, 700); }
  toast('😵 Você desmaiou! Alguém te levou para casa.');
  sfx('no');
}

/* ---------------- Combate dos NPCs (segurança / caçador) ---------------- */
function inimigoMaisProximo(x, y, r) {
  let best = null, bd = r || 800;
  for (const e of G.enemies) {
    if (e.hp <= 0 || e.estado === 'fugindo') continue;
    const d = dist(x, y, e.x, e.y);
    if (d < bd) { bd = d; best = e; }
  }
  return best;
}
function combaterInimigos(n, dt) {
  if (!n.alvoInimigo || !G.enemies.includes(n.alvoInimigo) ||
      n.alvoInimigo.hp <= 0 || n.alvoInimigo.estado === 'fugindo') {
    n.alvoInimigo = inimigoMaisProximo(n.x, n.y, 750);
  }
  const e = n.alvoInimigo;
  if (!e) return false;
  const dano = profDe(n).id === 'seguranca' ? 2.2 : 1.6; // segurança bate mais forte
  if (npcMove(n, e.x, e.y, 84, dt) || dist(n.x, n.y, e.x, e.y) < 30) {
    n.swingT += dt;
    if (n.swingT > 0.8) { n.swingT = 0; n.swing = 1; n.dir = e.x >= n.x ? 1 : -1; danoNoInimigo(e, dano, false); }
  }
  return true;
}

/* ---------------- Loop dos inimigos ---------------- */
function updateEnemies(dt) {
  const dia = !isNight();
  for (let i = G.enemies.length - 1; i >= 0; i--) {
    const e = G.enemies[i];
    e.hurt = Math.max(0, e.hurt - dt);
    if (e.hp <= 0) { matarInimigo(e, i); continue; }

    // de dia (amanheceu) todos fogem para longe da vila e somem
    if (dia && e.estado !== 'fugindo') e.estado = 'fugindo';
    if (e.estado === 'fugindo') {
      e.fugaT = (e.fugaT || 0) + dt;
      const ang = Math.atan2(e.y - CENTRO.y, e.x - CENTRO.x);
      const bx = CENTRO.x + Math.cos(ang) * 640, by = CENTRO.y + Math.sin(ang) * 640;
      moverInimigo(e, bx, by, ENEMY_INFO[e.tipo].vel, dt);
      if (dist(e.x, e.y, CENTRO.x, CENTRO.y) > 560 || e.fugaT > 12) G.enemies.splice(i, 1);
      continue;
    }

    if (e.tipo === 'ladrao') updateLadrao(e, dt);
    else updateLobo(e, dt);
  }
}

function updateLadrao(e, dt) {
  const alvoOk = e.alvo && G.buildings.includes(e.alvo) &&
    ((e.alvo.id === 'campo' && e.alvo.stage >= 3) || (BUILD_DEFS[e.alvo.id].gera && e.alvo.stock >= 1));
  if (!alvoOk) {
    const alvos = alvosRoubaveis();
    e.alvo = alvos.length
      ? alvos.reduce((a, b) => dist(e.x, e.y, bcx(a), bcy(a)) < dist(e.x, e.y, bcx(b), bcy(b)) ? a : b)
      : null;
  }
  if (!e.alvo) { e.estado = 'fugindo'; return; }  // nada a roubar → vai embora
  const tx = bcx(e.alvo), ty = bcy(e.alvo);
  if (moverInimigo(e, tx, ty, ENEMY_INFO.ladrao.vel, dt) || dist(e.x, e.y, tx, ty) < 42) {
    roubar(e, e.alvo);
    e.estado = 'fugindo';
  }
}
function roubar(e, b) {
  if (b.id === 'campo' && b.stage >= 3) {
    b.stage = 0; b.cropT = 0; e.loot += (hasB('moinho') ? 5 : 3);
    toast('🥷 Um ladrão roubou uma plantação!');
  } else if (BUILD_DEFS[b.id].gera && b.stock >= 1) {
    e.loot += b.stock; b.stock = 0;
    toast('🥷 Um ladrão saqueou ' + BUILD_DEFS[b.id].nome + '!');
  }
  spawnParts(bcx(b), bcy(b), { emoji: '💢', n: 1, g: -20, size: 4 });
  sfx('no');
}

function updateLobo(e, dt) {
  if (humanoInvalido(e.alvo)) e.alvo = humanoMaisProximo(e.x, e.y);
  const h = e.alvo;
  if (!h) { e.estado = 'fugindo'; return; }
  if (dist(e.x, e.y, h.x, h.y) > 26) {
    moverInimigo(e, h.x, h.y, ENEMY_INFO.lobo.vel, dt);
    e.atkT = 0;
  } else {
    e.moving = false;
    e.dir = h.x >= e.x ? 1 : -1;
    e.atkT += dt;
    if (e.atkT > 1) { e.atkT = 0; danoNoHumano(h, ENEMY_INFO.lobo.dano); }
  }
}

function matarInimigo(e, i) {
  spawnParts(e.x, e.y - 6, { emoji: '💥', n: 1, g: 0, size: 5 });
  if (e.tipo === 'lobo') addRes('carne', 2, e.x, e.y - 10);
  G.enemies.splice(i, 1);
}

/* ---------------- Ondas noturnas ---------------- */
function updateWaves(dt) {
  const noite = isNight();
  if (noite) {
    if (!G.noiteAnunciada) {
      G.noiteAnunciada = true;
      if (G.day >= 2) toast('🌙 A noite chegou... fique atento a ladrões e lobos!');
    }
    G.enemyTimer -= dt;
    const ativos = G.enemies.filter(e => e.estado !== 'fugindo').length;
    const maxIn = Math.min(6, 1 + Math.floor(G.level / 2));
    if (G.enemyTimer <= 0 && ativos < maxIn && G.day >= 2) {
      G.enemyTimer = rand(7, 14);
      const temRoubo = alvosRoubaveis().length > 0;
      const tipo = (temRoubo && Math.random() < 0.5) ? 'ladrao' : 'lobo';
      spawnEnemy(tipo);
    }
  } else {
    G.noiteAnunciada = false;
    G.enemyTimer = 5;
  }
  updateEnemies(dt);
}

/* ---------------- Desenho ---------------- */
function drawEnemies(ctx) {
  for (const e of G.enemies) {
    if (e.x < cam.x - 60 || e.x > cam.x + cam.w + 60 || e.y < cam.y - 60 || e.y > cam.y + cam.h + 60) continue;
    if (e.tipo === 'lobo') drawLobo(ctx, e);
    else drawLadrao(ctx, e);
  }
}
function drawLobo(ctx, e) {
  const x = e.x - cam.x;
  const hop = e.moving ? Math.abs(Math.sin(e.walkT * 9)) * 2 : 0;
  const y = e.y - cam.y - hop;
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  ctx.beginPath(); ctx.ellipse(e.x - cam.x, e.y - cam.y + 1, 13, 4, 0, 0, TAU); ctx.fill();
  ctx.save();
  if (e.hurt > 0 && Math.floor(G.now * 20) % 2) ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#6b6f78';                                   // corpo cinza
  ctx.beginPath(); ctx.ellipse(x, y - 7, 14, 8, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#565a62';                                   // dorso escuro
  rr(ctx, x - 11, y - 15, 22, 5, 2); ctx.fill();
  ctx.fillStyle = '#6b6f78';
  ctx.beginPath(); ctx.arc(x + e.dir * 12, y - 8, 6, 0, TAU); ctx.fill(); // cabeça
  ctx.beginPath(); ctx.moveTo(x + e.dir * 8, y - 16); ctx.lineTo(x + e.dir * 11, y - 20); ctx.lineTo(x + e.dir * 13, y - 14); ctx.closePath(); ctx.fill(); // orelha
  ctx.fillStyle = '#3a3d43';
  ctx.beginPath(); ctx.arc(x + e.dir * 17, y - 6, 3, 0, TAU); ctx.fill();  // focinho
  ctx.fillStyle = '#fdf6e3';
  ctx.fillRect(x + e.dir * 15, y - 4, 2, 3);                                // presa
  ctx.fillStyle = '#e0c14a';
  ctx.beginPath(); ctx.arc(x + e.dir * 12, y - 9, 1.4, 0, TAU); ctx.fill(); // olho âmbar
  ctx.fillStyle = '#565a62';
  ctx.fillRect(x - 8, y - 1, 3, 5); ctx.fillRect(x + 5, y - 1, 3, 5);       // patas
  ctx.restore();
  barraVidaInimigo(ctx, x, y, e);
}
function drawLadrao(ctx, e) {
  const x = e.x - cam.x, y = e.y - cam.y;
  ctx.save();
  if (e.hurt > 0 && Math.floor(G.now * 20) % 2) ctx.globalAlpha = 0.5;
  drawChar(ctx, x, y, {
    pele: '#c99a6b', cabelo: '#2b2b2b', roupa: '#3d4250', calca: '#2f333d',
    estilo: 0, fem: false, barba: true,
  }, { dir: e.dir, walkT: e.walkT, moving: e.moving, swing: 0, tool: null, scale: 1 });
  // bandana/máscara sobre o rosto
  ctx.fillStyle = '#7a2f2f';
  rr(ctx, x - 8, y - 30, 16, 5, 2); ctx.fill();
  ctx.font = '11px "Segoe UI Emoji"'; ctx.textAlign = 'center';
  ctx.fillText('🥷', x, y - 40 + Math.sin(G.now * 3) * 1.5);
  ctx.restore();
  barraVidaInimigo(ctx, x, y - 4, e);
}
function barraVidaInimigo(ctx, x, y, e) {
  if (e.hp >= e.maxhp) return;
  ctx.fillStyle = 'rgba(40,30,20,0.55)'; ctx.fillRect(x - 12, y - 26, 24, 4);
  ctx.fillStyle = '#e0655a'; ctx.fillRect(x - 11, y - 25, 22 * (e.hp / e.maxhp), 2);
}
