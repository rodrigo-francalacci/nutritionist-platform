#!/usr/bin/env node
//---------------------------------------------------------------//
// Publica e indexa sessoes salvas: estados (planos inteiros) e
// receitas. O app le esses arquivos do repositorio; este utilitario
// os coloca la e mantem os index.json que o app consulta.
//
//   node tools/sessions.js add <arquivo.json>   copia p/ a pasta certa e reindexa
//   node tools/sessions.js list                 lista o que esta publicado
//   node tools/sessions.js reindex              reconstroi os index.json
//   node tools/sessions.js rm "<nome|arquivo>"  remove
//
// Acrescente --push para commitar e enviar ao GitHub.
// Sem dependencias externas: so Node.
//---------------------------------------------------------------//

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const REPO = path.resolve(__dirname, '..');
const PASTAS = {
  estado:  path.join(REPO, 'estados'),
  receita: path.join(REPO, 'receitas'),
};

const cores = { reset:'\x1b[0m', neg:'\x1b[1m', fraco:'\x1b[2m', verm:'\x1b[31m', verde:'\x1b[32m', amar:'\x1b[33m', ciano:'\x1b[36m' };
const c = (cor, t) => cores[cor] + t + cores.reset;

// ---------- deteccao ----------

// Espelha carregarArquivoDetectado() do app: estado tem itens[];
// receita e um objeto com nome + cal. Uma array (o antigo foods.json
// dentro de receitas/) nao casa com nenhum e fica de fora.
function detectarTipo(obj) {
  if (obj && Array.isArray(obj.itens)) return 'estado';
  if (obj && !Array.isArray(obj) && typeof obj.nome === 'string' && obj.cal !== undefined) return 'receita';
  return null;
}

function lerJSON(arquivo) {
  // strip do BOM: editores/ferramentas do Windows gravam um BOM no
  // inicio do arquivo, e JSON.parse rejeita isso.
  try {
    let txt = fs.readFileSync(arquivo, 'utf8');
    if (txt.charCodeAt(0) === 0xFEFF) txt = txt.slice(1);
    return JSON.parse(txt);
  } catch { return undefined; }
}

// ---------- indice ----------

function reindexar(tipo) {
  const pasta = PASTAS[tipo];
  if (!fs.existsSync(pasta)) fs.mkdirSync(pasta, { recursive: true });

  const entradas = [];
  for (const arquivo of fs.readdirSync(pasta)) {
    if (!arquivo.toLowerCase().endsWith('.json')) continue;
    if (arquivo === 'index.json') continue;

    const obj = lerJSON(path.join(pasta, arquivo));
    if (detectarTipo(obj) !== tipo) continue;   // ignora o que nao for do tipo

    entradas.push({
      arquivo,
      nome: obj.nome || arquivo.replace(/\.json$/i, ''),
      salvoEm: obj.salvoEm || fs.statSync(path.join(pasta, arquivo)).mtime.toISOString(),
    });
  }

  entradas.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  fs.writeFileSync(path.join(pasta, 'index.json'), JSON.stringify(entradas, null, 2) + '\n', 'utf8');
  return entradas;
}

function reindexarTudo() {
  return { estados: reindexar('estado'), receitas: reindexar('receita') };
}

// ---------- comandos ----------

function cmdAdd(origem) {
  if (!origem) { console.error(c('verm', 'informe o arquivo: add <arquivo.json>')); process.exit(1); }
  if (!fs.existsSync(origem)) { console.error(c('verm', 'não encontrei ' + origem)); process.exit(1); }

  const obj = lerJSON(origem);
  const tipo = detectarTipo(obj);
  if (!tipo) { console.error(c('verm', 'este arquivo não é um estado (itens[]) nem uma receita (nome+cal).')); process.exit(1); }

  const pasta = PASTAS[tipo];
  if (!fs.existsSync(pasta)) fs.mkdirSync(pasta, { recursive: true });

  let destinoNome = path.basename(origem);
  if (!destinoNome.toLowerCase().endsWith('.json')) destinoNome += '.json';
  const destino = path.join(pasta, destinoNome);

  if (fs.existsSync(destino) && path.resolve(origem) !== path.resolve(destino)) {
    console.log(c('amar', 'sobrescrevendo ' + tipo + '/' + destinoNome));
  }
  fs.copyFileSync(origem, destino);

  reindexar(tipo);
  console.log(c('verde', '+ ' + tipo + '/' + destinoNome) + c('fraco', '  (' + (obj.nome || '?') + ')'));
  return { tipo, arquivo: destinoNome };
}

