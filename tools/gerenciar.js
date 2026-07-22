#!/usr/bin/env node
//---------------------------------------------------------------//
// Console amigavel da plataforma. Abre um menu com comandos curtos
// (add, edit, list, publish...) por cima dos utilitarios foods.js e
// sessions.js. Feito para ser aberto com dois cliques no Gerenciar.bat.
//
// Uso:
//   node tools/gerenciar.js          abre o menu interativo
//   node tools/gerenciar.js list     roda um comando e sai (avancado)
//---------------------------------------------------------------//

const path = require('path');
const readline = require('readline');
const { spawnSync } = require('child_process');

const REPO = path.resolve(__dirname, '..');

const cores = { reset:'\x1b[0m', neg:'\x1b[1m', fraco:'\x1b[2m', verm:'\x1b[31m', verde:'\x1b[32m', amar:'\x1b[33m', ciano:'\x1b[36m' };
const c = (cor, t) => cores[cor] + t + cores.reset;

// ---------- tabela de comandos ----------
// tool: qual utilitario chamar | args: argumentos fixos | precisaArg: pede um argumento
// muta: altera arquivos (mostra o lembrete de publicar) | grupo/desc: para o menu

const COMANDOS = {
  add:      { grupo: 'BASE DE ALIMENTOS', uso: 'add',            desc: 'adiciona um alimento',            tool: 'foods',    args: ['add'],        muta: true, interativo: true },
  edit:     { grupo: 'BASE DE ALIMENTOS', uso: 'edit <nome>',    desc: 'edita um alimento',               tool: 'foods',    args: ['edit'],       muta: true, interativo: true, precisaArg: 'o nome do alimento' },
  rm:       { grupo: 'BASE DE ALIMENTOS', uso: 'rm <nome>',      desc: 'remove um alimento',              tool: 'foods',    args: ['rm'],         muta: true, interativo: true, precisaArg: 'o nome do alimento' },
  list:     { grupo: 'BASE DE ALIMENTOS', uso: 'list [termo]',   desc: 'lista os alimentos (filtra)',     tool: 'foods',    args: ['list'] },
  cats:     { grupo: 'BASE DE ALIMENTOS', uso: 'cats',           desc: 'mostra as categorias',            tool: 'foods',    args: ['categorias'] },
  check:    { grupo: 'BASE DE ALIMENTOS', uso: 'check',          desc: 'procura erros na base',           tool: 'foods',    args: ['check'] },

  pub:      { grupo: 'SESSÕES',           uso: 'pub <arquivo>',  desc: 'publica um estado/receita baixado', tool: 'sessions', args: ['add'],      muta: true, precisaArg: 'o caminho do .json (pode arrastar o arquivo para cá)' },
  unpub:    { grupo: 'SESSÕES',           uso: 'unpub <nome>',   desc: 'remove um estado/receita',        tool: 'sessions', args: ['rm'],         muta: true, precisaArg: 'o nome ou arquivo' },
  sessions: { grupo: 'SESSÕES',           uso: 'sessions',       desc: 'lista estados e receitas',        tool: 'sessions', args: ['list'] },
  reindex:  { grupo: 'SESSÕES',           uso: 'reindex',        desc: 'reconstrói os índices',           tool: 'sessions', args: ['reindex'], muta: true },

  publish:  { grupo: 'GITHUB',            uso: 'publish',        desc: 'envia tudo ao site (commit + push)', especial: 'publish' },
  pull:     { grupo: 'GITHUB',            uso: 'pull',           desc: 'baixa as últimas alterações',     especial: 'pull' },

  help:     { grupo: 'OUTROS',            uso: 'help',           desc: 'mostra esta lista',               especial: 'help' },
  exit:     { grupo: 'OUTROS',            uso: 'exit',           desc: 'sair',                            especial: 'exit' },
};

// apelidos
const APELIDOS = { ls:'list', categorias:'cats', remove:'rm', delete:'rm', del:'rm',
                   push:'publish', publicar:'publish', quit:'exit', q:'exit', sair:'exit',
                   '?':'help', ajuda:'help' };

// ---------- menu ----------

function banner(){
  console.log('');
  console.log(c('neg', '  ┌─────────────────────────────────────────────┐'));
  console.log(c('neg', '  │        Gerenciador da plataforma nutri        │'));
  console.log(c('neg', '  └─────────────────────────────────────────────┘'));
  console.log(c('fraco', '  Digite um comando e Enter. "help" mostra tudo, "exit" sai.'));

  var grupos = [];
  Object.keys(COMANDOS).forEach(function(k){
    var g = COMANDOS[k].grupo;
    if (grupos.indexOf(g) === -1) grupos.push(g);
  });

  grupos.forEach(function(g){
    console.log('\n  ' + c('ciano', g));
    Object.keys(COMANDOS).forEach(function(k){
      var cmd = COMANDOS[k];
      if (cmd.grupo !== g) return;
      console.log('    ' + c('neg', cmd.uso.padEnd(16)) + c('fraco', cmd.desc));
    });
  });
  console.log('');
}

// ---------- execução ----------

