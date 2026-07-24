//----------------------------------------------------------//
var data = [];    
var sum = {};
var outPage = "";
var rowTemplate = "";   //molde de uma linha vazia, capturado em initializePop()
    
function uptadeRefeicao(rowID){
var row = parseInt(rowID.replace("-",""));

    data[row].refeicao = document.getElementById('refeicao-'+row).value;
    pintaRefeicao(row);
    renderBreakdown();   //o item mudou de periodo: atualiza o resumo por periodo
}

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

        //mostra o nome escolhido no "chip" que substituiu o dropdown
        atualizarNomeAlimento(row, rowFood);

        if(item == null){
            //zera os macros para nao somar numeros antigos de outro alimento
            console.warn('Alimento nao encontrado na base: "' + rowFood + '"');
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
            sumFacts();
            return;
        }

        //atualiza a unidade
        document.getElementById('uni-'+row).textContent = item.unidade;
        data[row].unidade = item.unidade;

        //atualiza os detalhes
        document.getElementById('detalhes-'+row).innerHTML = item.detalhes;
        data[row].detalhes = item.detalhes;

        //atualiza a quantidade
        data[row].qtd = document.getElementById('qtd-'+row).value;
        var q = parseNum(data[row].qtd);

        //atualiza a quantidade de proteínas
        data[row].protein = rd(q*parseNum(item.protein));
        document.getElementById('qtd-protein-'+row).textContent = data[row].protein;

        //atualiza a quantidade de carboidratos
        data[row].carb = rd(q*parseNum(item.carb));
        document.getElementById('qtd-carb-'+row).textContent = data[row].carb;

        //atualiza a quantidade de gorduras
        data[row].fats = rd(q*parseNum(item.fats));
        document.getElementById('qtd-fat-'+row).textContent = data[row].fats;

        //atualiza a quantidade de calorias
        data[row].cal = rd(q*parseNum(item.cal));
        document.getElementById('qtd-cal-'+row).textContent = data[row].cal;

        sumFacts();
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
function renderBreakdown(){

    var body = document.getElementById('periodos-body');
    if (!body){ return; }

    var res = calcPorPeriodo();
    body.innerHTML = "";

    PERIODOS.forEach(function(p){
        var d = res[p];
        if (d.itens.length === 0){ return; }

        var tr = document.createElement("tr");
        tr.innerHTML =
            '<td class="periodo-nome">' + p + '</td>' +
            '<td>' + d.protein + ' <span>g</span></td>' +
            '<td>' + d.carb    + ' <span>g</span></td>' +
            '<td>' + d.fats    + ' <span>g</span></td>' +
            '<td>' + d.cal     + ' <span>cal</span></td>';
        body.appendChild(tr);
    });
}
    
