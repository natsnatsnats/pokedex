let listaPokemon = [];
let evolucoes = [];
let indiceEvolucao = 0;

const pokemonImg = document.querySelector('.pokemon__image');
const pokemonNumber = document.querySelector('.pokemon__number');
const pokemonName = document.querySelector('.pokemon__name');
const inputSearch = document.querySelector('.input__search');
const btnPrev = document.querySelector('.btn-prev');
const btnNext = document.querySelector('.btn-next');
const infoText = document.querySelector('.info-text');

async function carregarLista() {
  const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1000");
  const data = await res.json();
  listaPokemon = data.results.map(p => p.name);
}

function distancia(a, b) {
  let d = 0;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] !== b[i]) d++;
  }
  return d + Math.abs(a.length - b.length);
}

function nomeMaisProximo(input) {
  input = input.toLowerCase();
  let melhor = listaPokemon[0];
  let menorDist = Infinity;

  listaPokemon.forEach(nome => {
    let dist = distancia(input, nome);
    if (dist < menorDist) {
      menorDist = dist;
      melhor = nome;
    }
  });

  return melhor;
}

async function buscarPokemon(nomeOuId) {
  if (!nomeOuId) return;

  let nome = nomeOuId.toString().toLowerCase();

  let resposta = await fetch(`https://pokeapi.co/api/v2/pokemon/${nome}`);
  if (!resposta.ok && listaPokemon.length > 0) {
    const corrigido = nomeMaisProximo(nome);
    resposta = await fetch(`https://pokeapi.co/api/v2/pokemon/${corrigido}`);
  }

  if (!resposta.ok) {
    alert("Pokémon não encontrado.");
    return;
  }

  const data = await resposta.json();

  pokemonImg.src =
    data.sprites.front_default ||
    data.sprites.other['official-artwork'].front_default;

  pokemonNumber.textContent = data.id;
  pokemonName.textContent = data.name;

  await pegarEvolucoes(data.name);
  atualizarBotoes();

  const tipos = data.types.map(t => t.type.name);

  let fraquezas = new Set();
  let resistencias = new Set();
  let imunidades = new Set();

  for (let t of tipos) {
    const res = await fetch(`https://pokeapi.co/api/v2/type/${t}`);
    const typeData = await res.json();

    typeData.damage_relations.double_damage_from.forEach(d => fraquezas.add(d.name));
    typeData.damage_relations.half_damage_from.forEach(d => resistencias.add(d.name));
    typeData.damage_relations.no_damage_from.forEach(d => imunidades.add(d.name));
  }

  const statsFormatados = data.stats
    .map(s => `${s.stat.name}: ${s.base_stat}`)
    .join("<br>");

  infoText.innerHTML = `
    <div class="info-section">
      <b>Tipos:</b>
      <span>${tipos.join(', ')}</span>
    </div>

    <div class="info-section">
      <b>Status:</b>
      <div class="stats">
        ${statsFormatados}
      </div>
    </div>

    <div class="info-section">
      <b>Fraquezas:</b>
      <span>${[...fraquezas].join(', ')}</span>
    </div>

    <div class="info-section">
      <b>Resistências:</b>
      <span>${[...resistencias].join(', ')}</span>
    </div>

    <div class="info-section">
      <b>Imunidades:</b>
      <span>${[...imunidades].join(', ') || 'Nenhuma'}</span>
    </div>
  `;
}

async function pegarEvolucoes(nome) {

  const familiaEevee = [
    'eevee',
    'vaporeon',
    'jolteon',
    'flareon',
    'espeon',
    'umbreon',
    'leafeon',
    'glaceon',
    'sylveon'
  ];

  if (familiaEevee.includes(nome)) {
    evolucoes = familiaEevee;

    indiceEvolucao = evolucoes.indexOf(nome);
    return;
  }

  const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${nome}`);
  const speciesData = await speciesRes.json();

  const evoRes = await fetch(speciesData.evolution_chain.url);
  const evoData = await evoRes.json();

  evolucoes = [];
  let atual = evoData.chain;

  while (atual) {
    evolucoes.push(atual.species.name);
    atual = atual.evolves_to[0];
  }

  indiceEvolucao = evolucoes.indexOf(nome);
}

function atualizarBotoes() {
  btnPrev.disabled = indiceEvolucao <= 0;
  btnNext.disabled = indiceEvolucao >= evolucoes.length - 1;
}

btnPrev.addEventListener('click', () => {
  if (indiceEvolucao > 0) {
    buscarPokemon(evolucoes[indiceEvolucao - 1]);
  }
});

btnNext.addEventListener('click', () => {
  if (indiceEvolucao < evolucoes.length - 1) {
    buscarPokemon(evolucoes[indiceEvolucao + 1]);
  }
});

inputSearch.addEventListener('keypress', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    buscarPokemon(inputSearch.value.toLowerCase());
  }
});

carregarLista().then(() => buscarPokemon(1));
