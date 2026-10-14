'use strict';
/* ============ Interface: HUD, menus, diálogos, missões, toasts ============ */

const $ = id => document.getElementById(id);
let chipEls = {};

function initUI() {
  // chips de recursos
  const hud = $('hud');
  hud.innerHTML = '';
  chipEls = {};
  for (const r of RES_LIST) {
    const el = document.createElement('div');
    el.className = 'chip';
    el.innerHTML = `<span class="ico">${RES_INFO[r].icon}</span><span class="val">0</span>`;
    hud.appendChild(el);
    chipEls[r] = el;
  }
  // botões flutuantes
  $('btns').innerHTML = '';
  const bBuild = document.createElement('button');
  bBuild.textContent = '🔨';
  bBuild.title = 'Construir (B)';
  bBuild.onclick = () => { audioStart(); openBuildMenu(); };
  const bPeople = document.createElement('button');
  bPeople.textContent = '👥';
  bPeople.title = 'Pessoas do vale (P)';
  bPeople.onclick = () => { audioStart(); if (G.mode === 'jogo') openNpcMenu(); };
  const bSom = document.createElement('button');
  bSom.textContent = '🔊';
  bSom.title = 'Som (M)';
  bSom.onclick = () => { audioStart(); bSom.textContent = audioToggle() ? '🔊' : '🔇'; };
  $('btns').appendChild(bBuild);
  $('btns').appendChild(bPeople);
  $('btns').appendChild(bSom);
}

function updateHUD() {
  for (const r of RES_LIST) {
    const v = chipEls[r].querySelector('.val');
    if (v.textContent != G.res[r]) v.textContent = G.res[r];
  }
  const nMor = G.npcs.filter(n => n.estado === 'morador').length;
  const prox = G.level < NIVEL_MAX ? XP_NIVEIS[G.level] : G.xp;
  const base = XP_NIVEIS[G.level - 1];
  const pct = G.level >= NIVEL_MAX ? 100 : clamp((G.xp - base) / (prox - base) * 100, 0, 100);
  const hpPct = clamp(G.player.hp / G.player.maxhp * 100, 0, 100);
  const hpCor = hpPct > 40 ? '#e0655a' : '#c0322a';
  $('topright').innerHTML =
    `<div class="row"><span>${isNight() ? '🌙' : '☀️'} Dia ${G.day}</span><span>⭐ Nível ${G.level}</span></div>` +
    `<div class="xpbar"><div style="width:${pct}%"></div></div>` +
    `<div class="row" style="margin-top:5px"><span>❤️ Vida</span><span>${Math.ceil(G.player.hp)}/${G.player.maxhp}</span></div>` +
    `<div class="hpbar"><div style="width:${hpPct}%;background:${hpCor}"></div></div>` +
    `<div class="row" style="margin-top:4px"><span>🏘️ ${nMor} morador${nMor === 1 ? '' : 'es'}</span><span>✨ Charme ${G.charm}</span></div>`;
}

function chipScreenPos(res) {
  const r = chipEls[res].getBoundingClientRect();
  return { x: r.left + 20, y: r.top + r.height / 2 };
}
function bumpChip(res) {
  const el = chipEls[res];
  el.classList.remove('bump');
  void el.offsetWidth;
  el.classList.add('bump');
}

function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  $('toasts').appendChild(el);
  setTimeout(() => el.remove(), 3600);
}

function setHint(html) {
  const h = $('hint');
  if (!html) { h.style.display = 'none'; return; }
  h.style.display = 'block';
  if (h.dataset.last !== html) { h.innerHTML = html; h.dataset.last = html; }
}

/* ---------------- Missões ---------------- */
function updateQuestBox() {
  const qb = $('questbox');
  if (G.questIdx >= QUESTS.length) {
    qb.innerHTML = `<div class="qtit">📜 Vale próspero</div>🏆 Você reconstruiu o vale! Continue expandindo sua história.`;
    return;
  }
  const q = QUESTS[G.questIdx];
  qb.innerHTML = `<div class="qtit">📜 Missão ${G.questIdx + 1}/${QUESTS.length}</div>${q.i} ${q.t}`;
}

/* ---------------- Painel genérico ---------------- */
function openPanel(html) {
  G.mode = 'painel';
  $('panel').innerHTML = `<button class="pclose" onclick="closePanel()">✕</button>` + html;
  $('panelWrap').classList.remove('hidden');
  sfx('ui');
}
function closePanel() {
  $('panelWrap').classList.add('hidden');
  if (G.mode === 'painel' || G.mode === 'pausa') G.mode = 'jogo';
}

