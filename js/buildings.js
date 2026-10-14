'use strict';
/* ============ Construções: definições, colocação, produção e desenho ============ */

const BUILD_DEFS = {
  casa:     { nome: 'Casa', icon: '🏠', tam: [3, 3], custo: {}, nivel: 1, menu: false,
              desc: 'Seu lar. Durma para pular a noite.' },
  campo:    { nome: 'Campo', icon: '🌾', tam: [3, 2], custo: { madeira: 8 }, nivel: 1,
              desc: 'Cresce sozinho. Chegue perto para colher.' },
  cabana:   { nome: 'Cabana', icon: '🛖', tam: [2, 2], custo: { madeira: 12, pedra: 4 }, nivel: 1,
              desc: 'Um novo morador pode viver aqui.' },
  serraria: { nome: 'Serraria', icon: '🪚', tam: [3, 2], custo: { madeira: 15, pedra: 8 }, nivel: 2,
              desc: 'Produz madeira sozinha.', gera: { res: 'madeira', int: 12, cap: 8 } },
  poco:     { nome: 'Poço', icon: '💧', tam: [2, 2], custo: { pedra: 10 }, nivel: 2,
              desc: 'Acelera campos próximos.' },
  mina:     { nome: 'Mina', icon: '⛏️', tam: [3, 2], custo: { madeira: 20, pedra: 10 }, nivel: 3,
              desc: 'Produz pedra sozinha.', gera: { res: 'pedra', int: 15, cap: 6 } },
  mercado:  { nome: 'Mercado', icon: '🏪', tam: [3, 2], custo: { madeira: 25, pedra: 10 }, nivel: 3,
              desc: 'Venda recursos por moedas (tecla E).' },
  ferreiro: { nome: 'Ferreiro', icon: '⚒️', tam: [2, 2], custo: { madeira: 20, pedra: 20 }, nivel: 4,
              desc: 'Melhore ferramentas e compre o anel (E).' },
  enfermaria: { nome: 'Enfermaria', icon: '⛑️', tam: [2, 2], custo: { madeira: 18, pedra: 10 }, nivel: 4,
              desc: 'Enfermeiros(as) curam a vida de quem se fere.', charme: 3 },
  torre:    { nome: 'Torre de Guarda', icon: '🗼', tam: [2, 2], custo: { madeira: 20, pedra: 20 }, nivel: 4,
              desc: 'Seguranças a usam de base. Cura a vila contra ataques.', charme: 3 },
  jardim:   { nome: 'Jardim', icon: '🌸', tam: [2, 2], custo: { madeira: 5, moeda: 10 }, nivel: 4,
              desc: 'Deixa a vila charmosa. Atrai visitantes.', charme: 5 },
  pomar:    { nome: 'Pomar', icon: '🍎', tam: [3, 2], custo: { madeira: 30, moeda: 20 }, nivel: 5,
              desc: 'Produz frutas sozinho.', gera: { res: 'fruta', int: 16, cap: 6 } },
  praca:    { nome: 'Praça', icon: '⛲', tam: [3, 3], custo: { pedra: 30, moeda: 30 }, nivel: 5,
              desc: 'O coração da vila. Muito charme!', charme: 10 },
  capela:   { nome: 'Capela', icon: '💒', tam: [3, 3], custo: { madeira: 40, pedra: 30, moeda: 50 }, nivel: 6,
              desc: 'Permite casamentos no vale.', charme: 5 },
  hospital: { nome: 'Hospital', icon: '🏥', tam: [3, 3], custo: { madeira: 45, pedra: 35, moeda: 40 }, nivel: 6,
              desc: 'Médicos(as) reanimam quem desmaia. Acelera recuperação.', charme: 6 },
  moinho:   { nome: 'Moinho', icon: '🌬️', tam: [3, 3], custo: { madeira: 50, pedra: 20, moeda: 40 }, nivel: 7,
              desc: 'Campos rendem +2 de colheita.' },
  estatua:  { nome: 'Estátua', icon: '🗿', tam: [2, 2], custo: { pedra: 60, moeda: 80 }, nivel: 8,
              desc: 'Monumento à sua lenda. Charme enorme.', charme: 20 },
};

function hasB(id) { return G.buildings.some(b => b.id === id && b.prog >= 1); }
function recalcCharm() {
  G.charm = G.buildings.reduce((s, b) => s + (b.prog >= 1 ? (BUILD_DEFS[b.id].charme || 0) : 0), 0);
}