function cmdList() {
  const idx = reindexarTudo();   // reindexa antes de listar, para refletir a pasta
  for (const [rotulo, lista] of [['Estados', idx.estados], ['Receitas', idx.receitas]]) {
    console.log('\n' + c('neg', rotulo) + c('fraco', '  (' + lista.length + ')'));
    if (!lista.length) { console.log(c('fraco', '  (vazio)')); continue; }
    lista.forEach(e => console.log('  ' + e.nome.padEnd(40) + c('fraco', e.arquivo + '   ' + String(e.salvoEm).slice(0, 10))));
  }
}

function cmdRm(alvo) {
  if (!alvo) { console.error(c('verm', 'informe o nome ou arquivo: rm "<nome>"')); process.exit(1); }

  const achados = [];
  for (const tipo of Object.keys(PASTAS)) {
    for (const e of reindexar(tipo)) {
      if (e.arquivo === alvo || e.nome === alvo || e.arquivo === alvo + '.json') achados.push({ tipo, ...e });
    }
  }

  if (!achados.length) { console.error(c('verm', 'não encontrei "' + alvo + '".')); process.exit(1); }
  if (achados.length > 1) {
    console.error(c('amar', '"' + alvo + '" casa com vários — use o nome do arquivo:'));
    achados.forEach(a => console.error('  ' + a.tipo + '/' + a.arquivo));
    process.exit(1);
  }

  const a = achados[0];
  fs.unlinkSync(path.join(PASTAS[a.tipo], a.arquivo));
  reindexar(a.tipo);
  console.log(c('verm', '- ' + a.tipo + '/' + a.arquivo));
  return a;
}

// ---------- git ----------

const git = (...args) => execFileSync('git', args, { cwd: REPO, encoding: 'utf8' }).trim();

function publicar(mensagem) {
  try {
    git('add', 'estados', 'receitas');
    if (!git('status', '--porcelain', 'estados', 'receitas')) {
      console.log(c('fraco', 'nada para publicar.'));
      return;
    }
    const branch = git('rev-parse', '--abbrev-ref', 'HEAD');
    git('commit', '-m', mensagem);
    console.log(c('verde', 'commit criado em ' + branch));

    git('push', 'origin', branch);
    console.log(c('verde', 'enviado para origin/' + branch));
    console.log(branch === 'main'
      ? c('fraco', 'o GitHub Pages vai republicar em ~1 minuto.')
      : c('amar', 'você está em "' + branch + '" — o Pages publica a partir de main.'));
  } catch (e) {
    console.error(c('verm', 'falha no git: ' + (e.stderr || e.message)));
    console.error(c('fraco', 'os arquivos foram salvos; é só commitar à mão.'));
    process.exit(1);
  }
}

// ---------- principal ----------

const AJUDA = `
${c('neg', 'Sessões publicadas (estados e receitas)')}

  node tools/sessions.js add <arquivo.json>    copia p/ a pasta certa e reindexa
  node tools/sessions.js list                  lista o que está publicado
  node tools/sessions.js reindex               reconstrói os index.json
  node tools/sessions.js rm "<nome|arquivo>"   remove

  --push    commita e envia ao GitHub depois de alterar
`;

(function main() {
  const args = process.argv.slice(2);
  const push = args.includes('--push');
  const resto = args.filter(a => a !== '--push');
  const cmd = resto[0];
  const arg = resto.slice(1).join(' ');

  let alterou = false;
  let msg = '';

  switch (cmd) {
    case 'add':     { const r = cmdAdd(arg); alterou = true; msg = 'Sessões: add ' + r.tipo + '/' + r.arquivo; break; }
    case 'rm':
    case 'remove':  { const r = cmdRm(arg);  alterou = true; msg = 'Sessões: rm ' + r.tipo + '/' + r.arquivo; break; }
    case 'reindex': { reindexarTudo();       alterou = true; msg = 'Sessões: reindex'; console.log(c('verde', 'index.json reconstruídos.')); break; }
    case 'list':    cmdList(); break;
    default:        console.log(AJUDA);
  }

  if (alterou && push) publicar(msg);
  else if (alterou && !process.env.NUTRI_CONSOLE) console.log(c('fraco', 'use --push para publicar no GitHub.'));
})();
