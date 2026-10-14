'use strict';
/* ============ Loop principal, entrada, missões, save ============ */

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const SAVE_PREFIX = 'recanto_do_vale_slot';
const N_SLOTS = 3;
function slotKey(i) { return SAVE_PREFIX + i; }
function slotMeta(i) {
  try {
    const d = JSON.parse(localStorage.getItem(slotKey(i)));
    if (!d || d.versao !== 1) return null;
    const npcs = d.npcs || [];
    return {
      day: d.day, level: d.level,
      moradores: npcs.filter(n => n.estado === 'morador').length,
      casados: npcs.filter(n => n.casado).length,
    };
  } catch (e) { return null; }
}

const keys = {};
const mouse = { x: 0, y: 0 };

/* ---------------- Missões ---------------- */
const QUESTS = [
  { t: 'Corte 3 árvores (segure o clique nelas)', i: '🪓', done: g => g.stats.chops >= 3, xp: 15 },
  { t: 'Quebre 2 rochas com a picareta', i: '⛏️', done: g => g.stats.mines >= 2, xp: 15 },
  { t: 'Cace 1 animal com o facão', i: '🍖', done: g => g.stats.hunts >= 1, xp: 20 },
  { t: 'Construa um Campo (tecla B)', i: '🌾', done: g => hasB('campo'), xp: 25 },
  { t: 'Faça 2 colheitas no campo', i: '🧺', done: g => g.stats.harvests >= 2, xp: 25 },
  { t: 'Construa uma Cabana', i: '🛖', done: g => hasB('cabana'), xp: 25 },
  { t: 'Convide alguém para morar na vila', i: '🤝', done: g => g.npcs.some(n => n.estado === 'morador'), xp: 40 },
  { t: 'Alcance o nível 3 da vila', i: '⭐', done: g => g.level >= 3, xp: 30 },
  { t: 'Construa o Mercado e venda algo', i: '🏪', done: g => g.stats.sold > 0, xp: 30 },
  { t: 'Junte 100 moedas', i: '🪙', done: g => g.res.moeda >= 100, xp: 40 },
  { t: 'Tenha 3 moradores na vila', i: '🏘️', done: g => g.npcs.filter(n => n.estado === 'morador').length >= 3, xp: 50 },
  { t: 'Defenda a vila: derrote 1 invasor à noite', i: '⚔️', done: g => g.stats.defesas >= 1, xp: 40 },
  { t: 'Construa a Enfermaria', i: '⛑️', done: g => hasB('enfermaria'), xp: 30 },
  { t: 'Recrute um(a) segurança para a vila', i: '🛡️', done: g => g.npcs.some(n => n.estado === 'morador' && n.prof === 'seguranca'), xp: 40 },
  { t: 'Comece um namoro (8 corações ❤️)', i: '💞', done: g => g.npcs.some(n => n.namoro || n.casado), xp: 60 },
  { t: 'Construa a Capela', i: '💒', done: g => hasB('capela'), xp: 50 },
  { t: 'Case-se com quem você ama', i: '💍', done: g => g.npcs.some(n => n.casado), xp: 100 },
  { t: 'Construa o Hospital', i: '🏥', done: g => hasB('hospital'), xp: 60 },
  { t: 'Alcance o nível 8 — o vale renasceu!', i: '🏆', done: g => g.level >= 8, xp: 200 },
];

function checkQuests() {
  if (G.questIdx >= QUESTS.length) return;
  const q = QUESTS[G.questIdx];
  if (q.done(G)) {
    addXP(q.xp);
    toast('✅ Missão concluída: ' + q.t + ' (+' + q.xp + ' XP)');
    sfx('done');
    G.questIdx++;
    const qb = document.getElementById('questbox');
    qb.classList.remove('qdone'); void qb.offsetWidth; qb.classList.add('qdone');
    updateQuestBox();
  }
}

