'use strict';
/* ============ NPCs: geração procedural de personagens, histórias, IA e relacionamentos ============ */

const NOMES_F = ['Aurora', 'Bela', 'Cecília', 'Dora', 'Elisa', 'Flor', 'Gilda', 'Helena', 'Íris', 'Jasmim', 'Lila', 'Maia', 'Nina', 'Olívia', 'Paloma', 'Rosa', 'Sofia', 'Talita', 'Violeta', 'Zora'];
const NOMES_M = ['Arthur', 'Bento', 'Caio', 'Davi', 'Elias', 'Fausto', 'Gael', 'Heitor', 'Ivo', 'João', 'Lucas', 'Milo', 'Nico', 'Otto', 'Pedro', 'Rafael', 'Simão', 'Tomás', 'Vicente', 'Ziggy'];

const LUGARES = ['Porto Brisa', 'Vila Cedro', 'Colina das Cabras', 'Baía Serena', 'Vale Nevoento', 'Campos de Âmbar', 'Rocha Alta', 'Lagoa do Sino', 'Travessia do Corvo', 'Pomar Antigo'];
const INFANCIAS = [
  'Cresci entre redes de pesca e histórias de marinheiros.',
  'Minha família tinha um pomar de maçãs — ainda sinto o cheiro doce quando fecho os olhos.',
  'Fui a criança mais nova de sete irmãos; aprendi cedo a dividir tudo.',
  'Passei a infância correndo atrás de cabras teimosas.',
  'Meu avô me ensinou a ler as estrelas nas noites de verão.',
  'Meus pais eram mascates, então nunca parávamos muito tempo num lugar.',
  'Cresci numa casa cheia de livros e goteiras.',
  'Aprendi a cozinhar antes mesmo de aprender a escrever.',
];
const MOTIVOS = [
  'Saí de casa depois que a grande geada levou nossa colheita.',
  'Vim procurar um recomeço, longe das lembranças antigas.',
  'Um mapa velho e amassado me trouxe até este vale.',
  'Segui um bando de gansos por semanas... e acabei aqui.',
  'Ouvi numa taverna que este vale acolhe qualquer viajante de bom coração.',
  'Perdi uma aposta e ganhei uma viagem. A melhor derrota da minha vida.',
  'Meu vilarejo ficou pequeno demais para os meus sonhos.',
];
const SONHOS = [
  'construir uma casa com varanda para ver o pôr do sol',
  'plantar um jardim que atraia borboletas raras',
  'escrever um livro sobre as pessoas deste vale',
  'nunca mais passar um inverno em solidão',
  'abrir uma cozinha que aqueça o coração de todo mundo',
  'encontrar a lendária flor azul das montanhas',
  'aprender todas as canções que o vento carrega',
  'ver este vale cheio de risadas de novo',
];
const SEGREDOS = [
  'Nunca contei isso a ninguém: tenho um medo terrível de trovões.',
  'Guardo uma carta que nunca tive coragem de enviar.',
  'Sei tocar flauta, mas só toco quando tenho certeza de que ninguém ouve.',
  'Já tive muito dinheiro, sabe? A felicidade não estava lá.',
  'Converso com os pássaros. E às vezes... juro que eles respondem.',
  'Uma cartomante disse que eu encontraria meu destino num vale. Acho que era este.',
  'Choro toda vez que vejo um filhote de qualquer coisa. Não espalha isso.',
];

const PERSONAS = [
  {
    id: 'alegre', n: 'Alegre',
    cumpr: ['Oi, oi! Que dia bom, né?', 'Você de novo! Que alegria!', 'Ei!! Eu estava mesmo pensando em você!'],
    papo: ['Hoje eu acordei cantando. Os pássaros ficaram com inveja!', 'Sabia que dançar sozinho(a) espanta qualquer tristeza? Funciona!', 'Um dia ainda faço uma festa enorme nesta vila!'],
    flerte: ['*risada* Você é uma graça, sabia?', 'Ah, para! *gira uma mecha de cabelo* ...continua.'],
  },
  {
    id: 'timida', n: 'Tímido(a)',
    cumpr: ['Ah! O-oi... não te vi chegando.', 'Oi... *acena devagarinho*', 'Que bom te ver... de verdade.'],
    papo: ['Eu gosto do silêncio daqui. Dá pra ouvir o próprio coração.', 'À-às vezes eu ensaio conversas na frente do espelho... esquece que eu disse isso.', 'Você é uma das poucas pessoas com quem consigo conversar.'],
    flerte: ['*fica vermelho(a) feito um tomate* E-eu... hm... obrigado(a)...', '*esconde o rosto* Você não pode falar essas coisas assim do nada!'],
  },
  {
    id: 'sonhadora', n: 'Sonhador(a)',
    cumpr: ['Ah, olá... eu estava contando as nuvens.', 'Você chegou na melhor hora: o vento está contando segredos.', 'Bem-vindo(a) ao meu pedacinho de céu.'],
    papo: ['Se as estrelas caíssem, eu plantaria todas para nascerem de novo.', 'Ontem sonhei que este vale flutuava. Era lindo.', 'Dizem que quem acha um trevo de quatro folhas aqui, fica para sempre.'],
    flerte: ['Sabe que eu já tinha sonhado com esse momento?', '*sorri devagar* O vale inteiro ficou mais bonito agora.'],
  },
  {
    id: 'resmungona', n: 'Resmungão(ona)',
    cumpr: ['Hmpf. Ah, é você. ...Que bom, aliás.', 'O que foi agora? ...Brincadeira. Pode falar.', 'Chegou fazendo barulho, como sempre.'],
    papo: ['Esse sol está forte demais. E ontem estava frio demais. Nunca está bom.', 'Não vá espalhar por aí que eu gosto daqui, hein?', 'As pessoas falam demais. Você não. Por isso te aturo.'],
    flerte: ['*vira o rosto* Não fica se achando por causa disso.', 'Hmpf. ...Fala de novo. Só pra eu ter certeza que ouvi errado.'],
  },
  {
    id: 'corajosa', n: 'Corajoso(a)',
    cumpr: ['E aí, parceiro(a)! Pronto(a) pra mais um dia?', 'Opa! Já lutou com algum javali hoje?', 'Salve! O vale está seguro comigo por perto.'],
    papo: ['Uma vez encarei um urso. A gente só... concordou em discordar.', 'Medo? Conheço de nome, mas nunca fomos apresentados.', 'Se precisar de ajuda com qualquer coisa, é só chamar. Qualquer coisa mesmo.'],
    flerte: ['Ha! Finalmente alguém com coragem de dizer isso na minha cara. Gostei.', '*sorriso torto* Cuidado. Eu retribuo na mesma moeda.'],
  },
  {
    id: 'gentil', n: 'Gentil',
    cumpr: ['Olá, querido(a). Já comeu alguma coisa hoje?', 'Que bom te ver bem!', 'Entre o vento e você, prefiro sempre a sua visita.'],
    papo: ['Deixei água fresca para os passarinhos hoje. Eles merecem.', 'Uma vila se constrói com paredes, mas se sustenta com carinho.', 'Se algum dia o mundo pesar, divide comigo, tá?'],
    flerte: ['*sorri com os olhos* Você tem um coração bonito, sabia?', 'Ah... você acabou de fazer meu dia inteiro valer a pena.'],
  },
];