/* ---------------- Pausa (ESC) ---------------- */
function openPause() {
  const nMor = G.npcs.filter(n => n.estado === 'morador').length;
  openPanel(`<h2>⏸️ Jogo pausado</h2>
    <div class="sub">Dia ${G.day} · Nível ${G.level} · ${nMor} morador${nMor === 1 ? '' : 'es'} · ${G.stats.chops} árvores cortadas</div>
    <div class="dbtns">
      <button class="btn" id="pjContinuar">▶️ Continuar (ESC)</button>
      <button class="btn sec" id="pjSalvar">💾 Salvar agora</button>
      <button class="btn sec" id="pjSom">🔊 Som liga/desliga</button>
      <button class="btn sec" id="pjMenu">🏠 Trocar de vale</button>
    </div>`);
  G.mode = 'pausa';
  $('pjContinuar').onclick = closePanel;
  $('pjSalvar').onclick = () => { saveGame(); toast('💾 Jogo salvo no Vale ' + (G.slot + 1) + '!'); };
  $('pjSom').onclick = sfxMuteBtn;
  $('pjMenu').onclick = voltarAoMenu;
}

/* ---------------- Inventário (I) ---------------- */
const ARMAS_INFO = {
  facao:  ['🔪', 'Facão', 'dano 1 · lâmina de caça inicial', 'o'],
  espada: ['🗡️', 'Espada', 'dano 3 · corpo a corpo', 'a'],
  arco:   ['🏹', 'Arco e flecha', 'dano 2 · mire com o mouse e clique', 'o'],
};
function openInventario() {
  let html = `<h2>🎒 Inventário</h2><div class="sub">Clique numa arma para equipá-la. Machado e picareta são usados sozinhos no alvo certo.</div>`;
  html += `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px">`;
  for (const r of RES_LIST) html += `<span class="chip">${RES_INFO[r].icon} ${RES_INFO[r].nome}: <b>&nbsp;${G.res[r]}</b></span>`;
  html += `</div>`;
  html += `<div class="srow"><span>🪓</span><span class="sname">Machado nível ${G.tools.machado} <small>— corta árvores e madeira</small></span></div>`;
  html += `<div class="srow"><span>⛏️</span><span class="sname">Picareta nível ${G.tools.picareta} <small>— quebra pedras e minérios</small></span></div>`;
  for (const w of ['facao', 'espada', 'arco']) {
    if (!G.weapons[w]) continue;
    const [ic, nome, desc] = ARMAS_INFO[w];
    const eq = G.armaAtiva === w;
    html += `<div class="srow"><span>${ic}</span>
      <span class="sname">${nome} <small>— ${desc}</small></span>
      <button class="btn ${eq ? '' : 'sec'}" data-eq="${w}" ${eq ? 'disabled' : ''}>${eq ? '✅ Em uso' : 'Equipar'}</button></div>`;
  }
  if (G.anel) html += `<div class="srow"><span>💍</span><span class="sname">Anel de casamento <small>— guardado para a hora certa...</small></span></div>`;
  openPanel(html);
  $('panel').querySelectorAll('button[data-eq]').forEach(el => {
    el.onclick = () => {
      const w = el.dataset.eq;
      G.armaAtiva = w;
      sfx('ui');
      toast(ARMAS_INFO[w][0] + ' ' + ARMAS_INFO[w][1] + ' equipad' + ARMAS_INFO[w][3] + '!');
      openInventario();
    };
  });
}

/* ---------------- Menu de NPCs / moradores (P) ---------------- */
function _heartsStr(n) {
  const cheios = Math.floor(n.coracoes);
  let s = '';
  for (let i = 0; i < 10; i++) s += i < cheios ? '❤️' : '🤍';
  return s;
}
function _statusNPC(n) {
  if (n.casado) return ['💍', 'Cônjuge', 'st-casado'];
  if (n.namoro) return ['💞', 'Namorando', 'st-namoro'];
  if (n.amigo) return ['🤝', 'Amig' + (n.fem ? 'a' : 'o'), 'st-amigo'];
  if (n.estado === 'morador') return ['🏘️', 'Morador' + (n.fem ? 'a' : ''), 'st-morador'];
  return ['🎒', 'Visitante', 'st-visita'];
}