// Comandos que fazem perguntas (add/edit/rm) recebem o terminal (stdin
// 'inherit'). Os demais nao leem stdin, entao usam 'ignore' — assim o
// leitor do menu continua dono da entrada.
function rodarTool(tool, args, interativo){
  var r = spawnSync(process.execPath, [path.join(REPO, 'tools', tool + '.js')].concat(args), {
    cwd: REPO,
    stdio: [ interativo ? 'inherit' : 'ignore', 'inherit', 'inherit' ],
    env: Object.assign({}, process.env, { NUTRI_CONSOLE: '1' }),
  });
  return r.status === 0;
}

function git(args, mostrar){
  return spawnSync('git', args, { cwd: REPO, stdio: mostrar ? 'inherit' : 'pipe', encoding: 'utf8' });
}

function publicar(){
  git(['add', 'foods.json', 'estados', 'receitas']);
  var st = git(['status', '--porcelain', 'foods.json', 'estados', 'receitas']);
  if (!st.stdout || !st.stdout.trim()){ console.log(c('fraco', 'nada para publicar.')); return; }

  var branch = (git(['rev-parse', '--abbrev-ref', 'HEAD']).stdout || 'main').trim();

  var commit = git(['commit', '-m', 'Atualiza base/sessoes pelo gerenciador'], true);
  if (commit.status !== 0){ console.log(c('verm', 'falha ao criar o commit.')); return; }

  var push = git(['push', 'origin', branch], true);
  if (push.status === 0){
    console.log(c('verde', 'enviado ao GitHub.') + c('fraco', ' O site republica em ~1 min.'));
    if (branch !== 'main') console.log(c('amar', 'você está em "' + branch + '" — o site publica a partir de main.'));
  } else {
    console.log(c('verm', 'falha no push (confira sua conexão / login do git).'));
  }
}

// Executa um comando. Devolve false só para "exit".
function executar(cmd, arg){
  cmd = (cmd || '').toLowerCase();
  cmd = APELIDOS[cmd] || cmd;

  var def = COMANDOS[cmd];
  if (!def){
    console.log(c('amar', 'comando desconhecido: "' + cmd + '"') + c('fraco', '  (digite help)'));
    return true;
  }

  switch (def.especial){
    case 'exit':  return false;
    case 'help':  banner(); return true;
    case 'publish': publicar(); return true;
    case 'pull':  git(['pull', '--ff-only'], true); return true;
  }

  if (def.precisaArg && !arg){
    console.log(c('amar', 'faltou ' + def.precisaArg + ':') + c('fraco', '  ex.: ' + def.uso));
    return true;
  }

  // tira aspas que sobram quando se arrasta um arquivo para o terminal
  arg = arg.replace(/^"(.*)"$/, '$1');

  var argsFinais = def.args.slice();
  if (arg) argsFinais.push(arg);

  var ok = rodarTool(def.tool, argsFinais, def.interativo);

  if (def.muta && ok){
    console.log(c('fraco', '\n  alterações salvas localmente — digite ') + c('ciano', 'publish') + c('fraco', ' para enviar ao site.'));
  }
  return true;
}

// ---------- laço interativo ----------

// Leitor de linhas com fila: uma unica readline persistente, robusta tanto
// no terminal quanto com entrada redirecionada (a versao anterior, que abria
// e fechava uma readline por pergunta, perdia linhas quando a entrada vinha
// de um pipe).
function criarLeitor(){
  var io = readline.createInterface({ input: process.stdin, output: process.stdout });
  var fila = [], esperando = [], fechado = false;

  io.on('line', function(l){ if (esperando.length) esperando.shift()(l); else fila.push(l); });
  io.on('close', function(){ fechado = true; while (esperando.length) esperando.shift()(null); });

  return {
    linha: function(prompt){
      process.stdout.write(prompt);
      return new Promise(function(res){
        if (fila.length) return res(fila.shift());
        if (fechado) return res(null);
        esperando.push(res);
      });
    },
    close: function(){ io.close(); },
  };
}

async function menu(){
  banner();
  var io = criarLeitor();

  for (;;){
    var bruto = await io.linha('\n' + c('ciano', 'nutri> '));
    if (bruto === null) break;          // fim da entrada (Ctrl+Z / EOF)

    var linha = bruto.trim();
    if (!linha) continue;

    var partes = linha.split(/\s+/);
    var cmd = (partes[0] || '').toLowerCase();
    cmd = APELIDOS[cmd] || cmd;
    var arg = partes.slice(1).join(' ');

    var def = COMANDOS[cmd];
    if (def && def.especial === 'exit') break;

    try {
      if (def && def.interativo){
        // entrega o terminal ao comando que faz perguntas, depois reabre o leitor
        io.close();
        executar(cmd, arg);
        io = criarLeitor();
      } else {
        executar(cmd, arg);
      }
    } catch (e){ console.log(c('verm', 'erro: ' + e.message)); }
  }

  console.log(c('fraco', '\naté logo!\n'));
}

// ---------- entrada ----------

var argv = process.argv.slice(2);
if (argv.length){
  // modo de um comando só (avançado / testes)
  executar(argv[0], argv.slice(1).join(' '));
} else {
  menu();
}