const PAPOS_GERAIS = [
  'Dizem que as amoras deste vale são as mais doces do mundo.',
  'De noite dá pra ouvir as corujas conversando no bosque.',
  'O riacho canta mais alto quando vai chover, repara só.',
  'Antigamente esta vila era cheia de gente. Ela está renascendo com você.',
  'Um mercador me disse que já viu um cervo dourado por aqui. Será?',
  'O segredo de uma boa colheita é conversar com as plantas. Eu juro.',
];

/* ---------------- Falas por profundidade da relação ----------------
   Marcadores: {sonho} e {lugar} são substituídos; (a)/(o)/o(a) tratam gênero. */

// 0–2 corações: educado, distante, ainda se conhecendo
const FALAS_CONHECIDO = [
  'Ainda estou me acostumando com o vale. Tudo aqui é tão... verde.',
  'Você mora aqui há muito tempo? Parece conhecer cada pedrinha.',
  'Desculpe se pareço reservad(o)(a). Levo um tempo pra me soltar.',
  'Bom dia! Ou boa tarde? Perdi a noção das horas admirando o céu.',
  'Faz um bom clima hoje, não faz? Ajuda a espantar a saudade de casa.',
  'Vim de {lugar}. Fica longe... mas parece que faz uma vida inteira.',
  'Ouvi dizer que você mesm(o)(a) reconstruiu boa parte da vila. Impressionante.',
  'Não quero atrapalhar o seu trabalho. Só... gosto de trocar duas palavras.',
];
// 3–5 corações: amizade se firmando
const FALAS_AMIGO = [
  'Sabe, eu já sinto que faço parte daqui. E boa parte disso é culpa sua.',
  'Toda vez que te vejo trabalhando, me dá vontade de ajudar. É contagiante!',
  'Guardei a melhor fruta do dia pensando em te oferecer. Bobagem, né?',
  'Você é a primeira pessoa que me faz rir de verdade desde que cheguei.',
  'Quando eu era criança, {lugar} tinha um festival de lanternas. Sinto falta.',
  'Meu sonho, sabe qual é? {sonho}. Nunca contei isso pra quase ninguém.',
  'Se um dia você precisar desabafar, eu tenho ouvidos e chá quente.',
  'Acho que a gente combina como amig(o)(a). Que sorte a minha te encontrar.',
];
// 6–7 corações: intimidade, confiança
const FALAS_CHEGADO = [
  'Tem gente que a gente conhece a vida toda e não confia. Com você foi diferente.',
  'Ontem à noite fiquei pensando em como seria o vale se você nunca tivesse chegado. Fiquei triste só de imaginar.',
  'Posso te confessar uma coisa? Você virou meu lugar seguro neste mundo.',
  'Quando você sorri assim, esqueço metade das minhas preocupações.',
  'Eu ando... sentindo coisas. Coisas que não sei bem nomear ainda.',
  'Se eu pudesse escolher uma pessoa pra ver todo dia, já escolhi. Faz tempo.',
  'Meu coração fica meio bobo perto de você. Não me leve a mal.',
];
// 8+ corações (ainda não namorando): à beira da paixão
const FALAS_INTIMO = [
  '*te encara por um segundo a mais que o normal* ...Desculpa. É que você é lindo(a).',
  'Toda manhã eu acordo torcendo pra te encontrar. Isso quer dizer alguma coisa, né?',
  'Eu já ensaiei mil vezes o que queria te dizer... e sempre travo na sua frente.',
  'Existe uma palavra pro que eu sinto, mas tenho medo de assustar você dizendo cedo demais.',
  'Se você me pedisse pra atravessar o vale nadando agora, eu ia. Sem pensar.',
];
// namorando: romântico, casal recente
const FALAS_NAMORO = [
  'Meu amor! O dia melhora só de te ver aparecer.',
  'Eu ainda não acredito que a gente está junto. Me belisca?',
  'Fico o dia inteiro colecionando coisinhas pra te contar quando você chega.',
  'Sonhei com a gente ontem. A gente construía uma casa cheia de girassóis.',
  'Você é a primeira coisa em que penso ao acordar e a última antes de dormir.',
  'Sabe aquele meu sonho, {sonho}? Agora eu imagino ele com você do meu lado.',
  'Passear de mãos dadas com você por essa vila é tudo que eu queria da vida.',
  'Às vezes eu paro só pra te admirar de longe. Aí você me pega e eu fico vermelh(o)(a)!',
  'Prometi pra mim que ia te fazer feliz todos os dias. Pretendo cumprir.',
];
// casado(a): intimidade de casal, vida compartilhada
const FALAS_CASADO = [
  'Bom dia, meu bem. Deixei o café pronto pra você antes de sair.',
  'Casar com você foi a melhor colheita da minha vida inteira.',
  'A casa fica tão vazia quando você sai... volta logo, tá?',
  'Estava pensando em plantar tulipas na frente de casa. O que meu amor acha?',
  'Ontem a vizinhança inteira comentou como a gente é um casal bonito. Fiquei orgulhos(o)(a).',
  'Envelhecer ao seu lado neste vale é o único plano que eu tenho. E é perfeito.',
  'Nossa vida é simples, mas eu não trocaria um só dia dela por todo o ouro do mundo.',
  'Toda noite eu agradeço às estrelas por ter dito "sim" pra você.',
  'Se um dia eu esquecer de dizer... obrigad(o)(a) por escolher a mim, todos os dias.',
];

// amizade selada (platônico, caloroso — sem romance)
const FALAS_AMIGAO = [
  'Ter você como meu melhor amig(o)(a) é um dos maiores tesouros da minha vida aqui.',
  'Sabe o que é bom demais? Saber que posso contar com você pra qualquer coisa.',
  'A gente não precisa de romance pra ser importante um pro outro. Amizade de verdade é raríssima.',
  'Se um dia você sumir, eu vou até o fim do vale te procurar. É o que os amigos fazem.',
  'Guardei essa história o dia todo só pra te contar. Amigos servem pra isso!',
  'Você é a família que a vida me deixou escolher. Obrigad(o)(a) por isso.',
  'Meu sonho é {sonho} — e que bom ter um amig(o)(a) como você pra torcer junto.',
];

