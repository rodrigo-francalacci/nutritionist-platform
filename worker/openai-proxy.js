// Proxy da OpenAI — roda no Cloudflare Workers (plano gratuito serve).
//
// POR QUE EXISTE: o app é estático, servido pelo GitHub Pages. Tudo o que o
// navegador precisa saber, qualquer visitante lê no código-fonte. Uma chave da
// OpenAI ali dentro é dinheiro da sua conta na mão de quem passar — e existem
// robôs que varrem a web justamente atrás disso. Então a chave fica AQUI, no
// servidor, e a página só conversa com este endereço.
//
// COMO PUBLICAR (uma vez, ~5 min):
//   1. dash.cloudflare.com -> Workers & Pages -> Create -> Worker
//   2. cole este arquivo no editor e faça o Deploy
//   3. Settings -> Variables and Secrets -> Add:
//        Type: Secret   Name: OPENAI_API_KEY   Value: <a chave NOVA>
//        (use "Secret", não "Text": secret não aparece mais no painel)
//   4. ainda em Variables, opcionalmente:
//        Type: Text     Name: ORIGENS   Value: https://rodrigo-francalacci.github.io
//   5. copie a URL do worker (algo como https://nutri-ia.SEU-NOME.workers.dev)
//      e ponha em ia-config.js
//
// A lista de origens importa: sem ela, qualquer site poderia chamar este
// worker e gastar os seus créditos.

const MODELO = "gpt-4o-mini";      // barato e suficiente para "quanto tem num copo de cerveja"
const MAX_TEXTO = 300;             // um pedido é uma frase curta, não um texto

const INSTRUCAO = [
  "Você recebe uma frase em português ou inglês em que alguém descreve algo que comeu ou bebeu.",
  "Devolva de 1 a 3 interpretações possíveis, da mais provável para a menos provável.",
  "Cada interpretação descreve UM item, com:",
  "  nome: nome curto e reconhecível do alimento/bebida (inclua a marca se a pessoa citou)",
  "  unidade: a unidade em que faz sentido medir ISTO (ml, gramas, unidade, fatia, colher de sopa...)",
  "  qtd: quantas dessas unidades a pessoa disse ter consumido (se não disse, estime uma porção normal)",
  "  cal, protein, carb, fats: os macros de UMA unidade, não do total.",
  "Exemplo: '500ml de cerveja Peroni' -> unidade 'ml', qtd 500, cal ~0.43 (que é a caloria de 1 ml).",
  "Se a frase não descreve comida nem bebida, devolva a lista vazia."
].join("\n");

const ESQUEMA = {
  type: "object",
  properties: {
    opcoes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          nome:     { type: "string" },
          unidade:  { type: "string" },
          qtd:      { type: "number" },
          cal:      { type: "number" },
          protein:  { type: "number" },
          carb:     { type: "number" },
          fats:     { type: "number" },
          detalhes: { type: "string" }
        },
        required: ["nome","unidade","qtd","cal","protein","carb","fats","detalhes"],
        additionalProperties: false
      }
    }
  },
  required: ["opcoes"],
  additionalProperties: false
};

function origemPermitida(request, env){
  var origem = request.headers.get("Origin") || "";
  var lista = String(env.ORIGENS || "").split(",").map(function(s){ return s.trim(); }).filter(Boolean);
  if (!lista.length){ return origem; }              // sem lista configurada: não bloqueia
  return lista.indexOf(origem) >= 0 ? origem : null;
}

function comCORS(resposta, origem){
  var h = new Headers(resposta.headers);
  h.set("Access-Control-Allow-Origin", origem || "*");
  h.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  h.set("Access-Control-Allow-Headers", "Content-Type");
  h.set("Vary", "Origin");
  return new Response(resposta.body, { status: resposta.status, headers: h });
}

function json(obj, status, origem){
  return comCORS(new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "Content-Type": "application/json" }
  }), origem);
}

export default {
  async fetch(request, env){
    var origem = origemPermitida(request, env);

    if (request.method === "OPTIONS"){
      return comCORS(new Response(null, { status: 204 }), origem || "*");
    }
    if (origem === null){
      return json({ erro: "origem não autorizada" }, 403, "*");
    }
    if (request.method !== "POST"){
      return json({ erro: "use POST" }, 405, origem);
    }
    if (!env.OPENAI_API_KEY){
      return json({ erro: "o worker está sem OPENAI_API_KEY" }, 500, origem);
    }

    var corpo;
    try { corpo = await request.json(); }
    catch(e){ return json({ erro: "corpo inválido" }, 400, origem); }

    var texto = String((corpo && corpo.texto) || "").trim();
    if (!texto){ return json({ erro: "diga o que você comeu" }, 400, origem); }
    if (texto.length > MAX_TEXTO){ return json({ erro: "texto longo demais" }, 400, origem); }

    var r;
    try {
      r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + env.OPENAI_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: env.MODELO || MODELO,
          messages: [
            { role: "system", content: INSTRUCAO },
            { role: "user", content: texto }
          ],
          response_format: {
            type: "json_schema",
            json_schema: { name: "alimentos", strict: true, schema: ESQUEMA }
          }
        })
      });
    } catch(e){
      return json({ erro: "não consegui falar com a OpenAI" }, 502, origem);
    }

    if (!r.ok){
      // o texto do erro da OpenAI pode conter detalhe de conta: não repassar
      return json({ erro: "a OpenAI recusou (HTTP " + r.status + ")" }, 502, origem);
    }

    var dados = await r.json();
    var conteudo = dados && dados.choices && dados.choices[0] &&
                   dados.choices[0].message && dados.choices[0].message.content;

    var saida;
    try { saida = JSON.parse(conteudo); }
    catch(e){ return json({ erro: "resposta ininteligível" }, 502, origem); }

    return json({ opcoes: (saida && saida.opcoes) || [] }, 200, origem);
  }
};
