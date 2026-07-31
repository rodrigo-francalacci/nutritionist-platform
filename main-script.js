//----------------------------------------------------------//
var data = [];    
var sum = {};
var outPage = "";
var rowTemplate = "";   //molde de uma linha vazia, capturado em initializePop()
    
function updateGrupo(rowID){
var row = parseInt(rowID.replace("-",""));

    data[row].grupo = document.getElementById('grupo-'+row).value;
}
    
//O seletor de alimentos funciona como um menu com niveis. As entradas de
//navegacao usam valores com prefixo "__" para nunca colidirem com o nome
//de um alimento de verdade (antes, um alimento chamado "Voltar" ou
//"Receita" quebraria a tela).
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

//procura um alimento pelo nome. Devolve null se nao existir,
//em vez de estourar o fim da lista.
function findByName(list, nome){

    if(!list){return null;}

    for(var i = 0; i < list.length; i++){
        if(list[i] && list[i].nome == nome){return list[i];}
    }
    return null;
}

//aceita tanto "1.5" quanto "1,5" e devolve 0 para entrada invalida
function parseNum(value){

    var n = parseFloat(String(value).replace(",", "."));
    return isNaN(n) ? 0 : n;
}

function aplicaAlimento(row, rowFood, item){

          document.getElementById("file-"+row).style.display="none";
          document.getElementById("col-qtd-"+row).style.display="block";

        //atualizar alimento no database
        data[row].nome = rowFood;
        data[row].semQtd = false;      // escolher um alimento sai do modo "livre"
        aplicarModoLivre(row);

        //mostra o nome escolhido no "chip" que substituiu o dropdown
        atualizarNomeAlimento(row, rowFood);

        if(item == null){
            //zera os macros para nao somar numeros antigos de outro alimento
            console.warn('Alimento nao encontrado na base: "' + rowFood + '"');
            data[row]._base = null;
            data[row].detalhes = "Alimento não encontrado na base de dados.";
            data[row].protein = 0;
            data[row].carb = 0;
            data[row].fats = 0;
            data[row].cal = 0;
            document.getElementById('detalhes-'+row).textContent = data[row].detalhes;
            document.getElementById('qtd-protein-'+row).textContent = 0;
            document.getElementById('qtd-carb-'+row).textContent = 0;
            document.getElementById('qtd-fat-'+row).textContent = 0;
            document.getElementById('qtd-cal-'+row).textContent = 0;
            document.getElementById('uni-'+row).textContent = "";
            sumFacts();
            return;
        }

        //guarda os macros POR UNIDADE PRINCIPAL + as unidades extras do alimento.
        //a linha começa na unidade principal; o usuário pode trocar depois.
        data[row]._base = baseDeAlimento(item);
        data[row].unidade = item.unidade;

        //atualiza os detalhes
        document.getElementById('detalhes-'+row).innerHTML = item.detalhes;
        data[row].detalhes = item.detalhes;

        data[row].qtd = document.getElementById('qtd-'+row).value;

        aplicarUnidadeControl(row);   //mostra o seletor de unidade se houver mais de uma
        recomputarMacros(row);
        sumFacts();
}

// ---- unidades múltiplas por alimento -------------------------------------
// Cada alimento tem uma unidade PRINCIPAL (macros por 1 dela) e pode ter
// unidades EXTRAS, definidas por equivalência: {unidade, equivale}, onde
// `equivale` = quantas unidades principais valem 1 dessa unidade. Ex.: base
// em gramas, "1 scoop = 30" -> scoop.equivale = 30.

// Extrai de um alimento os macros por unidade principal + a tabela de unidades.
function baseDeAlimento(f){
    return {
        unidadePrincipal: f.unidade,
        unidades: Array.isArray(f.unidades) ? f.unidades : [],
        cal: parseNum(f.cal), protein: parseNum(f.protein),
        carb: parseNum(f.carb), fats: parseNum(f.fats)
    };
}

// Garante que a linha tenha _base. Se o alimento estiver na base pessoal,
// usa a definição completa (com as unidades extras). Senão (TACO, OFF,
// receita — uma unidade só) deriva de UMA unidade a partir dos totais.
function garantirBase(row){
    if (data[row]._base){ return; }
    var f = findByName(foods, data[row].nome);
    if (f){ data[row]._base = baseDeAlimento(f); return; }
    var q = parseNum(data[row].qtd);
    var por = q > 0 ? 1 / q : 0;
    data[row]._base = {
        unidadePrincipal: data[row].unidade,
        unidades: [],
        cal:     parseNum(data[row].cal)     * por,
        protein: parseNum(data[row].protein) * por,
        carb:    parseNum(data[row].carb)    * por,
        fats:    parseNum(data[row].fats)    * por
    };
}

// Nomes de todas as unidades da linha: principal + extras (sem repetir).
function unidadesDaLinha(row){
    var b = data[row]._base;
    var principal = b ? b.unidadePrincipal : data[row].unidade;
    var nomes = [principal];
    if (b && b.unidades){
        b.unidades.forEach(function(u){
            if (u && u.unidade && nomes.indexOf(u.unidade) === -1){ nomes.push(u.unidade); }
        });
    }
    return nomes;
}

// Quantas unidades principais valem 1 da unidade escolhida.
function fatorDaUnidade(base, unidade){
    if (!base){ return 1; }
    if (unidade === base.unidadePrincipal){ return 1; }
    var lista = base.unidades || [];
    for (var i = 0; i < lista.length; i++){
        if (lista[i].unidade === unidade){ return parseNum(lista[i].equivale); }
    }
    return 1;
}

// Mostra a unidade: texto quando só há uma, <select> quando há extras.
function aplicarUnidadeControl(row){
    var host = document.getElementById('uni-'+row);
    if (!host){ return; }

    var nomes = unidadesDaLinha(row);
    var atual = data[row].unidade || nomes[0];
    if (nomes.indexOf(atual) === -1){ atual = nomes[0]; data[row].unidade = atual; }

    if (nomes.length <= 1){
        host.textContent = atual || "";
        return;
    }

    host.innerHTML = "";
    var sel = document.createElement("select");
    sel.className = "uni-select";
    sel.id = "uni-sel-" + row;
    sel.setAttribute("onchange", "trocarUnidade('-" + row + "')");
    nomes.forEach(function(u){
        var o = document.createElement("option");
        o.value = u; o.textContent = u;
        sel.appendChild(o);
    });
    sel.value = atual;
    host.appendChild(sel);
}

function trocarUnidade(rowID){
    var row = parseInt(rowID.replace("-", ""));
    var sel = document.getElementById("uni-sel-" + row);
    if (sel){ data[row].unidade = sel.value; }
    recomputarMacros(row);
    sumFacts();
}

// Recalcula os macros: quantidade × fator da unidade × macros por unidade
// principal. Atualiza data[] e a tela.
function recomputarMacros(row){
    if (data[row].semQtd){   // item livre não entra na conta de macros
        data[row].protein = 0; data[row].carb = 0; data[row].fats = 0; data[row].cal = 0;
        return;
    }
    garantirBase(row);
    var b = data[row]._base;
    var q = parseNum(data[row].qtd);
    var f = q * fatorDaUnidade(b, data[row].unidade);

    data[row].protein = rd(f * (b ? b.protein : 0));
    data[row].carb    = rd(f * (b ? b.carb : 0));
    data[row].fats    = rd(f * (b ? b.fats : 0));
    data[row].cal     = rd(f * (b ? b.cal : 0));

    document.getElementById('qtd-protein-'+row).textContent = data[row].protein;
    document.getElementById('qtd-carb-'+row).textContent = data[row].carb;
    document.getElementById('qtd-fat-'+row).textContent = data[row].fats;
    document.getElementById('qtd-cal-'+row).textContent = data[row].cal;
}

// Só a quantidade mudou: mantém a unidade escolhida e recalcula.
function atualizarQuantidade(rowID){
    var row = parseInt(rowID.replace("-", ""));
    data[row].qtd = document.getElementById('qtd-'+row).value;
    if (data[row].semQtd){ sumFacts(); return; }   // item livre: qtd é só texto
    recomputarMacros(row);
    sumFacts();
}

// Normaliza a quantidade atual para UMA unidade nova, só nesta linha (não
// mexe na base). Ex.: 123 g de tomate -> o usuário chama de "tomate médio";
// passa a valer 1 "tomate médio" (= 123 g). A unidade extra é criada na hora
// e viaja com a sessão (guardamos _base ao salvar).
function normalizarUnidade(rowID){
    var row = parseInt(rowID.replace("-", ""));
    garantirBase(row);
    var b = data[row]._base;
    if (!b){ return; }

    var q = parseNum(data[row].qtd);
    if (q <= 0){
        alert("Defina primeiro uma quantidade maior que zero para normalizar.");
        return;
    }

    var atualUnid = data[row].unidade || b.unidadePrincipal;
    var nome = prompt("Normalizar " + rd(q) + " " + atualUnid + " para a unidade chamada:", "");
    if (nome === null){ return; }            // cancelou
    nome = String(nome).trim();
    if (!nome){ return; }

    if (nome === b.unidadePrincipal){
        alert('"' + nome + '" é a unidade principal deste alimento; escolha outro nome.');
        return;
    }

    // quantas unidades principais valem 1 da nova unidade
    var equivale = q * fatorDaUnidade(b, atualUnid);

    // adiciona (ou substitui) a unidade nas unidades extras da linha
    if (!Array.isArray(b.unidades)){ b.unidades = []; }
    b.unidades = b.unidades.filter(function(u){ return u && u.unidade !== nome; });
    b.unidades.push({ unidade: nome, equivale: equivale });

    // passa a valer 1 desta nova unidade (os macros totais não mudam)
    data[row].unidade = nome;
    data[row].qtd = "1";
    document.getElementById('qtd-'+row).value = "1";

    aplicarUnidadeControl(row);
    recomputarMacros(row);
    sumFacts();
}

// Renomeia o alimento SÓ nesta linha da tabela (não altera foods.json nem os
// macros). Útil para dar um nome mais claro no plano.
function renomearAlimento(rowID){
    var row = parseInt(rowID.replace("-", ""));
    var atual = data[row].nome || "";
    var novo = prompt("Nome do alimento nesta tabela (não altera a base de dados):", atual);
    if (novo === null){ return; }
    novo = String(novo).trim();
    if (!novo){ return; }

    data[row].nome = novo;
    atualizarNomeAlimento(row, novo);

    // mantém o <select> escondido em sincronia (é ele que alguns fluxos leem)
    var sel = document.getElementById('foods-'+row);
    if (sel){
        var existe = false;
        for (var i = 0; i < sel.options.length; i++){
            if (sel.options[i].value === novo){ existe = true; break; }
        }
        if (!existe){
            var o = document.createElement("option");
            o.value = novo; o.text = novo;
            sel.appendChild(o);
        }
        sel.value = novo;
    }
}
    
function setTexto(id, valor){
    var el = document.getElementById(id);
    if (el){ el.textContent = valor; }
}

function sumFacts(){


    var iRow=0;
    var lastRow = data.length-1;
    var Tprotein = 0;
    var Tcarb = 0;
    var Tfats = 0;
    var Tcal = 0;
    
    for(iRow = 0; iRow <= lastRow; iRow++){
        
        Tprotein = Tprotein + parseRd(data[iRow].protein);
        Tcarb = Tcarb + parseRd(data[iRow].carb);
        Tfats = Tfats + parseRd(data[iRow].fats);
        Tcal = Tcal + parseRd(data[iRow].cal);
    };
    
    sum.protein = rd(Tprotein);
    sum.carb = rd(Tcarb);
    sum.fats = rd(Tfats);
    sum.cal = rd(Tcal);
    
    document.getElementById('qtd-protein-sum').innerHTML = rd(Tprotein);
    document.getElementById('qtd-carb-sum').innerHTML = rd(Tcarb);
    document.getElementById('qtd-fat-sum').innerHTML = rd(Tfats);
    document.getElementById('qtd-cal-sum').innerHTML = rd(Tcal);

    //barra de resumo fixa (sempre visivel no rodape)
    setTexto('rf-protein', rd(Tprotein));
    setTexto('rf-carb', rd(Tcarb));
    setTexto('rf-fat', rd(Tfats));
    setTexto('rf-cal', rd(Tcal));

    renderBreakdown();
}

// Os quatro periodos, na ordem do dia.
var PERIODOS = ["Manhã", "Almoço", "Tarde", "Noite"];

// Soma os macros de cada periodo e junta os itens de cada um.
function calcPorPeriodo(){

    var res = {};
    PERIODOS.forEach(function(p){ res[p] = {itens: [], protein: 0, carb: 0, fats: 0, cal: 0}; });

    for (var i = 0; i < data.length; i++){
        var d = data[i];
        var p = res[d.refeicao];
        if (!p){ continue; }
        p.itens.push(d);
        p.protein += parseRd(d.protein);
        p.carb    += parseRd(d.carb);
        p.fats    += parseRd(d.fats);
        p.cal     += parseRd(d.cal);
    }

    PERIODOS.forEach(function(p){
        res[p].protein = rd(res[p].protein);
        res[p].carb    = rd(res[p].carb);
        res[p].fats    = rd(res[p].fats);
        res[p].cal     = rd(res[p].cal);
    });

    return res;
}

// Preenche a tabela de resumo por periodo (pula periodos sem itens).
// Mostra os totais de cada período no cabeçalho da sua lista + marca o botão
// de notas quando o período tem alguma nota.
function renderBreakdown(){
    var res = calcPorPeriodo();
    PERIODOS.forEach(function(p){
        var d = res[p];
        var tot = document.getElementById(TOT_ID[p]);
        if (tot){
            tot.textContent = d.itens.length
                ? "(" + d.cal + " cal · P " + d.protein + " · C " + d.carb + " · G " + d.fats + ")"
                : "";
        }
        var sec = document.querySelector('.periodo-lista[data-periodo="' + p + '"]');
        var btn = sec ? sec.querySelector('.periodo-notas-btn') : null;
        if (btn){ btn.classList.toggle('tem', temNotas(notasPlano[p])); }
        var bsub = sec ? sec.querySelector('.periodo-subs-btn') : null;
        if (bsub){
            var a = alternativas[p] ? alternativas[p].lista[alternativas[p].ativa] : null;
            var n = (a && Array.isArray(a.substitutos)) ? a.substitutos.length : 0;
            bsub.classList.toggle('tem', n > 0);
            bsub.title = n ? (n + " substituto(s) nesta alternativa") : "Substitutos desta alternativa";
        }
    });
}
    
// "+" da linha: adiciona um alimento logo depois dela, na MESMA lista/período
function addRow(rowID){
   var row = parseInt(rowID.replace("-",""));
   var el = document.getElementById('form-row-'+row);
   if (!el){ return; }
   novaLinhaNoContainer(el.parentNode, el, periodoDoElemento(el));
}

function delRow(rowID){
   var row = parseInt(rowID.replace("-",""));
   removerLinha(row);
}

//Renumera os atributos de uma linha (id, for, onchange, onclick).
//Trabalha atributo por atributo, no elemento vivo. A versao antiga
//fazia replaceAll sobre o innerHTML inteiro, o que corrompia
//qualquer texto que contivesse hifen+numero (ex: "Ômega-3") e
//destruia o estado dos selects.
function renumeraLinha(el, oldRow, newRow){

    el.id = "form-row-" + newRow;
    el.setAttribute("name", "form-row-" + newRow);

    //ancorado no fim: "-1" nao casa com "foods-10"
    var idRe  = new RegExp("-" + oldRow + "$");
    var argRe = new RegExp("'-" + oldRow + "'", "g");
    var nodes = el.querySelectorAll("[id], [for], [onchange], [onclick], [ondblclick]");

    for (var i = 0; i < nodes.length; i++){
        var node = nodes[i];

        if (node.id){
            node.id = node.id.replace(idRe, "-" + newRow);
        }

        var attrFor = node.getAttribute("for");
        if (attrFor){
            node.setAttribute("for", attrFor.replace(idRe, "-" + newRow));
        }

        var onchange = node.getAttribute("onchange");
        if (onchange){
            node.setAttribute("onchange", onchange.replace(argRe, "'-" + newRow + "'"));
        }

        var onclick = node.getAttribute("onclick");
        if (onclick){
            node.setAttribute("onclick", onclick.replace(argRe, "'-" + newRow + "'"));
        }

        var ondblclick = node.getAttribute("ondblclick");
        if (ondblclick){
            node.setAttribute("ondblclick", ondblclick.replace(argRe, "'-" + newRow + "'"));
        }
    }
}