const FLERTE_NAMORO = [
  '*se aproxima e sussurra* Você fica ainda mais bonit(o)(a) quando se concentra.',
  '*rouba um beijo na sua bochecha e sai correndo, rindo*',
  'Para de ser tão encantador(a), assim eu não consigo trabalhar!',
];
const FLERTE_CASADO = [
  '*entrelaça os dedos nos seus* Mesmo depois de casad(o)(a), você me deixa de pernas bambas.',
  'Ainda flerta comigo, depois de tudo? *sorri* Eu adoro isso.',
  '*encosta a testa na sua* Casei com a pessoa mais linda do vale, e todo mundo sabe.',
];

function nivelRelacao(n) {
  if (n.casado) return 'casado';
  if (n.namoro) return 'namoro';
  if (n.amigo) return 'amigao';
  if (n.coracoes >= 8) return 'intimo';
  if (n.coracoes >= 6) return 'chegado';
  if (n.coracoes >= 3) return 'amigo';
  return 'conhecido';
}
function _tmpl(n, s) { return gflex(n, s.replace('{sonho}', n.sonho).replace('{lugar}', n.lugar)); }

function saudacao(n) {
  const persona = personaDe(n);
  if (n.casado) return _tmpl(n, choice(['Oi, meu amor! 💕', 'Que saudade, e nem faz uma hora! 💗', 'Meu bem chegou! Meu dia ficou completo.']));
  if (n.namoro) return _tmpl(n, choice(['Oi, você! *sorriso enorme* 💞', 'Ai, meu coração dispara quando você aparece!', 'A pessoa mais linda do vale veio me ver! 💗']));
  if (n.amigo) return _tmpl(n, choice(['Meu parceir(o)(a) de sempre! 🤝', 'Ei, chegou minha pessoa favorita do vale!', 'Aí sim, a melhor companhia que eu podia pedir!']));
  if (n.coracoes >= 6) return _tmpl(n, choice(['Você! Justo a pessoa que eu queria ver. 😊', 'Meu dia melhorou agora.', 'Oi! Fico feliz de verdade quando você chega.']));
  if (n.coracoes >= 3) return _tmpl(n, choice(persona.cumpr.concat(['E aí, amig(o)(a)! Tudo bem?', 'Ah, que bom te ver por aqui!'])));
  return _tmpl(n, choice(persona.cumpr));
}

function falaConversa(n) {
  const persona = personaDe(n);
  let pool;
  switch (nivelRelacao(n)) {
    case 'casado': pool = FALAS_CASADO; break;
    case 'namoro': pool = FALAS_NAMORO; break;
    case 'amigao': pool = FALAS_AMIGAO.concat(persona.papo, FALAS_CHEGADO); break;
    case 'intimo': pool = FALAS_INTIMO.concat(persona.papo); break;
    case 'chegado': pool = FALAS_CHEGADO.concat(persona.papo); break;
    case 'amigo': pool = FALAS_AMIGO.concat(persona.papo, PAPOS_GERAIS); break;
    default: pool = FALAS_CONHECIDO.concat(persona.cumpr, PAPOS_GERAIS);
  }
  return _tmpl(n, choice(pool));
}

const PROFS = [
  { id: 'lenhador', n: 'lenhador(a)', res: 'madeira', alvo: 'tree', tool: '🪓', frase: 'Machado afiado, coração leve.' },
  { id: 'minerador', n: 'minerador(a)', res: 'pedra', alvo: 'rock', tool: '⛏️', frase: 'Toda pedra guarda uma surpresa.' },
  { id: 'cacador', n: 'caçador(a)', res: 'carne', alvo: 'animal', tool: '🏹', frase: 'A floresta alimenta quem a respeita.' },
  { id: 'fazendeiro', n: 'fazendeiro(a)', res: 'colheita', alvo: 'campo', tool: '🧑‍🌾', frase: 'Terra boa não mente.' },
  { id: 'coletor', n: 'coletor(a)', res: 'fruta', alvo: 'bush', tool: '🧺', frase: 'O vale dá tudo que a gente precisa.' },
  { id: 'seguranca', n: 'segurança', tool: '🛡️', frase: 'Enquanto eu estiver de pé, a vila dorme em paz.' },
  { id: 'medico', n: 'médic(o)(a)', tool: '🩺', frase: 'Ninguém fica para trás enquanto eu puder ajudar.' },
  { id: 'enfermeiro', n: 'enfermeir(o)(a)', tool: '💉', frase: 'Um curativo, um chá e muito carinho.' },
];
// pool de sorteio: coletores comuns, seguranças frequentes, médicos/enfermeiros raros
const PROF_POOL = ['lenhador', 'minerador', 'cacador', 'fazendeiro', 'coletor',
  'lenhador', 'minerador', 'coletor', 'fazendeiro', 'cacador',
  'seguranca', 'seguranca', 'medico', 'enfermeiro'];
// viés de gênero por profissão (chance de ser mulher)
const FEM_POR_PROF = { medico: 0.3, enfermeiro: 0.82, seguranca: 0.45 };

const PELES = ['#f7d7b8', '#eec39a', '#d9a06b', '#a97650', '#8a5a3b'];
const CABELOS = ['#3b2b20', '#5b4636', '#8a5a3b', '#c98a4b', '#e0b34c', '#a33e2f', '#6b6b6b', '#efe4cf'];
const ROUPAS = ['#d46a6a', '#6a9bd4', '#7fb069', '#c98ac9', '#e0a84c', '#5fb0a5', '#b0785f', '#8b7fc9'];
const CALCAS = ['#5b4636', '#4a5568', '#6b5535', '#3e4a3d'];

let NPC_SEQ = 1;

function genNPC() {
  // escolhe a profissão primeiro; o gênero é enviesado por ela
  const profId = choice(PROF_POOL);
  const prof = PROFS.find(p => p.id === profId) || PROFS[0];
  const femChance = FEM_POR_PROF[prof.id] !== undefined ? FEM_POR_PROF[prof.id] : 0.7;
  const fem = Math.random() < femChance;
  const usados = G.npcs.map(n => n.nome);
  const pool = (fem ? NOMES_F : NOMES_M).filter(n => !usados.includes(n));
  const nome = pool.length ? choice(pool) : choice(fem ? NOMES_F : NOMES_M) + ' II';
  const persona = choice(PERSONAS);
  const lugar = choice(LUGARES);
  const sonho = choice(SONHOS);
  // história em 3 capítulos, revelados conforme a amizade cresce
  const historia = [
    `Nasci em ${lugar}. ${choice(INFANCIAS)}`,
    `${choice(MOTIVOS)} Virei ${prof.n} porque... bem, "${prof.frase}"`,
    `${choice(SEGREDOS)} Meu maior sonho é ${sonho}.`,
  ];
  // surge num ponto caminhável perto da vila (não na borda do mapa,
  // senão fica preso atrás dos lagos e nunca chega)
  let x = CENTRO.x, y = CENTRO.y + 300;
  for (let i = 0; i < 50; i++) {
    const ang = rand(TAU), r = rand(320, 470);
    const px = CENTRO.x + Math.cos(ang) * r, py = CENTRO.y + Math.sin(ang) * r;
    if (!isWaterPx(px, py) && !insideBuildingPx(px, py, 10)) { x = px; y = py; break; }
  }

  return {
    id: NPC_SEQ++, nome, fem,
    cores: {
      pele: choice(PELES), cabelo: choice(CABELOS),
      roupa: choice(ROUPAS), calca: choice(CALCAS),
      // estilos de cabelo: mulheres 1=solto 2=coque 3=chanel 4=rabo 5=chiquinha; homens curto=0
      estilo: fem ? choice([1, 1, 3, 3, 4, 5, 2]) : 0,
      barba: !fem && Math.random() < 0.4,  // alguns homens com barba
      cilios: fem,                          // cílios femininos
      fem,
    },
    persona: persona.id, prof: prof.id, lugar, sonho,
    favorito: choice(['fruta', 'colheita', 'carne', 'fruta', 'colheita']),
    historia,
    coracoes: 0, estado: 'chegando', casa: -1,
    namoro: false, casado: false, amigo: false,
    talkDay: 0, giftDay: 0, flirtDay: 0,
    hp: NPC_MAXHP, maxhp: NPC_MAXHP, hurt: 0, desmaiado: false,
    x, y, dir: 1, walkT: 0, moving: false, swing: 0, swingT: 0,
    alvo: null, alvoInimigo: null, wanderT: 0, tx: CENTRO.x, ty: CENTRO.y, workObj: null,
  };
}
function profFlex(n) { return gflex(n, profDe(n).n); }