function podeColocar(id, tx, ty) {
  const def = BUILD_DEFS[id];
  const [w, h] = def.tam;
  if (tx < 1 || ty < 1 || tx + w > WW - 1 || ty + h > WH - 1) return false;
  for (let y = ty; y < ty + h; y++)
    for (let x = tx; x < tx + w; x++)
      if (tileAt(x, y) !== 0) return false;
  const x0 = tx * TS - 8, y0 = ty * TS - 8, x1 = (tx + w) * TS + 8, y1 = (ty + h) * TS + 8;
  for (const b of G.buildings) {
    if (tx * TS < (b.tx + b.w) * TS + 8 && (tx + w) * TS > b.tx * TS - 8 &&
        ty * TS < (b.ty + b.h) * TS + 8 && (ty + h) * TS > b.ty * TS - 8) return false;
  }
  for (const o of G.objects) {
    if (!o.dead && o.x > x0 && o.x < x1 && o.y > y0 && o.y < y1) return false;
  }
  for (const n of G.npcs) {
    if (n.x > x0 && n.x < x1 && n.y > y0 && n.y < y1) return false;
  }
  const p = G.player;
  if (p.x > x0 - 8 && p.x < x1 + 8 && p.y > y0 - 8 && p.y < y1 + 8) return false;
  return true;
}

function buildingAt(wx, wy) {
  for (const b of G.buildings) {
    if (wx > b.tx * TS && wx < (b.tx + b.w) * TS &&
        wy > b.ty * TS && wy < (b.ty + b.h) * TS) return b;
  }
  return null;
}

function demolirBuilding(b) {
  const def = BUILD_DEFS[b.id];
  if (b.id === 'casa') { toast('🏠 Você não pode demolir a sua própria casa!'); sfx('no'); return false; }
  // reembolso de 50% do custo original (só de construções já prontas)
  const refund = {};
  if (b.prog >= 1) for (const k in (def.custo || {})) {
    const q = Math.floor(def.custo[k] * 0.5);
    if (q > 0) refund[k] = q;
  }
  const idx = G.buildings.indexOf(b);
  // despeja morador da cabana e limpa referências de trabalho
  for (const n of G.npcs) {
    if (n.casa === idx) { n.estado = 'visitante'; n.casa = -1; n.workObj = null; n.dormindo = false; }
    if (n.workObj === b) n.workObj = null;
  }
  G.buildings.splice(idx, 1);
  for (const n of G.npcs) { if (n.casa > idx) n.casa--; } // corrige índices deslocados
  for (const k in refund) { G.res[k] += refund[k]; bumpChip(k); }
  spawnParts((b.tx + b.w / 2) * TS, (b.ty + b.h / 2) * TS, { color: '#c9a06b', n: 14 });
  spawnParts((b.tx + b.w / 2) * TS, (b.ty + b.h / 2) * TS, { emoji: '💥', n: 1, g: 0, size: 6 });
  sfx('fall');
  recalcCharm();
  const txt = Object.keys(refund).length ? ' Recuperou ' + custoTxt(refund) : '';
  toast('🧨 ' + def.nome + ' demolida.' + txt);
  return true;
}

function colocarBuilding(id, tx, ty, instantanea) {
  const def = BUILD_DEFS[id];
  const b = {
    id, tx, ty, w: def.tam[0], h: def.tam[1],
    prog: instantanea ? 1 : 0,
    stock: 0, timer: 0,
    stage: 0, cropT: 0,
  };
  G.buildings.push(b);
  if (!instantanea) sfx('build');
  return b;
}