function novaLinha(){

    return {refeicao: "Manhã",
            nome: "Ovo",
            unidade: "ovos",
            qtd: "0",
            cal: "0",
            fats: "0",
            carb: "0",
            protein: "0",
            grupo: "--",
            detalhes: "Sem detalhes."};
}

function removerLinha(pos){
    var el = document.getElementById('form-row-'+pos);
    if (!el){ return; }
    el.parentNode.removeChild(el);
    sincronizarLinhas();   // reconstrói data[] a partir do DOM e renumera
}

function subirLinha(rowID){ moverLinha(parseInt(rowID.replace("-","")), -1); }
function descerLinha(rowID){ moverLinha(parseInt(rowID.replace("-","")), +1); }

// Copia os dados de uma linha (inclusive o _base com as unidades).
function clonarDadoLinha(d){
    var c = {};
    ["refeicao","nome","unidade","qtd","cal","fats","carb","protein","grupo","detalhes","semQtd"]
        .forEach(function(k){ c[k] = d[k]; });
    if (d._base){ c._base = JSON.parse(JSON.stringify(d._base)); }
    return c;
}

// Duplica uma linha logo abaixo dela — útil para reaproveitar alimentos
// (ex.: o jantar começa parecido com o almoço) sem procurar de novo na base.
function duplicarLinha(rowID){
    var row = parseInt(rowID.replace("-",""));
    var srcEl = document.getElementById('form-row-'+row);
    if (!srcEl){ return; }
    var copia = clonarDadoLinha(data[row]);

    // cria a linha nova logo depois da fonte, no MESMO container (período)
    var idx = data.length;
    data.push(copia);
    var el = document.createElement("div");
    el.className = "form-row";
    el.innerHTML = rowTemplate;
    renumeraLinha(el, 0, idx);
    srcEl.parentNode.insertBefore(el, srcEl.nextSibling);

    popFoods(idx);
    var sel = document.getElementById('foods-' + idx);
    if (sel){
        var existe = false;
        for (var i = 0; i < sel.options.length; i++){
            if (sel.options[i].value === copia.nome){ existe = true; break; }
        }
        if (!existe){ var o = document.createElement("option"); o.value = copia.nome; o.text = copia.nome; sel.appendChild(o); }
    }
    pasteRowValues(idx, copia);

    sincronizarLinhas();
}

//Troca uma linha com a vizinha. Move os NOS inteiros no DOM, entao o
//estado dos selects (opcoes carregadas, valor escolhido e a propriedade
//_lista) viaja junto — nao ha copia de valores, campo por campo.
// ▲▼: move a linha dentro da SUA lista (mesmo período)
function moverLinha(pos, dir){
    var el = document.getElementById('form-row-'+pos);
    if (!el){ return; }
    var irmao = dir < 0 ? el.previousElementSibling : el.nextElementSibling;
    if (!irmao || !irmao.classList || !irmao.classList.contains('form-row')){ return; }  // ponta da lista
    if (dir < 0){ el.parentNode.insertBefore(el, irmao); }
    else        { el.parentNode.insertBefore(irmao, el); }
    sincronizarLinhas();
}

// ---- arrastar e soltar: reordena dentro da lista E entre listas ---------

function numeroDaLinha(el){ return parseInt(String(el.id).replace("form-row-", ""), 10); }

var arrastando = null;   // linha sendo arrastada

// Linha ANTES da qual soltar, dado o Y do cursor (ou null p/ soltar no fim).
function linhaAlvo(container, y){
    var els = Array.prototype.slice.call(container.querySelectorAll('.form-row:not(.arrastando)'));
    var melhor = { offset: -Infinity, el: null };
    els.forEach(function(child){
        var box = child.getBoundingClientRect();
        var offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > melhor.offset){ melhor = { offset: offset, el: child }; }
    });
    return melhor.el;
}

// Qual lista de período está sob o cursor (para soltar em outro período).
function containerSob(x, y){
    var conts = document.querySelectorAll('.lista-linhas');
    for (var i = 0; i < conts.length; i++){
        var b = conts[i].getBoundingClientRect();
        if (x >= b.left && x <= b.right && y >= b.top - 12 && y <= b.bottom + 12){ return conts[i]; }
    }
    var melhor = null, dist = Infinity;
    for (var j = 0; j < conts.length; j++){
        var bb = conts[j].getBoundingClientRect();
        var d = Math.abs(y - (bb.top + bb.bottom) / 2);
        if (d < dist){ dist = d; melhor = conts[j]; }
    }
    return melhor;
}

// Ao soltar: reordena data[], define a refeição pela lista e renumera tudo.
function finalizarArrasto(){
    if (!arrastando){ return; }
    arrastando.classList.remove('arrastando');
    arrastando.removeAttribute('draggable');
    arrastando = null;
    var s = document.querySelector('.lista-linhas.solta');
    if (s){ s.classList.remove('solta'); }
    sincronizarLinhas();
}

function configurarArrastar(){
    var plano = document.getElementById('plano');
    if (!plano || plano._arrastarPronto){ return; }
    plano._arrastarPronto = true;

    // a linha só fica "draggable" enquanto o mouse está pressionado na alça
    plano.addEventListener('mousedown', function(e){
        var grip = e.target.closest ? e.target.closest('.drag-grip') : null;
        if (!grip){ return; }
        var row = grip.closest('.form-row');
        if (row){ row.setAttribute('draggable', 'true'); }
    });
    document.addEventListener('mouseup', function(){
        var pend = plano.querySelectorAll('.form-row[draggable="true"]');
        for (var i = 0; i < pend.length; i++){ pend[i].removeAttribute('draggable'); }
    });

    plano.addEventListener('dragstart', function(e){
        var row = e.target.closest ? e.target.closest('.form-row') : null;
        if (!row || row.getAttribute('draggable') !== 'true'){ e.preventDefault(); return; }
        arrastando = row;
        row.classList.add('arrastando');
        if (e.dataTransfer){ e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', ''); } catch(_){} }
    });

    plano.addEventListener('dragover', function(e){
        if (!arrastando){ return; }
        e.preventDefault();
        var cont = containerSob(e.clientX, e.clientY);
        if (!cont){ return; }
        var atual = document.querySelector('.lista-linhas.solta');
        if (atual && atual !== cont){ atual.classList.remove('solta'); }
        cont.classList.add('solta');
        var ref = linhaAlvo(cont, e.clientY);
        if (ref == null){ cont.appendChild(arrastando); }
        else if (ref !== arrastando){ cont.insertBefore(arrastando, ref); }
    });

    plano.addEventListener('drop', function(e){ if (arrastando){ e.preventDefault(); } finalizarArrasto(); });
    plano.addEventListener('dragend', function(){ finalizarArrasto(); });
}

function copyRowValues(row){
    
    var values = {};
    
     values = {refeicao: document.getElementById('refeicao-'+row).value, 
               nome: document.getElementById('foods-'+row).value,
               unidade: document.getElementById('uni-'+row).innerHTML, 
               qtd: document.getElementById('qtd-'+row).value, 
               cal: document.getElementById('qtd-cal-'+row).innerHTML, 
               fats: document.getElementById('qtd-fat-'+row).innerHTML, 
               carb: document.getElementById('qtd-carb-'+row).innerHTML, 
               protein: document.getElementById('qtd-protein-'+row).innerHTML,
               grupo: document.getElementById('grupo-'+row).value,
               detalhes: document.getElementById('detalhes-'+row).innerHTML
              };

    
    return values;
}
    
// Pinta a linha com os valores guardados. A refeição NÃO é mais um dropdown —
// ela vem de qual lista a linha está (definida por sincronizarLinhas).
function pasteRowValues(row, values){
        document.getElementById('foods-'+row).value = values.nome;
        atualizarNomeAlimento(row, values.nome);
        document.getElementById('qtd-'+row).value = values.qtd;
        data[row].unidade = values.unidade;
        garantirBase(row);
        aplicarUnidadeControl(row);
        document.getElementById('qtd-protein-'+row).innerHTML = values.protein;
        document.getElementById('qtd-carb-'+row).innerHTML = values.carb;
        document.getElementById('qtd-fat-'+row).innerHTML = values.fats;
        document.getElementById('qtd-cal-'+row).innerHTML = values.cal;
        document.getElementById('grupo-'+row).value = values.grupo || "--";
        document.getElementById('detalhes-'+row).innerHTML = values.detalhes;
        aplicarModoLivre(row);   //aplica/retira o visual de item livre
}

// ---- listas por período ---------------------------------------------------
// Cada período (Manhã/Almoço/Tarde/Noite) tem seu container. A refeição de um
// alimento é definida por EM QUAL lista ele está — não há mais dropdown.

var LISTA_ID = { "Manhã":"lista-manha", "Almoço":"lista-almoco", "Tarde":"lista-tarde", "Noite":"lista-noite" };
var TOT_ID   = { "Manhã":"tot-manha",   "Almoço":"tot-almoco",   "Tarde":"tot-tarde",   "Noite":"tot-noite" };

function containerPeriodo(p){ return document.getElementById(LISTA_ID[p] || LISTA_ID["Manhã"]); }

function periodoDoElemento(el){
    var sec = el && el.closest ? el.closest(".periodo-lista") : null;
    return (sec && sec.getAttribute("data-periodo")) || "Manhã";
}

// ids das linhas na ordem visual (período a período, e dentro de cada lista)
function listRows(){
    var ids = [];
    PERIODOS.forEach(function(p){
        var cont = containerPeriodo(p);
        if (!cont){ return; }
        var rows = cont.querySelectorAll(":scope > .form-row");
        for (var i = 0; i < rows.length; i++){ ids.push(rows[i].id); }
    });
    return ids;
}

// Reconstrói data[] para bater com a ordem do DOM (período a período),
// define a refeição de cada item pela lista em que ele está, e renumera todas
// as linhas para 0..n-1 (duas passadas p/ os ids nunca colidirem).
function sincronizarLinhas(){
    var itens = [];   // {el, idxAntigo, periodo}
    PERIODOS.forEach(function(p){
        var cont = containerPeriodo(p);
        if (!cont){ return; }
        var rows = cont.querySelectorAll(":scope > .form-row");
        for (var i = 0; i < rows.length; i++){ itens.push({ el: rows[i], idx: numeroDaLinha(rows[i]), periodo: p }); }
    });

    var novo = itens.map(function(o){ var d = data[o.idx]; if (d){ d.refeicao = o.periodo; } return d; });
    data.length = 0;
    Array.prototype.push.apply(data, novo);

    var TEMP = 100000;
    itens.forEach(function(o, i){ renumeraLinha(o.el, numeroDaLinha(o.el), TEMP + i); });
    itens.forEach(function(o, i){ renumeraLinha(o.el, TEMP + i, i); });

    sumFacts();
}

// Cria uma linha nova (clonada do molde) já preenchida como "Ovo", no
// container do período — opcionalmente logo depois de uma linha de referência.
function novaLinhaNoContainer(cont, refEl, periodo){
    var idx = data.length;
    var d = novaLinha();
    d.refeicao = periodo;
    data.push(d);

    var el = document.createElement("div");
    el.className = "form-row";
    el.innerHTML = rowTemplate;
    renumeraLinha(el, 0, idx);

    if (refEl && refEl.parentNode === cont){ cont.insertBefore(el, refEl.nextSibling); }
    else { cont.appendChild(el); }

    popFoods(idx);
    popNewLine(idx);
    sincronizarLinhas();
}

// botão "+ adicionar alimento" de cada lista
function adicionarNaLista(periodo){
    novaLinhaNoContainer(containerPeriodo(periodo), null, periodo);
}

// ==== Alternativas por período (lógica horizontal / carrossel) ============
// Cada período tem VÁRIAS alternativas; só a ATIVA é renderizada nas listas e
// entra nos totais/LaTeX/CSV/HTML. As demais ficam guardadas aqui, dormentes.
// Cada alternativa = { titulo, notas:[...], itens:[...] }.
var alternativas = { "Manhã":null, "Almoço":null, "Tarde":null, "Noite":null };

// "substitutos" = alimentos pre-escolhidos que o cliente pode usar no lugar dos
// desta lista, no modo de visualização. Guardam macros POR UNIDADE (mesma forma
// do foods.json), porque no celular a quantidade muda e os macros são
// recalculados na hora.
function novaAlt(titulo){ return { titulo: titulo || "Opção 1", notas: [], itens: [], substitutos: [] }; }

var CAMPOS_SUB = ["nome","unidade","cal","protein","carb","fats","detalhes"];

function normalizarSubstitutos(v){
    if (!Array.isArray(v)){ return []; }
    return v.filter(function(f){ return f && String(f.nome || "").trim(); })
            .map(function(f){
                var s = {};
                CAMPOS_SUB.forEach(function(k){ s[k] = f[k]; });
                s.nome = String(s.nome);
                s.unidade = String(s.unidade || "");
                s.detalhes = String(s.detalhes || "");
                ["cal","protein","carb","fats"].forEach(function(k){ s[k] = parseNum(s[k]); });
                return s;
            });
}

function substitutoDeAlimento(item){
    var s = {};
    CAMPOS_SUB.forEach(function(k){ s[k] = item[k]; });
    s.nome = String(s.nome || "");
    s.unidade = String(s.unidade || "");
    s.detalhes = String(s.detalhes || "");
    ["cal","protein","carb","fats"].forEach(function(k){ s[k] = parseNum(s[k]); });
    return s;
}

function inicializarAlternativas(){
    PERIODOS.forEach(function(p){ alternativas[p] = { ativa: 0, lista: [ novaAlt("Opção 1") ] }; });
}

function periodoDoContainer(cont){
    var sec = cont && cont.closest ? cont.closest(".periodo-lista") : null;
    return sec ? sec.getAttribute("data-periodo") : null;
}

// Salva os itens/notas ATIVOS de um período (a partir da tela) na alternativa.
function commitAtivo(p){
    var alt = alternativas[p]; if (!alt){ return; }
    var itens = [];
    data.forEach(function(d){ if (d.refeicao === p){ itens.push(clonarDadoLinha(d)); } });
    var atual = alt.lista[alt.ativa];
    atual.itens = itens;
    atual.notas = (notasPlano[p] || []).slice();
}
function commitTodas(){ PERIODOS.forEach(commitAtivo); }

// Cria uma linha de alimento a partir de um item guardado, num container.
function criarLinhaDeItem(cont, item){
    var idx = data.length;
    var d = clonarDadoLinha(item);
    d.refeicao = periodoDoContainer(cont) || d.refeicao;
    data.push(d);
    var el = document.createElement("div"); el.className = "form-row"; el.innerHTML = rowTemplate;
    renumeraLinha(el, 0, idx);
    cont.appendChild(el);
    mostrarMenuPrincipal(idx);
    if (!findByName(foods, d.nome)){
        var sel = document.getElementById('foods-'+idx);
        var o = document.createElement("option"); o.value = d.nome; o.text = d.nome; sel.appendChild(o);
        var per = derivarPorUnidade(d); if (per){ sel._lista = foods.concat([per]); }
    }
    pasteRowValues(idx, d);
}

// Renderiza a alternativa ATIVA de um período (recria as linhas e as notas).
function renderAtivo(p){
    var alt = alternativas[p]; if (!alt){ return; }
    var cont = containerPeriodo(p);
    cont.innerHTML = "";
    var atual = alt.lista[alt.ativa];
    notasPlano[p] = (atual.notas || []).slice();
    (atual.itens || []).forEach(function(item){ criarLinhaDeItem(cont, item); });
    atualizarCabAlternativas(p);
    sincronizarLinhas();
}

// Atualiza o cabeçalho: título + contador + setas (some com 1 alternativa).
function atualizarCabAlternativas(p){
    var alt = alternativas[p]; if (!alt){ return; }
    var slug = LISTA_ID[p].replace("lista-", "");
    var n = alt.lista.length, i = alt.ativa;
    var titEl = document.getElementById("alttit-" + slug);
    if (titEl){ titEl.textContent = alt.lista[i].titulo + (n > 1 ? "  (" + (i + 1) + "/" + n + ")" : ""); }
    var sec = document.querySelector('.periodo-lista[data-periodo="' + p + '"]');
    if (!sec){ return; }
    var navs = sec.querySelectorAll(".alt-nav");
    if (navs[0]){ navs[0].style.display = n > 1 ? "" : "none"; navs[0].disabled = (i === 0); }
    if (navs[1]){ navs[1].style.display = n > 1 ? "" : "none"; navs[1].disabled = (i === n - 1); }
    // "remover" fica sempre visível, mas desabilitado quando só há 1 alternativa
    var del = sec.querySelector(".alt-del");
    if (del){
        del.disabled = (n <= 1);
        del.title = (n <= 1) ? "Não dá para remover a única alternativa deste período" : "Remover esta alternativa";
    }
}

function swipeAlt(p, dir){
    var alt = alternativas[p]; if (!alt){ return; }
    var novo = alt.ativa + dir;
    if (novo < 0 || novo >= alt.lista.length){ return; }
    commitAtivo(p);
    alt.ativa = novo;
    renderAtivo(p);
}

function irParaAlt(p, i){
    var alt = alternativas[p]; if (!alt || i < 0 || i >= alt.lista.length || i === alt.ativa){ return; }
    commitAtivo(p);
    alt.ativa = i;
    renderAtivo(p);
}

function novaAlternativa(p, copiar){
    var alt = alternativas[p]; if (!alt){ return; }
    commitAtivo(p);
    var nova;
    if (copiar){
        var base = alt.lista[alt.ativa];
        nova = { titulo: base.titulo + " (cópia)", notas: (base.notas || []).slice(),
                 itens: (base.itens || []).map(clonarDadoLinha),
                 substitutos: normalizarSubstitutos(base.substitutos) };
    } else {
        nova = novaAlt("Opção " + (alt.lista.length + 1));
    }
    alt.lista.push(nova);
    alt.ativa = alt.lista.length - 1;
    renderAtivo(p);
}

function removerAlternativa(p){
    var alt = alternativas[p]; if (!alt){ return; }
    if (alt.lista.length <= 1){ alert("Cada período precisa de ao menos uma alternativa."); return; }
    var atual = alt.lista[alt.ativa];
    if (!confirm('Remover a alternativa "' + (atual.titulo || "") + '" de ' + p + '?')){ return; }
    alt.lista.splice(alt.ativa, 1);
    if (alt.ativa >= alt.lista.length){ alt.ativa = alt.lista.length - 1; }
    renderAtivo(p);
}

function renomearAlt(p, titulo){
    var alt = alternativas[p]; if (!alt){ return; }
    alt.lista[alt.ativa].titulo = String(titulo || "").trim() || ("Opção " + (alt.ativa + 1));
    atualizarCabAlternativas(p);
}

// Menu ao clicar no título: renomear (input) + pular direto para qualquer alt.
function fecharMenuAlt(){
    var m = document.getElementById("alt-menu-aberto");
    if (m){ m.parentNode.removeChild(m); }
    document.removeEventListener("mousedown", fecharMenuAltFora);
}
function fecharMenuAltFora(e){
    var m = document.getElementById("alt-menu-aberto");
    if (m && !m.contains(e.target)){ fecharMenuAlt(); }
}
function abrirMenuAlt(p, anchor){
    fecharMenuAlt();
    var alt = alternativas[p]; if (!alt){ return; }

    var menu = document.createElement("div");
    menu.className = "alt-menu";
    menu.id = "alt-menu-aberto";

    var inp = document.createElement("input");
    inp.type = "text"; inp.className = "alt-menu-nome";
    inp.value = alt.lista[alt.ativa].titulo;
    inp.placeholder = "nome desta alternativa";
    inp.oninput = function(){ renomearAlt(p, inp.value); };
    inp.onkeydown = function(e){ if (e.key === "Enter"){ fecharMenuAlt(); } };
    menu.appendChild(inp);

    var lista = document.createElement("div");
    lista.className = "alt-menu-lista";
    preencherMenuAlt(p, lista);
    configurarArrastarAlt(p, lista);
    menu.appendChild(lista);

    if (alt.lista.length > 1){
        var dica = document.createElement("div");
        dica.className = "alt-menu-dica";
        dica.textContent = "Arraste pelo ☰ para mudar a ordem.";
        menu.appendChild(dica);

        var rem = document.createElement("div");
        rem.className = "alt-menu-item alt-menu-remover";
        rem.textContent = "✕ remover esta alternativa";
        rem.onclick = function(){ fecharMenuAlt(); removerAlternativa(p); };
        menu.appendChild(rem);
    }

    document.body.appendChild(menu);
    var b = anchor.getBoundingClientRect();
    menu.style.left = Math.round(b.left) + "px";
    menu.style.top = Math.round(b.bottom + 4) + "px";
    inp.focus(); inp.select();
    setTimeout(function(){ document.addEventListener("mousedown", fecharMenuAltFora); }, 0);
}

// Um item por alternativa, na ordem atual. O objeto da alternativa fica preso
// ao elemento (_alt): é ele que diz a nova ordem depois de arrastar — índice
// guardado aqui viraria mentira assim que o DOM muda de ordem.
function preencherMenuAlt(p, lista){
    var alt = alternativas[p]; if (!alt){ return; }
    lista.innerHTML = "";

    alt.lista.forEach(function(a, i){
        var it = document.createElement("div");
        it.className = "alt-menu-item" + (i === alt.ativa ? " ativo" : "");
        it._alt = a;

        var grip = document.createElement("span");
        grip.className = "drag-grip alt-grip";
        grip.innerHTML = "&#9776;";
        grip.title = "Arraste para reordenar";
        it.appendChild(grip);

        var txt = document.createElement("span");
        txt.className = "alt-menu-txt";
        txt.textContent = (i + 1) + ". " + a.titulo;
        it.appendChild(txt);

        it.onclick = function(){
            if (lista._arrastou){ return; }   // acabou de arrastar: não troca de alternativa
            fecharMenuAlt();
            irParaAlt(p, alt.lista.indexOf(a));
        };

        lista.appendChild(it);
    });
}

// ---- arrastar e soltar as alternativas (mesma ideia das linhas do plano) ---

var arrastandoAlt = null;

function alvoMenuAlt(lista, y){
    var els = Array.prototype.slice.call(lista.querySelectorAll('.alt-menu-item:not(.arrastando)'));
    var melhor = { offset: -Infinity, el: null };
    els.forEach(function(child){
        var box = child.getBoundingClientRect();
        var offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > melhor.offset){ melhor = { offset: offset, el: child }; }
    });
    return melhor.el;
}

