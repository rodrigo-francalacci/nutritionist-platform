#!/usr/bin/env node
//---------------------------------------------------------------//
// Gerenciador da base pessoal de alimentos (foods.json).
//
//   node tools/foods.js list [termo]
//   node tools/foods.js categorias
//   node tools/foods.js add
//   node tools/foods.js edit "<nome>"
//   node tools/foods.js rm "<nome>"
//   node tools/foods.js check
//
// Acrescente --push para commitar e enviar ao GitHub (o Pages
// republica sozinho pelo workflow em .github/workflows/static.yml).
//
// Sem dependencias externas: so Node.
//---------------------------------------------------------------//

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execFileSync } = require('child_process');

const REPO = path.resolve(__dirname, '..');
const ARQUIVO = path.join(REPO, 'foods.json');

const CAMPOS_NUM = ['cal', 'protein', 'carb', 'fats'];

// ---------- utilidades ----------

const cores = {
  reset: '\x1b[0m', neg: '\x1b[1m', fraco: '\x1b[2m',
  verm: '\x1b[31m', verde: '\x1b[32m', amar: '\x1b[33m', ciano: '\x1b[36m',
};
const c = (cor, t) => cores[cor] + t + cores.reset;

function carregar() {
  if (!fs.existsSync(ARQUIVO)) {
    console.error(c('verm', 'Não encontrei ' + ARQUIVO));
    process.exit(1);
  }
  try {
    const lista = JSON.parse(fs.readFileSync(ARQUIVO, 'utf8'));
    if (!Array.isArray(lista)) throw new Error('o arquivo não contém uma lista');
    return lista;
  } catch (e) {
    console.error(c('verm', 'foods.json inválido: ' + e.message));
    process.exit(1);
  }
}

function salvar(lista) {
  lista.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  fs.writeFileSync(ARQUIVO, JSON.stringify(lista, null, 2) + '\n', 'utf8');
}

