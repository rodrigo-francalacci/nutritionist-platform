#!/usr/bin/env node
//---------------------------------------------------------------//
// Gera os ícones do app (icons/icon-192.png e icon-512.png).
//
//   node tools/icones.js
//
// Os PNG ficam commitados: isto aqui só roda quando você quiser
// mudar o desenho. Sem dependência nenhuma — o PNG é escrito na
// mão (cabeçalho + zlib do próprio Node + CRC32).
//
// O desenho: fundo azul da casa, um "prato" branco no meio. Com
// folga suficiente nas bordas para o Android poder recortar em
// círculo (ícone "maskable") sem cortar o prato.
//---------------------------------------------------------------//

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const AZUL   = [0x0B, 0x25, 0xD4];   // --cor2
const BRANCO = [0xFF, 0xFF, 0xFF];
const CLARO  = [0xAB, 0xDA, 0xFC];   // --cor4

// ---- PNG na unha ----

const TABELA_CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++){
    let c = n;
    for (let k = 0; k < 8; k++){ c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); }
    t[n] = c;
  }
  return t;
})();

function crc32(buf){
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++){ c = TABELA_CRC[(c ^ buf[i]) & 0xFF] ^ (c >>> 8); }
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function chunk(tipo, dados){
  const tam = Buffer.alloc(4);
  tam.writeUInt32BE(dados.length, 0);
  const corpo = Buffer.concat([Buffer.from(tipo, 'ascii'), dados]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(corpo), 0);
  return Buffer.concat([tam, corpo, crc]);
}

function png(largura, altura, pixels){          // pixels: Buffer RGB, linha a linha
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(largura, 0);
  ihdr.writeUInt32BE(altura, 4);
  ihdr[8] = 8;    // 8 bits por canal
  ihdr[9] = 2;    // RGB
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // cada linha começa com o byte de filtro (0 = nenhum)
  const cru = Buffer.alloc(altura * (1 + largura * 3));
  for (let y = 0; y < altura; y++){
    const destino = y * (1 + largura * 3);
    cru[destino] = 0;
    pixels.copy(cru, destino + 1, y * largura * 3, (y + 1) * largura * 3);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(cru, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

// ---- o desenho ----

function desenhar(tamanho){
  const px = Buffer.alloc(tamanho * tamanho * 3);
  const centro = (tamanho - 1) / 2;

  // o Android recorta um círculo de ~80% do ícone: o prato cabe dentro disso
  const raioPrato = tamanho * 0.28;
  const raioBorda = tamanho * 0.34;

  for (let y = 0; y < tamanho; y++){
    for (let x = 0; x < tamanho; x++){
      const d = Math.sqrt((x - centro) ** 2 + (y - centro) ** 2);
      let cor = AZUL;
      if (d <= raioPrato){ cor = BRANCO; }
      else if (d <= raioBorda){ cor = CLARO; }

      const i = (y * tamanho + x) * 3;
      px[i] = cor[0]; px[i + 1] = cor[1]; px[i + 2] = cor[2];
    }
  }
  return px;
}

const pasta = path.resolve(__dirname, '..', 'icons');
if (!fs.existsSync(pasta)){ fs.mkdirSync(pasta, { recursive: true }); }

[192, 512].forEach(function(t){
  const arquivo = path.join(pasta, 'icon-' + t + '.png');
  fs.writeFileSync(arquivo, png(t, t, desenhar(t)));
  console.log('escrito', arquivo, '(' + fs.statSync(arquivo).size + ' bytes)');
});