/* ---------------- Novo jogo / save ---------------- */
function newGame(slot) {
  if (slot !== undefined) G.slot = slot;
  G.seed = Math.floor(Math.random() * 1e9);
  G.day = 1; G.t = 0.28; G.xp = 0; G.level = 1; G.questIdx = 0; G.charm = 0;
  G.res = { madeira: 0, pedra: 0, carne: 0, fruta: 0, colheita: 0, moeda: 0 };
  G.tools = { machado: 1, picareta: 1 };
  G.weapons = { facao: true, espada: false, arco: false };
  G.armaAtiva = 'facao';
  G.arrows = [];
  G.anel = false; G.dating = null; G.married = null;
  G.stats = { chops: 0, mines: 0, hunts: 0, harvests: 0, sold: 0, coletas: 0, defesas: 0 };
  G.npcs = []; G.buildings = []; G.particles = []; G.flys = []; G.enemies = [];
  G.visitTimer = 40; G.enemyTimer = 8; G.noiteAnunciada = false;
  G.player.hp = G.player.maxhp = PLAYER_MAXHP; G.player.hurt = 0;
  G.mode = 'jogo'; G.buildSel = null;
  NPC_SEQ = 1;

  genWorld();
  // casa inicial no centro
  const ctx0 = Math.floor(WW / 2) - 1, cty = Math.floor(WH / 2) - 4;
  for (const o of G.objects) { // limpa área da casa
    if (o.x > (ctx0 - 1) * TS && o.x < (ctx0 + 4) * TS && o.y > (cty - 1) * TS && o.y < (cty + 4) * TS) o.dead = true, o.respawn = 9999;
  }
  colocarBuilding('casa', ctx0, cty, true);
  G.player.x = CENTRO.x;
  G.player.y = CENTRO.y + 30; // logo abaixo da casa inicial
  G.player.cores = { pele: '#eec39a', cabelo: '#5b4636', roupa: '#6a9bd4', calca: '#5b4636', estilo: 0, fem: false, barba: false, cilios: false };

  updateQuestBox();
  toast('🌄 Bem-vindo(a) ao vale! Chegue perto de uma árvore para cortar.');
}

function saveGame() {
  try {
    const data = {
      versao: G.versao, seed: G.seed, day: G.day, t: G.t,
      res: G.res, tools: G.tools, anel: G.anel,
      weapons: G.weapons, armaAtiva: G.armaAtiva,
      xp: G.xp, level: G.level, charm: G.charm,
      player: { x: G.player.x, y: G.player.y, cores: G.player.cores, hp: G.player.hp, maxhp: G.player.maxhp },
      objects: G.objects, npcs: G.npcs, buildings: G.buildings,
      questIdx: G.questIdx, stats: G.stats,
      dating: G.dating, married: G.married, npcSeq: NPC_SEQ,
    };
    localStorage.setItem(slotKey(G.slot), JSON.stringify(data));
  } catch (e) { /* armazenamento cheio/indisponível */ }
}