function openNpcMenu() {
  const lista = G.npcs.filter(n => n.estado !== 'chegando')
    .sort((a, b) => (b.casado - a.casado) || (b.namoro - a.namoro) ||
      ((b.estado === 'morador') - (a.estado === 'morador')) || (b.coracoes - a.coracoes));
  const nMor = G.npcs.filter(n => n.estado === 'morador').length;
  let html = `<h2>👥 Pessoas do Vale</h2>
    <div class="sub">${lista.length} no vale · ${nMor} morando aqui. Gerencie quem vive na vila.</div>`;
  if (!lista.length) {
    html += `<p style="text-align:center;color:#8a7350;padding:14px">Ninguém por aqui ainda. 🍃<br>Viajantes chegam com o tempo — deixe a vila charmosa (jardins, praça, estátua) para atrair mais gente!</p>`;
    openPanel(html);
    return;
  }
  html += `<div class="npcgrid">`;
  for (const n of lista) {
    const [ic, label, cls] = _statusNPC(n);
    html += `<div class="npccard">
      <canvas class="npcface" id="npcface_${n.id}" width="60" height="60"></canvas>
      <div class="npcinfo">
        <div class="npcname">${n.nome} <span class="npcbadge ${cls}">${ic} ${label}</span>${n.desmaiado ? ' <span class="npcbadge st-ferido">😵 desmaiad' + (n.fem ? 'a' : 'o') + '</span>' : (n.hp < n.maxhp ? ' <span class="npcbadge st-ferido">❤️ ' + Math.ceil(n.hp / n.maxhp * 100) + '%</span>' : '')}</div>
        <div class="npcsub">${gflex(n, profDe(n).n)} · ${gflex(n, personaDe(n).n)} · vind${n.fem ? 'a' : 'o'} de ${n.lugar}</div>
        <div class="npchearts">${_heartsStr(n)}</div>
        <div class="npcbtns">
          <button class="btn sec" data-talk="${n.id}">💬 Falar</button>
          ${n.estado === 'morador'
            ? `<button class="btn sec" data-unlive="${n.id}">🚪 Dispensar da moradia</button>`
            : ''}
          <button class="btn danger" data-evict="${n.id}">👋 Mandar embora</button>
        </div>
      </div></div>`;
  }
  html += `</div>`;
  openPanel(html);

  // desenha os retratos
  lista.forEach(n => {
    const cv = document.getElementById('npcface_' + n.id);
    if (cv) drawCharFace(cv.getContext('2d'), 60, 60, n.cores);
  });

  const byId = id => G.npcs.find(n => n.id === +id);
  $('panel').querySelectorAll('button[data-talk]').forEach(el => {
    el.onclick = () => { const n = byId(el.dataset.talk); closePanel(); openDialog(n); };
  });
  $('panel').querySelectorAll('button[data-unlive]').forEach(el => {
    el.onclick = () => {
      const n = byId(el.dataset.unlive);
      n.estado = 'visitante';
      n.casa = -1; n.workObj = null; n.dormindo = false;
      sfx('ui');
      toast('🚪 ' + n.nome + ' deixou de morar na vila, mas continua por perto como visitante.');
      openNpcMenu();
    };
  });
  $('panel').querySelectorAll('button[data-evict]').forEach(el => {
    el.onclick = () => {
      const n = byId(el.dataset.evict);
      if (el.dataset.armed) {
        // remove de vez do vale
        const idx = G.npcs.indexOf(n);
        if (idx >= 0) G.npcs.splice(idx, 1);
        if (G.dating === n.id) G.dating = null;
        if (G.married === n.id) G.married = null;
        sfx('no');
        toast('👋 ' + n.nome + ' fez as malas e partiu do vale.');
        openNpcMenu();
      } else {
        el.dataset.armed = '1';
        el.textContent = (n.casado || n.namoro) ? '💔 Confirmar (vão terminar)?' : '✔️ Confirmar?';
        setTimeout(() => { if (el.isConnected) { el.textContent = '👋 Mandar embora'; delete el.dataset.armed; } }, 2600);
      }
    };
  });
}