function updateBuildings(dt) {
  for (const b of G.buildings) {
    const def = BUILD_DEFS[b.id];
    // construção em tempo real
    if (b.prog < 1) {
      b.prog = Math.min(1, b.prog + dt / 3.2);
      if (Math.random() < 0.25) {
        spawnParts((b.tx + Math.random() * b.w) * TS, (b.ty + Math.random() * b.h) * TS,
          { color: '#c9a06b', n: 2 });
      }
      if (b.prog >= 1) {
        toast(def.icon + ' ' + def.nome + ' construída!');
        sfx('done');
        addXP(25);
        recalcCharm();
        spawnParts((b.tx + b.w / 2) * TS, (b.ty + b.h / 2) * TS, { emoji: '✨', n: 4, g: -30, size: 4 });
      }
      continue;
    }
    const cx = (b.tx + b.w / 2) * TS, cy = (b.ty + b.h / 2) * TS;
    // produção passiva
    if (def.gera) {
      b.timer += dt;
      if (b.timer >= def.gera.int) {
        b.timer = 0;
        if (b.stock < def.gera.cap) b.stock++;
      }
      if (b.stock >= 1 && dist(G.player.x, G.player.y, cx, cy) < 78) {
        addRes(def.gera.res, b.stock, cx, cy - 30);
        b.stock = 0;
      }
    }
    // campo: crescimento + colheita por proximidade
    if (b.id === 'campo') {
      if (b.stage < 3) {
        let vel = 1;
        for (const p of G.buildings) {
          if (p.id === 'poco' && p.prog >= 1 &&
              dist(p.tx + p.w / 2, p.ty + p.h / 2, b.tx + b.w / 2, b.ty + b.h / 2) < 6) { vel = 1.8; break; }
        }
        b.cropT += dt * vel;
        if (b.cropT >= 15) { b.cropT = 0; b.stage++; }
      } else if (dist(G.player.x, G.player.y, cx, cy) < 70) {
        colherCampo(b, true);
      }
    }
  }
}

function colherCampo(b, peloJogador) {
  if (b.stage < 3) return;
  b.stage = 0; b.cropT = 0;
  const qtd = hasB('moinho') ? 5 : 3;
  const cx = (b.tx + b.w / 2) * TS, cy = (b.ty + b.h / 2) * TS;
  addRes('colheita', qtd, cx, cy - 10, !peloJogador);
  spawnParts(cx, cy, { color: '#e8c84c', n: 8 });
  sfx('harvest', peloJogador ? 1 : 0.08);
  G.stats.harvests++;
  addXP(peloJogador ? 4 : 1);
}