function configurarArrastarAlt(p, lista){
    // o item só fica "draggable" enquanto o mouse está pressionado na alça —
    // assim clicar no texto continua trocando de alternativa
    lista.addEventListener("mousedown", function(e){
        var grip = e.target.closest ? e.target.closest(".alt-grip") : null;
        if (!grip){ return; }
        var it = grip.closest(".alt-menu-item");
        if (it){ it.setAttribute("draggable", "true"); }
    });

    lista.addEventListener("dragstart", function(e){
        var it = e.target.closest ? e.target.closest(".alt-menu-item") : null;
        if (!it || it.getAttribute("draggable") !== "true"){ e.preventDefault(); return; }
        arrastandoAlt = it;
        lista._arrastou = false;
        it.classList.add("arrastando");
        if (e.dataTransfer){
            e.dataTransfer.effectAllowed = "move";
            try { e.dataTransfer.setData("text/plain", ""); } catch(_){}
        }
    });

    lista.addEventListener("dragover", function(e){
        if (!arrastandoAlt){ return; }
        e.preventDefault();
        lista._arrastou = true;
        var ref = alvoMenuAlt(lista, e.clientY);
        if (ref == null){ lista.appendChild(arrastandoAlt); }
        else if (ref !== arrastandoAlt){ lista.insertBefore(arrastandoAlt, ref); }
    });

    lista.addEventListener("drop", function(e){
        if (!arrastandoAlt){ return; }
        e.preventDefault();
        finalizarArrastoAlt(p, lista);
    });
    lista.addEventListener("dragend", function(){ finalizarArrastoAlt(p, lista); });
}

function finalizarArrastoAlt(p, lista){
    if (!arrastandoAlt){ return; }
    arrastandoAlt.classList.remove("arrastando");
    arrastandoAlt.removeAttribute("draggable");
    arrastandoAlt = null;
    reordenarAlternativas(p, lista);
    // o clique sintético que vem logo depois do drop não deve trocar de alternativa
    setTimeout(function(){ lista._arrastou = false; }, 0);
}

// A ordem do DOM vira a ordem de alt.lista. A ATIVA é seguida pelo objeto, não
// pelo índice: quem estava na tela continua na tela, com o contador certo.
function reordenarAlternativas(p, lista){
    var alt = alternativas[p]; if (!alt){ return; }

    var ativa = alt.lista[alt.ativa];
    var nova = [];
    var kids = lista.querySelectorAll(".alt-menu-item");
    for (var i = 0; i < kids.length; i++){
        if (kids[i]._alt){ nova.push(kids[i]._alt); }
    }
    if (nova.length !== alt.lista.length){ return; }   // algo fora do lugar: não mexe

    alt.lista = nova;
    alt.ativa = Math.max(0, nova.indexOf(ativa));

    atualizarCabAlternativas(p);
    preencherMenuAlt(p, lista);   // renumera 1., 2., 3. e refaz os cliques
}

function popNewLine(row){
        document.getElementById('foods-'+row).value = "Ovo";
        atualizarNomeAlimento(row, "Ovo");
        document.getElementById('qtd-'+row).value = 0;
        document.getElementById('qtd-protein-'+row).textContent = 0;
        document.getElementById('qtd-carb-'+row).textContent = 0;
        document.getElementById('qtd-fat-'+row).textContent = 0;
        document.getElementById('qtd-cal-'+row).textContent = 0;
        document.getElementById('grupo-'+row).value = "--";
        document.getElementById('detalhes-'+row).textContent = "Sem detalhes.";
        //linha nova é "Ovo": pega a unidade (e extras, se houver) da base
        data[row].nome = "Ovo";
        data[row].unidade = "ovos";
        data[row]._base = null;
        garantirBase(row);
        aplicarUnidadeControl(row);
}

function popFoods(row){

    mostrarMenuPrincipal(row);
}
    
function initializePop(){

//Guarda o molde de uma linha (sem o dropdown de refeição) para clonar.
rowTemplate = document.getElementById('tpl-linha').innerHTML;

data = [
    {refeicao:"Manhã", nome:"Ovo",         unidade:"ovos",   qtd:"2", cal:"77", fats:"5.28", carb:"0.56", protein:"6.26", grupo:"--", detalhes:"Sem detalhes."},
    {refeicao:"Manhã", nome:"Mozzarella",  unidade:"gramas", qtd:"1", cal:"3",  fats:"0.22", carb:"0.02", protein:"0.22", grupo:"--", detalhes:"Sem detalhes."},
    {refeicao:"Manhã", nome:"Carne Moída", unidade:"gramas", qtd:"1", cal:"3",  fats:"0.19", carb:"0",    protein:"0.25", grupo:"--", detalhes:"Sem detalhes."}
];

    // cria as 3 linhas iniciais dentro da lista da Manhã
    var contManha = containerPeriodo("Manhã");
    data.forEach(function(d, i){
        var el = document.createElement("div");
        el.className = "form-row";
        el.innerHTML = rowTemplate;
        renumeraLinha(el, 0, i);
        contManha.appendChild(el);
    });

    for (var n = 0; n < data.length; n++){ popFoods(n); }
    for (var m = 0; m < data.length; m++){ pasteRowValues(m, data[m]); }

    // uma alternativa por período; a Manhã inicial já vai para a alternativa 1
    inicializarAlternativas();
    commitTodas();
    PERIODOS.forEach(atualizarCabAlternativas);

    sumFacts();
    aplicarPrefDetalhes();
    aplicarPrefCompacto();
    configurarArrastar();
}

// Liga/desliga a faixa de "detalhes" de todas as linhas. Some so a
// observacao; os macros continuam. A preferencia fica guardada para a
// proxima visita.
function alternarDetalhes(){
    var cont = document.getElementById('plano');
    var escondido = cont.classList.toggle('esconder-detalhes');
    var btn = document.getElementById('btnDetalhes');
    if (btn){ btn.textContent = escondido ? 'Mostrar detalhes' : 'Ocultar detalhes'; }
    try { localStorage.setItem('nutri_esconder_detalhes', escondido ? '1' : '0'); } catch(e){}
}

function aplicarPrefDetalhes(){
    var pref = null;
    try { pref = localStorage.getItem('nutri_esconder_detalhes'); } catch(e){}
    if (pref === '1'){
        document.getElementById('plano').classList.add('esconder-detalhes');
        var btn = document.getElementById('btnDetalhes');
        if (btn){ btn.textContent = 'Mostrar detalhes'; }
    }
}

// Modo compacto: aperta as linhas para caber mais alimentos sem rolar.
function alternarCompacto(){
    var cont = document.getElementById('plano');
    var compacto = cont.classList.toggle('compacto');
    var btn = document.getElementById('btnCompacto');
    if (btn){ btn.textContent = compacto ? 'Espaçoso' : 'Compacto'; }
    try { localStorage.setItem('nutri_compacto', compacto ? '1' : '0'); } catch(e){}
}

function aplicarPrefCompacto(){
    var pref = null;
    try { pref = localStorage.getItem('nutri_compacto'); } catch(e){}
    // padrão: compacto LIGADO (só fica espaçoso se o usuário desligar)
    var ligar = (pref !== '0');
    if (ligar){
        document.getElementById('plano').classList.add('compacto');
        var btn = document.getElementById('btnCompacto');
        if (btn){ btn.textContent = 'Espaçoso'; }
    }
}
    
function copyFromData(row){

    var valuesCopied = {};
    
    valuesCopied.refeicao = data[row].refeicao;
    valuesCopied.nome = data[row].nome;
    valuesCopied.unidade = data[row].unidade;
    valuesCopied.qtd = data[row].qtd;
    valuesCopied.cal = data[row].cal;
    valuesCopied.fats = data[row].fats;
    valuesCopied.carb = data[row].carb;
    valuesCopied.protein = data[row].protein;
    valuesCopied.grupo = data[row].grupo;
    valuesCopied.detalhes = data[row].detalhes;

        
    return valuesCopied;

}
    
function pasteInData(values, DataRow){

data[DataRow] = {
    refeicao: values.refeicao || "Manhã",
    nome: values.nome,
    unidade: values.unidade,
    qtd: values.qtd,
    cal: values.cal,
    fats: values.fats,
    carb: values.carb,
    protein: values.protein,
    grupo: values.grupo || "--",
    detalhes: values.detalhes
};


}
    
function pasteInFoods(values, DataFood){


     foods[DataFood] = {nome:"Ovo", 
                        unidade: "ovos", 
                        cal:"77", 
                        fats: "5.28", 
                        carb:"0.56", 
                        protein:"6.26",
                        detalhes: "trala"};

        

        
        
 foods[DataFood] = {
    nome: values.nome,
    unidade: values.unidade,
    cal: values.cal,
    fats: values.fats,
    carb: values.carb,
    protein: values.protein,
    detalhes: values.detalhes
};

    
}
    
function rd(num) {
return +(Math.round(num + "e+1")  + "e-1");
}
    
function parseRd(strNum){
    
   return rd(parseFloat(strNum));
}
    
///----------RECEITAS-----------------
    
