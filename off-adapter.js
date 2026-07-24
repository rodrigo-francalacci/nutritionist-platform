// ============================================================================
// Ponte com o Open Food Facts (OFF) — produtos de supermercado, ao vivo
// ----------------------------------------------------------------------------
// O app tem duas bases locais (foods.json e a tabela TACO). Este modulo
// adiciona fontes AO VIVO: produtos de supermercado buscados no Open Food
// Facts. E gratuito, nao precisa de chave de API e responde com CORS liberado
// (Access-Control-Allow-Origin: *), entao funciona direto de um site estatico
// como o GitHub Pages.
//
// Ha duas regioes, cada uma no seu dominio do OFF (que ja filtra por pais):
//   uk -> uk.openfoodfacts.org (Reino Unido)
//   br -> br.openfoodfacts.org (Brasil)
//
// O OFF guarda os nutrientes POR 100 g. O app fala "por unidade" (por grama
// quando unidade === "gramas", que e o caso aqui). offParaAlimento() faz essa
// conversao e devolve um objeto no MESMO formato dos foods.json:
//     { nome, categoria, unidade, cal, protein, carb, fats, detalhes }
// Assim o resto do app (aplicaAlimento, salvar/carregar sessao, LaTeX...) trata
// um produto do supermercado igualzinho a um alimento da base pessoal.
// ============================================================================

var OFF_REGIOES = {
    uk: {
        endpoint:  "https://uk.openfoodfacts.org/cgi/search.pl",
        categoria: "Supermercado (Reino Unido)",
        origem:    "Reino Unido",
        rotulo:    "Reino Unido"
    },
    br: {
        endpoint:  "https://br.openfoodfacts.org/cgi/search.pl",
        categoria: "Supermercado (Brasil)",
        origem:    "Brasil",
        rotulo:    "Brasil"
    }
};

function offRegiaoDe(chave){ return OFF_REGIOES[chave] || OFF_REGIOES.uk; }

function offArred(x){ return Math.round(Number(x) * 10) / 10; }

// Converte um produto do OFF para o formato de alimento do app.
// Devolve null se faltar algum macro essencial (o produto tem dados
// incompletos e nao serviria para montar o plano).
function offParaAlimento(prod, regiao){

    regiao = regiao || OFF_REGIOES.uk;

    var n = prod && prod.nutriments;
    if (!n){ return null; }

    var cal  = n["energy-kcal_100g"];
    var prot = n["proteins_100g"];
    var carb = n["carbohydrates_100g"];
    var fat  = n["fat_100g"];

    // exige os quatro macros: sem eles o alimento e inutil no plano
    if (cal == null || prot == null || carb == null || fat == null){ return null; }

    var nome = String(prod.product_name || "").trim();
    if (!nome){ return null; }

    var marca = String(prod.brands || "").split(",")[0].trim();
    if (marca){ nome = nome + " — " + marca; }   // "Nome — Marca"

    var detalhes = "Open Food Facts (" + regiao.origem + ")";
    if (prod.quantity){ detalhes += " · " + prod.quantity; }
    if (prod.code){ detalhes += " · cód " + prod.code; }
    detalhes += " · por 100 g: " +
        offArred(cal) + " kcal, " + offArred(prot) + " g prot, " +
        offArred(carb) + " g carb, " + offArred(fat) + " g gord.";

    return {
        nome: nome,
        categoria: regiao.categoria,
        unidade: "gramas",
        // OFF vem por 100 g; o app quer por 1 g
        cal:     cal  / 100,
        protein: prot / 100,
        carb:    carb / 100,
        fats:    fat  / 100,
        detalhes: detalhes
    };
}

function offEsperar(ms){ return new Promise(function(res){ setTimeout(res, ms); }); }

// Busca no OFF de uma regiao ("uk" ou "br") e devolve uma lista de alimentos
// JA no formato do app. Produtos com dados incompletos sao descartados. Faz
// ate `tentativas` tentativas porque o endpoint as vezes devolve 503 sob carga.
function buscarOpenFoodFacts(termo, regiaoChave, tentativas){

    var regiao = offRegiaoDe(regiaoChave);

    // o search.pl do OFF costuma responder 5xx (500/503) sob carga; várias
    // tentativas resolvem a grande maioria dos casos
    tentativas = tentativas || 8;

    var url = regiao.endpoint +
        "?search_terms=" + encodeURIComponent(termo) +
        "&search_simple=1&action=process&json=1&page_size=40" +
        "&fields=product_name,brands,quantity,code,nutriments";

    // Erros 5xx e falhas de rede são temporários (serviço ocupado/instável):
    // espera um pouco e tenta de novo enquanto houver tentativas. Só 4xx e o
    // esgotamento das tentativas viram erro de verdade.
    function buscarComRetentativa(restam){
        return fetch(url, { headers: { "Accept": "application/json" } })
            .then(function(r){
                if (r.status >= 500){
                    var e = new Error("Open Food Facts respondeu " + r.status);
                    e.temporario = true;
                    throw e;
                }
                if (!r.ok){ throw new Error("Open Food Facts respondeu " + r.status); }
                return r.json();
            })
            .catch(function(err){
                var temporario = (err && err.temporario) || (err && err.name === "TypeError"); // 5xx ou rede
                if (temporario && restam > 1){
                    return offEsperar(800).then(function(){ return buscarComRetentativa(restam - 1); });
                }
                throw err;
            });
    }

    return buscarComRetentativa(tentativas).then(function(data){
        var brutos = (data && data.products) || [];
        var out = [];
        brutos.forEach(function(p){
            var a = offParaAlimento(p, regiao);
            if (a){ out.push(a); }
        });
        return out;
    });
}