/* ---------------- Menu de construção ---------------- */
function openBuildMenu() {
  if (G.mode === 'construir') { G.mode = 'jogo'; G.buildSel = null; return; }
  let html = `<h2>🔨 Construir</h2><div class="sub">Clique numa construção e depois clique no chão para colocá-la. Botão direito cancela.</div>
    <div style="margin-bottom:10px"><button class="btn danger" id="btnDemolir">🧨 Demolir uma construção (recupera 50% dos recursos)</button></div>
    <div class="bgrid">`;
  const ids = Object.keys(BUILD_DEFS).filter(id => BUILD_DEFS[id].menu !== false)
    .sort((a, b) => BUILD_DEFS[a].nivel - BUILD_DEFS[b].nivel);
  for (const id of ids) {
    const d = BUILD_DEFS[id];
    const locked = G.level < d.nivel;
    const poor = !locked && !canAfford(d.custo);
    html += `<div class="bcard ${locked ? 'locked' : ''} ${poor ? 'poor' : ''}" data-b="${id}">
      <div class="bi">${d.icon}</div><div class="bn">${d.nome}</div>
      <div class="bd">${d.desc}</div>
      <div class="bc">${locked ? '🔒 Nível ' + d.nivel : custoTxt(d.custo) || 'grátis'}</div></div>`;
  }
  html += `</div>`;
  openPanel(html);
  $('btnDemolir').onclick = () => {
    closePanel();
    G.mode = 'demolir';
    G.buildSel = null;
    sfx('ui');
  };
  $('panel').querySelectorAll('.bcard').forEach(el => {
    el.onclick = () => {
      const id = el.dataset.b;
      const d = BUILD_DEFS[id];
      if (G.level < d.nivel) { sfx('no'); return; }
      if (!canAfford(d.custo)) { toast('Recursos insuficientes: ' + custoTxt(d.custo)); sfx('no'); return; }
      closePanel();
      G.mode = 'construir';
      G.buildSel = id;
      sfx('ui');
    };
  });
}

/* ---------------- Mercado ---------------- */
function openMercado() {
  let html = `<h2>🏪 Mercado</h2><div class="sub">Venda seus recursos por moedas. Você tem ${RES_INFO.moeda.icon} ${G.res.moeda}.</div>`;
  for (const r of RES_LIST) {
    if (r === 'moeda') continue;
    html += `<div class="srow"><span>${RES_INFO[r].icon}</span>
      <span class="sname">${RES_INFO[r].nome} — <b>${G.res[r]}</b> <small>(${PRECOS[r]} ${RES_INFO.moeda.icon}/un.)</small></span>
      <button class="btn sec" data-s="${r}" data-q="1">Vender 1</button>
      <button class="btn sec" data-s="${r}" data-q="10">×10</button>
      <button class="btn" data-s="${r}" data-q="all">Tudo</button></div>`;
  }
  openPanel(html);
  $('panel').querySelectorAll('button[data-s]').forEach(el => {
    el.onclick = () => {
      const r = el.dataset.s;
      let q = el.dataset.q === 'all' ? G.res[r] : Math.min(G.res[r], parseInt(el.dataset.q));
      if (q <= 0) { sfx('no'); return; }
      G.res[r] -= q;
      G.res.moeda += q * PRECOS[r];
      G.stats.sold += q;
      bumpChip('moeda');
      sfx('coin');
      addXP(Math.ceil(q / 3));
      openMercado(); // atualiza painel
    };
  });
}