function personaDe(n) { return PERSONAS.find(p => p.id === n.persona) || PERSONAS[0]; }
function profDe(n) { return PROFS.find(p => p.id === n.prof) || PROFS[0]; }
function gflex(n, txt) { // ajusta terminações de gênero: ão(ona) > o(a) > (a)/(o)
  return txt.replace(/ão\(ona\)/g, n.fem ? 'ona' : 'ão')
    .replace(/o\(a\)/g, n.fem ? 'a' : 'o')
    .replace(/\(a\)/g, n.fem ? 'a' : '')
    .replace(/\(o\)/g, n.fem ? '' : 'o');
}

/* ---------------- IA ---------------- */
function npcMove(n, tx, ty, sp, dt) {
  const d = dist(n.x, n.y, tx, ty);
  if (d < 6) { n.moving = false; return true; }
  const vx = (tx - n.x) / d, vy = (ty - n.y) / d;
  const step = sp * dt;
  const nx = n.x + vx * step, ny = n.y + vy * step;
  if (!isWaterPx(nx, ny)) { n.x = nx; n.y = ny; }
  else if (!isWaterPx(n.x + vy * step, n.y - vx * step)) { n.x += vy * step; n.y -= vx * step; } // desvia p/ um lado
  else if (!isWaterPx(n.x - vy * step, n.y + vx * step)) { n.x -= vy * step; n.y += vx * step; } // ...ou p/ o outro
  else { n.wanderT = 0; n.moving = false; return false; } // encurralado: caller resolve (failsafe)
  n.moving = true;
  n.walkT += dt;
  if (Math.abs(vx) > 0.15) n.dir = vx > 0 ? 1 : -1;
  return false;
}

/* reaparece o NPC num ponto de grama caminhável perto da casa dele (ou da vila) */
function respawnNPCSeguro(n) {
  const casa = n.casa >= 0 ? G.buildings[n.casa] : null;
  const cxp = casa ? (casa.tx + casa.w / 2) * TS : CENTRO.x;
  const cyp = casa ? (casa.ty + casa.h) * TS + 18 : CENTRO.y + 60;
  for (let i = 0; i < 50; i++) {
    const ang = rand(TAU), r = rand(24, 130);
    const x = cxp + Math.cos(ang) * r, y = cyp + Math.sin(ang) * r;
    if (walkable(x, y)) { n.x = x; n.y = y; n.workObj = null; n.wanderT = 0; return; }
  }
  n.x = CENTRO.x; n.y = CENTRO.y + 70; n.workObj = null;
}

/* alvo mais próximo de um tipo que NÃO esteja reservado por outro NPC;
   se todos estiverem reservados, cai para o mais próximo mesmo assim */
function alvoLivre(n, ehValido, coord) {
  let best = null, bd = 620, bestQualquer = null, bdQualquer = 620;
  const pool = coord === 'animal' ? G.animals : G.objects;
  for (const o of pool) {
    if (!ehValido(o)) continue;
    const d = dist(n.x, n.y, o.x, o.y);
    if (d < bdQualquer) { bdQualquer = d; bestQualquer = o; }
    if (G.npcs.some(m => m !== n && m.workObj === o)) continue; // reservado por outro
    if (d < bd) { bd = d; best = o; }
  }
  return best || bestQualquer;
}

/* alvo de cura: precisaDesmaiado=true → só desmaiados (médico); false → feridos conscientes (enfermeiro) */
function curavelMaisProximo(n, precisaDesmaiado) {
  let best = null, bd = 750;
  for (const m of G.npcs) {
    if (m === n) continue;
    if (precisaDesmaiado ? !m.desmaiado : (m.desmaiado || m.hp >= m.maxhp)) continue;
    const d = dist(n.x, n.y, m.x, m.y);
    if (d < bd) { bd = d; best = m; }
  }
  return best;
}
function reanimar(m) {
  m.desmaiado = false;
  m.hp = Math.max(m.hp, m.maxhp * 0.45);
  m.workObj = null;
  spawnParts(m.x, m.y - 12, { emoji: '💗', n: 2, g: -30, size: 4 });
  toast('🩺 ' + m.nome + ' foi reanimad' + (m.fem ? 'a' : 'o') + '!');
  sfx('heart', 0.5);
}
function patrulharGuarda(n, dt) {
  n.wanderT -= dt;
  if (n.wanderT <= 0) {
    n.wanderT = rand(2.5, 5);
    for (let i = 0; i < 8; i++) {
      const x = CENTRO.x + rand(-240, 240), y = CENTRO.y + rand(-240, 240);
      if (walkable(x, y)) { n.tx = x; n.ty = y; break; }
    }
  }
  npcMove(n, n.tx, n.ty, 52, dt);
}
function trabalharPertoDe(n, buildId, dt) {
  const b = G.buildings.find(bb => bb.id === buildId && bb.prog >= 1);
  if (b) {
    const bx = (b.tx + b.w / 2) * TS, by = (b.ty + b.h) * TS + 20;
    if (dist(n.x, n.y, bx, by) > 44) { npcMove(n, bx, by, 50, dt); return; }
  }
  n.wanderT -= dt;
  if (n.wanderT <= 0) {
    n.wanderT = rand(3, 6);
    for (let i = 0; i < 8; i++) { const x = CENTRO.x + rand(-140, 140), y = CENTRO.y + rand(-140, 140); if (walkable(x, y)) { n.tx = x; n.ty = y; break; } }
  }
  npcMove(n, n.tx, n.ty, 40, dt);
}