function loadGame(slot) {
  if (slot !== undefined) G.slot = slot;
  let data;
  try { data = JSON.parse(localStorage.getItem(slotKey(G.slot))); } catch (e) { data = null; }
  if (!data || data.versao !== 1) { newGame(G.slot); return; }
  G.seed = data.seed;
  genWorld();
  G.objects = data.objects;
  G.day = data.day; G.t = data.t;
  G.res = data.res; G.tools = data.tools; G.anel = data.anel;
  G.weapons = data.weapons || { facao: true, espada: false, arco: false };
  G.armaAtiva = data.armaAtiva || 'facao';
  G.arrows = []; G.enemies = []; G.enemyTimer = 8; G.noiteAnunciada = false;
  G.xp = data.xp; G.level = data.level; G.charm = data.charm;
  G.player.x = data.player.x; G.player.y = data.player.y;
  G.player.cores = data.player.cores;
  G.player.maxhp = data.player.maxhp || PLAYER_MAXHP;
  G.player.hp = data.player.hp !== undefined ? data.player.hp : G.player.maxhp;
  G.player.hurt = 0;
  G.npcs = data.npcs;
  G.buildings = data.buildings;
  G.questIdx = data.questIdx; G.stats = data.stats;
  if (G.stats.defesas === undefined) G.stats.defesas = 0;
  G.dating = data.dating; G.married = data.married;
  NPC_SEQ = data.npcSeq || 100;
  // limpa alvos de trabalho serializados + compatibilidade com saves antigos
  for (const n of G.npcs) {
    n.workObj = null; n.alvoInimigo = null; n.moving = false; n.swing = 0;
    if (n.cores.fem === undefined) n.cores.fem = n.fem;
    if (n.maxhp === undefined) { n.maxhp = NPC_MAXHP; n.hp = NPC_MAXHP; n.desmaiado = false; }
    if (n.amigo === undefined) n.amigo = false;
    // resgata visitantes que ficaram presos longe da vila (bug antigo de spawn)
    if ((n.estado === 'visitante' || n.estado === 'chegando') &&
        dist(n.x, n.y, CENTRO.x, CENTRO.y) > 520) {
      n.x = CENTRO.x + rand(-120, 120);
      n.y = CENTRO.y + rand(60, 160);
      if (isWaterPx(n.x, n.y)) { n.x = CENTRO.x; n.y = CENTRO.y + 70; }
    }
  }
  updateQuestBox();
  toast('💾 Jogo carregado. Bem-vindo(a) de volta, dia ' + G.day + '!');
}

/* ---------------- Entrada ---------------- */
window.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  audioStart();
  const k = e.key.toLowerCase();
  if (k === 'escape') {
    if (G.mode === 'construir' || G.mode === 'demolir') { G.mode = 'jogo'; G.buildSel = null; }
    else if (G.mode === 'painel' || G.mode === 'pausa') closePanel();
    else if (G.mode === 'dialogo') closeDialog();
    else if (G.mode === 'jogo') openPause();
  }
  if (k === 'b' && (G.mode === 'jogo' || G.mode === 'construir')) openBuildMenu();
  if (k === 'i') {
    if (G.mode === 'jogo') openInventario();
    else if (G.mode === 'painel') closePanel();
  }
  if (k === 'p') {
    if (G.mode === 'jogo') openNpcMenu();
    else if (G.mode === 'painel') closePanel();
  }
  if (k === 'm') sfxMuteBtn();
  if (k === 'e' && G.mode === 'jogo') interagir();
});
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

function sfxMuteBtn() {
  const btn = document.querySelectorAll('#btns button')[1];
  if (btn) btn.textContent = audioToggle() ? '🔊' : '🔇';
}

canvas.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
canvas.addEventListener('contextmenu', e => {
  e.preventDefault();
  if (G.mode === 'construir' || G.mode === 'demolir') { G.mode = 'jogo'; G.buildSel = null; }
});
canvas.addEventListener('mousedown', e => {
  audioStart();
  if (e.button !== 0) return;
  if (G.mode === 'construir' && G.buildSel) {
    const wx = mouse.x + cam.x, wy = mouse.y + cam.y;
    const def = BUILD_DEFS[G.buildSel];
    const tx = Math.floor(wx / TS - def.tam[0] / 2 + 0.5);
    const ty = Math.floor(wy / TS - def.tam[1] / 2 + 0.5);
    if (!podeColocar(G.buildSel, tx, ty)) { sfx('no'); return; }
    if (!spend(def.custo)) { toast('Recursos insuficientes!'); sfx('no'); return; }
    colocarBuilding(G.buildSel, tx, ty, false);
    if (!canAfford(def.custo)) { G.mode = 'jogo'; G.buildSel = null; } // sem recursos p/ outra
    return;
  }
  if (G.mode === 'demolir') {
    const b = buildingAt(mouse.x + cam.x, mouse.y + cam.y);
    if (b) demolirBuilding(b);
    else sfx('no');
    return;
  }
  if (G.mode === 'jogo') {
    mouse.down = true;
    actTimer = ACT_INT; bowT = BOW_INT; // primeira ação/tiro imediato
  }
});
window.addEventListener('mouseup', () => { mouse.down = false; });
canvas.addEventListener('mouseleave', () => { mouse.down = false; });