/* ---------------- Desenho ---------------- */
function drawBuilding(ctx, b) {
  const def = BUILD_DEFS[b.id];
  const px = b.tx * TS - cam.x, py = b.ty * TS - cam.y;
  const w = b.w * TS, h = b.h * TS;

  if (b.prog < 1) { // em construção
    ctx.fillStyle = 'rgba(0,0,0,0.10)';
    ctx.beginPath(); ctx.ellipse(px + w / 2, py + h, w * 0.55, 8, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#d9c69a';
    rr(ctx, px + 3, py + h * 0.35, w - 6, h * 0.65, 5); ctx.fill();
    ctx.strokeStyle = '#a9835a'; ctx.lineWidth = 3;
    ctx.strokeRect(px + 6, py + h * 0.4, w - 12, h * 0.55);
    ctx.beginPath();
    ctx.moveTo(px + 6, py + h * 0.4); ctx.lineTo(px + w - 6, py + h * 0.95);
    ctx.moveTo(px + w - 6, py + h * 0.4); ctx.lineTo(px + 6, py + h * 0.95);
    ctx.stroke();
    ctx.font = '18px "Segoe UI Emoji"'; ctx.textAlign = 'center';
    ctx.fillText('🔨', px + w / 2 + Math.sin(G.now * 10) * 4, py + h * 0.35);
    // barra de progresso
    ctx.fillStyle = 'rgba(40,30,20,0.5)';
    rr(ctx, px + 4, py - 10, w - 8, 7, 3); ctx.fill();
    ctx.fillStyle = '#8fc177';
    rr(ctx, px + 5, py - 9, (w - 10) * b.prog, 5, 2); ctx.fill();
    return;
  }

  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath(); ctx.ellipse(px + w / 2, py + h, w * 0.55, 8, 0, 0, TAU); ctx.fill();

  switch (b.id) {
    case 'campo': {
      ctx.fillStyle = '#8a6242'; rr(ctx, px + 2, py + 2, w - 4, h - 4, 5); ctx.fill();
      ctx.fillStyle = '#75512f';
      for (let r = 0; r < b.h * 2; r++) ctx.fillRect(px + 6, py + 6 + r * 14, w - 12, 3);
      const st = b.stage;
      for (let i = 0; i < b.w * 2; i++) {
        for (let r = 0; r < b.h * 2 - 1; r++) {
          const sx = px + 10 + i * (w - 20) / (b.w * 2 - 1);
          const sy = py + 10 + r * 14;
          if (st === 0) { ctx.fillStyle = '#9db86a'; ctx.fillRect(sx - 1, sy - 2, 2, 3); }
          else if (st === 1) { ctx.fillStyle = '#7fb069'; ctx.fillRect(sx - 1, sy - 6, 2, 7); ctx.fillRect(sx - 3, sy - 4, 6, 2); }
          else if (st === 2) { ctx.fillStyle = '#a8b85e'; ctx.fillRect(sx - 1, sy - 9, 2, 10); ctx.fillRect(sx - 3, sy - 7, 6, 2); }
          else {
            ctx.fillStyle = '#c9a54c'; ctx.fillRect(sx - 1, sy - 11, 2, 12);
            ctx.fillStyle = '#e8c84c'; ctx.fillRect(sx - 2.5, sy - 14, 5, 5);
          }
        }
      }
      if (st >= 3) drawBubble(ctx, px + w / 2, py - 6, '🌾');
      break;
    }
    case 'poco': {
      ctx.fillStyle = '#9a9a94';
      ctx.beginPath(); ctx.arc(px + w / 2, py + h / 2 + 6, 18, 0, TAU); ctx.fill();
      ctx.fillStyle = '#5d89b0';
      ctx.beginPath(); ctx.arc(px + w / 2, py + h / 2 + 6, 12, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath(); ctx.arc(px + w / 2 - 3, py + h / 2 + 3, 4, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#8a5a3b'; ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(px + w / 2 - 16, py + h / 2 + 8); ctx.lineTo(px + w / 2 - 16, py + 6);
      ctx.lineTo(px + w / 2 + 16, py + 6); ctx.lineTo(px + w / 2 + 16, py + h / 2 + 8);
      ctx.stroke();
      ctx.fillStyle = '#b5533c';
      ctx.beginPath(); ctx.moveTo(px + w / 2 - 22, py + 8); ctx.lineTo(px + w / 2, py - 8);
      ctx.lineTo(px + w / 2 + 22, py + 8); ctx.closePath(); ctx.fill();
      break;
    }
    case 'praca': {
      ctx.fillStyle = '#cfc6ae'; ctx.beginPath(); ctx.arc(px + w / 2, py + h / 2, w * 0.48, 0, TAU); ctx.fill();
      ctx.fillStyle = '#9a9a94'; ctx.beginPath(); ctx.arc(px + w / 2, py + h / 2, w * 0.3, 0, TAU); ctx.fill();
      ctx.fillStyle = '#6fb0d6'; ctx.beginPath(); ctx.arc(px + w / 2, py + h / 2, w * 0.24, 0, TAU); ctx.fill();
      const jet = Math.abs(Math.sin(G.now * 2.4)) * 12;
      ctx.fillStyle = '#a9d3ea';
      rr(ctx, px + w / 2 - 2.5, py + h / 2 - 12 - jet, 5, 12 + jet, 2.5); ctx.fill();
      ctx.beginPath(); ctx.arc(px + w / 2, py + h / 2 - 12 - jet, 4, 0, TAU); ctx.fill();
      break;
    }
    case 'jardim': {
      ctx.fillStyle = '#7fb069'; rr(ctx, px + 2, py + 2, w - 4, h - 4, 8); ctx.fill();
      ctx.font = '16px "Segoe UI Emoji"'; ctx.textAlign = 'center';
      const fl = ['🌷', '🌼', '🌸', '🌻'];
      for (let i = 0; i < 4; i++) {
        const fx = px + 12 + (i % 2) * (w - 24), fy = py + 20 + Math.floor(i / 2) * (h - 26);
        ctx.fillText(fl[i], fx, fy + Math.sin(G.now * 2 + i) * 1.5);
      }
      break;
    }
    case 'estatua': {
      ctx.fillStyle = '#cfc6ae'; rr(ctx, px + 6, py + h - 18, w - 12, 14, 4); ctx.fill();
      ctx.font = '42px "Segoe UI Emoji"'; ctx.textAlign = 'center';
      ctx.fillText('🗿', px + w / 2, py + h - 16);
      break;
    }
    default: {
      // casinha genérica com cores por tipo
      const cores = {
        casa: ['#e8d5b0', '#b5533c'], cabana: ['#c9a06b', '#8a5a3b'],
        serraria: ['#c9a06b', '#75512f'], mina: ['#b5b5ae', '#6b6b6b'],
        mercado: ['#e8d5b0', '#5fb0a5'], ferreiro: ['#a89a8a', '#4a4a4a'],
        capela: ['#f0e9d8', '#8b7fc9'], moinho: ['#e8d5b0', '#8a5a3b'],
        hospital: ['#f4f0e6', '#d46a6a'], enfermaria: ['#f4f0e6', '#e08a8a'],
        torre: ['#b5b5ae', '#5f6b7a'],
      };
      const [wall, roof] = cores[b.id] || ['#e8d5b0', '#b5533c'];
      const wallH = h * 0.55;
      ctx.fillStyle = wall;
      rr(ctx, px + 3, py + h - wallH, w - 6, wallH, 4); ctx.fill();
      // telhado
      ctx.fillStyle = roof;
      ctx.beginPath();
      ctx.moveTo(px - 2, py + h - wallH + 2);
      ctx.lineTo(px + w / 2, py + 2);
      ctx.lineTo(px + w + 2, py + h - wallH + 2);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.moveTo(px + 4, py + h - wallH); ctx.lineTo(px + w / 2, py + 6); ctx.lineTo(px + w / 2 + 8, py + 10);
      ctx.lineTo(px + 12, py + h - wallH); ctx.closePath(); ctx.fill();
      // porta
      ctx.fillStyle = '#75512f';
      rr(ctx, px + w / 2 - 7, py + h - 20, 14, 20, 5); ctx.fill();
      ctx.fillStyle = '#e0b34c';
      ctx.beginPath(); ctx.arc(px + w / 2 + 4, py + h - 10, 1.5, 0, TAU); ctx.fill();
      // janela
      if (w > 70) {
        ctx.fillStyle = isNight() ? '#f7d97a' : '#a9d3ea';
        rr(ctx, px + 12, py + h - wallH + 8, 12, 12, 3); ctx.fill();
        rr(ctx, px + w - 24, py + h - wallH + 8, 12, 12, 3); ctx.fill();
      }
      // detalhes especiais
      if (b.id === 'capela') {
        ctx.fillStyle = '#e0b34c';
        ctx.fillRect(px + w / 2 - 1.5, py - 12, 3, 12);
        ctx.fillRect(px + w / 2 - 5, py - 8, 10, 3);
      }
      if (b.id === 'hospital' || b.id === 'enfermaria') { // cruz vermelha
        const cyw = py + h - wallH + 6;
        ctx.fillStyle = '#fff';
        rr(ctx, px + w / 2 - 9, cyw - 3, 18, 14, 3); ctx.fill();
        ctx.fillStyle = '#d33b3b';
        ctx.fillRect(px + w / 2 - 2, cyw - 1, 4, 10);
        ctx.fillRect(px + w / 2 - 6, cyw + 3, 12, 4);
      }
      if (b.id === 'torre') { // ameias no topo
        ctx.fillStyle = roof;
        for (let i = 0; i < 3; i++) ctx.fillRect(px + 4 + i * (w - 12) / 2, py + 2, 6, 8);
        ctx.fillStyle = '#4a5568';
        rr(ctx, px + w / 2 - 5, py + h - wallH + 6, 10, 10, 2); ctx.fill();
      }
      if (b.id === 'moinho') {
        ctx.save();
        ctx.translate(px + w / 2, py + 8);
        ctx.rotate(G.now * 0.8);
        ctx.fillStyle = '#f0e9d8';
        for (let i = 0; i < 4; i++) {
          ctx.rotate(Math.PI / 2);
          rr(ctx, -3, 0, 6, 26, 3); ctx.fill();
        }
        ctx.restore();
        ctx.fillStyle = '#5b4636';
        ctx.beginPath(); ctx.arc(px + w / 2, py + 8, 4, 0, TAU); ctx.fill();
      }
      // placa com ícone
      ctx.font = '15px "Segoe UI Emoji"'; ctx.textAlign = 'center';
      ctx.fillText(def.icon, px + w - 16, py + h - wallH - 4);
    }
  }

  // bolha de produção acumulada
  if (def.gera && b.stock >= 1) {
    drawBubble(ctx, px + w / 2, py - 8, RES_INFO[def.gera.res].icon, b.stock);
  }
}

function drawBubble(ctx, x, y, icon, n) {
  const bobY = y + Math.sin(G.now * 3) * 3;
  ctx.fillStyle = 'rgba(253,246,227,0.95)';
  ctx.strokeStyle = '#c9b087'; ctx.lineWidth = 2;
  rr(ctx, x - 16, bobY - 26, 32, 26, 9); ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 5, bobY); ctx.lineTo(x + 5, bobY); ctx.lineTo(x, bobY + 6);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.font = '15px "Segoe UI Emoji"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(icon, x, bobY - 13);
  if (n > 1) {
    ctx.font = '800 10px "Segoe UI"'; ctx.fillStyle = '#5b4636';
    ctx.fillText('x' + n, x + 12, bobY - 22);
  }
  ctx.textBaseline = 'alphabetic';
}