function loadIngredientes(){
    
  var RX = document.getElementById("grupoSalvar").value;
  var rows = listRows();
  var lastRow = rows.length-1;
  var row = 0;
  var str="INGREDIENTES\n\n"
  var receita = {nome: "",
                 unidade: "porção",
                 cal:0,
                 fats: 0, 
                 carb:0, 
                 protein:0,
                 detalhes: "" };
    
    for(row=0; row<=lastRow; row++){
    
        if(document.getElementById("grupo-"+row).value == RX){
        str = str + data[row].qtd + " " + data[row].unidade + " de " + data[row].nome + "\n"
            
        receita.cal = receita.cal + parseFloat(data[row].cal);
        receita.fats = receita.fats + parseFloat(data[row].fats);
        receita.carb = receita.carb + parseFloat(data[row].carb);
        receita.protein = receita.protein + parseFloat(data[row].protein); 
        
        }
        
    }
    
        receita.cal = rd(receita.cal);
        receita.fats = rd(receita.fats);
        receita.carb = rd(receita.carb);
        receita.protein = rd(receita.protein);
        
  document.getElementById("qtd-protein-receita").innerHTML = receita.protein;
  document.getElementById("qtd-carb-receita").innerHTML = receita.carb;
  document.getElementById("qtd-cal-receita").innerHTML = receita.cal;
  document.getElementById("qtd-fat-receita").innerHTML = receita.fats;
    
  document.getElementById("saveStr").value = str;
}    
    
function saveReceita(){
    
  var RX = document.getElementById("grupoSalvar").value;
  var rows = listRows();
  var lastRow = rows.length-1;
  var row = 0;
  var receita = {nome: "",
                 unidade: "porção",
                 cal:0,
                 fats: 0, 
                 carb:0, 
                 protein:0,
                 detalhes: "" };
    
    for(row=0; row<=lastRow; row++){
    
        if(document.getElementById("grupo-"+row).value == RX){
            
        receita.cal = receita.cal + parseFloat(data[row].cal);
        receita.fats = receita.fats + parseFloat(data[row].fats);
        receita.carb = receita.carb + parseFloat(data[row].carb);
        receita.protein = receita.protein + parseFloat(data[row].protein); 
        
        }
        
    }
        
        receita.nome = document.getElementById("tituloReceita").innerHTML;
        receita.cal = rd(receita.cal);
        receita.fats = rd(receita.fats);
        receita.carb = rd(receita.carb);
        receita.protein = rd(receita.protein);
        receita.detalhes =  document.getElementById("saveStr").value;
            
 downloadReceita(JSON.stringify(receita), receita.nome + '.json', 'application/json');
}        

function downloadReceita(content, fileName, contentType) {
var a = document.createElement("a");
var file = new Blob([content], {type: contentType});
a.href = URL.createObjectURL(file);
a.download = fileName;
a.click();
} //salva um banco de dados json
// downloadReceita(JSON.stringify(foods), 'foods.json', 'application/json');

///----------ESTADO / SESSOES-----------------

// baixa um texto como arquivo (generico)
function baixarArquivo(conteudo, nomeArquivo, tipo){
    var a = document.createElement("a");
    var blob = new Blob([conteudo], {type: tipo || 'application/octet-stream'});
    a.href = URL.createObjectURL(blob);
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
}

// Monta o objeto que representa o plano inteiro na tela.
function estadoAtual(){
    lerNotasVivas();   // se o modal de notas estiver aberto, captura o que foi digitado
    commitTodas();     // garante que as alternativas ativas refletem a tela
    return {
        tipo: "estado",
        versao: 2,
        nome: document.getElementById("nome").textContent.trim(),
        notas: document.getElementById("dia").textContent.trim(),
        notasPlano: JSON.parse(JSON.stringify(notasPlano)),           // notas ativas (compat)
        foodsSessao: JSON.parse(JSON.stringify(foodsSessao)),
        periodos: JSON.parse(JSON.stringify(alternativas)),          // TODAS as alternativas
        salvoEm: new Date().toISOString(),
        soma: {protein: sum.protein, carb: sum.carb, fats: sum.fats, cal: sum.cal},
        // combinação ATIVA achatada — mantém compatibilidade e a detecção do CLI
        itens: data.map(function(d){
            return {refeicao: d.refeicao, nome: d.nome, unidade: d.unidade,
                    qtd: d.qtd, cal: d.cal, fats: d.fats, carb: d.carb,
                    protein: d.protein, grupo: d.grupo, detalhes: d.detalhes,
                    semQtd: d.semQtd || false,
                    base: d._base || null};
        })
    };
}

function nomeArquivoEstado(nome){
    var base = (nome || "").trim().replace(/[^\p{L}\p{N} _-]/gu, "").replace(/\s+/g, "-");
    if (!base){ base = "sem-nome"; }
    return "estado-" + base + ".json";
}

function salvarEstado(){
    var estado = estadoAtual();
    baixarArquivo(JSON.stringify(estado, null, 2), nomeArquivoEstado(estado.nome), 'application/json');
}

// Normaliza a estrutura de alternativas vinda de uma sessão v2.
function normalizarAlternativas(obj){
    var out = {};
    PERIODOS.forEach(function(p){
        var src = obj && obj[p];
        var lista = (src && Array.isArray(src.lista)) ? src.lista : null;
        if (!lista || !lista.length){
            out[p] = { ativa: 0, lista: [ novaAlt("Opção 1") ] };
        } else {
            out[p] = {
                ativa: Math.min(Math.max(0, src.ativa | 0), lista.length - 1),
                lista: lista.map(function(a, i){
                    return {
                        titulo: (a && a.titulo) ? String(a.titulo) : ("Opção " + (i + 1)),
                        notas: (a && Array.isArray(a.notas)) ? a.notas.map(String) : [],
                        itens: (a && Array.isArray(a.itens)) ? a.itens : [],
                        substitutos: normalizarSubstitutos(a && a.substitutos)
                    };
                })
            };
        }
    });
    return out;
}

// Item de estado ANTIGO (achatado, com "base") -> item de alternativa ("_base").
function itemAntigoParaAlt(item){
    var it = {};
    ["refeicao","nome","unidade","qtd","cal","fats","carb","protein","grupo","detalhes","semQtd"]
        .forEach(function(k){ it[k] = item[k]; });
    if (item.base){ it._base = item.base; }
    return it;
}

// Reconstrói a tela a partir de um estado salvo. v2 traz TODAS as alternativas
// por período (estado.periodos). Estados antigos (só itens[]) viram 1
// alternativa por período.
function carregarEstado(estado){
    if (!estado || !Array.isArray(estado.itens) || estado.itens.length === 0){
        alert("Este arquivo nao parece um estado valido (sem itens).");
        return;
    }

    document.getElementById("nome").textContent = estado.nome || "";
    document.getElementById("dia").textContent = estado.notas || "";
    foodsSessao = Array.isArray(estado.foodsSessao) ? estado.foodsSessao : [];
    notasPlano = normalizarNotas(estado.notasPlano);   // notas gerais (+ ativas por período)

    if (estado.periodos && typeof estado.periodos === "object"){
        alternativas = normalizarAlternativas(estado.periodos);
    } else {
        // formato antigo: uma alternativa por período, montada dos itens[]
        var np = normalizarNotas(estado.notasPlano);
        inicializarAlternativas();
        PERIODOS.forEach(function(p){ alternativas[p].lista[0].notas = (np[p] || []).slice(); });
        estado.itens.forEach(function(item){
            var p = (item.refeicao && alternativas[item.refeicao]) ? item.refeicao : "Manhã";
            alternativas[p].lista[0].itens.push(itemAntigoParaAlt(item));
        });
    }

    // limpa tudo e renderiza a alternativa ATIVA de cada período
    data = [];
    PERIODOS.forEach(function(p){ var c = containerPeriodo(p); if (c){ c.innerHTML = ""; } });
    PERIODOS.forEach(function(p){ renderAtivo(p); });

    sincronizarLinhas();
    fecharSessoes();
}

// Recupera os macros POR UNIDADE a partir dos totais guardados
// (os totais foram gravados como qtd * por-unidade).
function derivarPorUnidade(item){
    var q = parseNum(item.qtd);
    if (q <= 0){ return null; }
    return {
        nome: item.nome,
        unidade: item.unidade,
        cal: parseNum(item.cal)/q,
        protein: parseNum(item.protein)/q,
        carb: parseNum(item.carb)/q,
        fats: parseNum(item.fats)/q,
        detalhes: item.detalhes || ""
    };
}

// Acrescenta uma receita como uma nova linha do plano (na lista da Manhã por
// padrão; é só arrastar para outro período depois).
function carregarReceitaComoLinha(receita){
    var idx = data.length;
    var d = novaLinha(); d.refeicao = "Manhã";
    data.push(d);

    var el = document.createElement("div");
    el.className = "form-row";
    el.innerHTML = rowTemplate;
    renumeraLinha(el, 0, idx);
    containerPeriodo("Manhã").appendChild(el);

    // uma receita e "1 porcao": os valores ja sao por unidade
    var porUnidade = {
        nome: receita.nome,
        unidade: receita.unidade || "porção",
        cal: parseNum(receita.cal),
        protein: parseNum(receita.protein),
        carb: parseNum(receita.carb),
        fats: parseNum(receita.fats),
        detalhes: String(receita.detalhes || "").replaceAll("\n", "<br>")
    };

    mostrarMenuPrincipal(idx);
    var select = document.getElementById('foods-'+idx);
    var o = document.createElement("option");
    o.value = porUnidade.nome; o.text = porUnidade.nome;
    select.appendChild(o);
    select._lista = (select._lista || foods).concat([porUnidade]);
    select.value = porUnidade.nome;

    document.getElementById('qtd-'+idx).value = 1;
    updateFood('-'+idx);
    sincronizarLinhas();
    fecharSessoes();
}

// Decide se um arquivo carregado e um estado (plano inteiro) ou uma
// receita (item unico), e trata cada caso.
function carregarArquivoDetectado(obj){
    if (obj && Array.isArray(obj.itens)){ carregarEstado(obj); return; }
    if (obj && typeof obj.nome === "string" && obj.cal !== undefined){ carregarReceitaComoLinha(obj); return; }
    alert("Nao reconheci este arquivo como estado nem como receita.");
}

function abrirEstadoArquivo(input){
    var file = input.files[0];
    if (!file){ return; }

    var reader = new FileReader();
    reader.onload = function(e){
        var obj;
        try { obj = JSON.parse(e.target.result); }
        catch(err){ alert("Arquivo JSON invalido: " + err.message); return; }
        carregarArquivoDetectado(obj);
    };
    reader.readAsText(file);
    input.value = "";   //permite reabrir o mesmo arquivo depois
}

//--- carregar do repositorio (GitHub Pages / servidor local) ---

var indiceSessoes = { estados: [], receitas: [] };

function carregarIndiceSessoes(){
    var sel = document.getElementById("sessoesRepo");
    if (!sel){ return; }

    // O GitHub Pages guarda os arquivos em cache por 10 min. Sem o "?t=", uma
    // sessão recém-publicada demorava a aparecer aqui. O parametro muda a cada
    // abertura, forçando a busca da lista mais recente.
    var t = "?t=" + Date.now();

    Promise.all([
        pegarJSON("estados/index.json" + t).catch(function(){ return []; }),
        pegarJSON("receitas/index.json" + t).catch(function(){ return []; })
    ]).then(function(res){
        indiceSessoes.estados  = Array.isArray(res[0]) ? res[0] : [];
        indiceSessoes.receitas = Array.isArray(res[1]) ? res[1] : [];
        montarSelectSessoes();
    });
}

function montarSelectSessoes(){
    var sel = document.getElementById("sessoesRepo");
    sel.innerHTML = "";

    var vazio = document.createElement("option");
    vazio.value = ""; vazio.disabled = true; vazio.selected = true;
    vazio.text = (indiceSessoes.estados.length || indiceSessoes.receitas.length)
                 ? "— escolha —" : "— nada publicado ainda —";
    sel.appendChild(vazio);

    adicionarGrupoSessoes(sel, "Estados",  "estado",  indiceSessoes.estados,  "estados/");
    adicionarGrupoSessoes(sel, "Receitas", "receita", indiceSessoes.receitas, "receitas/");
}

function adicionarGrupoSessoes(sel, rotulo, tipo, lista, pasta){
    if (!lista || !lista.length){ return; }

    var og = document.createElement("optgroup");
    og.label = rotulo;

    lista.slice()
         .sort(function(a,b){ return String(a.nome).localeCompare(String(b.nome), "pt-BR"); })
         .forEach(function(item){
             var o = document.createElement("option");
             o.value = tipo + "|" + pasta + "|" + item.arquivo;
             o.text = item.nome + (item.salvoEm ? "  (" + String(item.salvoEm).slice(0,10) + ")" : "");
             og.appendChild(o);
         });

    sel.appendChild(og);
}

// Gera o link "view" (só leitura, para o cliente) do estado selecionado.
function copiarLinkView(){
    var sel = document.getElementById("sessoesRepo");
    var out = document.getElementById("viewLinkOut");
    var v = sel && sel.value;
    if (!v){ if (out){ out.textContent = "Escolha um estado publicado primeiro."; } return; }
    var partes = v.split("|");   // tipo | pasta | arquivo
    if (partes[0] !== "estado"){ if (out){ out.textContent = "O link de visualização é só para estados (planos)."; } return; }

    var arquivo = partes[2];
    var base = location.href.split("?")[0].replace(/[^\/]*$/, "");   // pasta do index.html
    var link = base + "view.html?e=" + encodeURIComponent(arquivo);

    function mostrar(copiado){
        if (!out){ return; }
        out.innerHTML = (copiado ? "✓ Link copiado — " : "") +
            '<a href="' + link + '" target="_blank" rel="noopener">abrir</a> &middot; ' +
            '<span style="word-break:break-all;">' + link + '</span>';
    }
    if (navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(link).then(function(){ mostrar(true); }, function(){ mostrar(false); });
    } else {
        mostrar(false);
    }
}

function carregarSessaoDoRepo(){
    var sel = document.getElementById("sessoesRepo");
    var v = sel.value;
    if (!v){ alert("Escolha uma sessao para carregar."); return; }

    var partes = v.split("|");
    var url = partes[1] + encodeURIComponent(partes[2]) + "?t=" + Date.now();

    pegarJSON(url)
        .then(carregarArquivoDetectado)
        .catch(function(err){ alert("Nao consegui carregar: " + err.message); });
}

//--- modal ---

function abrirSessoes(){
    document.getElementById("nomeEstadoAtual").textContent =
        (document.getElementById("nome").textContent.trim() || "(sem nome)") +
        " — " + data.length + " item(ns)";
    carregarIndiceSessoes();
    document.getElementById("sessoesModal").style.display = "block";
}

function fecharSessoes(){
    var m = document.getElementById("sessoesModal");
    if (m){ m.style.display = "none"; }
}

// fecha ao clicar fora (coexiste com o window.onclick de modal-window.js)
window.addEventListener('click', function(event){
    if (event.target === document.getElementById('sessoesModal')){ fecharSessoes(); }
});

// ==== Importar uma lista de OUTRO plano ===================================
// O botão "importar" de cada período abre este modal: escolhe-se um plano
// (publicado ou de arquivo), veem-se as listas dele agrupadas por período, e
// um clique traz a escolhida como uma NOVA alternativa do período de destino.
// O modal continua aberto depois de importar — dá para trazer várias de uma
// vez (os 4 dias de um plano para o mesmo período, por exemplo).

var importAlvo = null;     // período que recebe as listas
var importOrigem = null;   // { nome, listas: [...] } do plano escolhido

function abrirImportar(p){
    if (!alternativas[p]){ return; }
    importAlvo = p;
    importOrigem = null;

    var dest = document.getElementById("importDestino");
    if (dest){ dest.textContent = p; }
    mensagemImport("Escolha um plano acima para ver as listas dele.");
    montarSelectImport();

    document.getElementById("importarModal").style.display = "block";
}

function fecharImportar(){
    var m = document.getElementById("importarModal");
    if (m){ m.style.display = "none"; }
    importAlvo = null;
    importOrigem = null;
}

function mensagemImport(txt){
    var out = document.getElementById("importListas");
    if (!out){ return; }
    out.innerHTML = "";
    var p = document.createElement("p");
    p.className = "fraco";
    p.textContent = txt;
    out.appendChild(p);
}