/* ---------------- Ferreiro ---------------- */
const FORJA = {
  machado: [null, { moeda: 30, pedra: 8 }, { moeda: 80, pedra: 20 }],
  picareta: [null, { moeda: 30, pedra: 8 }, { moeda: 80, pedra: 20 }],
};
function openFerreiro() {
  let html = `<h2>⚒️ Ferreiro</h2><div class="sub">Ferramentas melhores colhem mais rápido.</div>`;
  for (const t of ['machado', 'picareta']) {
    const lvl = G.tools[t];
    const icon = t === 'machado' ? '🪓' : '⛏️';
    if (lvl >= 3) {
      html += `<div class="srow"><span>${icon}</span><span class="sname">${t[0].toUpperCase() + t.slice(1)} nível ${lvl} — <b>máximo!</b></span></div>`;
    } else {
      const c = FORJA[t][lvl];
      html += `<div class="srow"><span>${icon}</span>
        <span class="sname">${t[0].toUpperCase() + t.slice(1)} nível ${lvl} → ${lvl + 1} <small>(dano +1)</small></span>
        <button class="btn" data-f="${t}">${custoTxt(c)}</button></div>`;
    }
  }
  // armas de caça
  html += `<div class="srow"><span>🔪</span><span class="sname">Facão <small>— sua lâmina de caça inicial (dano 1)</small></span></div>`;
  if (!G.weapons.espada) {
    html += `<div class="srow"><span>🗡️</span><span class="sname">Espada <small>(dano 3, corpo a corpo)</small></span>
      <button class="btn" data-f="espada">${custoTxt({ moeda: 50, pedra: 10 })}</button></div>`;
  } else {
    html += `<div class="srow"><span>🗡️</span><span class="sname">Espada — <b>forjada!</b></span></div>`;
  }
  if (!G.weapons.arco) {
    html += `<div class="srow"><span>🏹</span><span class="sname">Arco e flecha <small>(dano 2, mire com o mouse e clique)</small></span>
      <button class="btn" data-f="arco">${custoTxt({ moeda: 40, madeira: 15 })}</button></div>`;
  } else {
    html += `<div class="srow"><span>🏹</span><span class="sname">Arco e flecha — <b>adquirido!</b></span></div>`;
  }
  if (!G.anel) {
    html += `<div class="srow"><span>💍</span>
      <span class="sname">Anel de casamento <small>(para pedir alguém em casamento)</small></span>
      <button class="btn love" data-f="anel">${custoTxt({ moeda: 60, pedra: 5 })}</button></div>`;
  } else {
    html += `<div class="srow"><span>💍</span><span class="sname">Você já tem um anel guardado no bolso...</span></div>`;
  }
  openPanel(html);
  $('panel').querySelectorAll('button[data-f]').forEach(el => {
    el.onclick = () => {
      const t = el.dataset.f;
      if (t === 'anel') {
        if (!spend({ moeda: 60, pedra: 5 })) { toast('Você precisa de ' + custoTxt({ moeda: 60, pedra: 5 })); sfx('no'); return; }
        G.anel = true;
        toast('💍 Anel comprado! Agora só falta a pessoa certa... e uma capela.');
        sfx('coin');
      } else if (t === 'espada' || t === 'arco') {
        const c = t === 'espada' ? { moeda: 50, pedra: 10 } : { moeda: 40, madeira: 15 };
        if (!spend(c)) { toast('Você precisa de ' + custoTxt(c)); sfx('no'); return; }
        G.weapons[t] = true;
        G.armaAtiva = t;
        toast((t === 'espada' ? '🗡️ Espada forjada' : '🏹 Arco e flecha prontos') + ' — já equipado! Troque no inventário (I).');
        sfx('done');
      } else {
        const c = FORJA[t][G.tools[t]];
        if (!spend(c)) { toast('Você precisa de ' + custoTxt(c)); sfx('no'); return; }
        G.tools[t]++;
        toast((t === 'machado' ? '🪓' : '⛏️') + ' ' + t + ' melhorado para o nível ' + G.tools[t] + '!');
        sfx('done');
      }
      openFerreiro();
    };
  });
}

/* ---------------- Diálogo com NPC ---------------- */
let dialogNPC = null;

