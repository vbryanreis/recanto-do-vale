# 🌾 Recanto do Vale

Jogo 2D de fazendinha e coleta de recursos em tempo real — no estilo dos anúncios
("chega perto, corta, recurso voa pro contador"), mas com progressão longa,
missões, NPCs procedurais, namoro e casamento. **100% offline**, sem nenhuma
dependência ou asset externo: arte e trilha sonora são geradas por código.

## ▶️ Como jogar

Abra o `index.html` no navegador (duplo clique funciona). Para uma experiência
melhor, sirva a pasta com qualquer servidor local, por exemplo:

```
npx serve recanto-do-vale
```

## 🎮 Controles

| Tecla | Ação |
|---|---|
| **WASD / setas** | Andar |
| **Clique / segurar (mouse)** | Cortar, minerar, colher e caçar — a ferramenta certa é usada sozinha: 🪓 machado em árvores, ⛏️ picareta em rochas, 🔪 facão/🗡️ espada em animais |
| **Mouse (com 🏹 arco)** | Mirar com o cursor e clicar para atirar flechas |
| **E** | Falar com NPCs, dormir na casa, vender no Mercado, forjar no Ferreiro |
| **B** | Menu de construção (clique no chão para colocar; botão direito cancela). Inclui o modo **🧨 Demolir**: clique numa construção para destruí-la e recuperar 50% dos recursos |
| **I** | Inventário (recursos, ferramentas e troca de arma equipada) |
| **P** | Pessoas do vale — cards de todos os NPCs, quem mora aqui, e gerenciamento |
| **ESC** | Pausar o jogo / fechar janelas |
| **M** | Liga/desliga o som |

## ⚔️ Armas, combate e defesa da vila

Você começa com o **facão** (dano 1). No Ferreiro é possível forjar a
**espada** (dano 3, corpo a corpo) ou o **arco e flecha** (dano 2, ataque à
distância com mira do mouse). Troque a arma equipada no inventário (**I**).

**À noite chegam invasores** (a partir do 2º dia):
- 🥷 **Ladrões** correm até roubar plantações prontas e o estoque de serraria,
  mina e pomar — se conseguirem, fogem com os recursos.
- 🐺 **Lobos** atacam diretamente os humanos (você e os moradores).

Clique nos inimigos para lutar. Você e os NPCs têm **barra de vida**: se a de um
NPC zerar, ele **desmaia** (😵) e não trabalha até se recuperar. Se a sua zerar,
você acorda em casa com metade da vida. A vida regenera devagar de dia, e todos
descansam ao amanhecer.

Recrute profissões de apoio para se defender e cuidar dos feridos:
- 🛡️ **Segurança** — patrulha a vila dia e noite e enfrenta ladrões e lobos.
- 🏹 **Caçador** — além de caçar por carne, luta contra os lobos.
- 🩺 **Médico(a)** — reanima quem desmaiou (mais homens, mas de todos os gêneros).
- 💉 **Enfermeiro(a)** — restabelece a vida dos feridos (mais mulheres).

Construa a **Enfermaria** ⛑️, a **Torre de Guarda** 🗼 e o **Hospital** 🏥 para
apoiar essas profissões e dar charme à vila.

## 🧭 Progressão

- **Recursos**: madeira 🪵, pedra 🪨, carne 🍖, frutas 🫐, colheita 🌾, moedas 🪙.
- **Vila com 10 níveis** — cada nível desbloqueia novas construções
  (Campo, Cabana, Serraria, Poço, Mina, Mercado, Ferreiro, Jardim, Pomar,
  Praça, Capela, Moinho, Estátua).
- **19 missões** guiam o jogo do primeiro machado à defesa da vila e ao hospital.
- Serraria, Mina e Pomar **produzem sozinhas** — passe perto para coletar a bolha.
- O Ferreiro melhora machado e picareta (colheita mais rápida).
- Ciclo de **dia e noite**; durma na sua casa à noite para pular para a manhã.
- **3 slots de save** independentes (Vale 1/2/3) na tela inicial: cada um mostra
  dia, nível e moradores; dá para criar, continuar ou apagar. O jogo **salva
  automaticamente** no slot atual; troque de vale pelo menu de pausa (**ESC**).

## 💞 NPCs procedurais

Viajantes chegam ao vale com nome, aparência, personalidade, profissão e uma
história de vida em 3 capítulos — tudo gerado proceduralmente. Homens e mulheres
têm corpos e rostos distintos (mulheres com traços mais femininos e cabelo
comprido/coque; homens mais angulares, com sobrancelhas e às vezes barba). A história é
revelada conforme a amizade cresce (0–10 corações ❤️).

- **Conversar** e **presentear** aumenta os corações (cada NPC tem um presente favorito!).
- Com **3 ❤️** e uma cabana livre, você pode convidá-lo a **morar na vila** —
  ele passa a trabalhar sozinho na profissão dele (lenhador, minerador, caçador,
  fazendeiro ou coletor).
- Com **4 ❤️** dá para **flertar**; com **8 ❤️** você escolhe o caminho:
  **pedir em namoro** 💞 ou **selar amizade** 🤝 — selar amizade fecha o romance
  (o flerte e o namoro somem, e as conversas viram platônicas e calorosas).
- Do namoro, com **10 ❤️**, anel do ferreiro e uma Capela... **casamento** 💍.
- **Sem limite de romance**: você pode namorar e casar com quantos NPCs quiser.
- Cada cônjuge te dá um presente toda manhã.
- **Diálogos que evoluem**: as falas mudam conforme os corações (de educado e
  distante a íntimo e apaixonado) e conforme o status — namoro e casamento
  desbloqueiam conversas românticas e de casal.
- **Fim do dia**: cada morador volta para dormir na sua cabana; quem namora ou
  é casado(a) com você dorme na casa principal (com um 💤).
- **Menu de pessoas (P)**: veja o card de cada NPC do vale, quem mora aqui, e
  gerencie-os — **dispensar da moradia** (vira visitante e libera a cabana) ou
  **mandar embora do vale** (parte de vez, com confirmação).

## 🎨 Estilo artístico e trilha

- **Arte**: "aconchego pastel" — canvas puro com formas arredondadas, paleta
  outonal (árvores verdes e alaranjadas), personagens chibi e ícones emoji.
- **Trilha**: "folk de vale", sintetizada em tempo real via WebAudio — plucks
  pentatônicos, pads quentes e chocalho de dia (Dó maior, 86 BPM); melodia
  lenta e menor à noite (Lá menor, 62 BPM). Efeitos sonoros também sintetizados.