function updateNPC(n, dt) {
  n.swing = Math.max(0, n.swing - dt * 2.5);
  n.moving = false;
  n.hurt = Math.max(0, (n.hurt || 0) - dt);
  const night = isNight();

  // desmaiado: fica caído, sem agir (médico reanima; de madrugada recupera sozinho)
  if (n.desmaiado) { n.moving = false; n.swing = 0; n.travadoN = 0; return; }

  // regeneração natural lenta durante o dia
  if (!night && n.hp < n.maxhp) n.hp = Math.min(n.maxhp, n.hp + 1.4 * dt);

  const prof = profDe(n);

  // detector geral de travamento: se ficar ~11s sem progredir (e não está
  // dormindo de propósito), reaparece num local seguro perto de casa/vila
  if (!n.dormindo) {
    n.travadoT = (n.travadoT || 0) + dt;
    if (n.travadoT >= 3) {
      const andou = dist(n.x, n.y, n.travadoX ?? n.x, n.travadoY ?? n.y);
      n.travadoX = n.x; n.travadoY = n.y; n.travadoT = 0;
      n.travadoN = andou < 8 ? (n.travadoN || 0) + 1 : 0;
      if (n.travadoN >= 4) { respawnNPCSeguro(n); n.travadoN = 0; }
    }
  } else { n.travadoN = 0; n.travadoX = n.x; n.travadoY = n.y; }

  if (n.estado === 'chegando') {
    // trava de segurança: se ficar preso no caminho, aparece perto da vila
    n.stuckT = (n.stuckT || 0) + dt;
    if (n.stuckT > 20) {
      n.stuckT = 0;
      n.x = CENTRO.x + rand(-90, 90); n.y = CENTRO.y + rand(60, 140);
      if (isWaterPx(n.x, n.y)) { n.x = CENTRO.x; n.y = CENTRO.y + 70; }
    }
    if (npcMove(n, CENTRO.x + (n.id % 5 - 2) * 40, CENTRO.y + (n.id % 3 - 1) * 40, 75, dt)) {
      n.estado = 'visitante';
      toast('🌟 ' + n.nome + ' chegou ao vale! Vá conversar (tecla E).');
      sfx('heart');
    }
    return;
  }

  // COMBATE tem prioridade: segurança sempre defende; caçador ataca se houver inimigo
  if (G.enemies.length && (prof.id === 'seguranca' || prof.id === 'cacador')) {
    if (combaterInimigos(n, dt)) return;
  }
  // segurança patrulha (dia e noite) em vez de dormir
  if (prof.id === 'seguranca') { patrulharGuarda(n, dt); return; }

  // Fim do dia: cada NPC vai dormir na sua casa.
  // Quem namora ou é casado(a) com o player dorme na casa principal.
  if (night && (n.estado === 'morador' || n.namoro || n.casado)) {
    const parceiro = n.namoro || n.casado;
    const casaPropria = n.casa >= 0 ? G.buildings[n.casa] : null;
    const destino = parceiro ? G.buildings.find(b => b.id === 'casa') : casaPropria;
    let hx = CENTRO.x, hy = CENTRO.y + 46;
    if (destino) {
      hx = (destino.tx + destino.w / 2) * TS + ((n.id % 3) - 1) * 15;
      hy = (destino.ty + destino.h) * TS + 12;
    }
    const d = dist(n.x, n.y, hx, hy);
    if (d < 22) {                       // chegou: dorme
      n.dormindo = true; n.sleepTryT = 0;
    } else {
      npcMove(n, hx, hy, 74, dt);
      // failsafe anti-travamento: se não conseguir chegar em ~10s, entra em casa
      n.sleepTryT = (n.sleepTryT || 0) + dt;
      if (n.sleepTryT > 10) { n.x = hx; n.y = hy; n.dormindo = true; n.sleepTryT = 0; }
      else n.dormindo = false;
    }
    return;
  }
  n.dormindo = false;
  n.sleepTryT = 0;

  if (n.estado === 'visitante') {
    if (night) return; // visitante sem casa fica parado à noite
    n.wanderT -= dt;
    if (n.wanderT <= 0) {
      n.wanderT = rand(3, 7);
      for (let i = 0; i < 8; i++) { // ponto caminhável, deslocado por id p/ espalhar
        const x = CENTRO.x + rand(-190, 190) + ((n.id % 5) - 2) * 26;
        const y = CENTRO.y + rand(-190, 190);
        if (walkable(x, y)) { n.tx = x; n.ty = y; break; }
      }
    }
    npcMove(n, n.tx, n.ty, 45, dt);
    return;
  }

  // trabalho de dia
  if (prof.id === 'medico') {
    // reanima o desmaiado mais próximo
    const alvo = curavelMaisProximo(n, true);
    if (alvo) {
      if (npcMove(n, alvo.x, alvo.y, 70, dt) || dist(n.x, n.y, alvo.x, alvo.y) < 30) {
        n.swing = 1; n.swingT += dt;
        if (n.swingT > 2) { n.swingT = 0; reanimar(alvo); spawnParts(alvo.x, alvo.y - 20, { emoji: '✨', n: 2, g: -20, size: 4 }); }
      }
    } else { trabalharPertoDe(n, 'hospital', dt); }
    return;
  }
  if (prof.id === 'enfermeiro') {
    // cura a vida de quem está ferido (não desmaiado)
    const alvo = curavelMaisProximo(n, false);
    if (alvo) {
      if (npcMove(n, alvo.x, alvo.y, 70, dt) || dist(n.x, n.y, alvo.x, alvo.y) < 30) {
        n.swing = 1;
        alvo.hp = Math.min(alvo.maxhp, alvo.hp + 14 * dt);
        if (Math.random() < 0.04) spawnParts(alvo.x, alvo.y - 18, { emoji: '💚', n: 1, g: -20, size: 3 });
      }
    } else { trabalharPertoDe(n, 'enfermaria', dt); }
    return;
  }
  if (prof.id === 'fazendeiro') {
    // procura campo pronto que outro fazendeiro não tenha reservado
    if (!n.workObj || n.workObj.id !== 'campo' || n.workObj.stage < 3) {
      const prontos = G.buildings.filter(b => b.id === 'campo' && b.prog >= 1 && b.stage >= 3);
      n.workObj = prontos.find(b => !G.npcs.some(m => m !== n && m.workObj === b)) || prontos[0] || null;
    }
    if (n.workObj) {
      const b = n.workObj;
      const bx = (b.tx + b.w / 2) * TS, by = (b.ty + b.h / 2) * TS + 20;
      if (npcMove(n, bx, by, 60, dt)) {
        n.swingT += dt;
        n.swing = 1;
        if (n.swingT > 1.1) {
          n.swingT = 0;
          if (b.stage >= 3) colherCampo(b, false);
          n.workObj = null;
        }
      }
      return;
    }
  } else if (prof.alvo === 'animal') {
    if (!n.workObj || n.workObj.hp === undefined || n.workObj.hp <= 0 || !G.animals.includes(n.workObj)) {
      n.workObj = alvoLivre(n, a => true, 'animal');
    }
    if (n.workObj) {
      const a = n.workObj;
      if (npcMove(n, a.x, a.y, 78, dt) || dist(n.x, n.y, a.x, a.y) < 34) {
        n.swingT += dt;
        if (n.swingT > 1) {
          n.swingT = 0; n.swing = 1;
          hitAnimal(a, 1, n.x, n.y, false);
          if (a.hp <= 0) addXP(1);
        }
      }
      return;
    }
  } else {
    // lenhador / minerador / coletor
    if (!n.workObj || n.workObj.dead) {
      n.workObj = alvoLivre(n, o => !o.dead && o.kind === prof.alvo, 'obj');
    }
    if (n.workObj) {
      const o = n.workObj;
      if (npcMove(n, o.x, o.y + 6, 62, dt) || dist(n.x, n.y, o.x, o.y) < 36) {
        n.swingT += dt;
        if (n.swingT > 1) {
          n.swingT = 0; n.swing = 1;
          hitObject(o, 1, false);
          if (o.dead) { addXP(1); n.workObj = null; }
        }
      }
      return;
    }
  }
  // sem trabalho: passeia perto do centro (ponto caminhável, espalhado por id)
  n.wanderT -= dt;
  if (n.wanderT <= 0) {
    n.wanderT = rand(3, 6);
    for (let i = 0; i < 8; i++) {
      const x = CENTRO.x + rand(-150, 150) + ((n.id % 5) - 2) * 24;
      const y = CENTRO.y + rand(-150, 150);
      if (walkable(x, y)) { n.tx = x; n.ty = y; break; }
    }
  }
  npcMove(n, n.tx, n.ty, 40, dt);
}

