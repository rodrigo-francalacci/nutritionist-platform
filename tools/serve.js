#!/usr/bin/env node
//---------------------------------------------------------------//
// Servidor local para testar o site antes de publicar.
//
//   node tools/serve.js          -> http://localhost:8080
//   node tools/serve.js 3000     -> http://localhost:3000
//
// A pagina busca foods.json e a tabela TACO via fetch, e o navegador
// bloqueia fetch em file:// — por isso abrir o index.html direto do
// disco nao funciona. Sem dependencias: so Node.
//---------------------------------------------------------------//

const http = require('http');
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const PORTA = parseInt(process.argv[2], 10) || 8080;

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.pdf':  'application/pdf',
  '.xls':  'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

http.createServer((req, res) => {
  let rel;
  try {
    rel = decodeURIComponent(req.url.split('?')[0]);
  } catch {
    res.writeHead(400); return res.end('URL inválida');
  }
  if (rel === '/') rel = '/index.html';

  const arquivo = path.join(RAIZ, rel);

  // nao deixa escapar da pasta do projeto
  if (!arquivo.startsWith(RAIZ)) { res.writeHead(403); return res.end('proibido'); }

  fs.readFile(arquivo, (erro, conteudo) => {
    if (erro) {
      console.log('  404  ' + rel);
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('não encontrado: ' + rel);
    }
    res.writeHead(200, {
      'Content-Type': TIPOS[path.extname(arquivo).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store',   // sempre pega a versao mais recente ao recarregar
    });
    res.end(conteudo);
  });
}).listen(PORTA, () => {
  console.log('\n  Servindo ' + RAIZ);
  console.log('  \x1b[36mhttp://localhost:' + PORTA + '\x1b[0m');
  console.log('\n  Ctrl+C para parar.\n');
}).on('error', e => {
  if (e.code === 'EADDRINUSE') {
    console.error('\n  A porta ' + PORTA + ' já está em uso.');
    console.error('  Tente outra: node tools/serve.js ' + (PORTA + 1) + '\n');
  } else {
    console.error(e.message);
  }
  process.exit(1);
});