function categorias(lista) {
  return [...new Set(lista.map(f => f.categoria || 'Outros'))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

// unidades em uso, da mais comum para a menos comum
function unidades(lista) {
  const conta = new Map();
  lista.forEach(f => conta.set(f.unidade, (conta.get(f.unidade) || 0) + 1));
  return [...conta.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR'))
    .map(([unidade, n]) => ({ unidade, n }));
}

// ignora acentos e caixa nas buscas
const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function achar(lista, nome) {
  const exato = lista.findIndex(f => f.nome === nome);
  if (exato !== -1) return exato;
  const aprox = lista.filter(f => norm(f.nome).includes(norm(nome)));
  if (aprox.length === 1) return lista.indexOf(aprox[0]);
  if (aprox.length > 1) {
    console.error(c('amar', '"' + nome + '" casa com ' + aprox.length + ' alimentos:'));
    aprox.forEach(f => console.error('  ' + f.nome));
    process.exit(1);
  }
  return -1;
}

// ---------- perguntas ----------

// Com stdin vindo de um pipe (nao de um terminal), o readline dispara
// todas as linhas de uma vez e fecha. Se usassemos io.question direto,
// so a primeira pergunta seria respondida e o processo morreria calado.
// Por isso as linhas vao para uma fila.
function rl() {
  const io = readline.createInterface({ input: process.stdin, output: process.stdout });
  const fila = [];
  const esperando = [];
  let fechado = false;

  io.on('line', linha => {
    if (esperando.length) esperando.shift()(linha);
    else fila.push(linha);
  });
  io.on('close', () => {
    fechado = true;
    while (esperando.length) esperando.shift()(null);
  });

  return {
    linha(prompt) {
      process.stdout.write(prompt);
      return new Promise(res => {
        if (fila.length) { const l = fila.shift(); process.stdout.write(l + '\n'); return res(l); }
        if (fechado) return res(null);
        esperando.push(res);
      });
    },
    close: () => io.close(),
  };
}

async function perguntar(io, texto, padrao) {
  const sufixo = padrao !== undefined && padrao !== '' ? c('fraco', ' [' + padrao + ']') : '';
  const r = await io.linha(texto + sufixo + ': ');
  if (r === null) return padrao ?? '';        // entrada acabou
  return r.trim() === '' ? (padrao ?? '') : r.trim();
}

async function perguntarNumero(io, texto, padrao) {
  for (let tentativa = 0; tentativa < 10; tentativa++) {
    const r = await perguntar(io, texto, padrao);
    const n = parseFloat(String(r).replace(',', '.'));
    if (!isNaN(n) && n >= 0) return n;
    console.log(c('verm', '  precisa ser um número >= 0'));
  }
  console.error(c('verm', 'entrada inválida demais; abortando.'));
  process.exit(1);
}

async function perguntarCategoria(io, lista, padrao) {
  const cats = categorias(lista);
  console.log(c('fraco', '  categorias existentes:'));
  cats.forEach((cat, i) => console.log(c('fraco', '    ' + (i + 1) + ') ' + cat)));
  console.log(c('fraco', '    (ou digite uma nova)'));

  const r = await perguntar(io, 'categoria', padrao);
  const i = parseInt(r, 10);
  if (!isNaN(i) && i >= 1 && i <= cats.length) return cats[i - 1];
  return r;
}

// A unidade define o que o usuario digita na tela: "2 ovos", "1 fatia",
// "1 colher de sopa". Os macros sao sempre POR UMA unidade dessas.
// Oferece as que ja existem porque foi assim que a base acabou com
// grama/gramas/gram/grams — quatro grafias da mesma coisa.
async function perguntarUnidade(io, lista, padrao) {
  const uns = unidades(lista);

  console.log(c('fraco', '  unidades já em uso:'));
  uns.forEach((u, i) => console.log(c('fraco',
    '    ' + String(i + 1).padStart(2) + ') ' + u.unidade.padEnd(22) + String(u.n).padStart(3) + ' alimento(s)')));
  console.log(c('fraco', '    (ou digite uma nova: ovo, fatia, colher de sopa, lata...)'));

  for (;;) {
    const r = await perguntar(io, 'unidade', padrao);

    const i = parseInt(r, 10);
    if (!isNaN(i) && i >= 1 && i <= uns.length) return uns[i - 1].unidade;
    if (!r) { console.log(c('verm', '  a unidade não pode ficar vazia')); continue; }

    // se so muda acento/caixa/plural em relacao a uma existente, usa a existente
    const parecida = uns.find(u => norm(u.unidade) === norm(r) ||
                                   norm(u.unidade) === norm(r) + 's' ||
                                   norm(u.unidade) + 's' === norm(r));
    if (parecida && parecida.unidade !== r) {
      console.log(c('amar', '  "' + r + '" é praticamente "' + parecida.unidade + '", que já existe — usando essa.'));
      return parecida.unidade;
    }
    return r;
  }
}

// ---------- comandos ----------

function cmdList(lista, termo) {
  let itens = lista;
  if (termo) itens = lista.filter(f => norm(f.nome).includes(norm(termo)) || norm(f.categoria).includes(norm(termo)));

  if (!itens.length) return console.log(c('amar', 'nenhum alimento encontrado.'));

  let catAtual = null;
  itens.slice().sort((a, b) =>
    (a.categoria || '').localeCompare(b.categoria || '', 'pt-BR') || a.nome.localeCompare(b.nome, 'pt-BR')
  ).forEach(f => {
    if (f.categoria !== catAtual) {
      catAtual = f.categoria;
      console.log('\n' + c('neg', catAtual));
    }
    console.log('  ' + f.nome.padEnd(52) + c('fraco',
      String(f.cal).padStart(7) + ' cal  ' +
      String(f.protein).padStart(6) + ' P  ' +
      String(f.carb).padStart(6) + ' C  ' +
      String(f.fats).padStart(6) + ' G  por ' + f.unidade));
  });
  console.log('\n' + c('fraco', itens.length + ' de ' + lista.length + ' alimentos'));
}

function cmdCategorias(lista) {
  categorias(lista).forEach(cat => {
    const n = lista.filter(f => (f.categoria || 'Outros') === cat).length;
    console.log('  ' + String(n).padStart(3) + '  ' + cat);
  });
}

async function cmdAdd(lista) {
  const io = rl();
  console.log(c('neg', '\nNovo alimento') + c('fraco', '  (os macros são POR UNIDADE)\n'));

  const nome = await perguntar(io, 'nome');
  if (!nome) { console.log(c('verm', 'nome é obrigatório.')); io.close(); return null; }
  if (achar(lista, nome) !== -1 && lista.some(f => f.nome === nome)) {
    console.log(c('verm', 'já existe um alimento com esse nome.')); io.close(); return null;
  }

  const novo = { nome };
  novo.categoria = await perguntarCategoria(io, lista);
  novo.unidade = await perguntarUnidade(io, lista, 'gramas');
  console.log(c('fraco', '\n  agora os macros de UM(A) ' + novo.unidade + ':'));
  novo.cal = await perguntarNumero(io, 'calorias por ' + novo.unidade);
  novo.protein = await perguntarNumero(io, 'proteína (g) por ' + novo.unidade);
  novo.carb = await perguntarNumero(io, 'carboidrato (g) por ' + novo.unidade);
  novo.fats = await perguntarNumero(io, 'gordura (g) por ' + novo.unidade);
  novo.detalhes = await perguntar(io, 'detalhes', '');

  io.close();
  lista.push(novo);
  console.log(c('verde', '\n+ ' + novo.nome) + c('fraco', '  (' + novo.categoria + ')'));
  return novo.nome;
}

async function cmdEdit(lista, nome) {
  const i = achar(lista, nome);
  if (i === -1) { console.log(c('verm', 'não encontrei "' + nome + '".')); return null; }

  const f = lista[i];
  const io = rl();
  console.log(c('neg', '\nEditando ' + f.nome) + c('fraco', '  (Enter mantém o valor)\n'));

  f.nome = await perguntar(io, 'nome', f.nome);
  f.categoria = await perguntarCategoria(io, lista, f.categoria);

  const unidadeAntes = f.unidade;
  f.unidade = await perguntarUnidade(io, lista, f.unidade);
  if (f.unidade !== unidadeAntes) {
    console.log(c('amar', '\n  a unidade mudou de "' + unidadeAntes + '" para "' + f.unidade + '".'));
    console.log(c('amar', '  reveja os macros abaixo: agora valem por ' + f.unidade + '.'));
  }

  for (const campo of CAMPOS_NUM) f[campo] = await perguntarNumero(io, campo + ' por ' + f.unidade, f[campo]);
  f.detalhes = await perguntar(io, 'detalhes', f.detalhes);

  io.close();
  console.log(c('verde', '\n~ ' + f.nome));
  return f.nome;
}

async function cmdRm(lista, nome) {
  const i = achar(lista, nome);
  if (i === -1) { console.log(c('verm', 'não encontrei "' + nome + '".')); return null; }

  const f = lista[i];
  const io = rl();
  console.log('\n' + c('neg', f.nome) + c('fraco', '  ' + f.categoria + ' | ' + f.cal + ' cal por ' + f.unidade));
  const ok = await perguntar(io, c('amar', 'remover? (s/N)'), 'n');
  io.close();

  if (ok.toLowerCase() !== 's') { console.log('cancelado.'); return null; }

  lista.splice(i, 1);
  console.log(c('verm', '- ' + f.nome));
  return f.nome;
}

function cmdCheck(lista) {
  const problemas = [];
  const vistos = new Map();

  lista.forEach((f, i) => {
    const onde = '[' + i + '] ' + (f.nome || '(sem nome)');
    if (!f.nome) problemas.push(onde + ': sem nome');
    if (!f.categoria) problemas.push(onde + ': sem categoria');
    if (!f.unidade) problemas.push(onde + ': sem unidade');
    CAMPOS_NUM.forEach(k => {
      if (typeof f[k] !== 'number' || isNaN(f[k])) problemas.push(onde + ': ' + k + ' não é número (' + f[k] + ')');
      else if (f[k] < 0) problemas.push(onde + ': ' + k + ' negativo');
    });
    if (f.nome) {
      if (vistos.has(f.nome)) problemas.push(onde + ': nome duplicado');
      vistos.set(f.nome, true);
    }
    // sanidade: calorias devem bater aproximadamente com 4P + 4C + 9G
    if (CAMPOS_NUM.every(k => typeof f[k] === 'number')) {
      const est = 4 * f.protein + 4 * f.carb + 9 * f.fats;
      if (est > 0 && f.cal > 0 && (f.cal / est > 1.7 || f.cal / est < 0.55)) {
        problemas.push(onde + ': calorias (' + f.cal + ') destoam dos macros (~' + est.toFixed(1) + ')');
      }
    }
  });

  // unidades que so diferem por acento, caixa ou plural
  const uns = unidades(lista).map(u => u.unidade);
  uns.forEach((a, i) => uns.slice(i + 1).forEach(b => {
    if (norm(a) === norm(b) || norm(a) + 's' === norm(b) || norm(a) === norm(b) + 's') {
      problemas.push('unidades quase iguais: "' + a + '" e "' + b + '" — vale unificar');
    }
  }));

  const cats = categorias(lista);
  console.log(lista.length + ' alimentos, ' + cats.length + ' categorias, ' + uns.length + ' unidades');
  if (!problemas.length) return console.log(c('verde', 'nenhum problema encontrado.'));
  console.log(c('amar', '\n' + problemas.length + ' aviso(s):'));
  problemas.forEach(p => console.log('  ' + p));
}

// ---------- git ----------

const git = (...args) => execFileSync('git', args, { cwd: REPO, encoding: 'utf8' }).trim();

function publicar(mensagem) {
  try {
    if (!git('status', '--porcelain', 'foods.json')) {
      console.log(c('fraco', 'nada para publicar.'));
      return;
    }
    const branch = git('rev-parse', '--abbrev-ref', 'HEAD');
    git('add', 'foods.json');
    git('commit', '-m', mensagem);
    console.log(c('verde', 'commit criado em ' + branch));

    git('push', 'origin', branch);
    console.log(c('verde', 'enviado para origin/' + branch));
    if (branch === 'main') {
      console.log(c('fraco', 'o GitHub Pages vai republicar em ~1 minuto.'));
    } else {
      console.log(c('amar', 'você está em "' + branch + '" — o Pages publica a partir de main.'));
    }
  } catch (e) {
    console.error(c('verm', 'falha no git: ' + (e.stderr || e.message)));
    console.error(c('fraco', 'o foods.json foi salvo; é só commitar à mão.'));
    process.exit(1);
  }
}

// ---------- principal ----------

const AJUDA = `
${c('neg', 'Base pessoal de alimentos')}

  node tools/foods.js list [termo]     lista (filtra por nome ou categoria)
  node tools/foods.js categorias       categorias e quantos alimentos tem cada
  node tools/foods.js add              acrescenta um alimento
  node tools/foods.js edit "<nome>"    edita
  node tools/foods.js rm "<nome>"      remove
  node tools/foods.js check            procura erros na base

  --push    commita e envia ao GitHub depois de alterar
`;

(async function main() {
  const args = process.argv.slice(2);
  const push = args.includes('--push');
  const resto = args.filter(a => a !== '--push');
  const cmd = resto[0];
  const arg = resto.slice(1).join(' ');

  const lista = carregar();
  let alterou = null;

  switch (cmd) {
    case 'list': case 'ls': cmdList(lista, arg); break;
    case 'categorias': case 'cats': cmdCategorias(lista); break;
    case 'check': cmdCheck(lista); break;
    case 'add': alterou = await cmdAdd(lista); break;
    case 'edit':
      if (!arg) { console.log(c('verm', 'informe o nome: edit "<nome>"')); process.exit(1); }
      alterou = await cmdEdit(lista, arg); break;
    case 'rm': case 'remove':
      if (!arg) { console.log(c('verm', 'informe o nome: rm "<nome>"')); process.exit(1); }
      alterou = await cmdRm(lista, arg); break;
    default: console.log(AJUDA);
  }

  if (alterou) {
    salvar(lista);
    console.log(c('fraco', 'foods.json salvo (' + lista.length + ' alimentos).'));
    if (push) publicar('Base de alimentos: ' + cmd + ' "' + alterou + '"');
    else console.log(c('fraco', 'use --push para publicar no GitHub.'));
  }
})();