/* separação: evita que NPCs fiquem um dentro do outro (mesma função → mesmo caminho) */
function separarNPCs() {
  const arr = G.npcs;
  const minD = 15;
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      const a = arr[i], b = arr[j];
      if (a.dormindo && b.dormindo) continue; // podem dividir a casa à noite
      const dx = a.x - b.x, dy = a.y - b.y;
      const d = Math.hypot(dx, dy);
      if (d < minD) {
        let ox, oy;
        if (d < 0.5) { const ang = rand(TAU); ox = Math.cos(ang) * minD * 0.5; oy = Math.sin(ang) * minD * 0.5; }
        else { const push = (minD - d) / d * 0.5; ox = dx * push; oy = dy * push; }
        if (walkable(a.x + ox, a.y + oy)) { a.x += ox; a.y += oy; }
        if (walkable(b.x - ox, b.y - oy)) { b.x -= ox; b.y -= oy; }
      }
    }
  }
}

/* ---------------- Desenho de personagem (compartilhado com o jogador) ---------------- */
function drawChar(ctx, x, y, c, o) {
  const s = o.scale || 1;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath(); ctx.ellipse(0, 1, 9 * s, 3.5 * s, 0, 0, TAU); ctx.fill();

  const bob = o.moving ? Math.sin(o.walkT * 11) * 1.4 : Math.sin(G.now * 2 + x * 0.01) * 0.5;
  const lg = o.moving ? Math.sin(o.walkT * 11) * 2.5 : 0;
  const by = bob * 0.4;

  if (c.fem) {
    // corpo feminino: busto, cintura marcada e saia com quadril
    ctx.fillStyle = c.calca;
    rr(ctx, -5 * s, (-8 + (lg > 0 ? -2 : 0)) * s, 4 * s, (8 + (lg > 0 ? 2 : 0)) * s, 2 * s); ctx.fill();
    rr(ctx, 1 * s, (-8 + (lg < 0 ? -2 : 0)) * s, 4 * s, (8 + (lg < 0 ? 2 : 0)) * s, 2 * s); ctx.fill();
    ctx.fillStyle = c.roupa;
    // busto
    rr(ctx, -6 * s, (-22 + by) * s, 12 * s, 8 * s, 4 * s); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, (-16.5 + by) * s, 6.6 * s, 3.6 * s, 0, 0, TAU); ctx.fill();
    // cintura fina abrindo para o quadril (saia)
    ctx.beginPath();
    ctx.moveTo(-4 * s, (-15 + by) * s);
    ctx.lineTo(4 * s, (-15 + by) * s);
    ctx.quadraticCurveTo(9.5 * s, -9 * s, 8.5 * s, -4.5 * s);
    ctx.quadraticCurveTo(0, -2.5 * s, -8.5 * s, -4.5 * s);
    ctx.quadraticCurveTo(-9.5 * s, -9 * s, -4 * s, (-15 + by) * s);
    ctx.closePath(); ctx.fill();
    // braços delicados
    rr(ctx, -8.8 * s, (-20 + by) * s, 3 * s, 9 * s, 1.5 * s); ctx.fill();
    rr(ctx, 5.8 * s, (-20 + by) * s, 3 * s, 9 * s, 1.5 * s); ctx.fill();
  } else {
    // corpo masculino: ombros largos, tronco reto
    ctx.fillStyle = c.calca;
    rr(ctx, -6 * s, (-10 + (lg > 0 ? -2 : 0)) * s, 5 * s, (10 + (lg > 0 ? 2 : 0)) * s, 2 * s); ctx.fill();
    rr(ctx, 1 * s, (-10 + (lg < 0 ? -2 : 0)) * s, 5 * s, (10 + (lg < 0 ? 2 : 0)) * s, 2 * s); ctx.fill();
    ctx.fillStyle = c.roupa;
    rr(ctx, -8.5 * s, (-22 + by) * s, 17 * s, 14 * s, 5 * s); ctx.fill();
    rr(ctx, -11.5 * s, (-20 + by) * s, 4 * s, 9 * s, 2 * s); ctx.fill();
    rr(ctx, 7.5 * s, (-20 + by) * s, 4 * s, 9 * s, 2 * s); ctx.fill();
  }

  const hy = (-30 + bob) * s;
  // cabelo atrás (mulheres): mechas laterais fora do rosto, nunca sob o queixo
  if (c.fem && c.estilo !== 2) {
    ctx.fillStyle = c.cabelo;
    const comp = (c.estilo === 3 ? 12 : 17) * s;      // chanel mais curto
    const yTop = c.estilo === 5 ? hy - 1 * s : hy - 6 * s; // chiquinha mais baixa
    rr(ctx, -10.5 * s, yTop, 4 * s, comp, 2 * s); ctx.fill();
    rr(ctx, 6.5 * s, yTop, 4 * s, comp, 2 * s); ctx.fill();
    if (c.estilo === 4) { ctx.fillStyle = '#e78ba0'; ctx.beginPath(); ctx.arc(8.5 * s, hy - 5 * s, 1.6 * s, 0, TAU); ctx.fill(); }
  }
  // cabeça: mulheres redonda, homens com maxilar mais reto
  ctx.fillStyle = c.pele;
  if (c.fem) { ctx.beginPath(); ctx.arc(0, hy, 9 * s, 0, TAU); ctx.fill(); }
  else { rr(ctx, -8.6 * s, hy - 9 * s, 17.2 * s, 18 * s, 5 * s); ctx.fill(); }
  // barba masculina
  if (!c.fem && c.barba) {
    ctx.fillStyle = c.cabelo;
    ctx.beginPath(); ctx.arc(0, hy + 3 * s, 7.5 * s, 0.2, Math.PI - 0.2); ctx.fill();
  }
  // franja / topo
  ctx.fillStyle = c.cabelo;
  ctx.beginPath(); ctx.arc(0, hy - 0.5 * s, 9.4 * s, Math.PI, TAU); ctx.closePath(); ctx.fill();
  if (c.fem && c.estilo === 2) { ctx.beginPath(); ctx.arc(0, hy - 10 * s, 4.4 * s, 0, TAU); ctx.fill(); } // coque
  // sobrancelhas masculinas
  const ex = o.dir * 2 * s;
  if (!c.fem) {
    ctx.strokeStyle = c.cabelo; ctx.lineWidth = 1 * s; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(ex - 4.4 * s, hy - 0.4 * s); ctx.lineTo(ex - 1.6 * s, hy - 1 * s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ex + 1.6 * s, hy - 1 * s); ctx.lineTo(ex + 4.4 * s, hy - 0.4 * s); ctx.stroke();
    ctx.lineCap = 'butt';
  }
  // olhos
  ctx.fillStyle = '#3b2b20';
  ctx.beginPath(); ctx.arc(ex - 3 * s, hy + 2 * s, (c.fem ? 1.4 : 1.2) * s, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(ex + 3 * s, hy + 2 * s, (c.fem ? 1.4 : 1.2) * s, 0, TAU); ctx.fill();
  // cílios / lábios femininos
  if (c.fem) {
    ctx.strokeStyle = '#3b2b20'; ctx.lineWidth = 0.7 * s; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(ex - 4.3 * s, hy + 1.4 * s); ctx.lineTo(ex - 5 * s, hy + 0.6 * s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ex + 4.3 * s, hy + 1.4 * s); ctx.lineTo(ex + 5 * s, hy + 0.6 * s); ctx.stroke();
    ctx.lineCap = 'butt';
    ctx.fillStyle = '#c65b6e';
    ctx.beginPath(); ctx.ellipse(0, hy + 5.5 * s, 1.7 * s, 0.9 * s, 0, 0, TAU); ctx.fill();
  }
  // bochechas (mais rosadas nas mulheres)
  ctx.fillStyle = c.fem ? 'rgba(240,110,120,0.42)' : 'rgba(220,130,110,0.25)';
  ctx.beginPath(); ctx.arc(-5 * s, hy + 4.5 * s, (c.fem ? 2 : 1.6) * s, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(5 * s, hy + 4.5 * s, (c.fem ? 2 : 1.6) * s, 0, TAU); ctx.fill();

  // ferramenta girando (golpe)
  if (o.swing > 0 && o.tool) {
    ctx.save();
    ctx.translate(o.dir * 11 * s, -18 * s);
    ctx.rotate(o.dir * (-0.7 + Math.sin(clamp(o.swing, 0, 1) * Math.PI) * 1.7));
    ctx.font = Math.round(15 * s) + 'px "Segoe UI Emoji"';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(o.tool, 0, 0);
    ctx.restore();
  }
  ctx.restore();
}

function drawNPC(ctx, n) {
  const x = n.x - cam.x, y = n.y - cam.y;
  const prof = profDe(n);
  if (n.desmaiado) {
    // caído no chão (deitado de lado)
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 2 * n.dir);
    drawChar(ctx, 0, 0, n.cores, { dir: 1, walkT: 0, moving: false, swing: 0, tool: null, scale: 0.95 });
    ctx.restore();
    ctx.font = '13px "Segoe UI Emoji"'; ctx.textAlign = 'center';
    ctx.fillText('😵', x, y - 20 + Math.sin(G.now * 3) * 1.5);
  } else {
    drawChar(ctx, x, y, n.cores, {
      dir: n.dir, walkT: n.walkT, moving: n.moving,
      swing: n.swing, tool: prof.tool, scale: 1,
    });
  }
  // Zzz quando está dormindo
  if (n.dormindo) {
    ctx.font = '12px "Segoe UI Emoji"'; ctx.textAlign = 'center';
    ctx.fillText('💤', x + 12, y - 40 + Math.sin(G.now * 2) * 2);
  }
  // barra de vida quando ferido
  if (n.hp < n.maxhp && !n.desmaiado) {
    ctx.fillStyle = 'rgba(40,30,20,0.55)'; ctx.fillRect(x - 12, y - 44, 24, 4);
    ctx.fillStyle = n.hp / n.maxhp > 0.4 ? '#7fc06a' : '#e0655a';
    ctx.fillRect(x - 11, y - 43, 22 * (n.hp / n.maxhp), 2);
  }
  // nome + status quando o jogador está perto
  const d = dist(n.x, n.y, G.player.x, G.player.y);
  if (d < 110) {
    ctx.font = '700 11px "Segoe UI"';
    ctx.textAlign = 'center';
    const marca = n.desmaiado ? ' 😵' : n.casado ? ' 💍' : n.namoro ? ' 💞' : n.amigo ? ' 🤝' : n.coracoes >= 1 ? ' ❤️' : '';
    const tag = n.nome + marca;
    ctx.strokeStyle = 'rgba(60,45,30,0.85)'; ctx.lineWidth = 3;
    ctx.strokeText(tag, x, y - 50);
    ctx.fillStyle = '#fdf6e3';
    ctx.fillText(tag, x, y - 50);
  }
}

