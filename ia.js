// Adivinha os food facts a partir de uma frase ("500ml de cerveja Peroni").
//
// Quem fala com a OpenAI é o worker (worker/openai-proxy.js), que guarda a
// chave. Daqui sai só a frase do usuário.
//
//   IA.ligada()        -> tem proxy configurado?
//   IA.adivinhar(txt)  -> Promise<[{nome, unidade, qtd, cal, protein, carb, fats, detalhes}]>
//
// Os macros de cada opção são POR UNIDADE, igual ao resto do app: o total sai
// de qtd x unidade, e por isso mexer na quantidade depois continua funcionando.

(function(){

  var CFG = window.IA_CONFIG || {};
  var ENDPOINT = String(CFG.endpoint || "").trim().replace(/\/+$/, "");

  function num(v){ var n = parseFloat(v); return isFinite(n) ? n : 0; }

  // A resposta vem de fora: trata como palpite, não como verdade. Só passa o
  // que tem nome e formato de número; o resto vira zero.
  function limpar(lista){
    if (!Array.isArray(lista)){ return []; }
    return lista.slice(0, 3).map(function(o){
      if (!o || !String(o.nome || "").trim()){ return null; }
      var qtd = num(o.qtd);
      return {
        nome: String(o.nome).slice(0, 120),
        unidade: String(o.unidade || "unidade").slice(0, 40),
        qtd: qtd > 0 ? qtd : 1,
        cal: Math.max(0, num(o.cal)),
        protein: Math.max(0, num(o.protein)),
        carb: Math.max(0, num(o.carb)),
        fats: Math.max(0, num(o.fats)),
        detalhes: String(o.detalhes || "").slice(0, 300)
      };
    }).filter(Boolean);
  }

  window.IA = {
    ligada: function(){ return !!ENDPOINT; },

    adivinhar: function(texto){
      if (!ENDPOINT){ return Promise.reject(new Error("sem proxy configurado")); }

      return fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: String(texto || "").slice(0, 300) })
      }).then(function(r){
        return r.json().then(function(d){
          if (!r.ok){ throw new Error((d && d.erro) || ("HTTP " + r.status)); }
          return limpar(d && d.opcoes);
        });
      });
    }
  };
})();