/* ---------------- Interação (tecla E) ---------------- */
function nearestInteract() {
  const p = G.player;
  // NPC mais próximo
  let best = null, bd = 64;
  for (const n of G.npcs) {
    if (n.estado === 'chegando') continue;
    const d = dist(p.x, p.y, n.x, n.y);
    if (d < bd) { bd = d; best = { tipo: 'npc', ref: n }; }
  }
  if (best) return best;
  // construção interativa
  bd = 84;
  for (const b of G.buildings) {
    if (b.prog < 1) continue;
    if (!['casa', 'mercado', 'ferreiro'].includes(b.id)) continue;
    const d = dist(p.x, p.y, (b.tx + b.w / 2) * TS, (b.ty + b.h / 2) * TS);
    if (d < bd) { bd = d; best = { tipo: 'building', ref: b }; }
  }
  return best;
}

function interagir() {
  const it = nearestInteract();
  if (!it) return;
  if (it.tipo === 'npc') { openDialog(it.ref); return; }
  const b = it.ref;
  if (b.id === 'mercado') openMercado();
  else if (b.id === 'ferreiro') openFerreiro();
  else if (b.id === 'casa') {
    if (isNight()) dormir();
    else toast('🛏️ Ainda é dia! Volte quando escurecer para dormir.');
  }
}

function dormir() {
  const fade = document.getElementById('fade');
  fade.style.opacity = 1;
  G.mode = 'dormindo';
  setTimeout(() => {
    G.day++; G.t = 0.28;
    onNewDay();
    saveGame();
    fade.style.opacity = 0;
    G.mode = 'jogo';
    toast('🌄 Dia ' + G.day + '. Um novo amanhecer no vale!');
  }, 1100);
}

function onNewDay() {
  // inimigos somem ao amanhecer
  G.enemies = [];
  // quem desmaiou se recupera com o descanso (médicos apenas aceleram durante a noite)
  let recuperados = 0;
  for (const n of G.npcs) {
    if (n.desmaiado) { n.desmaiado = false; n.hp = Math.round(n.maxhp * 0.4); recuperados++; }
    else if (n.hp < n.maxhp) n.hp = Math.min(n.maxhp, n.hp + n.maxhp * 0.4);
  }
  if (recuperados) toast('🌅 ' + recuperados + ' morador(es) se recuperaram durante a noite.');
  G.player.hp = Math.min(G.player.maxhp, G.player.hp + G.player.maxhp * 0.5);

  // cada cônjuge deixa um presentinho de bom dia
  for (const c of G.npcs.filter(n => n.casado)) {
    const presente = choice(['moeda', 'fruta', 'colheita', 'carne']);
    const qtd = presente === 'moeda' ? 5 : 2;
    G.res[presente] += qtd;
    bumpChip(presente);
    toast('💝 ' + c.nome + ' te deu ' + qtd + RES_INFO[presente].icon + ' de bom dia!');
  }
}

/* ---------------- Ação com o mouse (clique / segurar) ---------------- */
const ACT_INT = 0.45, BOW_INT = 0.55;
let actTimer = ACT_INT, bowT = BOW_INT;

function danoDaArma() {
  if (G.armaAtiva === 'espada' && G.weapons.espada) return 3;
  return 1; // facão
}