/* Cabelo feminino do retrato — várias texturas que NUNCA cruzam o queixo.
   camada=true desenha atrás da cabeça; camada=false desenha o topo/frente. */
function drawFemHairFace(ctx, cx, cy, R, c) {
  const st = c.estilo;
  ctx.fillStyle = c.cabelo;
  const laco = (x, y) => { ctx.fillStyle = '#e78ba0'; ctx.beginPath(); ctx.arc(x, y, 3.4, 0, TAU); ctx.fill(); ctx.fillStyle = c.cabelo; };
  if (c._back) {
    // mechas caindo pelas laterais (fora do rosto), volume atrás do topo
    if (st === 1) {                    // solto longo
      rr(ctx, cx - R - 7, cy - R + 4, 13, R * 2.05, 6); ctx.fill();
      rr(ctx, cx + R - 6, cy - R + 4, 13, R * 2.05, 6); ctx.fill();
    } else if (st === 3) {             // chanel / bob (até o maxilar)
      rr(ctx, cx - R - 6, cy - R + 4, 12, R * 1.4, 6); ctx.fill();
      rr(ctx, cx + R - 6, cy - R + 4, 12, R * 1.4, 6); ctx.fill();
    } else if (st === 4) {             // rabo de cavalo lateral
      rr(ctx, cx + R - 1, cy - R + 9, 11, R * 1.95, 6); ctx.fill();
      rr(ctx, cx - R - 4, cy - R + 4, 10, R * 0.75, 5); ctx.fill();
    } else if (st === 5) {             // maria-chiquinha (duas mechas baixas)
      rr(ctx, cx - R - 9, cy - 1, 12, R * 1.5, 6); ctx.fill();
      rr(ctx, cx + R - 3, cy - 1, 12, R * 1.5, 6); ctx.fill();
    }
    ctx.beginPath(); ctx.arc(cx, cy - 2, R + 3, Math.PI, TAU); ctx.fill(); // volume superior
  } else {
    // calota/franja no topo
    ctx.beginPath(); ctx.arc(cx, cy - 2, R + 1, Math.PI, TAU); ctx.closePath(); ctx.fill();
    // mechas frontais curtas emoldurando a testa (param acima das maçãs do rosto)
    if (st !== 2) {
      rr(ctx, cx - R - 1, cy - 13, 7, R * 0.8, 4); ctx.fill();
      rr(ctx, cx + R - 6, cy - 13, 7, R * 0.8, 4); ctx.fill();
    }
    if (st === 1) { // franja repartida ao meio
      ctx.beginPath(); ctx.moveTo(cx, cy - R + 2); ctx.lineTo(cx - 9, cy - 4); ctx.lineTo(cx - 2, cy - 6); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx, cy - R + 2); ctx.lineTo(cx + 9, cy - 4); ctx.lineTo(cx + 2, cy - 6); ctx.closePath(); ctx.fill();
    }
    if (st === 2) {                    // coque no topo + faixa
      ctx.beginPath(); ctx.arc(cx, cy - R - 4, R * 0.46, 0, TAU); ctx.fill();
      rr(ctx, cx - 5, cy - R - 3, 10, 6, 2); ctx.fill();
    }
    if (st === 4) laco(cx + R - 1, cy - R + 9);       // laço do rabo
    if (st === 5) { laco(cx - R - 3, cy); laco(cx + R + 3, cy); } // laços das chiquinhas
  }
}