function openDialog(n, texto) {
  dialogNPC = n;
  G.mode = 'dialogo';
  const persona = personaDe(n);
  const prof = profDe(n);
  if (!texto) texto = saudacao(n);

  const heartsFull = Math.floor(n.coracoes);
  let hearts = '';
  for (let i = 0; i < 10; i++) hearts += i < heartsFull ? '❤️' : '🤍';

  // história revelada por nível de amizade
  let historia = '';
  const niveis = [0, 3, 6];
  const rotulos = ['', '💛 3', '🧡 6'];
  for (let i = 0; i < 3; i++) {
    historia += n.coracoes >= niveis[i]
      ? `<div style="margin-top:4px">📖 <i>${n.historia[i]}</i></div>`
      : `<div style="margin-top:4px;opacity:0.5">🔒 <i>Fique mais próximo para ouvir o resto... (${rotulos[i]} corações)</i></div>`;
  }

  const estadoTag = n.casado ? '💍 seu cônjuge' : n.namoro ? '💞 seu namoro' :
    n.amigo ? '🤝 seu grande amig' + (n.fem ? 'a' : 'o') :
    n.estado === 'morador' ? '🏘️ morador(a) da vila' : '🎒 visitante';

  let botoes = `<button class="btn" data-a="conversar">💬 Conversar</button>`;
  botoes += `<button class="btn sec" data-a="presentear">🎁 Presentear</button>`;
  if (n.estado === 'visitante') {
    botoes += `<button class="btn" data-a="convidar">🤝 Convidar para a vila</button>`;
  }
  // flerte só no caminho romântico (amizade selada fecha o flerte)
  if (n.coracoes >= 4 && !n.amigo && !n.casado) {
    botoes += `<button class="btn love" data-a="flertar">😊 Flertar</button>`;
  }
  // aos 8 corações: escolha entre namoro OU amizade (uma fecha a outra)
  if (n.coracoes >= 8 && !n.amigo && !n.namoro && !n.casado) {
    botoes += `<button class="btn love" data-a="namorar">💞 Pedir em namoro</button>`;
    botoes += `<button class="btn sec" data-a="amizade">🤝 Selar amizade</button>`;
  }
  if (n.namoro && !n.casado) {
    botoes += `<button class="btn love" data-a="casar">💍 Pedir em casamento</button>`;
  }
  botoes += `<button class="btn sec" data-a="tchau">👋 Tchau</button>`;

  $('dialog').innerHTML = `
    <div class="dleft">
      <canvas id="dface" width="96" height="96"></canvas>
      <div class="dname">${n.nome}</div>
      <div class="dsub">${gflex(n, prof.n)} · ${gflex(n, persona.n)}<br>${estadoTag}</div>
      <div class="dhearts" title="${n.coracoes.toFixed(1)}/10">${hearts.slice(0, 30)}<br>${hearts.slice(30)}</div>
    </div>
    <div class="dright">
      <div class="dtext">“${texto}”</div>
      <div style="font-size:12px;color:#8a7350;max-height:96px;overflow-y:auto">${historia}</div>
      <div class="dbtns" style="margin-top:8px">${botoes}</div>
    </div>`;
  $('dialogWrap').classList.remove('hidden');

  const fc = $('dface');
  drawCharFace(fc.getContext('2d'), 96, 96, n.cores);

  $('dialog').querySelectorAll('button[data-a]').forEach(el => {
    el.onclick = () => acaoDialog(n, el.dataset.a);
  });
}

function closeDialog() {
  $('dialogWrap').classList.add('hidden');
  dialogNPC = null;
  if (G.mode === 'dialogo') G.mode = 'jogo';
}

