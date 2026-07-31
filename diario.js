// Diário do cliente: o que ele realmente comeu, dia a dia.
//
// Um documento por PLANO (o "estado"), porque um plano é feito para uma pessoa.
// Dentro dele, um registro por data:
//
//   { v:1, plano:"madeira-plan.json", dias: { "2026-08-01": {...}, ... } }
//
// Trocar de backend é trocar SÓ este arquivo. A interface é:
//
//   Diario.remoto            -> true se atravessa de um aparelho para outro
//   Diario.carregar(plano)   -> Promise<doc|null>
//   Diario.salvar(plano,doc) -> Promise<void>
//
// O Firebase aqui é usado pela API REST do Realtime Database — nada de SDK,
// que manteria a promessa deste repositório de não ter dependência nem build.
// Um GET e um PUT resolvem.

(function(){

  var CFG = window.DIARIO_CONFIG || {};
  var BASE = String(CFG.firebaseURL || "").trim().replace(/\/+$/, "");

  // ---- aparelho (enquanto o Firebase não estiver configurado) --------------

  function chaveLocal(plano){ return "nutri:diario:" + plano; }

  var local = {
    remoto: false,
    carregar: function(plano){
      var doc = null;
      try { doc = JSON.parse(localStorage.getItem(chaveLocal(plano)) || "null"); }
      catch(e){ doc = null; }
      return Promise.resolve(doc);
    },
    salvar: function(plano, doc){
      try { localStorage.setItem(chaveLocal(plano), JSON.stringify(doc)); }
      catch(e){ return Promise.reject(new Error("sem espaço no aparelho")); }
      return Promise.resolve();
    }
  };

  // ---- Firebase Realtime Database (REST) ----------------------------------

  // "madeira-plan.json" -> "madeira-plan_json": ponto, #, $, [ e ] não podem
  // aparecer numa chave do Realtime Database.
  function chaveRemota(plano){
    return String(plano).replace(/[.#$\[\]\/]/g, "_");
  }

  function url(plano){ return BASE + "/diarios/" + chaveRemota(plano) + ".json"; }

  var remoto = {
    remoto: true,
    carregar: function(plano){
      return fetch(url(plano) + "?t=" + Date.now())
        .then(function(r){
          if (!r.ok){ throw new Error("HTTP " + r.status); }
          return r.json();          // o RTDB devolve null quando não existe
        });
    },
    salvar: function(plano, doc){
      return fetch(url(plano), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(doc)
      }).then(function(r){
        if (!r.ok){ throw new Error("HTTP " + r.status); }
      });
    }
  };

  window.Diario = BASE ? remoto : local;
})();