function pickTarget() {
  const wx = mouse.x + cam.x, wy = mouse.y + cam.y;
  const p = G.player;
  // prioridade: inimigos sob o cursor / ao alcance
  let best = null, bd = 50;
  for (const e of G.enemies) {
    if (e.hp <= 0) continue;
    const dc = dist(wx, wy, e.x, e.y - 8);
    if (dc < bd && dist(p.x, p.y, e.x, e.y) < 90) { bd = dc; best = { type: 'enemy', ref: e }; }
  }
  if (best) return best;
  bd = 44;
  for (const o of G.objects) {
    if (o.dead) continue;
    const dc = dist(wx, wy, o.x, o.y - 10);
    if (dc < bd && dist(p.x, p.y, o.x, o.y) < 85) { bd = dc; best = { type: 'obj', ref: o }; }
  }
  for (const a of G.animals) {
    const dc = dist(wx, wy, a.x, a.y - 6);
    if (dc < bd && dist(p.x, p.y, a.x, a.y) < 85) { bd = dc; best = { type: 'animal', ref: a }; }
  }
  // senão: inimigo próximo (defesa automática ao segurar clique), depois recurso
  if (!best) {
    const e = inimigoMaisProximo(p.x, p.y, 60);
    if (e) return { type: 'enemy', ref: e };
  }
  return best || nearestHarvest(p.x, p.y, 55);
}

function doAction() {
  const t = pickTarget();
  if (!t) return;
  const p = G.player;
  p.swing = 1;
  p.dir = t.ref.x >= p.x ? 1 : -1;
  if (t.type === 'obj') {
    const o = t.ref;
    if (o.kind === 'tree') { p.toolEmoji = '🪓'; hitObject(o, G.tools.machado, true); }
    else if (o.kind === 'rock') { p.toolEmoji = '⛏️'; hitObject(o, G.tools.picareta, true); }
    else { p.toolEmoji = '✋'; hitObject(o, 1, true); }
  } else if (t.type === 'enemy') {
    p.toolEmoji = (G.armaAtiva === 'espada' && G.weapons.espada) ? '🗡️' : '🔪';
    danoNoInimigo(t.ref, danoDaArma() + 1, true);
  } else {
    p.toolEmoji = (G.armaAtiva === 'espada' && G.weapons.espada) ? '🗡️' : '🔪';
    hitAnimal(t.ref, danoDaArma(), p.x, p.y, true);
  }
}

function shootArrow() {
  const p = G.player;
  const wx = mouse.x + cam.x, wy = mouse.y + cam.y;
  const dx = wx - p.x, dy = wy - (p.y - 14);
  const l = Math.hypot(dx, dy) || 1;
  G.arrows.push({ x: p.x, y: p.y - 14, vx: dx / l * 430, vy: dy / l * 430, life: 0.85 });
  p.swing = 1;
  p.toolEmoji = '🏹';
  p.dir = dx >= 0 ? 1 : -1;
  sfx('arrow');
}

function updateArrows(dt) {
  for (let i = G.arrows.length - 1; i >= 0; i--) {
    const f = G.arrows[i];
    f.life -= dt;
    f.x += f.vx * dt; f.y += f.vy * dt;
    let acabou = f.life <= 0;
    for (const e of G.enemies) {   // inimigos têm prioridade
      if (e.hp > 0 && dist(f.x, f.y, e.x, e.y - 6) < 16) {
        danoNoInimigo(e, 3, true);
        acabou = true;
        break;
      }
    }
    if (!acabou) for (const a of G.animals) {
      if (dist(f.x, f.y, a.x, a.y - 6) < 15) {
        hitAnimal(a, 2, f.x, f.y, true);
        acabou = true;
        break;
      }
    }
    if (acabou) G.arrows.splice(i, 1);
  }
}

function drawArrows(ctx) {
  for (const f of G.arrows) {
    const x = f.x - cam.x, y = f.y - cam.y;
    ctx.strokeStyle = '#8a5a3b'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x - f.vx * 0.035, y - f.vy * 0.035);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.fillStyle = '#e8e0d0';
    ctx.beginPath(); ctx.arc(x, y, 2, 0, TAU); ctx.fill();
  }
}

/* ---------------- Atualização ---------------- */