// Só estados entram aqui (receita não é uma lista). Reaproveita o índice já
// buscado pelo modal de Sessões; busca de novo se ainda não veio.
function montarSelectImport(){
    var sel = document.getElementById("importRepo");
    if (!sel){ return; }

    function preencher(){
        sel.innerHTML = "";
        var vazio = document.createElement("option");
        vazio.value = ""; vazio.disabled = true; vazio.selected = true;
        vazio.text = indiceSessoes.estados.length ? "— escolha um plano —" : "— nenhum plano publicado —";
        sel.appendChild(vazio);

        indiceSessoes.estados.slice()
            .sort(function(a,b){ return String(a.nome).localeCompare(String(b.nome), "pt-BR"); })
            .forEach(function(item){
                var o = document.createElement("option");
                o.value = item.arquivo;
                o.text = item.nome + (item.salvoEm ? "  (" + String(item.salvoEm).slice(0,10) + ")" : "");
                sel.appendChild(o);
            });
    }

    if (indiceSessoes.estados.length){ preencher(); return; }

    sel.innerHTML = "";
    var carregando = document.createElement("option");
    carregando.disabled = true; carregando.selected = true; carregando.text = "— carregando… —";
    sel.appendChild(carregando);

    pegarJSON("estados/index.json?t=" + Date.now())
        .then(function(idx){ indiceSessoes.estados = Array.isArray(idx) ? idx : []; })
        .catch(function(){ indiceSessoes.estados = []; })
        .then(preencher);
}

// Todas as listas de um estado, na ordem dos períodos. Estados ANTIGOS (v1, só
// itens[]) viram uma lista por período, como em carregarEstado().
function listasDeEstado(estado){
    var out = [];

    if (estado && estado.periodos && typeof estado.periodos === "object"){
        var alts = normalizarAlternativas(estado.periodos);
        PERIODOS.forEach(function(p){
            alts[p].lista.forEach(function(a){
                out.push({ periodo: p, titulo: a.titulo, notas: a.notas || [],
                           itens: a.itens || [], substitutos: a.substitutos || [] });
            });
        });
    } else if (estado && Array.isArray(estado.itens)){
        var np = normalizarNotas(estado.notasPlano);
        // no formato antigo o rótulo do dia ficava no campo "notas" do plano
        var rotulo = String(estado.notas || "").trim() || "Opção 1";
        PERIODOS.forEach(function(p){
            out.push({
                periodo: p,
                titulo: rotulo,
                notas: (np[p] || []).slice(),
                itens: estado.itens.filter(function(it){ return it.refeicao === p; }).map(itemAntigoParaAlt),
                substitutos: []
            });
        });
    }

    return out;
}

function somaDaLista(itens){
    var s = { protein: 0, carb: 0, fats: 0, cal: 0 };
    (itens || []).forEach(function(it){
        s.protein += parseNum(it.protein); s.carb += parseNum(it.carb);
        s.fats    += parseNum(it.fats);    s.cal  += parseNum(it.cal);
    });
    return s;
}

function mostrarListasImportaveis(estado, origem){
    var out = document.getElementById("importListas");
    if (!out){ return; }

    if (!estado || !Array.isArray(estado.itens)){
        mensagemImport("Este arquivo não parece um plano (estado).");
        return;
    }

    // lista vazia não vale a pena importar — para isso já existe o "+ vazia"
    var listas = listasDeEstado(estado).filter(function(l){
        return l.itens.length || l.notas.length;
    });
    importOrigem = { nome: origem, listas: listas };

    if (!listas.length){
        mensagemImport("Este plano não tem nenhuma lista com conteúdo.");
        return;
    }

    out.innerHTML = "";
    PERIODOS.forEach(function(p){
        var doPeriodo = [];
        listas.forEach(function(l, i){ if (l.periodo === p){ doPeriodo.push(i); } });
        if (!doPeriodo.length){ return; }

        var h = document.createElement("h4");
        h.className = "import-periodo";
        h.textContent = p + (p === importAlvo ? "  (o período de destino)" : "");
        out.appendChild(h);

        doPeriodo.forEach(function(i){ out.appendChild(cartaoImport(listas[i], i)); });
    });
}

function cartaoImport(l, idx){
    var card = document.createElement("div");
    card.className = "import-lista";

    var tit = document.createElement("div");
    tit.className = "import-lista-tit";
    tit.textContent = l.titulo;
    card.appendChild(tit);

    var s = somaDaLista(l.itens);
    var meta = document.createElement("div");
    meta.className = "import-lista-meta";
    meta.textContent = l.itens.length + " item(ns)" +
        (l.notas.length ? " · " + l.notas.length + " nota(s)" : "") +
        " · " + arred1(s.cal) + " cal · P " + arred1(s.protein) + " · C " + arred1(s.carb) + " · G " + arred1(s.fats);
    card.appendChild(meta);

    var bt = document.createElement("button");
    bt.type = "button";
    bt.className = "import-btn";
    bt.textContent = "importar";
    bt.title = "Trazer esta lista como nova alternativa de " + importAlvo;
    bt.onclick = function(){ importarLista(idx, bt); };
    card.appendChild(bt);

    if (l.itens.length){
        var pre = document.createElement("div");
        pre.className = "import-lista-itens";
        pre.textContent = l.itens.map(function(it){ return it.nome; }).join(" · ");
        card.appendChild(pre);
    }

    return card;
}

function importarLista(idx, botao){
    var p = importAlvo;
    var l = importOrigem && importOrigem.listas[idx];
    var alt = p && alternativas[p];
    if (!l || !alt){ return; }

    commitAtivo(p);   // guarda o que está na tela antes de trocar de alternativa

    alt.lista.push({
        titulo: tituloImportado(l.titulo, importOrigem.nome),
        notas: (l.notas || []).slice(),
        substitutos: normalizarSubstitutos(l.substitutos),
        // a refeição de um item é a lista onde ele está: reetiqueta ao mudar de período
        itens: (l.itens || []).map(function(it){
            var c = clonarDadoLinha(it);
            c.refeicao = p;
            return c;
        })
    });
    alt.ativa = alt.lista.length - 1;
    renderAtivo(p);

    if (botao){
        botao.textContent = "✓ importado";
        botao.disabled = true;
    }
}

// De qual plano veio — senão duas listas "Opção 1" ficam indistinguíveis.
function tituloImportado(titulo, origem){
    var t = String(titulo || "").trim() || "Opção";
    var o = String(origem || "").trim();
    return o ? (t + " (" + o + ")") : t;
}

function nomeDoPlano(estado, arquivo){
    var n = estado && String(estado.nome || "").trim();
    return n || String(arquivo || "").replace(/\.json$/i, "");
}

function verListasDoRepo(){
    var sel = document.getElementById("importRepo");
    var arquivo = sel && sel.value;
    if (!arquivo){ mensagemImport("Escolha um plano na lista acima."); return; }

    mensagemImport("Carregando…");
    pegarJSON("estados/" + encodeURIComponent(arquivo) + "?t=" + Date.now())
        .then(function(obj){ mostrarListasImportaveis(obj, nomeDoPlano(obj, arquivo)); })
        .catch(function(err){ mensagemImport("Não consegui carregar: " + err.message); });
}

function verListasDeArquivo(input){
    var file = input.files[0];
    if (!file){ return; }

    var reader = new FileReader();
    reader.onload = function(e){
        var obj;
        try { obj = JSON.parse(e.target.result); }
        catch(err){ mensagemImport("Arquivo JSON inválido: " + err.message); return; }
        mostrarListasImportaveis(obj, nomeDoPlano(obj, file.name));
    };
    reader.readAsText(file);
    input.value = "";   // permite reabrir o mesmo arquivo depois
}

window.addEventListener('click', function(event){
    if (event.target === document.getElementById('importarModal')){ fecharImportar(); }
});

// ==== Substitutos de uma alternativa ======================================
// Pool curado de alimentos que o CLIENTE pode usar no lugar dos desta lista,
// lá no modo de visualização. Guardamos os macros POR UNIDADE (igual ao
// foods.json): no celular a quantidade muda e o cálculo é refeito na hora.

var subsPeriodo = null;

function altAtual(p){
    var alt = alternativas[p];
    return alt ? alt.lista[alt.ativa] : null;
}

function abrirSubs(p){
    if (!alternativas[p]){ return; }
    subsPeriodo = p;
    commitAtivo(p);
    renderSubs();
    document.getElementById("subsModal").style.display = "block";
}

function fecharSubs(){
    var m = document.getElementById("subsModal");
    if (m){ m.style.display = "none"; }
    subsPeriodo = null;
    renderBreakdown();   // atualiza o destaque do botão ⇄
}

function renderSubs(){
    var p = subsPeriodo;
    var a = altAtual(p);
    var tit = document.getElementById("subsTitulo");
    var out = document.getElementById("subsLista");
    if (!a || !out){ return; }

    if (tit){ tit.textContent = p + " — " + a.titulo; }
    if (!Array.isArray(a.substitutos)){ a.substitutos = []; }
    out.innerHTML = "";

    if (!a.substitutos.length){
        var vazio = document.createElement("p");
        vazio.className = "fraco";
        vazio.textContent = "Nenhum substituto ainda. Sem eles, no celular o cliente só consegue mudar a quantidade.";
        out.appendChild(vazio);
        return;
    }

    a.substitutos.forEach(function(s, i){
        var lin = document.createElement("div");
        lin.className = "sub-linha";

        var nome = document.createElement("span");
        nome.className = "sub-nome";
        nome.textContent = s.nome;
        lin.appendChild(nome);

        var macros = document.createElement("span");
        macros.className = "sub-macros";
        macros.textContent = "por " + (s.unidade || "unidade") + ": " +
            arred1(s.cal) + " cal · P " + arred1(s.protein) + " · C " + arred1(s.carb) + " · G " + arred1(s.fats);
        lin.appendChild(macros);

        var del = document.createElement("button");
        del.type = "button";
        del.className = "sub-del";
        del.textContent = "remover";
        del.onclick = function(){ removerSubstituto(i); };
        lin.appendChild(del);

        out.appendChild(lin);
    });
}

function adicionarSubstituto(){
    var p = subsPeriodo;
    abrirPickerPara(function(item){
        var a = altAtual(p);
        if (!a){ return; }
        if (!Array.isArray(a.substitutos)){ a.substitutos = []; }
        var novo = substitutoDeAlimento(item);
        if (!novo.nome){ return; }
        var repetido = a.substitutos.some(function(s){ return s.nome === novo.nome; });
        if (!repetido){ a.substitutos.push(novo); }
        subsPeriodo = p;
        renderSubs();
        document.getElementById("subsModal").style.display = "block";
    });
}

function removerSubstituto(i){
    var a = altAtual(subsPeriodo);
    if (!a || !Array.isArray(a.substitutos)){ return; }
    a.substitutos.splice(i, 1);
    renderSubs();
}

window.addEventListener('click', function(event){
    if (event.target === document.getElementById('subsModal')){ fecharSubs(); }
});

//----------------------------

function openJSONfile(rowID) {
    var row = parseInt(rowID.replace("-",""));
    
    
    let file = document.querySelector("#file-input"+rowID).files[0];
    let reader = new FileReader();
    reader.addEventListener('load', function(e) {
            let text = e.target.result;
            var loaded = JSON.parse(text);
            var str= loaded.detalhes;
            
            loaded.detalhes = str.replaceAll("\n", "<br>");
        
            pasteInFoods(loaded, foods.length);
        
            var option = document.createElement("option");
            option.value = loaded.nome;
            option.text = loaded.nome;
            document.getElementById('foods-' + row).appendChild(option);
            document.getElementById('foods-' + row).value = loaded.nome;
            document.getElementById('qtd-' + row).value = 1;
            updateFood(rowID);
        
            
            //document.getElementById('foods-' + row).appendChild(loaded.nome);
            
            
            
    });

  
    reader.readAsText(file);
} //abre uma banco de dados json

//------------------------------------

///----------GERADOR DE LaTeX-----------------

