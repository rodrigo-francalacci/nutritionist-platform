// Onde o diário do cliente é guardado.
//
// Enquanto "firebaseURL" estiver vazio, o diário fica só no aparelho
// (localStorage): dá para experimentar, mas não atravessa do celular para o
// computador. Preencha para ligar o Firebase de verdade.
//
// Como obter a URL:
//   1. console.firebase.google.com -> criar projeto (o de graça basta)
//   2. Build -> Realtime Database -> criar banco
//   3. copie a URL que aparece, algo como
//        https://SEU-PROJETO-default-rtdb.europe-west1.firebasedatabase.app
//   4. cole abaixo e troque o "?v=" das tags <script> do view.html
//
// Regras sugeridas (aba "Rules" do Realtime Database). Elas liberam SÓ a pasta
// dos diários, e nada mais do banco:
//
//   {
//     "rules": {
//       "diarios": { ".read": true, ".write": true },
//       "$outros": { ".read": false, ".write": false }
//     }
//   }
//
// O que isso significa, sem rodeios: quem souber o endereço do banco consegue
// ler e escrever os diários. É o mesmo nível de proteção que o plano já tem
// hoje (qualquer um com o link de visualização abre o plano). Se um dia isso
// não bastar, o caminho é pôr um proxy na frente — a troca fica toda dentro do
// diario.js, o resto do app não muda.

window.DIARIO_CONFIG = {
  firebaseURL: ""
};
