//---------------- CARREGAMENTO DAS BASES DE DADOS ----------------//
// Substitui loadTACO.js. Usa fetch em vez de jQuery, e espera todos
// os arquivos antes de montar a tela (a versao antiga disparava 12
// requisicoes soltas e montava a pagina sem saber se tinham chegado).

var foods = [];        // base pessoal (foods.json)
var tacoGrupos = {};   // { "Bebidas": [...], "Carnes e Derivados": [...], ... }

var TACO_ARQUIVOS = {
    "Bebidas":                  "bebidas.json",
    "Carnes e Derivados":       "carnes_e_derivados.json",
    "Cereais e Derivados":      "cereais_e_derivados.json",
    "Frutas e Derivados":       "frutas_e_derivados.json",
    "Leguminosas e Derivados":  "leguminosas_e_derivados.json",
    "Leite e Derivados":        "leite_e_derivados.json",
    "Nozes e Castanhas":        "nozes_castanhas_e_outros.json",
    "Ovos e Derivados":         "ovos_e_derivados.json",
    "Pescados e Frutos do Mar": "pescados_e_frutos_do_mar.json",
    "Produtos Açucarados":      "produtos_acucarados.json",
    "Verduras e Hortaliças":    "verduras_hortalicas_e_derivados.json",
    "Óleos e Gorduras":         "oleos_e_gorduras.json"
};

function pegarJSON(url){

    return fetch(url).then(function(resposta){
        if(!resposta.ok){ throw new Error("HTTP " + resposta.status); }
        return resposta.json();
    });
}

function carregarDados(){

    //a base pessoal e obrigatoria: se falhar, o erro sobe
    var pedidos = [
        pegarJSON("foods.json").then(function(json){ foods = json; })
    ];

    //os grupos da TACO sao opcionais: um arquivo com problema nao pode
    //derrubar a pagina inteira, so aquele grupo
    Object.keys(TACO_ARQUIVOS).forEach(function(nome){

        tacoGrupos[nome] = [];

        pedidos.push(
            pegarJSON("tabela_taco/" + TACO_ARQUIVOS[nome])
                .then(function(json){
                    tacoGrupos[nome] = json.Plan1 || [];
                })
                .catch(function(erro){
                    console.error('Falha ao carregar o grupo TACO "' + nome + '": ' + erro.message);
                })
        );
    });

    return Promise.all(pedidos);
}

//lista das categorias presentes na base pessoal, em ordem alfabetica
function categoriasPessoais(){

    var vistas = {};

    foods.forEach(function(f){
        var c = f.categoria || "Outros";
        vistas[c] = true;
    });

    return Object.keys(vistas).sort(function(a,b){ return a.localeCompare(b, "pt-BR"); });
}

function alimentosDaCategoria(categoria){

    return foods.filter(function(f){ return (f.categoria || "Outros") === categoria; });
}