function update(dt) {
  if (G.mode === 'pausa' || G.mode === 'menu') return; // mundo congelado
  G.now += dt;
  const emJogo = G.mode === 'jogo' || G.mode === 'construir';

  // tempo do dia
  if (G.mode !== 'dormindo') {
    const antes = G.t;
    G.t += dt / DAY_LEN;
    if (G.t >= 1) { G.t -= 1; G.day++; onNewDay(); toast('🌄 Dia ' + G.day + '!'); }
  }

  // movimento do jogador
  const p = G.player;
  p.moving = false;
  if (emJogo) {
    let mx = 0, my = 0;
    if (keys['w'] || keys['arrowup']) my -= 1;
    if (keys['s'] || keys['arrowdown']) my += 1;
    if (keys['a'] || keys['arrowleft']) mx -= 1;
    if (keys['d'] || keys['arrowright']) mx += 1;
    if (mx || my) {
      const l = Math.hypot(mx, my); mx /= l; my /= l;
      const sp = 150;
      if (walkable(p.x + mx * sp * dt, p.y)) p.x += mx * sp * dt;
      if (walkable(p.x, p.y + my * sp * dt)) p.y += my * sp * dt;
      p.moving = true;
      p.walkT += dt;
      if (mx) p.dir = mx > 0 ? 1 : -1;
    }
  }
  p.swing = Math.max(0, p.swing - dt * 3);

  // ação segurando o botão do mouse
  if (G.mode === 'jogo' && mouse.down) {
    if (G.armaAtiva === 'arco' && G.weapons.arco) {
      bowT += dt;
      if (bowT >= BOW_INT) { bowT = 0; shootArrow(); }
    } else {
      actTimer += dt;
      if (actTimer >= ACT_INT) { actTimer = 0; doAction(); }
    }
  }
  updateArrows(dt);

  // câmera (arredondada para pixels inteiros -> tiles sem emendas/frestas)
  cam.w = canvas.width; cam.h = canvas.height;
  cam.x = lerp(cam.x, clamp(p.x - cam.w / 2, 0, WW * TS - cam.w), 0.12);
  cam.y = lerp(cam.y, clamp(p.y - cam.h / 2, 0, WH * TS - cam.h), 0.12);
  cam.x = Math.round(cam.x); cam.y = Math.round(cam.y);

  // vida do player: regen lento de dia, decaimento do flash de dano
  p.hurt = Math.max(0, (p.hurt || 0) - dt);
  if (!isNight() && p.hp < p.maxhp) p.hp = Math.min(p.maxhp, p.hp + 2.2 * dt);

  updateObjects(dt);
  updateAnimals(dt);
  updateBuildings(dt);
  updateWaves(dt);                 // inimigos noturnos
  for (const n of G.npcs) updateNPC(n, dt);
  separarNPCs();
  updateParts(dt);
  updateFlys(dt);

  // chegada de visitantes
  const visitantes = G.npcs.filter(n => n.estado === 'visitante' || n.estado === 'chegando').length;
  if (visitantes < 3 && G.npcs.length < 12) {
    G.visitTimer -= dt * (1 + G.charm / 40);
    if (G.visitTimer <= 0) {
      G.visitTimer = rand(55, 100);
      G.npcs.push(genNPC());
      toast('🧳 Um viajante se aproxima da vila! Siga a setinha 🙋');
    }
  }

  // dica de interação
  if (G.mode === 'jogo') {
    const it = nearestInteract();
    if (it) {
      if (it.tipo === 'npc') setHint(`<span class="key">E</span> Falar com ${it.ref.nome}`);
      else {
        const nomes = { casa: isNight() ? 'Dormir' : 'Sua casa', mercado: 'Vender no Mercado', ferreiro: 'Visitar o Ferreiro' };
        setHint(`<span class="key">E</span> ${nomes[it.ref.id]}`);
      }
    } else setHint(null);
  } else if (G.mode === 'construir') {
    setHint(`🔨 ${BUILD_DEFS[G.buildSel].icon} ${BUILD_DEFS[G.buildSel].nome} — clique para construir · botão direito cancela`);
  } else if (G.mode === 'demolir') {
    setHint(`🧨 Clique numa construção para demolir (recupera 50%) · botão direito ou ESC cancela`);
  } else setHint(null);

  // missões (2x por segundo é suficiente)
  if (!G._questT) G._questT = 0;
  G._questT += dt;
  if (G._questT > 0.5) { G._questT = 0; checkQuests(); }

  // autosave
  if (!G._saveT) G._saveT = 0;
  G._saveT += dt;
  if (G._saveT > 12) { G._saveT = 0; saveGame(); }
}

