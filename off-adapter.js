// ============================================================================
// Ponte com o Open Food Facts (OFF) — alimentos de supermercados do Reino Unido
// ----------------------------------------------------------------------------
// O app tem duas bases locais (foods.json e a tabela TACO). Este modulo
// adiciona uma TERCEIRA fonte, ao vivo: produtos vendidos no Reino Unido,
// buscados no Open Food Facts. E gratuito, nao precisa de chave de API e
// responde com CORS liberado (Access-Control-Allow-Origin: *), entao funciona
// direto de um site estatico como o GitHub Pages.
//
// O OFF guarda os nutrientes POR 100 g. O app fala "por unidade" (por grama
// quando unidade === "gramas", que e o caso aqui). offParaAlimento() faz essa
// conversao e devolve um objeto no MESMO formato dos foods.json:
//     { nome, categoria, unidade, cal, protein, carb, fats, detalhes }
// Assim o resto do app (aplicaAlimento, salvar/carregar sessao, LaTeX...) trata
// um produto do supermercado igualzinho a um alimento da base pessoal.
// ============================================================================

// Endpoint de busca no dominio "uk.": ja devolve so produtos vendidos no
// Reino Unido. (O search.pl as vezes responde 503 por sobrecarga; por isso a
// busca abaixo tenta algumas vezes antes de desistir.)
var OFF_ENDPOINT  = "https://uk.openfoodfacts.org/cgi/search.pl";
var OFF_CATEGORIA = "Supermercado (Reino Unido)";

function offArred(x){ return Math.round(Number(x) * 10) / 10; }

// Converte um produto do OFF para o formato de alimento do app.
// Devolve null se faltar algum macro essencial (o produto tem dados
// incompletos e nao serviria para montar o plano).
function offParaAlimento(prod){

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

    var detalhes = "Open Food Facts (Reino Unido)";
    if (prod.quantity){ detalhes += " · " + prod.quantity; }
    if (prod.code){ detalhes += " · cód " + prod.code; }
    detalhes += " · por 100 g: " +
        offArred(cal) + " kcal, " + offArred(prot) + " g prot, " +
        offArred(carb) + " g carb, " + offArred(fat) + " g gord.";

    return {
        nome: nome,
        categoria: OFF_CATEGORIA,
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

// Busca no OFF (Reino Unido) e devolve uma lista de alimentos JA no formato
// do app. Produtos com dados incompletos sao descartados. Faz ate `tentativas`
// tentativas porque o endpoint as vezes devolve 503 sob carga.
function buscarOpenFoodFacts(termo, tentativas){

    // o search.pl do OFF costuma responder 503 sob carga; algumas tentativas
    // resolvem a grande maioria dos casos
    tentativas = tentativas || 6;

    var url = OFF_ENDPOINT +
        "?search_terms=" + encodeURIComponent(termo) +
        "&search_simple=1&action=process&json=1&page_size=40" +
        "&fields=product_name,brands,quantity,code,nutriments";

    function tentar(restam){
        return fetch(url, { headers: { "Accept": "application/json" } })
            .then(function(r){
                // 503 = servico ocupado: espera um pouco e tenta de novo
                if (r.status === 503 && restam > 1){
                    return offEsperar(700).then(function(){ return tentar(restam - 1); });
                }
                if (!r.ok){ throw new Error("Open Food Facts respondeu " + r.status); }
                return r.json();
            })
            .then(function(data){
                var brutos = (data && data.products) || [];
                var out = [];
                brutos.forEach(function(p){
                    var a = offParaAlimento(p);
                    if (a){ out.push(a); }
                });
                return out;
            });
    }

    return tentar(tentativas);
}