function addRow(rowID){

   var row = parseInt(rowID.replace("-",""));
   inserirLinha(row+1);
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
    var nodes = el.querySelectorAll("[id], [for], [onchange], [onclick]");

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

function inserirLinha(pos){

    var total = listRows().length;
    if(pos > total){ pos = total; }

    //renumera de tras para frente, senao os ids colidem no meio do caminho
    for (var i = total-1; i >= pos; i--){
        renumeraLinha(document.getElementById('form-row-'+i), i, i+1);
    }

    var nova = document.createElement("div");
    nova.className = "form-row";
    nova.innerHTML = rowTemplate;
    renumeraLinha(nova, 0, pos);

    if (pos >= total){
        document.getElementById('row-container').appendChild(nova);
    } else {
        //a linha que estava em pos agora se chama pos+1
        document.getElementById('row-container').insertBefore(nova, document.getElementById('form-row-'+(pos+1)));
    }

    data.splice(pos, 0, novaLinha());
    popFoods(pos);
    popNewLine(pos);
    sumFacts();
}

function removerLinha(pos){

    var total = listRows().length;

    //sempre manter pelo menos uma linha
    if (total <= 1){ return; }

    var el = document.getElementById('form-row-'+pos);
    el.parentNode.removeChild(el);
    data.splice(pos, 1);

    //renumera de frente para tras
    for (var i = pos+1; i < total; i++){
        renumeraLinha(document.getElementById('form-row-'+i), i, i-1);
    }

    sumFacts();
}

function subirLinha(rowID){ moverLinha(parseInt(rowID.replace("-","")), -1); }
function descerLinha(rowID){ moverLinha(parseInt(rowID.replace("-","")), +1); }

//Troca uma linha com a vizinha. Move os NOS inteiros no DOM, entao o
//estado dos selects (opcoes carregadas, valor escolhido e a propriedade
//_lista) viaja junto — nao ha copia de valores, campo por campo.
function moverLinha(pos, dir){

    var destino = pos + dir;
    var total = listRows().length;
    if (destino < 0 || destino >= total){ return; }   //ja esta na ponta

    var a = document.getElementById('form-row-'+pos);       //linha que se move
    var b = document.getElementById('form-row-'+destino);   //vizinha

    //renumera usando um numero temporario para os ids nao colidirem
    var TMP = 999999;
    renumeraLinha(a, pos, TMP);
    renumeraLinha(b, destino, pos);
    renumeraLinha(a, TMP, destino);

    //poe os nos na ordem numerica certa dentro do container
    var container = document.getElementById('row-container');
    if (dir > 0){ container.insertBefore(b, a); }   //a desceu: b vem antes
    else        { container.insertBefore(a, b); }   //a subiu: a vem antes

    //troca no modelo de dados
    var t = data[pos]; data[pos] = data[destino]; data[destino] = t;

    sumFacts();
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
    
function pasteRowValues(row, values){
    
    
        document.getElementById('refeicao-'+row).value = values.refeicao;
        document.getElementById('foods-'+row).value = values.nome;
        atualizarNomeAlimento(row, values.nome);
        document.getElementById('qtd-'+row).value = values.qtd;
        document.getElementById('uni-'+row).innerHTML = values.unidade;
        document.getElementById('qtd-protein-'+row).innerHTML = values.protein;
        document.getElementById('qtd-carb-'+row).innerHTML = values.carb;
        document.getElementById('qtd-fat-'+row).innerHTML = values.fats;
        document.getElementById('qtd-cal-'+row).innerHTML = values.cal;
        document.getElementById('grupo-'+row).value = values.grupo || "--";
        document.getElementById('detalhes-'+row).innerHTML = values.detalhes;

        //mantem a cor do seletor de refeicao em sincronia com o valor
        pintaRefeicao(row);

}

function pintaRefeicao(row){

    var el = document.getElementById('refeicao-'+row);

    //fundo por periodo + cor de fonte com contraste suficiente.
    //"Noite" tem fundo azul-escuro (corTema[2]), entao a fonte vai a branco.
    var bg = corTema[5], fg = corTema[1];
    switch(el.value){
           case "Manhã": bg = corTema[5]; fg = corTema[1]; break;
           case "Almoço": bg = corTema[4]; fg = corTema[1]; break;
           case "Tarde":  bg = corTema[3]; fg = corTema[1]; break;
           case "Noite":  bg = corTema[2]; fg = "#ffffff";  break;
           }
    el.style.backgroundColor = bg;
    el.style.color = fg;
}
    
function listRows(){
  var oInput = document.getElementById('row-container'),
        oChild;
  var i=0;
  var n =0;
  var rows=[];

  for(i = 0; i < oInput.childNodes.length; i++){
        oChild = oInput.childNodes[i];
        if(oChild.nodeName == 'DIV'){
            rows[n]=oChild.id;
            n=n+1;
        }
  }
  return rows;
}
    
function popNewLine(row){
        document.getElementById('uni-'+row).textContent = "ovos";
        document.getElementById('foods-'+row).value = "Ovo";
        atualizarNomeAlimento(row, "Ovo");
        document.getElementById('qtd-'+row).value = 0;
        document.getElementById('qtd-protein-'+row).textContent = 0;
        document.getElementById('qtd-carb-'+row).textContent = 0;
        document.getElementById('qtd-fat-'+row).textContent = 0;
        document.getElementById('qtd-cal-'+row).textContent = 0;
        document.getElementById('grupo-'+row).value = "--";
        document.getElementById('detalhes-'+row).textContent = "Sem detalhes.";
        pintaRefeicao(row);
}

function popFoods(row){

    mostrarMenuPrincipal(row);
}
    
function initializePop(){

//Guarda o molde de uma linha vazia ANTES de qualquer alteracao.
//As linhas novas sao clonadas daqui, e nao da linha 0 em uso,
//que a essa altura ja pode ter a lista TACO carregada dentro dela.
rowTemplate = document.getElementById('form-row-0').innerHTML;

data[0] = {refeicao: "Manhã",
           nome:"Ovo",
           unidade: "ovos",
           qtd: "2",
           cal:"77",
           fats: "5.28",
           carb:"0.56",
           protein:"6.26",
           grupo: "--",
           detalhes: "Sem detalhes."};

data[1] = {refeicao: "Manhã",
           nome:"Mozzarella",
           unidade: "gramas",
           qtd: "1",
           cal:"3",
           fats: "0.22",
           carb:"0.02",
           protein:"0.22",
           grupo: "--",
           detalhes: "Sem detalhes."};

data[2] = {refeicao: "Manhã",
           nome:"Carne Moída",
           unidade: "gramas",
           qtd: "1",
           cal:"3",
           fats: "0.19",
           carb:"0",
           protein:"0.25",
           grupo: "--",
           detalhes: "Sem detalhes."};

    var linhas = listRows().length;
    var n=0;

    for (n = 0; n < linhas; n++){
        popFoods(n);
    }

    for (n = 0; n < linhas; n++){
        pasteRowValues(n, data[n]);
    }

    sumFacts();
    aplicarPrefDetalhes();
}

// Liga/desliga a faixa de "detalhes" de todas as linhas. Some so a
// observacao; os macros continuam. A preferencia fica guardada para a
// proxima visita.
function alternarDetalhes(){
    var cont = document.getElementById('row-container');
    var escondido = cont.classList.toggle('esconder-detalhes');
    var btn = document.getElementById('btnDetalhes');
    if (btn){ btn.textContent = escondido ? 'Mostrar detalhes' : 'Ocultar detalhes'; }
    try { localStorage.setItem('nutri_esconder_detalhes', escondido ? '1' : '0'); } catch(e){}
}

function aplicarPrefDetalhes(){
    var pref = null;
    try { pref = localStorage.getItem('nutri_esconder_detalhes'); } catch(e){}
    if (pref === '1'){
        document.getElementById('row-container').classList.add('esconder-detalhes');
        var btn = document.getElementById('btnDetalhes');
        if (btn){ btn.textContent = 'Mostrar detalhes'; }
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
    return {
        tipo: "estado",
        versao: 1,
        nome: document.getElementById("nome").textContent.trim(),
        notas: document.getElementById("dia").textContent.trim(),
        salvoEm: new Date().toISOString(),
        soma: {protein: sum.protein, carb: sum.carb, fats: sum.fats, cal: sum.cal},
        itens: data.map(function(d){
            return {refeicao: d.refeicao, nome: d.nome, unidade: d.unidade,
                    qtd: d.qtd, cal: d.cal, fats: d.fats, carb: d.carb,
                    protein: d.protein, grupo: d.grupo, detalhes: d.detalhes};
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

// Reconstroi a tela inteira a partir de um estado salvo.
function carregarEstado(estado){
    if (!estado || !Array.isArray(estado.itens) || estado.itens.length === 0){
        alert("Este arquivo nao parece um estado valido (sem itens).");
        return;
    }

    document.getElementById("nome").textContent = estado.nome || "";
    document.getElementById("dia").textContent = estado.notas || "";

    // ajusta o numero de linhas para bater com o estado
    while (listRows().length > 1){ removerLinha(listRows().length - 1); }
    while (listRows().length < estado.itens.length){ inserirLinha(listRows().length); }

    for (var i = 0; i < estado.itens.length; i++){
        aplicarItemNaLinha(i, estado.itens[i]);
    }
    sumFacts();
    fecharSessoes();
}

// Coloca um item salvo numa linha existente, exibindo os valores
// guardados. Se o alimento nao estiver na base (veio da TACO ou de uma
// receita), ele e adicionado como opcao e como fonte por-unidade, para
// que mudar a quantidade depois recalcule certo.
function aplicarItemNaLinha(row, item){

    data[row] = {
        refeicao: item.refeicao || "Manhã",
        nome: item.nome,
        unidade: item.unidade,
        qtd: item.qtd,
        cal: item.cal, fats: item.fats, carb: item.carb, protein: item.protein,
        grupo: item.grupo || "--",
        detalhes: item.detalhes || ""
    };

    mostrarMenuPrincipal(row);   //popula a lista principal, _lista = foods

    if (!findByName(foods, item.nome)){
        var select = document.getElementById('foods-'+row);
        var o = document.createElement("option");
        o.value = item.nome; o.text = item.nome;
        select.appendChild(o);

        var perUnidade = derivarPorUnidade(item);
        if (perUnidade){ select._lista = foods.concat([perUnidade]); }
    }

    pasteRowValues(row, data[row]);
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

// Acrescenta uma receita como uma nova linha do plano.
function carregarReceitaComoLinha(receita){
    inserirLinha(listRows().length);            //nova linha no fim
    var row = listRows().length - 1;

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

    var select = document.getElementById('foods-'+row);
    var o = document.createElement("option");
    o.value = porUnidade.nome; o.text = porUnidade.nome;
    select.appendChild(o);
    select._lista = (select._lista || foods).concat([porUnidade]);
    select.value = porUnidade.nome;

    document.getElementById('qtd-'+row).value = 1;
    updateFood('-'+row);
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
function montarLatex(enxuto){

    var nome  = document.getElementById("nome").textContent.trim();
    var notas = document.getElementById("dia").textContent.trim();
    var res   = calcPorPeriodo();

    var L = [];
    L.push("\\documentclass[11pt]{article}");
    L.push("\\usepackage[utf8]{inputenc}");
    L.push("\\usepackage[T1]{fontenc}");
    L.push("\\usepackage[margin=2cm]{geometry}");
    L.push("\\usepackage{booktabs}");
    L.push("\\usepackage{array}");
    L.push("\\usepackage{xcolor}");
    L.push("\\definecolor{accent}{HTML}{0B25D4}");
    L.push("\\renewcommand{\\arraystretch}{1.3}");
    L.push("\\setlength{\\parindent}{0pt}");
    L.push("");
    L.push("\\begin{document}");
    L.push("");

    // cabecalho
    L.push("\\begin{center}");
    L.push("{\\LARGE\\bfseries\\color{accent} " + escLatex(nome || "Plano alimentar") + "}");
    if (notas){ L.push("\\\\[4pt]"); L.push("{\\large " + escLatex(notas) + "}"); }
    L.push("\\end{center}");
    L.push("\\vspace{10pt}");
    L.push("");

    // resumo por periodo + total (só na versão completa)
    if (!enxuto){
        L.push("\\section*{Resumo}");
        L.push("\\begin{center}");
        L.push("\\begin{tabular}{@{}lrrrr@{}}");
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
        L.push("\\end{tabular}");
        L.push("\\end{center}");
        L.push("");
    }

    // uma secao por periodo, com os itens
    PERIODOS.forEach(function(p){
        var d = res[p];
        if (d.itens.length === 0){ return; }

        L.push("\\section*{" + escLatex(p) + "}");
        L.push("\\begin{tabular}{@{}p{6.5cm}rrrrr@{}}");
        L.push("\\toprule");
        L.push("\\textbf{Alimento} & \\textbf{Qtd} & \\textbf{Prot} & \\textbf{Carb} & \\textbf{Gord} & \\textbf{Cal} \\\\");
        L.push("\\midrule");

        d.itens.forEach(function(it){
            var alimento = escLatex(it.nome);
            if (!enxuto){
                var obs = stripHtml(it.detalhes || "");
                if (obs && obs !== "Sem detalhes."){
                    alimento += " \\newline \\textit{\\small " + escLatex(obs) + "}";
                }
            }
            var qtd = escLatex(it.qtd + " " + it.unidade);
            L.push(alimento + " & " + qtd + " & " + it.protein + " & " + it.carb + " & " + it.fats + " & " + it.cal + " \\\\");
        });

        L.push("\\midrule");
        L.push("\\textbf{Subtotal} & & \\textbf{" + d.protein + "} & \\textbf{" + d.carb + "} & \\textbf{" + d.fats + "} & \\textbf{" + d.cal + "} \\\\");
        L.push("\\bottomrule");
        L.push("\\end{tabular}");
        L.push("");
    });

    L.push("\\end{document}");
    return L.join("\n");
}

function latexEnxutoMarcado(){
    var chk = document.getElementById("latexEnxuto");
    return !!(chk && chk.checked);
}

// abre o modal com o código (respeita o estado da caixa "versão enxuta")
function gerarLatex(){
    document.getElementById("latexOut").value = montarLatex(latexEnxutoMarcado());
    document.getElementById("latexModal").style.display = "block";
}

// regera o código quando o usuário marca/desmarca "versão enxuta"
function atualizarLatex(){
    document.getElementById("latexOut").value = montarLatex(latexEnxutoMarcado());
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
// Seletor de alimentos em colunas (estilo Finder / Miller columns)
//
// O <select id="foods-N"> continua sendo a fonte de verdade do valor
// (salvar sessao, renumerar linhas etc.). Este seletor e so uma forma
// mais rapida de navegar: ao escolher um alimento, escrevemos o valor
// no <select> e chamamos aplicaAlimento(), a mesma rotina do dropdown.
//====================================================================

var pickerRow     = null;   // linha que abriu o seletor
var pickerPath    = [];     // pastas escolhidas, uma por coluna
var pickerPreview = null;   // alimento (folha) em pré-visualização

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

function fecharPicker(){
    document.getElementById("pickerModal").style.display = "none";
    pickerRow = null;
}

//Filhos de uma "pasta". entry === null significa a raiz.
function pickerFilhos(entry){

    if (!entry){
        return [
            {tipo:"grupo", rotulo:"Minha base",  fonte:"base"},
            {tipo:"grupo", rotulo:"Tabela TACO", fonte:"taco"},
            {tipo:"acao",  rotulo:"Supermercado UK (Open Food Facts)", fonte:"off"},
            {tipo:"acao",  rotulo:"Carregar receita (arquivo)…", fonte:"receita"}
        ];
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
                abrirBuscaOFF();
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

function abrirBuscaOFF(){
    document.getElementById("pickerColunas").style.display   = "none";
    document.getElementById("pickerResultados").style.display = "none";
    document.getElementById("pickerOFF").style.display        = "block";
    document.getElementById("offBusca").focus();
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
    status.textContent = "Buscando no Open Food Facts…";
    botao.disabled = true;

    buscarOpenFoodFacts(termo)
        .then(function(alimentos){
            botao.disabled = false;

            if (alimentos.length === 0){
                status.textContent = "Nenhum produto com dados completos de macros. Tente outro termo.";
                return;
            }

            status.textContent = alimentos.length + " produto(s) — clique para usar (valores por grama):";

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
                it.onclick = function(){ escolherAlimentoDoPicker(a); };
                lista.appendChild(it);
            });
        })
        .catch(function(err){
            botao.disabled = false;
            status.textContent = "O serviço está ocupado no momento. Tente de novo em alguns segundos.";
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

//Revela o campo "Abrir Receita" daquela linha (mesma acao que a antiga
//opcao "Receita" do dropdown) e fecha o seletor.
function abrirReceitaArquivo(row){
    if (row === null){ return; }
    document.getElementById("file-" + row).style.display = "block";
    document.getElementById("col-qtd-" + row).style.display = "none";
    fecharPicker();
}

function escolherAlimentoDoPicker(item){

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
    outPage = outPage + buildItem(data[iRow].nome, data[iRow].detalhes, data[iRow].protein, data[iRow].carb, data[iRow].fats, data[iRow].cal) 
    };
};
    
outPage = outPage +  buildPeriodo("ALMOÇO");
    
for (iRow=0; iRow<data.length; iRow++){

    if (data[iRow].refeicao == "Almoço"){
    outPage = outPage + buildItem(data[iRow].nome, data[iRow].detalhes, data[iRow].protein, data[iRow].carb, data[iRow].fats, data[iRow].cal)
    };
};
    
outPage = outPage +  buildPeriodo("TARDE");
    
for (iRow=0; iRow<data.length; iRow++){

    if (data[iRow].refeicao == "Tarde"){
    outPage = outPage + buildItem(data[iRow].nome, data[iRow].detalhes, data[iRow].protein, data[iRow].carb, data[iRow].fats, data[iRow].cal)
    };
};
    
outPage = outPage +  buildPeriodo("NOITE");
    
for (iRow=0; iRow<data.length; iRow++){

    if (data[iRow].refeicao == "Noite"){
    outPage = outPage + buildItem(data[iRow].nome, data[iRow].detalhes, data[iRow].protein, data[iRow].carb, data[iRow].fats, data[iRow].cal)
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

function buildItem(alimento, descricao, protein, carb, fats, cal){
    
 
    
    
    var str = '<table><tr><td  style="text-align:center width: 20%;">' + alimento + '</td><td style="width: 60%">' + descricao + '</td><td style="width: 20%"><ul><li>Proteína: ' + protein + 'g</li><li>Carbs: ' + carb + 'g</li><li>Fats: ' + fats + 'g</li><li>Calorias: ' + cal + '</li></ul></td</tr></table>'
    
    return str;
}
//----------------------------
    
//As bases agora vem de arquivos JSON, entao a tela so pode ser montada
//depois que o carregamento terminar.
carregarDados()
    .then(initializePop)
    .catch(function(erro){
        console.error(erro);
        document.getElementById('row-container').innerHTML =
            '<p style="color:var(--cor8);">Não foi possível carregar a base de alimentos (foods.json): '
            + erro.message + '</p>';
    });