function drawCharFace(ctx, w, h, c) {
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2 + 8;
  // ombros
  ctx.fillStyle = c.roupa;
  rr(ctx, cx - 26, cy + 18, 52, 24, 12); ctx.fill();
  // cabelo atrás (mulheres) — antes da cabeça
  if (c.fem) { c._back = true; drawFemHairFace(ctx, cx, cy, 25, c); }
  // cabeça: mulheres arredondada, homens com maxilar mais reto
  ctx.fillStyle = c.pele;
  if (c.fem) { ctx.beginPath(); ctx.arc(cx, cy, 25, 0, TAU); ctx.fill(); }
  else { rr(ctx, cx - 24, cy - 25, 48, 50, 15); ctx.fill(); }

  if (!c.fem && c.barba) { // barba (por baixo do resto do rosto)
    ctx.fillStyle = c.cabelo;
    ctx.beginPath(); ctx.arc(cx, cy + 9, 20, 0.15, Math.PI - 0.15); ctx.fill();
    ctx.fillRect(cx - 20, cy + 6, 40, 4);
  }
  // cabelo do topo / frente
  if (c.fem) { c._back = false; drawFemHairFace(ctx, cx, cy, 25, c); }
  else {
    ctx.fillStyle = c.cabelo;
    ctx.beginPath(); ctx.arc(cx, cy - 2, 25.8, Math.PI, TAU); ctx.closePath(); ctx.fill();
  }

  // sobrancelhas masculinas
  if (!c.fem) {
    ctx.strokeStyle = c.cabelo; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx - 12, cy + 1); ctx.lineTo(cx - 4, cy - 0.5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 4, cy - 0.5); ctx.lineTo(cx + 12, cy + 1); ctx.stroke();
  }
  // olhos
  ctx.fillStyle = '#3b2b20';
  const er = c.fem ? 3.6 : 3.0;
  ctx.beginPath(); ctx.arc(cx - 8, cy + 6, er, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 8, cy + 6, er, 0, TAU); ctx.fill();
  // brilho
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(cx - 7, cy + 5, 1.2, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 9, cy + 5, 1.2, 0, TAU); ctx.fill();
  // cílios femininos
  if (c.fem) {
    ctx.strokeStyle = '#3b2b20'; ctx.lineWidth = 1.3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx - 11.5, cy + 3.5); ctx.lineTo(cx - 13.5, cy + 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 11.5, cy + 3.5); ctx.lineTo(cx + 13.5, cy + 2); ctx.stroke();
  }
  // bochechas (mais rosadas nas mulheres)
  ctx.fillStyle = c.fem ? 'rgba(240,110,120,0.45)' : 'rgba(220,130,110,0.28)';
  ctx.beginPath(); ctx.arc(cx - 14, cy + 12, c.fem ? 5 : 4, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 14, cy + 12, c.fem ? 5 : 4, 0, TAU); ctx.fill();
  // boca: lábios femininos / sorriso masculino
  if (c.fem) {
    ctx.fillStyle = '#c65b6e';
    ctx.beginPath(); ctx.ellipse(cx, cy + 15, 4.5, 2.6, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath(); ctx.ellipse(cx, cy + 14.2, 2, 0.8, 0, 0, TAU); ctx.fill();
  } else {
    ctx.strokeStyle = '#3b2b20'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(cx, cy + 12, 6, 0.25, Math.PI - 0.25); ctx.stroke();
  }
  ctx.lineCap = 'butt';
}

/* ---------------- Relacionamento ---------------- */
function addCoracoes(n, v) {
  const antes = Math.floor(n.coracoes);
  n.coracoes = clamp(n.coracoes + v, 0, 10);
  if (v > 0) {
    spawnParts(n.x, n.y - 40, { emoji: '💗', n: 2, g: -40, size: 4 });
    sfx('heart');
  }
  if (Math.floor(n.coracoes) > antes) {
    if (Math.floor(n.coracoes) === 2) toast('💛 ' + n.nome + ' está se abrindo com você!');
    if (Math.floor(n.coracoes) === 5) toast('🧡 ' + n.nome + ' confia em você de verdade!');
    if (Math.floor(n.coracoes) === 8) toast('❤️ ' + n.nome + ' te olha de um jeito diferente...');
  }
}

function moradores() {
  return G.npcs.filter(n => n.estado === 'morador');
}
function cabanasLivres() {
  const ocupadas = moradores().filter(n => !n.casado).map(n => n.casa);
  return G.buildings.filter((b, i) => b.id === 'cabana' && b.prog >= 1 && !ocupadas.includes(i));
}
