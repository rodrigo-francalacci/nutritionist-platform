// Onde fica o proxy que fala com a OpenAI.
//
// A chave da OpenAI NÃO entra aqui, nem em nenhum arquivo deste repositório:
// tudo isto é servido pelo GitHub Pages, e o que o navegador recebe qualquer
// pessoa lê. Chave em página pública é conta aberta para quem achar — e há
// robôs varrendo a web atrás exatamente disso.
//
// A chave mora no servidor que fica na frente da OpenAI — escolha UM:
//   api/ia.js                 -> Vercel (variável de ambiente OPENAI_API_KEY)
//   worker/openai-proxy.js    -> Cloudflare Workers (Secret OPENAI_API_KEY)
// Aqui fica só o endereço dele, que pode ser público:
//   https://SEU-PROJETO.vercel.app/api/ia
//   https://nutri-ia.SEU-NOME.workers.dev
//
// Enquanto estiver vazio, a seção "Extra" continua funcionando, mas pedindo os
// macros na mão em vez de adivinhar pela frase.

window.IA_CONFIG = {
  endpoint: ""
};