/* ---------------- Desenho ---------------- */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawWorldTiles(ctx);

  // entidades ordenadas por Y (profundidade)
  const ents = [];
  for (const b of G.buildings) ents.push({ y: (b.ty + b.h) * TS, f: () => drawBuilding(ctx, b) });
  for (const o of G.objects) {
    if (o.x < cam.x - 60 || o.x > cam.x + cam.w + 60 || o.y < cam.y - 80 || o.y > cam.y + cam.h + 40) continue;
    ents.push({ y: o.y, f: () => drawObj(ctx, o) });
  }
  for (const a of G.animals) {
    if (a.x < cam.x - 60 || a.x > cam.x + cam.w + 60 || a.y < cam.y - 60 || a.y > cam.y + cam.h + 40) continue;
    ents.push({ y: a.y, f: () => drawAnimal(ctx, a) });
  }
  for (const n of G.npcs) ents.push({ y: n.y, f: () => drawNPC(ctx, n) });
  for (const e of G.enemies) {
    if (e.x < cam.x - 60 || e.x > cam.x + cam.w + 60 || e.y < cam.y - 60 || e.y > cam.y + cam.h + 60) continue;
    ents.push({ y: e.y, f: () => (e.tipo === 'lobo' ? drawLobo(ctx, e) : drawLadrao(ctx, e)) });
  }
  const p = G.player;
  ents.push({
    y: p.y, f: () => {
      ctx.save();
      if (p.hurt > 0 && Math.floor(G.now * 20) % 2) ctx.globalAlpha = 0.5;
      drawChar(ctx, p.x - cam.x, p.y - cam.y, p.cores, {
        dir: p.dir, walkT: p.walkT, moving: p.moving, swing: p.swing,
        tool: p.swing > 0 ? (p.toolEmoji || '🪓') : null, scale: 1.05,
      });
      ctx.restore();
      if (G.npcs.some(n => n.casado)) {
        ctx.font = '10px "Segoe UI Emoji"'; ctx.textAlign = 'center';
        ctx.fillText('💍', p.x - cam.x + 10, p.y - cam.y - 40);
      }
    }
  });
  ents.sort((a, b) => a.y - b.y);
  for (const e of ents) e.f();

  drawArrows(ctx);
  drawParts(ctx);

  // fantasma de construção
  if (G.mode === 'construir' && G.buildSel) {
    const def = BUILD_DEFS[G.buildSel];
    const wx = mouse.x + cam.x, wy = mouse.y + cam.y;
    const tx = Math.floor(wx / TS - def.tam[0] / 2 + 0.5);
    const ty = Math.floor(wy / TS - def.tam[1] / 2 + 0.5);
    const ok = podeColocar(G.buildSel, tx, ty);
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = ok ? '#8fc177' : '#e0655a';
    rr(ctx, tx * TS - cam.x, ty * TS - cam.y, def.tam[0] * TS, def.tam[1] * TS, 6);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.font = '26px "Segoe UI Emoji"'; ctx.textAlign = 'center';
    ctx.fillText(def.icon, (tx + def.tam[0] / 2) * TS - cam.x, (ty + def.tam[1] / 2) * TS - cam.y + 8);
  }

  // destaque de demolição
  if (G.mode === 'demolir') {
    const b = buildingAt(mouse.x + cam.x, mouse.y + cam.y);
    if (b) {
      const podeDemolir = b.id !== 'casa';
      ctx.globalAlpha = 0.4 + Math.sin(G.now * 6) * 0.12;
      ctx.fillStyle = podeDemolir ? '#e0655a' : '#8a8a8a';
      rr(ctx, b.tx * TS - cam.x, b.ty * TS - cam.y, b.w * TS, b.h * TS, 6);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.font = '26px "Segoe UI Emoji"'; ctx.textAlign = 'center';
      ctx.fillText(podeDemolir ? '🧨' : '🚫',
        (b.tx + b.w / 2) * TS - cam.x, (b.ty + b.h / 2) * TS - cam.y + 8);
    }
  }

  // tonalidade do dia/noite
  let escuro = 0;
  if (G.t > 0.68) escuro = clamp((G.t - 0.68) / 0.1, 0, 1);       // entardecer -> noite
  else if (G.t < 0.10) escuro = clamp((0.10 - G.t) / 0.08, 0, 1); // madrugada -> manhã
  if (escuro > 0.02) {
    ctx.fillStyle = `rgba(20, 24, 60, ${escuro * 0.45})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // entardecer alaranjado
    if (G.t > 0.66 && G.t < 0.78) {
      ctx.fillStyle = `rgba(230, 130, 60, ${0.12 * (1 - Math.abs(G.t - 0.72) / 0.06)})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  // indicador de visitantes fora da tela (para nunca mais "perder" um NPC)
  for (const n of G.npcs) {
    if (n.estado !== 'visitante' && n.estado !== 'chegando') continue;
    const sx = n.x - cam.x, sy = n.y - cam.y;
    if (sx > -30 && sx < cam.w + 30 && sy > -30 && sy < cam.h + 30) continue;
    const cx2 = cam.w / 2, cy2 = cam.h / 2;
    const dx = sx - cx2, dy = sy - cy2;
    const t = Math.min(
      (cam.w / 2 - 46) / Math.abs(dx || 1e-9),
      (cam.h / 2 - 46) / Math.abs(dy || 1e-9));
    const ix = cx2 + dx * t, iy = cy2 + dy * t;
    ctx.fillStyle = 'rgba(253,246,227,0.95)';
    ctx.strokeStyle = '#c9b087'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(ix, iy, 16, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.save();
    ctx.translate(ix, iy); ctx.rotate(Math.atan2(dy, dx));
    ctx.fillStyle = '#c9855a';
    ctx.beginPath(); ctx.moveTo(26, 0); ctx.lineTo(15, -7); ctx.lineTo(15, 7); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.font = '15px "Segoe UI Emoji"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🙋', ix, iy);
    ctx.textBaseline = 'alphabetic';
  }

  // mira do arco
  if (G.mode === 'jogo' && G.armaAtiva === 'arco' && G.weapons.arco) {
    ctx.strokeStyle = 'rgba(253,246,227,0.95)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 9, 0, TAU); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(mouse.x - 15, mouse.y); ctx.lineTo(mouse.x - 5, mouse.y);
    ctx.moveTo(mouse.x + 5, mouse.y); ctx.lineTo(mouse.x + 15, mouse.y);
    ctx.moveTo(mouse.x, mouse.y - 15); ctx.lineTo(mouse.x, mouse.y - 5);
    ctx.moveTo(mouse.x, mouse.y + 5); ctx.lineTo(mouse.x, mouse.y + 15);
    ctx.stroke();
    ctx.fillStyle = 'rgba(224,101,90,0.9)';
    ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 2, 0, TAU); ctx.fill();
  }

  drawFlys(ctx);
  updateHUD();
}

/* ---------------- Boot ---------------- */
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
window.addEventListener('beforeunload', () => { if (G.buildings.length) saveGame(); });

let lastT = 0;
function loop(ts) {
  const dt = Math.min(0.05, (ts - lastT) / 1000 || 0.016);
  lastT = ts;
  if (G.buildings.length) { // só roda depois de newGame/loadGame
    update(dt);
    draw();
  }
  requestAnimationFrame(loop);
}

// migra o save único antigo para o slot 1, se existir
(function migrarSaveAntigo() {
  const antigo = localStorage.getItem('recanto_do_vale_save1');
  if (antigo && !localStorage.getItem(slotKey(0))) {
    localStorage.setItem(slotKey(0), antigo);
    localStorage.removeItem('recanto_do_vale_save1');
  }
})();

resize();
initUI();
updateQuestBox();
showIntro();
requestAnimationFrame(loop);