// Escapa os caracteres especiais do LaTeX. Nomes como "M&S ... 10% Fat"
// tem & e %, que sem escape quebram a compilacao.
function escLatex(s){
    return String(s)
        .replace(/\\/g, "\\textbackslash{}")
        .replace(/([&%$#_{}])/g, "\\$1")
        .replace(/~/g, "\\textasciitilde{}")
        .replace(/\^/g, "\\textasciicircum{}");
}

// Tira HTML/quebras de linha dos detalhes para caber numa celula.
function stripHtml(s){
    return String(s)
        .replace(/<br\s*\/?>/gi, "; ")
        .replace(/<[^>]+>/g, "")
        .replace(/\s*\n+\s*/g, "; ")
        .trim();
}

// Monta o documento LaTeX. Na versão enxuta tira o resumo do topo e as
// observações dos alimentos, deixando só as tabelas por refeição — menos
// ruído para quem só quer o plano.
// Empurra parágrafos de nota (cada string vira um parágrafo LaTeX).
function paragrafosLatex(L, lista){
    if (!Array.isArray(lista)){ return; }
    lista.forEach(function(txt){
        var s = String(txt || "").replace(/\s*\n\s*/g, " ").trim();
        if (!s){ return; }
        L.push(escLatex(s));
        L.push("");   // linha em branco = novo parágrafo
    });
}

function temNotas(lista){
    return Array.isArray(lista) && lista.some(function(s){ return String(s).trim() !== ""; });
}

// modo: "completa" (resumo + macros por alimento), "enxuta" (sem resumo e
// sem observações) ou "ultra" (uma página: só nome+quantidade, totais no
// título, instruções ao lado da tabela).
function montarLatex(modo){

    var enxuto = (modo === "enxuta");
    var ultra  = (modo === "ultra");

    var nome  = document.getElementById("nome").textContent.trim();
    var notas = document.getElementById("dia").textContent.trim();
    lerNotasVivas();                 // garante notasPlano atualizado
    var res   = calcPorPeriodo();

    var L = [];
    L.push("\\documentclass[10pt]{article}");
    L.push("\\usepackage[utf8]{inputenc}");
    L.push("\\usepackage[T1]{fontenc}");
    // margens menores para aproveitar melhor a folha
    L.push("\\usepackage[a4paper,top=1.3cm,bottom=1.3cm,left=1.4cm,right=1.4cm]{geometry}");
    L.push("\\usepackage{booktabs}");
    L.push("\\usepackage{array}");
    L.push("\\usepackage{tabularx}");
    L.push("\\usepackage{wrapfig}");
    L.push("\\usepackage{xcolor}");
    L.push("\\definecolor{accent}{HTML}{0B25D4}");
    // colunas de largura fixa: as tabelas ficam iguais em TODOS os períodos,
    // independentemente do tamanho dos nomes dos alimentos (o nome usa a
    // coluna X, que ocupa o espaço restante e quebra linha se preciso).
    L.push("\\newcolumntype{N}{>{\\raggedleft\\arraybackslash}p{1.1cm}}");
    L.push("\\newcolumntype{Q}{>{\\raggedright\\arraybackslash}p{2.2cm}}");
    L.push("\\renewcommand{\\arraystretch}{1.15}");
    L.push("\\setlength{\\parindent}{0pt}");
    L.push("");
    L.push("\\begin{document}");
    L.push("");

    // cabecalho
    L.push("\\begin{center}");
    L.push("{\\LARGE\\bfseries\\color{accent} " + escLatex(nome || "Plano alimentar") + "}");
    if (notas){ L.push("\\\\[4pt]"); L.push("{\\large " + escLatex(notas) + "}"); }
    L.push("\\end{center}");
    L.push("\\vspace{" + (ultra ? "4pt" : "8pt") + "}");
    L.push("");

    // notas gerais (parágrafos), em qualquer versão
    if (temNotas(notasPlano.geral)){
        paragrafosLatex(L, notasPlano.geral);
        L.push("\\vspace{4pt}");
        L.push("");
    }

    if (ultra){ montarLatexUltra(L, res); }
    else      { montarLatexNormal(L, res, enxuto); }

    L.push("\\end{document}");
    return L.join("\n");
}

// Versões "completa" e "enxuta": resumo (só completa) + uma tabela larga por
// período com os macros de cada alimento.
function montarLatexNormal(L, res, enxuto){

    if (!enxuto){
        L.push("\\section*{Resumo}");
        L.push("\\begin{tabularx}{\\textwidth}{@{}X N N N N@{}}");
        L.push("\\toprule");
        L.push("\\textbf{Período} & \\textbf{Prot. (g)} & \\textbf{Carb. (g)} & \\textbf{Gord. (g)} & \\textbf{Cal.} \\\\");
        L.push("\\midrule");

        var tP = 0, tC = 0, tF = 0, tCal = 0;
        PERIODOS.forEach(function(p){
            var d = res[p];
            if (d.itens.length === 0){ return; }
            L.push(escLatex(p) + " & " + d.protein + " & " + d.carb + " & " + d.fats + " & " + d.cal + " \\\\");
            tP += d.protein; tC += d.carb; tF += d.fats; tCal += d.cal;
        });

        L.push("\\midrule");
        L.push("\\textbf{Total} & \\textbf{" + rd(tP) + "} & \\textbf{" + rd(tC) + "} & \\textbf{" + rd(tF) + "} & \\textbf{" + rd(tCal) + "} \\\\");
        L.push("\\bottomrule");
        L.push("\\end{tabularx}");
        L.push("\\vspace{6pt}");
        L.push("");
    }

    PERIODOS.forEach(function(p){
        var d = res[p];
        var comNotas = temNotas(notasPlano[p]);
        if (d.itens.length === 0 && !comNotas){ return; }

        L.push("\\section*{" + escLatex(p) + "}");

        if (d.itens.length > 0){
            L.push("{\\small");
            L.push("\\begin{tabularx}{\\textwidth}{@{}X Q N N N N@{}}");
            L.push("\\toprule");
            L.push("\\textbf{Alimento} & \\textbf{Qtd} & \\textbf{Prot} & \\textbf{Carb} & \\textbf{Gord} & \\textbf{Cal} \\\\");
            L.push("\\midrule");

            d.itens.forEach(function(it){
                var alimento = escLatex(it.nome);
                if (!enxuto){
                    var obs = stripHtml(it.detalhes || "");
                    if (obs && obs !== "Sem detalhes."){
                        alimento += " \\newline \\textit{\\footnotesize " + escLatex(obs) + "}";
                    }
                }
                if (it.semQtd){
                    var ql = escLatex(String(it.qtd || "").trim());
                    L.push(alimento + " & " + ql + " & & & & \\\\");
                    return;
                }
                var qtd = escLatex(it.qtd + " " + it.unidade);
                L.push(alimento + " & " + qtd + " & " + it.protein + " & " + it.carb + " & " + it.fats + " & " + it.cal + " \\\\");
            });

            L.push("\\midrule");
            L.push("\\textbf{Subtotal} & & \\textbf{" + d.protein + "} & \\textbf{" + d.carb + "} & \\textbf{" + d.fats + "} & \\textbf{" + d.cal + "} \\\\");
            L.push("\\bottomrule");
            L.push("\\end{tabularx}");
            L.push("}");
        }

        if (comNotas){
            L.push("\\vspace{3pt}");
            paragrafosLatex(L, notasPlano[p]);
        }
        L.push("");
    });
}

// Tabela compacta de duas colunas (nome | quantidade), largura fixa.
function tabelaNomeQtd(d, largura){
    var t = [];
    t.push("{\\small");
    t.push("\\begin{tabularx}{" + largura + "}{@{}X >{\\raggedleft\\arraybackslash}p{2.3cm}@{}}");
    t.push("\\toprule");
    t.push("\\textbf{Alimento} & \\textbf{Qtd} \\\\");
    t.push("\\midrule");
    d.itens.forEach(function(it){
        var nome = escLatex(it.nome);
        var qtd = it.semQtd ? escLatex(String(it.qtd || "").trim()) : escLatex(it.qtd + " " + it.unidade);
        t.push(nome + " & " + qtd + " \\\\");
    });
    t.push("\\bottomrule");
    t.push("\\end{tabularx}");
    t.push("}");
    return t.join("\n");
}

// Empurra um parágrafo de nota já escapado (sem quebra de linha interna).
function paragrafoNotaLatex(L, txt){
    var s = String(txt || "").replace(/\s*\n\s*/g, " ").trim();
    if (!s){ return; }
    L.push(escLatex(s));
    L.push("");
}

// Estimativa (limite INFERIOR) de quantas linhas as notas ocupam a ~meia
// largura. Uso um teto alto de caracteres por linha para NUNCA superestimar
// — assim só considero as notas "longas" quando com certeza passam da tabela.
function estimarLinhasNotas(notas){
    var CH = 58;   // teto de caracteres por linha a ~0.5\textwidth (10pt)
    var n = 0;
    notas.forEach(function(t){
        var s = String(t).replace(/\s+/g, " ").trim();
        if (s){ n += Math.ceil(s.length / CH); }
    });
    return n;
}

// Versão "ultra" (uma página): cada período é um BLOCO próprio, independente,
// em largura cheia — NÃO é um documento de duas colunas. Dentro do bloco:
//   • título com o nome do período e os totais (cal / proteína);
//   • tabela nome+quantidade ocupando ~metade da largura, à esquerda;
//   • as instruções ENCHEM primeiro o lado direito da tabela e só então
//     continuam em largura cheia, abaixo.
// Quando as notas cabem ao lado da tabela, uso duas minipages lado a lado
// (determinístico, sem risco de vazamento). Quando as notas são LONGAS o
// bastante para passar da tabela, uso wrapfig, que enche a direita e desce
// para a largura cheia. Só uso wrapfig nesse caso porque, com texto curto,
// ele deixaria o próximo período vazar para o lado (vira jornal de 2 colunas).
function montarLatexUltra(L, res){

    // total do dia numa linha compacta
    var totP = 0, totC = 0, totF = 0, totCal = 0;
    PERIODOS.forEach(function(p){ var d = res[p]; totP += d.protein; totC += d.carb; totF += d.fats; totCal += d.cal; });
    L.push("{\\small\\textbf{Total do dia:}~ " + rd(totCal) + " cal \\textbullet{} Prot " + rd(totP) +
           " g \\textbullet{} Carb " + rd(totC) + " g \\textbullet{} Gord " + rd(totF) + " g}\\par");
    L.push("\\vspace{6pt}");
    L.push("");

    PERIODOS.forEach(function(p){
        var d = res[p];
        var temItens = d.itens.length > 0;
        var notas = (notasPlano[p] || []).filter(function(s){ return String(s).trim() !== ""; });
        if (!temItens && notas.length === 0){ return; }

        // título do período (largura cheia) com os totais entre parênteses
        var tit = escLatex(p) + " {\\normalsize\\mdseries(" + d.cal + " cal \\textbullet{} " + d.protein + " g prot)}";
        L.push("\\section*{" + tit + "}");

        if (temItens){
            var linhasTabela = d.itens.length + 3;                 // ~altura da tabela em linhas
            var linhasNotas  = estimarLinhasNotas(notas);          // limite inferior
            var notasLongas  = notas.length > 0 && linhasNotas >= linhasTabela + 1;

            if (notasLongas){
                // enche a direita da tabela e continua abaixo, em largura cheia
                L.push("\\begin{wraptable}{l}{0.5\\textwidth}");
                L.push("\\vspace{-\\intextsep}");
                L.push(tabelaNomeQtd(d, "0.47\\textwidth"));
                L.push("\\end{wraptable}");
                L.push("");
                notas.forEach(function(t){ paragrafoNotaLatex(L, t); });
                L.push("");
            } else {
                // notas cabem ao lado: tabela e notas em minipages lado a lado
                L.push("\\noindent");
                L.push("\\begin{minipage}[t]{0.46\\textwidth}");
                L.push("\\vspace{0pt}");
                L.push(tabelaNomeQtd(d, "\\linewidth"));
                L.push("\\end{minipage}\\hfill");
                L.push("\\begin{minipage}[t]{0.5\\textwidth}");
                L.push("\\vspace{0pt}");
                notas.forEach(function(t){ paragrafoNotaLatex(L, t); });
                L.push("\\end{minipage}");
                L.push("\\par");
            }
        } else {
            // sem itens: só as instruções, em largura cheia
            notas.forEach(function(t){ paragrafoNotaLatex(L, t); });
        }

        L.push("\\vspace{10pt}");
        L.push("");
    });
}

function latexModoSelecionado(){
    var s = document.getElementById("latexModo");
    return s ? s.value : "completa";
}

// abre o modal com o código (respeita a versão escolhida)
function gerarLatex(){
    document.getElementById("latexOut").value = montarLatex(latexModoSelecionado());
    document.getElementById("latexModal").style.display = "block";
}

// regera o código quando o usuário troca a versão
function atualizarLatex(){
    document.getElementById("latexOut").value = montarLatex(latexModoSelecionado());
}

function copiarLatex(){
    var ta = document.getElementById("latexOut");
    ta.select();
    ta.setSelectionRange(0, ta.value.length);   // iOS

    var feito = function(){
        var b = document.getElementById("btnCopiarLatex");
        if (!b){ return; }
        var t = b.textContent;
        b.textContent = "Copiado!";
        setTimeout(function(){ b.textContent = t; }, 1500);
    };

    if (navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(ta.value).then(feito, function(){ document.execCommand("copy"); feito(); });
    } else {
        document.execCommand("copy");
        feito();
    }
}

function fecharLatex(){
    var m = document.getElementById("latexModal");
    if (m){ m.style.display = "none"; }
}

window.addEventListener('click', function(event){
    if (event.target === document.getElementById('latexModal')){ fecharLatex(); }
});

//====================================================================
// Exportar a sessão como HTML (colar no Word/Excel) e como CSV (Excel)
//====================================================================

function escHtml(s){
    return String(s == null ? "" : s)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// número no formato brasileiro (vírgula decimal), para o Excel pt-BR ler certo
function numBR(n){ return String(n).replace(".", ","); }

// campo de CSV: aspas quando tiver ; " ou quebra de linha
function csvCampo(v){
    var s = String(v == null ? "" : v);
    if (/[;"\n\r]/.test(s)){ s = '"' + s.replace(/"/g, '""') + '"'; }
    return s;
}

// Monta um HTML simples, com estilos EM LINHA (para o Word/Excel manterem a
// formatação ao colar): resumo por período + uma tabela por período + notas.
function exportarHTML(){
    var nome = document.getElementById("nome").textContent.trim() || "Plano alimentar";
    var subt = document.getElementById("dia").textContent.trim();
    lerNotasVivas();
    var res = calcPorPeriodo();

    var TBL = "border-collapse:collapse; width:100%; margin:8px 0;";
    var THL = "border:1px solid #999; padding:4px 8px; background:#e8eefc; text-align:left;";
    var THR = "border:1px solid #999; padding:4px 8px; background:#e8eefc; text-align:right;";
    var TDL = "border:1px solid #ccc; padding:4px 8px;";
    var TDR = "border:1px solid #ccc; padding:4px 8px; text-align:right;";

    var H = [];
    H.push('<!doctype html><html lang="pt-br"><head><meta charset="utf-8"><title>' + escHtml(nome) + '</title></head>');
    H.push('<body style="font-family:Georgia,serif; color:#111; max-width:900px; margin:16px auto; padding:0 12px;">');
    H.push('<h1 style="color:#0B25D4; margin:0 0 4px;">' + escHtml(nome) + '</h1>');
    if (subt){ H.push('<div style="color:#444; margin-bottom:8px;">' + escHtml(subt) + '</div>'); }

    if (temNotas(notasPlano.geral)){
        notasPlano.geral.forEach(function(t){ if (String(t).trim()){ H.push('<p style="margin:4px 0;">' + escHtml(t) + '</p>'); } });
    }

    // resumo por período
    H.push('<h2 style="margin:14px 0 4px;">Resumo</h2>');
    H.push('<table style="' + TBL + '"><tr>' +
        '<th style="' + THL + '">Período</th><th style="' + THR + '">Prot (g)</th>' +
        '<th style="' + THR + '">Carb (g)</th><th style="' + THR + '">Gord (g)</th><th style="' + THR + '">Cal</th></tr>');
    var tP = 0, tC = 0, tF = 0, tCal = 0;
    PERIODOS.forEach(function(p){
        var d = res[p]; if (!d.itens.length){ return; }
        H.push('<tr><td style="' + TDL + '">' + escHtml(p) + '</td><td style="' + TDR + '">' + d.protein +
            '</td><td style="' + TDR + '">' + d.carb + '</td><td style="' + TDR + '">' + d.fats +
            '</td><td style="' + TDR + '">' + d.cal + '</td></tr>');
        tP += d.protein; tC += d.carb; tF += d.fats; tCal += d.cal;
    });
    H.push('<tr><td style="' + TDL + '"><b>Total</b></td><td style="' + TDR + '"><b>' + rd(tP) +
        '</b></td><td style="' + TDR + '"><b>' + rd(tC) + '</b></td><td style="' + TDR + '"><b>' + rd(tF) +
        '</b></td><td style="' + TDR + '"><b>' + rd(tCal) + '</b></td></tr></table>');

    // uma tabela por período
    PERIODOS.forEach(function(p){
        var d = res[p]; var comNotas = temNotas(notasPlano[p]);
        if (!d.itens.length && !comNotas){ return; }

        H.push('<h2 style="margin:14px 0 4px;">' + escHtml(p) + '</h2>');
        if (d.itens.length){
            H.push('<table style="' + TBL + '"><tr>' +
                '<th style="' + THL + '">Alimento</th><th style="' + THR + '">Qtd</th>' +
                '<th style="' + THR + '">Prot</th><th style="' + THR + '">Carb</th>' +
                '<th style="' + THR + '">Gord</th><th style="' + THR + '">Cal</th></tr>');
            d.itens.forEach(function(it){
                var obs = stripHtml(it.detalhes || "");
                var cel = escHtml(it.nome);
                if (obs && obs !== "Sem detalhes."){
                    cel += '<br><span style="font-size:12px;color:#555;font-style:italic;">' + escHtml(obs) + '</span>';
                }
                if (it.semQtd){
                    var qL = escHtml(String(it.qtd || "").trim());
                    H.push('<tr><td style="' + TDL + '">' + cel + '</td><td style="' + TDR + '">' + qL +
                        '</td><td style="' + TDR + '"></td><td style="' + TDR + '"></td><td style="' + TDR + '"></td><td style="' + TDR + '"></td></tr>');
                } else {
                    var q = escHtml((it.qtd || "") + " " + (it.unidade || ""));
                    H.push('<tr><td style="' + TDL + '">' + cel + '</td><td style="' + TDR + '">' + q +
                        '</td><td style="' + TDR + '">' + it.protein + '</td><td style="' + TDR + '">' + it.carb +
                        '</td><td style="' + TDR + '">' + it.fats + '</td><td style="' + TDR + '">' + it.cal + '</td></tr>');
                }
            });
            H.push('<tr><td style="' + TDL + '"><b>Subtotal</b></td><td style="' + TDR + '"></td>' +
                '<td style="' + TDR + '"><b>' + d.protein + '</b></td><td style="' + TDR + '"><b>' + d.carb +
                '</b></td><td style="' + TDR + '"><b>' + d.fats + '</b></td><td style="' + TDR + '"><b>' + d.cal + '</b></td></tr></table>');
        }
        if (comNotas){
            notasPlano[p].forEach(function(t){ if (String(t).trim()){ H.push('<p style="margin:4px 0;">' + escHtml(t) + '</p>'); } });
        }
    });

    H.push('</body></html>');
    baixarArquivo(H.join("\n"), slugArquivo(nome) + ".html", "text/html;charset=utf-8");
}

// Monta um CSV (separador ";", decimal com vírgula, com BOM) para abrir no
// Excel: uma linha por alimento, subtotal por período e o total do dia.
function exportarCSV(){
    var nome = document.getElementById("nome").textContent.trim() || "plano";
    lerNotasVivas();
    var res = calcPorPeriodo();

    var linhas = [];
    linhas.push(["Período", "Alimento", "Quantidade", "Unidade", "Proteína (g)", "Carboidrato (g)", "Gordura (g)", "Calorias"]);

    var tP = 0, tC = 0, tF = 0, tCal = 0;
    PERIODOS.forEach(function(p){
        var d = res[p]; if (!d.itens.length){ return; }
        d.itens.forEach(function(it){
            if (it.semQtd){
                linhas.push([p, it.nome, String(it.qtd || ""), "", "", "", "", ""]);
            } else {
                linhas.push([p, it.nome, numBR(it.qtd), it.unidade || "",
                             numBR(it.protein), numBR(it.carb), numBR(it.fats), numBR(it.cal)]);
            }
        });
        linhas.push(["", "Subtotal " + p, "", "", numBR(d.protein), numBR(d.carb), numBR(d.fats), numBR(d.cal)]);
        tP += d.protein; tC += d.carb; tF += d.fats; tCal += d.cal;
    });
    linhas.push(["", "Total do dia", "", "", numBR(rd(tP)), numBR(rd(tC)), numBR(rd(tF)), numBR(rd(tCal))]);

    var csv = linhas.map(function(r){ return r.map(csvCampo).join(";"); }).join("\r\n");
    baixarArquivo(String.fromCharCode(0xFEFF) + csv, slugArquivo(nome) + ".csv", "text/csv;charset=utf-8");
}

//====================================================================
// Notas do plano: notas gerais + uma por período. Cada nota é uma LISTA
// de parágrafos (strings). No LaTeX, cada parágrafo vira um parágrafo.
//====================================================================

var notasPlano = { geral: [], "Manhã": [], "Almoço": [], "Tarde": [], "Noite": [] };

// grupos na ordem em que aparecem no modal
var NOTAS_GRUPOS = [
    { chave: "geral",  rotulo: "Notas gerais" },
    { chave: "Manhã",  rotulo: "Manhã" },
    { chave: "Almoço", rotulo: "Almoço" },
    { chave: "Tarde",  rotulo: "Tarde" },
    { chave: "Noite",  rotulo: "Noite" }
];

// Normaliza um objeto de notas vindo de fora (sessão) para o formato certo.
function normalizarNotas(obj){
    var out = { geral: [], "Manhã": [], "Almoço": [], "Tarde": [], "Noite": [] };
    if (obj && typeof obj === "object"){
        NOTAS_GRUPOS.forEach(function(g){
            var v = obj[g.chave];
            if (Array.isArray(v)){
                out[g.chave] = v.map(function(s){ return String(s); }).filter(function(s){ return s.trim() !== ""; });
            } else if (typeof v === "string" && v.trim()){
                out[g.chave] = [v];
            }
        });
    }
    return out;
}

// Lê os textareas do modal para dentro de notasPlano (fonte de verdade).
function coletarNotas(){
    NOTAS_GRUPOS.forEach(function(g){
        var cont = document.getElementById("notas-grupo-" + g.chave);
        if (!cont){ return; }   // modal ainda não renderizado
        var areas = cont.querySelectorAll("textarea");
        var lista = [];
        for (var i = 0; i < areas.length; i++){
            var t = areas[i].value.trim();
            if (t){ lista.push(t); }
        }
        notasPlano[g.chave] = lista;
    });
}

// Só coleta se o modal estiver aberto/renderizado (usado antes de LaTeX/salvar).
function lerNotasVivas(){
    if (document.querySelector('[id^="notas-grupo-"]')){ coletarNotas(); }
}

function paragrafoNota(chave, texto){
    var wrap = document.createElement("div");
    wrap.className = "nota-paragrafo";

    var ta = document.createElement("textarea");
    ta.className = "nota-area";
    ta.rows = 2;
    ta.value = texto || "";
    ta.placeholder = "escreva um parágrafo…";
    ta.oninput = coletarNotas;

    var x = document.createElement("button");
    x.type = "button";
    x.className = "nota-remover";
    x.textContent = "×";
    x.title = "remover este parágrafo";
    x.onclick = function(){ wrap.parentNode.removeChild(wrap); coletarNotas(); };

    wrap.appendChild(ta);
    wrap.appendChild(x);
    return wrap;
}

// soChave (opcional): renderiza só aquele grupo (ex.: "geral" ou "Manhã").
function renderNotas(soChave){
    var body = document.getElementById("notasBody");
    if (!body){ return; }
    body.innerHTML = "";

    var grupos = soChave ? NOTAS_GRUPOS.filter(function(g){ return g.chave === soChave; }) : NOTAS_GRUPOS;

    grupos.forEach(function(g){
        var bloco = document.createElement("div");
        bloco.className = "notas-bloco";

        var h = document.createElement("div");
        h.className = "notas-titulo";
        h.textContent = g.rotulo;
        bloco.appendChild(h);

        var cont = document.createElement("div");
        cont.id = "notas-grupo-" + g.chave;
        cont.className = "notas-grupo";

        var lista = notasPlano[g.chave] || [];
        if (lista.length === 0){ lista = [""]; }   // sempre pelo menos um campo
        lista.forEach(function(txt){ cont.appendChild(paragrafoNota(g.chave, txt)); });
        bloco.appendChild(cont);

        var add = document.createElement("button");
        add.type = "button";
        add.className = "nota-add";
        add.textContent = "+ parágrafo";
        add.onclick = function(){
            var novo = paragrafoNota(g.chave, "");
            cont.appendChild(novo);
            novo.querySelector("textarea").focus();
        };
        bloco.appendChild(add);

        body.appendChild(bloco);
    });
}

function definirTituloNotas(t){
    var el = document.getElementById("notasTitulo");
    if (el){ el.textContent = t; }
}

// botão "Notas gerais" do topo — só o grupo geral
function abrirNotasGerais(){
    definirTituloNotas("Notas gerais");
    renderNotas("geral");
    document.getElementById("notasModal").style.display = "block";
}

// botão 📝 no cabeçalho de um período — só as notas daquele período
function abrirNotasPeriodo(p){
    definirTituloNotas("Notas — " + p);
    renderNotas(p);
    document.getElementById("notasModal").style.display = "block";
}

function fecharNotas(){
    coletarNotas();
    document.getElementById("notasModal").style.display = "none";
    renderBreakdown();   // atualiza o destaque do botão 📝 dos períodos
}

window.addEventListener('click', function(event){
    if (event.target === document.getElementById('notasModal')){ fecharNotas(); }
});

//====================================================================
// Seletor de alimentos em colunas (estilo Finder / Miller columns)
//
// O <select id="foods-N"> continua sendo a fonte de verdade do valor
// (salvar sessao, renumerar linhas etc.). Este seletor e so uma forma
// mais rapida de navegar: ao escolher um alimento, escrevemos o valor
// no <select> e chamamos aplicaAlimento(), a mesma rotina do dropdown.
//====================================================================

var pickerRow     = null;   // linha que abriu o seletor
var pickerRetorno = null;   // se definido, o alimento escolhido vai para cá (e não para uma linha)
var pickerPath    = [];     // pastas escolhidas, uma por coluna
var pickerPreview = null;   // alimento (folha) em pré-visualização

// "Atalhos da sessão": coleção de alimentos que o usuário junta de qualquer
// base enquanto monta o plano, para reaproveitar rápido (trocar, testar) sem
// procurar de novo. É salva junto com a sessão (estado).
var foodsSessao = [];

function estaNosAtalhos(item){
    return !!(item && foodsSessao.some(function(f){ return f.nome === item.nome; }));
}

function guardarAtalho(item){
    if (!item || estaNosAtalhos(item)){ return; }
    var copia = {
        nome: item.nome, categoria: item.categoria || "", unidade: item.unidade,
        cal: item.cal, protein: item.protein, carb: item.carb, fats: item.fats,
        detalhes: item.detalhes || ""
    };
    if (Array.isArray(item.unidades)){ copia.unidades = JSON.parse(JSON.stringify(item.unidades)); }
    foodsSessao.push(copia);
}

function removerAtalho(item){
    if (!item){ return; }
    foodsSessao = foodsSessao.filter(function(f){ return f.nome !== item.nome; });
}

// Redesenha a pré-visualização (colunas ou painel do OFF) após guardar/remover.
function refrescarAtalhoUI(item){
    var off = document.getElementById("pickerOFF");
    if (off && off.style.display === "block"){
        var pane = document.getElementById("offPreview");
        if (pane){ pane.innerHTML = ""; pane.appendChild(colunaPreview(item)); }
    } else {
        renderPickerColunas();
    }
}

//Escreve o nome do alimento no "chip" visivel. O <select> escondido
//continua guardando o valor; isto e so a etiqueta que o usuario ve.
function atualizarNomeAlimento(row, nome){
    var chip = document.getElementById("chip-" + row);
    if (chip){ chip.textContent = nome || "Escolher alimento…"; }
}

function abrirPicker(rowID){
    pickerRow = parseInt(String(rowID).replace("-",""), 10);
    var busca = document.getElementById("pickerBusca");
    busca.value = "";
    document.getElementById("pickerResultados").style.display = "none";
    document.getElementById("pickerOFF").style.display = "none";
    document.getElementById("pickerColunas").style.display = "flex";
    pickerPath = [];
    pickerPreview = null;
    renderPickerColunas();
    document.getElementById("pickerModal").style.display = "block";
    busca.focus();
}

// Abre o seletor SEM linha de destino: o alimento escolhido vai para o callback.
// É assim que o pool de substitutos reaproveita o mesmo navegador de alimentos.
function abrirPickerPara(cb){
    pickerRetorno = cb;
    pickerRow = null;
    var busca = document.getElementById("pickerBusca");
    busca.value = "";
    document.getElementById("pickerResultados").style.display = "none";
    document.getElementById("pickerOFF").style.display = "none";
    document.getElementById("pickerColunas").style.display = "flex";
    pickerPath = [];
    pickerPreview = null;
    renderPickerColunas();
    document.getElementById("pickerModal").style.display = "block";
    busca.focus();
}

function fecharPicker(){
    document.getElementById("pickerModal").style.display = "none";
    pickerRow = null;
    pickerRetorno = null;
}

//Filhos de uma "pasta". entry === null significa a raiz.
function pickerFilhos(entry){

    if (!entry){
        var raiz = [
            {tipo:"grupo", rotulo:"★ Atalhos da sessão (" + foodsSessao.length + ")", fonte:"sessao"},
            {tipo:"grupo", rotulo:"Minha base",  fonte:"base"},
            {tipo:"grupo", rotulo:"Tabela TACO", fonte:"taco"},
            {tipo:"acao",  rotulo:"Supermercado Brasil (Open Food Facts)", fonte:"off", regiao:"br"},
            {tipo:"acao",  rotulo:"Supermercado Reino Unido (Open Food Facts)", fonte:"off", regiao:"uk"}
        ];
        // "item livre" e "receita" agem sobre uma LINHA do plano: não fazem
        // sentido quando o seletor foi aberto para escolher um substituto
        if (!pickerRetorno){
            raiz.push({tipo:"acao", rotulo:"Item livre / sem quantidade…", fonte:"livre"});
            raiz.push({tipo:"acao", rotulo:"Carregar receita (arquivo)…", fonte:"receita"});
        }
        return raiz;
    }

    if (entry.fonte === "sessao"){
        return foodsSessao.map(function(f){ return {tipo:"folha", rotulo:f.nome, item:f}; });
    }

    if (entry.fonte === "base"){
        return categoriasPessoais().map(function(cat){
            return {tipo:"grupo", rotulo:cat + " (" + alimentosDaCategoria(cat).length + ")",
                    fonte:"base-cat", cat:cat};
        });
    }

    if (entry.fonte === "base-cat"){
        return alimentosDaCategoria(entry.cat).map(function(f){
            return {tipo:"folha", rotulo:f.nome, item:f};
        });
    }

    if (entry.fonte === "taco"){
        return Object.keys(TACO_ARQUIVOS)
            .sort(function(a,b){ return a.localeCompare(b, "pt-BR"); })
            .map(function(g){
                return {tipo:"grupo", rotulo:g, fonte:"taco-grupo", grupo:g};
            });
    }

    if (entry.fonte === "taco-grupo"){
        return (tacoGrupos[entry.grupo] || [])
            .slice()
            .sort(function(a,b){ return String(a.nome).localeCompare(String(b.nome), "pt-BR"); })
            .map(function(f){ return {tipo:"folha", rotulo:f.nome, item:f}; });
    }

    return [];
}

function mesmaEntrada(a, b){
    return a && b && a.fonte === b.fonte && a.cat === b.cat &&
           a.grupo === b.grupo && a.rotulo === b.rotulo;
}

function renderPickerColunas(){

    var wrap = document.getElementById("pickerColunas");
    wrap.innerHTML = "";

    for (var nivel = 0; nivel <= pickerPath.length; nivel++){
        var pai    = (nivel === 0) ? null : pickerPath[nivel - 1];
        var filhos = pickerFilhos(pai);
        var sel    = pickerPath[nivel];   // pasta aberta nesta coluna, se houver
        wrap.appendChild(colunaEl(filhos, nivel, sel));
    }

    //coluna extra: os "food facts" do alimento em foco, antes de selecionar
    if (pickerPreview){
        wrap.appendChild(colunaPreview(pickerPreview));
    }

    //mostra sempre a coluna mais profunda
    wrap.scrollLeft = wrap.scrollWidth;
}

// Mostra os valores nutricionais do alimento em foco. Para alimentos em
// gramas, exibe por 100 g (mais legível que "por 1 grama"); para os demais,
// por unidade (ovo, fatia...).
function colunaPreview(item){

    var col = document.createElement("div");
    col.className = "picker-col picker-preview";

    var emGramas = /^gram/i.test(item.unidade || "") || item.unidade === "g";
    var fator    = emGramas ? 100 : 1;
    var rotuloQtd = emGramas ? "por 100 g" : "por " + item.unidade;

    var h = document.createElement("div");
    h.className = "preview-nome";
    h.textContent = item.nome;
    col.appendChild(h);

    var facts = [
        ["Calorias",    arred1(parseNum(item.cal)     * fator) + " cal"],
        ["Proteína",    arred1(parseNum(item.protein) * fator) + " g"],
        ["Carboidrato", arred1(parseNum(item.carb)    * fator) + " g"],
        ["Gordura",     arred1(parseNum(item.fats)    * fator) + " g"]
    ];
    facts.forEach(function(f){
        var r = document.createElement("div"); r.className = "preview-linha";
        var k = document.createElement("span"); k.className = "preview-rot"; k.textContent = f[0];
        var v = document.createElement("span"); v.className = "preview-val"; v.textContent = f[1];
        r.appendChild(k); r.appendChild(v);
        col.appendChild(r);
    });

    var nota = document.createElement("div");
    nota.className = "preview-nota";
    nota.textContent = rotuloQtd;
    col.appendChild(nota);

    //unidades extras (equivalência), quando o alimento tiver
    if (Array.isArray(item.unidades) && item.unidades.length){
        var u = document.createElement("div");
        u.className = "preview-nota";
        u.textContent = "outras unidades: " + item.unidades.map(function(x){
            return x.unidade + " (= " + x.equivale + " " + item.unidade + ")";
        }).join(", ");
        col.appendChild(u);
    }

    var det = stripHtml(item.detalhes || "");
    if (det && det !== "Sem detalhes."){
        var d = document.createElement("div");
        d.className = "preview-det";
        d.textContent = det;
        col.appendChild(d);
    }

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "preview-btn";
    btn.textContent = "Selecionar este alimento";
    btn.onclick = function(){ escolherAlimentoDoPicker(item); };
    col.appendChild(btn);

    // guardar / remover dos "Atalhos da sessão"
    var atalho = document.createElement("button");
    atalho.type = "button";
    atalho.className = "preview-atalho" + (estaNosAtalhos(item) ? " tem" : "");
    atalho.textContent = estaNosAtalhos(item) ? "✕ Remover dos atalhos" : "★ Guardar como atalho";
    atalho.onclick = function(){
        if (estaNosAtalhos(item)){ removerAtalho(item); } else { guardarAtalho(item); }
        refrescarAtalhoUI(item);
    };
    col.appendChild(atalho);

    return col;
}

function arred1(x){ return Math.round(Number(x) * 10) / 10; }

function colunaEl(filhos, nivel, selecionado){

    var col = document.createElement("div");
    col.className = "picker-col";

    filhos.forEach(function(entry){

        var it = document.createElement("div");
        it.className = "picker-item" + (entry.tipo === "grupo" ? " picker-folder" : "");
        if (selecionado && mesmaEntrada(entry, selecionado)){ it.className += " sel"; }
        //destaca a folha que está em pré-visualização
        if (entry.tipo === "folha" && entry.item === pickerPreview){ it.className += " sel"; }

        var rot = document.createElement("span");
        rot.textContent = entry.rotulo;
        it.appendChild(rot);

        if (entry.tipo === "grupo"){
            var seta = document.createElement("span");
            seta.className = "picker-seta";
            seta.innerHTML = "&#8250;";   // ›
            it.appendChild(seta);
        }

        it.onclick = function(){
            if (entry.tipo === "grupo"){
                pickerPreview = null;               // trocou de pasta: some o preview
                pickerPath = pickerPath.slice(0, nivel);
                pickerPath.push(entry);
                renderPickerColunas();
            } else if (entry.tipo === "acao" && entry.fonte === "off"){
                abrirBuscaOFF(entry.regiao);
            } else if (entry.tipo === "acao" && entry.fonte === "livre"){
                criarItemLivre(pickerRow);
            } else if (entry.tipo === "acao" && entry.fonte === "receita"){
                abrirReceitaArquivo(pickerRow);
            } else {
                //folha: mostra os food facts numa coluna; selecionar é 1 clique a mais
                pickerPreview = entry.item;
                renderPickerColunas();
            }
        };
        //duplo-clique numa folha seleciona direto (atalho)
        if (entry.tipo === "folha"){
            it.ondblclick = function(){ escolherAlimentoDoPicker(entry.item); };
        }

        col.appendChild(it);
    });

    return col;
}

//Lista achatada de tudo, para a busca por texto.
function todosAlimentos(){

    var out = [];
    foods.forEach(function(f){
        out.push({item:f, origem: (f.categoria || "Outros")});
    });
    Object.keys(tacoGrupos).forEach(function(g){
        (tacoGrupos[g] || []).forEach(function(f){
            out.push({item:f, origem:"TACO · " + g});
        });
    });
    return out;
}

function buscarNoPicker(){

    var termo = document.getElementById("pickerBusca").value.trim().toLowerCase();
    var cols  = document.getElementById("pickerColunas");
    var res   = document.getElementById("pickerResultados");

    //a busca do topo age sobre as bases locais; sair dela volta para as colunas
    document.getElementById("pickerOFF").style.display = "none";

    if (termo.length < 2){
        cols.style.display = "flex";
        res.style.display  = "none";
        return;
    }

    cols.style.display = "none";
    res.style.display  = "block";
    res.innerHTML = "";

    var achados = todosAlimentos().filter(function(x){
        return String(x.item.nome).toLowerCase().indexOf(termo) !== -1;
    }).slice(0, 100);

    if (achados.length === 0){
        var vazio = document.createElement("div");
        vazio.className = "picker-vazio";
        vazio.textContent = "Nenhum alimento encontrado.";
        res.appendChild(vazio);
        return;
    }

    achados.forEach(function(x){
        var it = document.createElement("div");
        it.className = "picker-item";

        var nome = document.createElement("span");
        nome.textContent = x.item.nome;

        var org = document.createElement("span");
        org.className = "picker-origem";
        org.textContent = x.origem;

        it.appendChild(nome);
        it.appendChild(org);
        it.onclick = function(){ escolherAlimentoDoPicker(x.item); };
        res.appendChild(it);
    });
}

//--- Supermercado UK (Open Food Facts) -----------------------------------
//As funcoes de rede vivem em off-adapter.js (buscarOpenFoodFacts,
//offParaAlimento). Aqui e so a interface dentro do seletor.

var offRegiao = "uk";   // região atual da busca no Open Food Facts

function abrirBuscaOFF(regiao){
    offRegiao = regiao || "uk";
    var info = (typeof OFF_REGIOES !== "undefined") ? OFF_REGIOES[offRegiao] : null;
    var rotulo = info ? info.rotulo : "";
    var exemplos = (offRegiao === "br") ? "requeijão, arroz, iogurte" : "chicken breast, hummus, oat milk";

    document.getElementById("pickerColunas").style.display    = "none";
    document.getElementById("pickerResultados").style.display = "none";
    document.getElementById("pickerOFF").style.display        = "block";

    var busca = document.getElementById("offBusca");
    busca.value = "";
    busca.placeholder = "Produto no supermercado (" + rotulo + ")… ex.: " + exemplos;
    document.getElementById("offResultados").innerHTML = "";
    document.getElementById("offStatus").textContent =
        "Fonte: Open Food Facts — produtos de supermercados (" + rotulo + "). Valores por 100 g convertidos automaticamente.";
    limparPreviewOFF();
    busca.focus();
}

//pré-visualização dos food facts (lado direito do painel do OFF)
function limparPreviewOFF(){
    var pane = document.getElementById("offPreview");
    if (pane){ pane.innerHTML = '<div class="picker-off-vazio">Clique num produto para ver os valores nutricionais.</div>'; }
}

function mostrarPreviewOFF(a, el){
    var itens = document.querySelectorAll("#offResultados .picker-item");
    for (var i = 0; i < itens.length; i++){ itens[i].classList.remove("sel"); }
    if (el){ el.classList.add("sel"); }

    var pane = document.getElementById("offPreview");
    pane.innerHTML = "";
    pane.appendChild(colunaPreview(a));
}

function voltarDoOFF(){
    document.getElementById("pickerOFF").style.display      = "none";
    document.getElementById("pickerColunas").style.display  = "flex";
}

function executarBuscaOFF(){

    var termo  = document.getElementById("offBusca").value.trim();
    var status = document.getElementById("offStatus");
    var lista  = document.getElementById("offResultados");
    var botao  = document.getElementById("offBtn");

    if (termo.length < 2){ status.textContent = "Digite ao menos 2 letras."; return; }

    lista.innerHTML = "";
    limparPreviewOFF();
    status.textContent = "Buscando no Open Food Facts…";
    botao.disabled = true;

    buscarOpenFoodFacts(termo, offRegiao)
        .then(function(alimentos){
            botao.disabled = false;

            if (alimentos.length === 0){
                status.textContent = "Nenhum produto com dados completos de macros. Tente outro termo.";
                return;
            }

            status.textContent = alimentos.length + " produto(s) — clique para ver os valores; duplo-clique (ou “Selecionar”) para usar.";

            alimentos.forEach(function(a){
                var it = document.createElement("div");
                it.className = "picker-item";

                var nome = document.createElement("span");
                nome.textContent = a.nome;

                var lado = document.createElement("span");
                lado.className = "off-lado";

                var org = document.createElement("span");
                org.className = "picker-origem";
                org.textContent = Math.round(a.cal * 100) + " kcal/100g";

                var salvar = document.createElement("button");
                salvar.type = "button";
                salvar.className = "off-salvar";
                salvar.textContent = "+ base";
                salvar.title = "Baixar para salvar na minha base pessoal";
                salvar.onclick = function(ev){ ev.stopPropagation(); salvarAlimentoNaBase(a); };

                lado.appendChild(org);
                lado.appendChild(salvar);

                it.appendChild(nome);
                it.appendChild(lado);
                //um clique mostra os food facts; duplo-clique seleciona direto
                it.onclick = function(){ mostrarPreviewOFF(a, it); };
                it.ondblclick = function(){ escolherAlimentoDoPicker(a); };
                lista.appendChild(it);
            });
        })
        .catch(function(err){
            botao.disabled = false;
            status.textContent = "O Open Food Facts está instável ou fora do ar agora (é do serviço, não do seu app). " +
                                 "Clique em Buscar de novo, ou tente daqui a alguns minutos.";
            console.error("Open Food Facts:", err);
        });
}

//Baixa um alimento (do Open Food Facts, ou qualquer objeto no formato do
//app) como um .json para ser adicionado a base pessoal. O app e estatico e
//nao pode escrever no repositorio; entao a ponte e a mesma das sessoes:
//baixa o arquivo e o gerenciador (base-add) o grava no foods.json e publica.
function salvarAlimentoNaBase(a){

    var limpo = {
        nome:     a.nome,
        categoria:a.categoria,
        unidade:  a.unidade,
        cal:      arred4(a.cal),
        protein:  arred4(a.protein),
        carb:     arred4(a.carb),
        fats:     arred4(a.fats),
        detalhes: a.detalhes || ""
    };

    var arq = "alimento-" + slugArquivo(a.nome) + ".json";
    baixarArquivo(JSON.stringify(limpo, null, 2), arq, 'application/json');

    var status = document.getElementById("offStatus");
    if (status){
        status.textContent = "Baixado " + arq +
            " (pasta Downloads). No gerenciador digite  base-add  e arraste o arquivo para publicá-lo na sua base.";
    }
}

function arred4(x){ return Math.round(Number(x) * 10000) / 10000; }

function slugArquivo(nome){
    var s = String(nome).trim().replace(/[^\p{L}\p{N} _-]/gu, "").replace(/\s+/g, "-");
    return s || "alimento";
}

//--- Item livre / sem quantidade ------------------------------------------
// Uma linha "livre" é um item que não entra na conta de macros: chá, água,
// "temperos a gosto", uma lista de ingredientes... O nome é texto livre e a
// quantidade também (opcional: "1 xícara", "a gosto"), sem unidade nem macros.

function criarItemLivre(row){
    if (row === null){ return; }
    var texto = prompt("Item sem quantidade (ex.: Chá de gengibre; Temperos: sal, alho a gosto):", "");
    if (texto === null){ return; }
    texto = String(texto).trim();
    if (!texto){ return; }
    definirLinhaLivre(row, texto);
    fecharPicker();
}

function definirLinhaLivre(row, texto){
    document.getElementById("file-"+row).style.display = "none";
    document.getElementById("col-qtd-"+row).style.display = "block";

    data[row].nome = texto;
    data[row].semQtd = true;
    data[row]._base = null;
    data[row].unidade = "";
    data[row].detalhes = "";
    data[row].qtd = "";
    data[row].cal = 0; data[row].protein = 0; data[row].carb = 0; data[row].fats = 0;

    atualizarNomeAlimento(row, texto);
    document.getElementById('qtd-'+row).value = "";
    document.getElementById('uni-'+row).textContent = "";
    document.getElementById('detalhes-'+row).textContent = "";
    document.getElementById('qtd-protein-'+row).textContent = "";
    document.getElementById('qtd-carb-'+row).textContent = "";
    document.getElementById('qtd-fat-'+row).textContent = "";
    document.getElementById('qtd-cal-'+row).textContent = "";

    aplicarModoLivre(row);
    sumFacts();
}

// Liga/desliga o visual "livre" da linha conforme data[row].semQtd.
function aplicarModoLivre(row){
    var linha = document.getElementById('form-row-'+row);
    if (!linha){ return; }
    var q = document.getElementById('qtd-'+row);
    if (data[row] && data[row].semQtd){
        linha.classList.add('linha-livre');
        if (q){ q.placeholder = "à vontade / qtd livre"; }
    } else {
        linha.classList.remove('linha-livre');
        if (q){ q.placeholder = ""; }
    }
}

//Revela o campo "Abrir Receita" daquela linha (mesma acao que a antiga
//opcao "Receita" do dropdown) e fecha o seletor.
function abrirReceitaArquivo(row){
    if (row === null){ return; }
    document.getElementById("file-" + row).style.display = "block";
    document.getElementById("col-qtd-" + row).style.display = "none";
    fecharPicker();
}

function escolherAlimentoDoPicker(item){

    // modo "entrega ao callback" (pool de substitutos): não há linha para aplicar
    if (pickerRetorno){
        var cb = pickerRetorno;
        pickerRetorno = null;
        cb(item);
        fecharPicker();
        return;
    }

    if (pickerRow === null){ return; }

    var row    = pickerRow;
    var select = document.getElementById("foods-" + row);

    //garante que o nome exista como <option> e fique selecionado,
    //para que salvar a sessao (que le select.value) veja o nome certo
    var existe = false;
    for (var i = 0; i < select.options.length; i++){
        if (select.options[i].value === item.nome){ existe = true; break; }
    }
    if (!existe){
        var o = document.createElement("option");
        o.value = item.nome;
        o.text  = item.nome;
        select.appendChild(o);
    }
    select.value   = item.nome;
    select._lista  = [item];

    aplicaAlimento(row, item.nome, item);
    fecharPicker();
}

window.addEventListener('click', function(event){
    if (event.target === document.getElementById('pickerModal')){ fecharPicker(); }
});

//------------------------------------

function printRel(){

outPage = buildPrintHead();
outPage = outPage +  buildPeriodo("MANHÃ");
    
var iRow = 0;
    
for (iRow=0; iRow<data.length; iRow++){

    if (data[iRow].refeicao == "Manhã"){
    outPage = outPage + buildItem(data[iRow]) 
    };
};
    
outPage = outPage +  buildPeriodo("ALMOÇO");
    
for (iRow=0; iRow<data.length; iRow++){

    if (data[iRow].refeicao == "Almoço"){
    outPage = outPage + buildItem(data[iRow])
    };
};
    
outPage = outPage +  buildPeriodo("TARDE");
    
for (iRow=0; iRow<data.length; iRow++){

    if (data[iRow].refeicao == "Tarde"){
    outPage = outPage + buildItem(data[iRow])
    };
};
    
outPage = outPage +  buildPeriodo("NOITE");
    
for (iRow=0; iRow<data.length; iRow++){

    if (data[iRow].refeicao == "Noite"){
    outPage = outPage + buildItem(data[iRow])
    };
};
  
    
    
go();      

}
    
function go(){

// Passa o relatorio por sessionStorage em vez de escrever numa variavel
// da janela nova. A versao antiga dependia de newwin.onload disparar
// depois do window.open, o que corria com o carregamento da pagina e
// falhava de forma intermitente ("first is not defined").
try {
    sessionStorage.setItem("relatorio", outPage);
} catch(e){
    alert("Nao foi possivel preparar o relatorio: " + e.message);
    return;
}

var newwin = window.open("relatorio.html");

if (!newwin){
    alert("O navegador bloqueou a janela do relatorio. Libere pop-ups para este site.");
}
}

function buildPrintHead(){
    
    var pessoa = document.getElementById("nome").innerHTML;
    var dia = document.getElementById("dia").innerHTML;
    
    var str = '<table><tr><td style="width: 50px;">NOME:</td><td colspan="2">' + pessoa + '</td></tr><tr style="margin-bottom: 10px;"><td style="width: 50px;">DIA:</td><td colspan="2">' + dia + '</td></tr><tr><td colspan="3">PROTEÍNA ' + sum.protein + 'g | CARBOIDRATO ' + sum.carb + 'g | GORDURA ' + sum.fats + 'g | CALORIAS ' + sum.cal + 'cal</tr></table>'
    
    return str;
    
}
    
function buildPeriodo(periodo){
    var str = '<table><tr style="margin-bottom: 10px;"><td colspan="3" style="text-align:center;">' + periodo + '</td> </tr></table>'

    return str;
}

function buildItem(d){

    var alimento = d.nome;
    var descricao = d.detalhes;

    // item livre: mostra o nome e a quantidade em texto, sem os macros
    if (d.semQtd){
        var q = String(d.qtd || "").trim();
        var linhaQtd = q ? (' <em>(' + q + ')</em>') : ' <em>(à vontade)</em>';
        return '<table><tr><td style="width: 20%;">' + alimento + linhaQtd +
               '</td><td style="width: 60%">' + descricao +
               '</td><td style="width: 20%">—</td></tr></table>';
    }

    var str = '<table><tr><td  style="text-align:center width: 20%;">' + alimento + '</td><td style="width: 60%">' + descricao + '</td><td style="width: 20%"><ul><li>Proteína: ' + d.protein + 'g</li><li>Carbs: ' + d.carb + 'g</li><li>Fats: ' + d.fats + 'g</li><li>Calorias: ' + d.cal + '</li></ul></td</tr></table>'

    return str;
}
//----------------------------
    
//As bases agora vem de arquivos JSON, entao a tela so pode ser montada
//depois que o carregamento terminar.
carregarDados()
    .then(initializePop)
    .catch(function(erro){
        console.error(erro);
        document.getElementById('plano').innerHTML =
            '<p style="color:var(--cor8);">Não foi possível carregar a base de alimentos (foods.json): '
            + erro.message + '</p>';
    });