// Service worker do modo de visualização.
//
// Serve para duas coisas:
//   1. o Chrome só oferece "instalar" com um service worker no ar;
//   2. o plano abre sem sinal — que é metade da graça, porque o celular
//      costuma sair do bolso justamente no supermercado ou na cozinha.
//
// A regra é diferente por tipo de arquivo, e a diferença importa:
//
//   páginas e scripts  -> REDE PRIMEIRO. Um app que guarda o próprio código
//                         para sempre é um app que nunca mais atualiza. Se a
//                         rede falhar, aí sim usa o que estiver guardado.
//   bases de alimentos -> GUARDADO PRIMEIRO. São ~180 KB que quase nunca
//                         mudam; baixar de novo a cada busca seria desperdício.
//   planos (estados/)  -> REDE PRIMEIRO, com cópia de reserva. O plano pode ter
//                         sido reescrito pela nutricionista hoje de manhã.
//   Firebase           -> NUNCA passa por aqui. Diário é dado vivo; guardar
//                         resposta de diário daria o dia de ontem como o de hoje.

var VERSAO = "v3";
var CACHE = "nutri-" + VERSAO;

// O essencial para a tela abrir offline. Inclui as bases de alimentos: são
// ~180 KB, mas o "install" roda em segundo plano (não segura a primeira
// pintura), e sem elas a busca do Extra ficaria vazia justamente para quem
// instalou o app e foi ao mercado sem sinal.
var TACO = ["bebidas","carnes_e_derivados","cereais_e_derivados","frutas_e_derivados",
  "leguminosas_e_derivados","leite_e_derivados","nozes_castanhas_e_outros",
  "ovos_e_derivados","pescados_e_frutos_do_mar","produtos_acucarados",
  "verduras_hortalicas_e_derivados","oleos_e_gorduras"];

var BASICO = [
  "view.html",
  "diario.js",
  "diario-config.js",
  "ia.js",
  "ia-config.js",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "foods.json"
].concat(TACO.map(function(g){ return "tabela_taco/" + g + ".json"; }));

self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      // addAll falha inteiro se UM arquivo falhar; aqui cada um por si
      return Promise.all(BASICO.map(function(u){
        return c.add(new Request(u, {cache: "reload"})).catch(function(){});
      }));
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(nomes){
      return Promise.all(nomes.map(function(n){
        return n === CACHE ? null : caches.delete(n);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

function guardar(req, resp){
  if (resp && resp.ok && resp.type === "basic"){
    var copia = resp.clone();
    caches.open(CACHE).then(function(c){ c.put(req, copia); });
  }
  return resp;
}

function redePrimeiro(req){
  return fetch(req).then(function(r){ return guardar(req, r); })
                   .catch(function(){ return caches.match(req); });
}

function guardadoPrimeiro(req){
  return caches.match(req).then(function(guardado){
    if (guardado){ return guardado; }
    return fetch(req).then(function(r){ return guardar(req, r); });
  });
}

self.addEventListener("fetch", function(e){
  var req = e.request;
  if (req.method !== "GET"){ return; }

  var url = new URL(req.url);

  // outra origem (Firebase, proxy da IA): passa direto, sem tocar
  if (url.origin !== self.location.origin){ return; }

  var caminho = url.pathname;

  if (/\/(foods\.json|tabela_taco\/)/.test(caminho)){
    e.respondWith(guardadoPrimeiro(req));
    return;
  }

  // O plano e o índice são pedidos com "?t=" para furar o cache do GitHub
  // Pages — o que também muda a chave do cache a cada carregamento. Sem
  // ignoreSearch, a cópia de reserva NUNCA seria encontrada e o app abriria
  // vazio no primeiro lugar sem sinal. Aqui a busca é pelo caminho.
  if (/\/(estados)\//.test(caminho)){
    e.respondWith(
      fetch(req).then(function(r){ return guardar(req, r); })
                .catch(function(){ return caches.match(req, { ignoreSearch: true }); })
    );
    return;
  }

  e.respondWith(redePrimeiro(req));
});
