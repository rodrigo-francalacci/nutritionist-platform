// ============================================================================
// LEGADO — seletor de alimentos em dropdown (menu de vários níveis)
// ----------------------------------------------------------------------------
// Cópia de referência das funções do seletor antigo, como estavam em
// main-script.js quando o novo seletor em colunas foi introduzido.
//
// NÃO é carregado pela página. Serve só de backup, caso essas funções sejam
// um dia refatoradas/removidas do main-script.js e você queira restaurá-las.
// Veja o README.md desta pasta para instruções de reversão.
// ============================================================================

// O seletor de alimentos funciona como um menu com niveis. As entradas de
// navegacao usam valores com prefixo "__" para nunca colidirem com o nome
// de um alimento de verdade (antes, um alimento chamado "Voltar" ou
// "Receita" quebraria a tela).
var NAV = {
    VOLTAR:     "__voltar",
    RECEITA:    "__receita",
    MINHA_BASE: "__minhabase",
    TACO:       "__taco",
    CAT:        "__cat:",    // categoria da base pessoal
    GRUPO_TACO: "__taco:"    // grupo da tabela TACO
};

function updateFood(rowID){

    var row = parseInt(rowID.replace("-",""));
    var escolha = document.getElementById('foods-'+row).value;

    if (escolha === NAV.VOLTAR){
        mostrarMenuPrincipal(row);
        return;
    }

    if (escolha === NAV.RECEITA){
        document.getElementById("file-"+row).style.display="block";
        document.getElementById("col-qtd-"+row).style.display="none";
        return;
    }

    if (escolha === NAV.MINHA_BASE){
        mostrarCategoriasPessoais(row);
        return;
    }

    if (escolha === NAV.TACO){
        mostrarGruposTaco(row);
        return;
    }

    if (escolha.indexOf(NAV.CAT) === 0){
        mostrarCategoriaPessoal(row, escolha.slice(NAV.CAT.length));
        return;
    }

    if (escolha.indexOf(NAV.GRUPO_TACO) === 0){
        mostrarGrupoTaco(row, escolha.slice(NAV.GRUPO_TACO.length));
        return;
    }

    //e um alimento: procura na lista que esta em uso NESTA linha
    var select = document.getElementById('foods-'+row);
    var item = findByName(select._lista, escolha) || findByName(foods, escolha);
    aplicaAlimento(row, escolha, item);
}

//--- montagem das listas do seletor ---

function opcaoNav(select, valor, texto, destaque){

    var o = document.createElement("option");
    o.value = valor;
    o.text = texto;
    if (destaque === "acao"){ o.style.color = "var(--cor8)"; }
    if (destaque === "grupo"){
        o.style.backgroundColor = "var(--cor1)";
        o.style.color = "var(--cor4)";
    }
    select.appendChild(o);
    return o;
}

function opcoesDeAlimentos(select, lista){

    lista.slice()
         .sort(function(a,b){ return String(a.nome).localeCompare(String(b.nome), "pt-BR"); })
         .forEach(function(f){
             var o = document.createElement("option");
             o.value = f.nome;
             o.text = f.nome;
             select.appendChild(o);
         });

    //guarda a lista no proprio elemento: assim cada linha sabe de onde
    //veio o seu alimento, mesmo depois de as linhas serem renumeradas
    select._lista = lista;
}

function prepararSelect(row){

    document.getElementById("file-"+row).style.display="none";
    document.getElementById("col-qtd-"+row).style.display="block";

    var select = document.getElementById('foods-'+row);
    select.innerHTML = "";
    return select;
}

// nivel 0: acoes + base pessoal inteira (lista plana, como antes)
function mostrarMenuPrincipal(row){

    var select = prepararSelect(row);

    opcaoNav(select, NAV.RECEITA,    "Receita",              "acao");
    opcaoNav(select, NAV.MINHA_BASE, "Minha base por categoria", "acao");
    opcaoNav(select, NAV.TACO,       "Tabela TACO",          "acao");
    opcoesDeAlimentos(select, foods);
}

//cabecalho nao selecionavel, so para dizer onde o usuario esta
function opcaoTitulo(select, texto){

    var o = document.createElement("option");
    o.text = texto;
    o.disabled = true;
    o.selected = true;
    select.appendChild(o);
}

// nivel 1a: categorias da base pessoal
function mostrarCategoriasPessoais(row){

    var select = prepararSelect(row);

    opcaoTitulo(select, "— escolha uma categoria —");
    opcaoNav(select, NAV.VOLTAR, "Voltar", "acao");

    categoriasPessoais().forEach(function(cat){
        var qtd = alimentosDaCategoria(cat).length;
        opcaoNav(select, NAV.CAT + cat, cat + " (" + qtd + ")", "grupo");
    });

    select._lista = [];
    select.selectedIndex = 0;
}

// nivel 2a: alimentos de uma categoria da base pessoal
function mostrarCategoriaPessoal(row, categoria){

    var select = prepararSelect(row);

    opcaoNav(select, NAV.VOLTAR,     "Voltar",                  "acao");
    opcaoNav(select, NAV.MINHA_BASE, "« " + categoria,          "grupo");

    opcoesDeAlimentos(select, alimentosDaCategoria(categoria));
    select.value = NAV.MINHA_BASE;
}

// nivel 1b: grupos da tabela TACO
function mostrarGruposTaco(row){

    var select = prepararSelect(row);

    opcaoTitulo(select, "— escolha um grupo da TACO —");
    opcaoNav(select, NAV.VOLTAR, "Voltar", "acao");

    Object.keys(TACO_ARQUIVOS)
          .sort(function(a,b){ return a.localeCompare(b, "pt-BR"); })
          .forEach(function(grupo){
              opcaoNav(select, NAV.GRUPO_TACO + grupo, grupo, "grupo");
          });

    select._lista = [];
    select.selectedIndex = 0;
}

// nivel 2b: alimentos de um grupo da TACO
function mostrarGrupoTaco(row, grupo){

    var select = prepararSelect(row);
    var lista = tacoGrupos[grupo] || [];

    opcaoNav(select, NAV.VOLTAR, "Voltar",      "acao");
    opcaoNav(select, NAV.TACO,   "« " + grupo,  "grupo");

    if (lista.length === 0){
        console.error('Grupo TACO "' + grupo + '" vazio ou nao carregado.');
        opcaoNav(select, NAV.TACO, "(nao foi possivel carregar este grupo)", "acao");
    }

    opcoesDeAlimentos(select, lista);
    select.value = NAV.TACO;
}
