// Proxy da OpenAI — versão Vercel (Serverless Function).
//
// Faz o mesmo que worker/openai-proxy.js. Você só precisa de UM dos dois:
// este, se preferir a Vercel; o outro, se preferir o Cloudflare. Mexeu num,
// mexa no outro, ou apague o que não usar.
//
// POR QUE EXISTE: o app é servido pelo GitHub Pages, que só entrega arquivos —
// nada seu roda no servidor deles. Não há onde ler uma variável de ambiente com
// segurança. Aqui na Vercel há: este arquivo roda no servidor, lê a chave de
// process.env e o navegador nunca a vê.
//
// COMO PUBLICAR (uma vez, ~5 min):
//   1. vercel.com -> Add New -> Project -> importe este repositório
//   2. Deploy (não precisa configurar build: a Vercel acha a pasta api/ sozinha)
//   3. Settings -> Environment Variables -> Add:
//        Name: OPENAI_API_KEY   Value: <a chave NOVA>   (todos os ambientes)
//        Name: ORIGENS          Value: https://rodrigo-francalacci.github.io
//   4. Redeploy (variável nova só vale no deploy seguinte)
//   5. o endereço é https://SEU-PROJETO.vercel.app/api/ia -> ponha em ia-config.js
//
// ORIGENS não é detalhe: sem ela, qualquer site pode chamar este endereço e
// gastar os seus créditos.

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

function origemPermitida(req){
  const origem = req.headers.origin || "";
  const lista = String(process.env.ORIGENS || "").split(",").map(s => s.trim()).filter(Boolean);
  if (!lista.length){ return origem || "*"; }   // sem lista configurada: não bloqueia
  return lista.includes(origem) ? origem : null;
}

export default async function handler(req, res){
  const origem = origemPermitida(req);

  res.setHeader("Access-Control-Allow-Origin", origem || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Vary", "Origin");

  if (req.method === "OPTIONS"){ return res.status(204).end(); }
  if (origem === null){ return res.status(403).json({ erro: "origem não autorizada" }); }
  if (req.method !== "POST"){ return res.status(405).json({ erro: "use POST" }); }
  if (!process.env.OPENAI_API_KEY){
    return res.status(500).json({ erro: "o servidor está sem OPENAI_API_KEY" });
  }

  // a Vercel já entrega req.body como objeto quando o content-type é json
  const corpo = typeof req.body === "string" ? safeParse(req.body) : (req.body || {});
  const texto = String((corpo && corpo.texto) || "").trim();

  if (!texto){ return res.status(400).json({ erro: "diga o que você comeu" }); }
  if (texto.length > MAX_TEXTO){ return res.status(400).json({ erro: "texto longo demais" }); }

  let r;
  try {
    r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + process.env.OPENAI_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.MODELO || MODELO,
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
  } catch (e){
    return res.status(502).json({ erro: "não consegui falar com a OpenAI" });
  }

  if (!r.ok){
    // o texto do erro da OpenAI pode conter detalhe de conta: não repassar
    return res.status(502).json({ erro: "a OpenAI recusou (HTTP " + r.status + ")" });
  }

  const dados = await r.json();
  const conteudo = dados?.choices?.[0]?.message?.content;
  const saida = safeParse(conteudo);

  if (!saida){ return res.status(502).json({ erro: "resposta ininteligível" }); }
  return res.status(200).json({ opcoes: saida.opcoes || [] });
}

function safeParse(txt){
  try { return JSON.parse(txt); } catch (e){ return null; }
}