function acaoDialog(n, a) {
  const persona = personaDe(n);
  sfx('ui');
  switch (a) {
    case 'tchau': closeDialog(); return;

    case 'conversar': {
      if (n.talkDay !== G.day) {
        n.talkDay = G.day;
        addCoracoes(n, n.casado ? 0.15 : 0.3);
      }
      openDialog(n, falaConversa(n));
      return;
    }

    case 'presentear': {
      const opcoes = RES_LIST.filter(r => r !== 'moeda' && G.res[r] > 0);
      if (!opcoes.length) { openDialog(n, gflex(n, 'Você tateia os bolsos... vazios. Volte quando tiver algo para dar.')); return; }
      let html = `<div class="dtext">“O que você quer me dar?”</div><div class="dbtns">`;
      for (const r of opcoes) {
        html += `<button class="btn sec" data-g="${r}">${RES_INFO[r].icon} ${RES_INFO[r].nome} (${G.res[r]})</button>`;
      }
      html += `<button class="btn sec" data-g="nada">Deixa pra lá</button></div>`;
      $('dialog').querySelector('.dright').innerHTML = html;
      $('dialog').querySelectorAll('button[data-g]').forEach(el => {
        el.onclick = () => {
          const r = el.dataset.g;
          if (r === 'nada') { openDialog(n); return; }
          G.res[r]--;
          let txt;
          if (n.giftDay === G.day) {
            addCoracoes(n, 0.1);
            txt = 'De novo?! Você me mima demais... *guarda com carinho*';
          } else if (r === n.favorito) {
            n.giftDay = G.day;
            addCoracoes(n, 1);
            txt = `${RES_INFO[r].icon} É... é meu favorito! Como você sabia?! 💖`;
          } else {
            n.giftDay = G.day;
            addCoracoes(n, 0.4);
            txt = choice(['Ah, que gentileza! Obrigad' + (n.fem ? 'a' : 'o') + '!', 'Pra mim? *sorri* Vou guardar com carinho.']);
          }
          openDialog(n, gflex(n, txt));
        };
      });
      return;
    }

    case 'convidar': {
      if (n.coracoes < 3) {
        openDialog(n, gflex(n, 'Morar aqui? Hmm... a gente mal se conhece. Que tal conversarmos mais um pouco antes?'));
        return;
      }
      const livres = cabanasLivres();
      if (!livres.length) {
        openDialog(n, gflex(n, 'Eu adoraria! Mas... onde eu dormiria? Construa uma cabana livre para mim.'));
        return;
      }
      n.estado = 'morador';
      n.casa = G.buildings.indexOf(livres[0]);
      addXP(30);
      addCoracoes(n, 0.5);
      toast('🏘️ ' + n.nome + ' agora mora na vila e vai trabalhar como ' + gflex(n, profDe(n).n) + '!');
      sfx('done');
      openDialog(n, gflex(n, 'Sério?! Eu aceito! Pode contar comigo: sou ' + profDe(n).n + ' de mão cheia!'));
      return;
    }

    case 'flertar': {
      let txt;
      if (n.flirtDay === G.day) {
        txt = n.casado ? '*te dá uma piscadela* Guarda energia pra hoje à noite, amor. 😏'
          : n.namoro ? '*sorri de canto* Já me deixou derretid(o)(a) hoje, insistente!'
          : '*ainda vermelho(a) do último flerte* Hoje já foi, tá?';
      } else {
        n.flirtDay = G.day;
        addCoracoes(n, 0.35);
        const pool = n.casado ? FLERTE_CASADO : n.namoro ? FLERTE_NAMORO : persona.flerte;
        txt = choice(pool);
      }
      openDialog(n, gflex(n, txt));
      return;
    }

    case 'amizade': {
      if (n.coracoes < 8) { openDialog(n, gflex(n, 'A gente ainda está se conhecendo, mas já vejo um grande amig(o)(a) em você!')); return; }
      n.amigo = true;
      addCoracoes(n, 0.5);
      toast('🤝 Você e ' + n.nome + ' selaram uma grande amizade!');
      sfx('heart');
      openDialog(n, gflex(n, choice([
        '*aperta sua mão com força e sorri* Melhores amigos, então? Fechado! Pra sempre.',
        'Amizade de verdade! Isso vale mais que qualquer romance, e eu não troco a nossa por nada.',
        'Que alívio poder te chamar de melhor amig(o)(a) sem rodeios. Conte comigo pra tudo!',
      ])));
      return;
    }

    case 'namorar': {
      if (n.coracoes < 8) { openDialog(n, gflex(n, '*desvia o olhar* Eu... ainda não sei. Me dê mais um tempo?')); return; }
      n.namoro = true;
      G.dating = n.id;
      addCoracoes(n, 1);
      toast('💞 Você e ' + n.nome + ' estão namorando!');
      sfx('heart');
      openDialog(n, gflex(n, choice([
        'Eu... achei que você nunca ia perguntar! Sim! Mil vezes sim!',
        '*segura suas mãos* O vale inteiro parece ter florescido agora.',
        'Sim! Ai, meu coração! Vou ser o namorad(o)(a) mais dedicad(o)(a) do mundo!',
      ])));
      return;
    }

    case 'casar': {
      if (!hasB('capela')) { openDialog(n, gflex(n, 'Casar... *olhos brilhando* Mas eu sonho com uma cerimônia de verdade. Construa uma capela primeiro?')); return; }
      if (!G.anel) { openDialog(n, gflex(n, '*percebe você procurando nos bolsos* Você... esqueceu o anel, né? O ferreiro faz um lindo.')); return; }
      if (n.coracoes < 10) { openDialog(n, gflex(n, '*coração acelerado* Quase... quase! Só quero ter certeza absoluta. Fica mais um pouquinho comigo?')); return; }
      casamento(n);
      return;
    }
  }
}

/* ---------------- Casamento ---------------- */
function casamento(n) {
  closeDialog();
  n.casado = true;
  n.namoro = false;
  n.estado = 'morador';
  G.married = n.id;
  G.dating = null;
  G.anel = false;
  addXP(100);
  sfx('sino');
  for (let i = 0; i < 24; i++) {
    setTimeout(() => spawnParts(G.player.x + rand(-60, 60), G.player.y + rand(-70, -10),
      { emoji: choice(['💐', '🎊', '💖', '🌸', '✨']), n: 1, g: 30, size: 5 }), i * 90);
  }
  $('wed').innerHTML = `<div class="bigcard">
    <h1>💒 Casamento! 💒</h1>
    <div class="tag">Sob as flores do vale, com a vila inteira reunida...</div>
    <div style="font-size:52px;margin:10px">👤 💍 ${n.fem ? '👰' : '🤵'}</div>
    <p style="font-size:17px">Você e <b>${n.nome}</b> agora são uma família.<br>
    <small>${gflex(n, 'Seu novo cônjuge trará um presentinho todas as manhãs e viverá com você na sua casa.')}</small></p>
    <button class="btn love" onclick="document.getElementById('wed').classList.add('hidden')">💖 Viver felizes</button>
  </div>`;
  $('wed').classList.remove('hidden');
  toast('💍 Você se casou com ' + n.nome + '!');
}

/* ---------------- Intro com slots de save ---------------- */
function showIntro() {
  G.mode = 'menu';
  let slots = '';
  for (let i = 0; i < N_SLOTS; i++) {
    const m = slotMeta(i);
    if (m) {
      const corLine = `Dia ${m.day} · Nível ${m.level} · 🏘️ ${m.moradores}` + (m.casados ? ` · 💍 ${m.casados}` : '');
      slots += `<div class="slotrow">
        <div class="slotinfo"><b>Vale ${i + 1}</b><br><small>${corLine}</small></div>
        <div class="slotbtns">
          <button class="btn" data-load="${i}">▶️ Continuar</button>
          <button class="btn sec" data-del="${i}" title="Apagar">🗑️</button>
        </div></div>`;
    } else {
      slots += `<div class="slotrow">
        <div class="slotinfo"><b>Vale ${i + 1}</b><br><small style="opacity:0.6">— espaço vazio —</small></div>
        <div class="slotbtns"><button class="btn" data-new="${i}">🌱 Novo jogo</button></div></div>`;
    }
  }
  $('intro').innerHTML = `<div class="bigcard">
    <h1>Recanto do Vale</h1>
    <div class="tag">🌾 colha, construa, apaixone-se 🌾</div>
    <div class="ctrl">
      🚶 <b>WASD / setas</b> — andar &nbsp;·&nbsp; 🖱️ <b>clique / segure</b> — cortar, minerar, caçar<br>
      🏹 com o arco equipado: mire com o mouse e clique para atirar<br>
      ⚔️ à noite chegam <b>ladrões e lobos</b> — clique neles para lutar! Recrute seguranças, médicos e enfermeiros<br>
      💬 <b>E</b> — falar, dormir, vender, forjar &nbsp;·&nbsp; 🔨 <b>B</b> — construir<br>
      🎒 <b>I</b> — inventário &nbsp;·&nbsp; 👥 <b>P</b> — pessoas do vale &nbsp;·&nbsp; ⏸️ <b>ESC</b> — pausar &nbsp;·&nbsp; 🔊 <b>M</b> — som
    </div>
    <div class="slots">${slots}</div>
  </div>`;
  $('intro').classList.remove('hidden');

  const entrar = fn => { audioStart(); fn(); $('intro').classList.add('hidden'); G.mode = 'jogo'; };
  $('intro').querySelectorAll('[data-load]').forEach(el =>
    el.onclick = () => entrar(() => loadGame(+el.dataset.load)));
  $('intro').querySelectorAll('[data-new]').forEach(el =>
    el.onclick = () => entrar(() => newGame(+el.dataset.new)));
  // apagar com confirmação em dois cliques (sem usar confirm(), que pode ser bloqueado)
  $('intro').querySelectorAll('[data-del]').forEach(el => {
    el.onclick = () => {
      if (el.dataset.armed) {
        localStorage.removeItem(slotKey(+el.dataset.del));
        sfx('no');
        showIntro();
      } else {
        el.dataset.armed = '1';
        el.textContent = '✔️ Apagar?';
        el.classList.add('love');
        setTimeout(() => { if (el.isConnected) { el.textContent = '🗑️'; el.classList.remove('love'); delete el.dataset.armed; } }, 2500);
      }
    };
  });
}

/* volta ao menu de slots (a partir da pausa), salvando antes */
function voltarAoMenu() {
  saveGame();
  $('panelWrap').classList.add('hidden');
  showIntro();
}
