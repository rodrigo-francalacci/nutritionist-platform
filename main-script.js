//----------------------------------------------------------//
var data = [];    
var sum = {};
var actualGroup = [];
var outPage = "";
var rowTemplate = "";   //molde de uma linha vazia, capturado em initializePop()
    
function uptadeRefeicao(rowID){
var row = parseInt(rowID.replace("-",""));

    data[row].refeicao = document.getElementById('refeicao-'+row).value;
    pintaRefeicao(row);
}

function updateGrupo(rowID){
var row = parseInt(rowID.replace("-",""));

    data[row].grupo = document.getElementById('grupo-'+row).value;
}
    
function updateFood(rowID){
    
    var row = parseInt(rowID.replace("-",""));
    //encontrar alimento alterado
    var rowFood = document.getElementById('foods-'+row).value;   

    switch(rowFood) {
        
          case "Voltar":
            voltarListaNormal(row);
            break;
            
          case "Receita":
            document.getElementById("file-"+row).style.display="block";
            document.getElementById("col-qtd-"+row).style.display="none";
            break;
            
          case "Tabela TACO":
            TACOgruposLoad(row);
            //document.getElementById("foods-" + row).value = "Selecione uma categoria..."
            break;
            
          case "-Bebidas":
            actualGroup = TACOgrupoLoad(row,bebidas,"-Bebidas");
            break;
            
          case "-Carnes e Derivados":
            actualGroup = TACOgrupoLoad(row,carnes_e_derivados,"-Carnes e Derivados");
            break;
            
          case "-Cereais e Derivados":
            actualGroup = TACOgrupoLoad(row,cereais_e_derivados,"-Cereais e Derivados");
            break;
            
          case "-Frutas e Derivados":
            actualGroup = TACOgrupoLoad(row,frutas_e_derivados,"-Frutas e Derivados");
            break;
            
          case "-Leguminosas e Derivados":
            actualGroup = TACOgrupoLoad(row,leguminosas_e_derivados,"-Leguminosas e Derivados");
            break;
            
          case "-Leite e Derivados":
            actualGroup = TACOgrupoLoad(row,leite_e_derivados,"-Leite e Derivados");
            break;
            
          case "-Nozes e Castanhas":
            actualGroup = TACOgrupoLoad(row,nozes_castanhas_e_outros,"-Nozes e Castanhas");
            break;
            
          case "-Óleos e Gorduras":
            actualGroup = TACOgrupoLoad(row,oleos_e_gorduras,"-Óleos e Gorduras");
            break;
            
          case "-Pescados e Frutos do Mar":
            actualGroup = TACOgrupoLoad(row,pescados_e_frutos_do_mar,"-Pescados e Frutos do Mar");
            break;
          
          case "-Produtos Açucarados":
            actualGroup = TACOgrupoLoad(row,produtos_acucarados,"-Produtos Açucarados");
            break;
            
          case "-Verduras e Hortaliças":
            actualGroup = TACOgrupoLoad(row,verduras_hortalicas_e_derivados,"-Verduras e Hortaliças");
            
            break;
            
          default: //caso seja um alimento da lista principal
              if(document.getElementById("foods-"+row).firstChild.value == "Voltar"){

                 updateWhenTacoList(row, rowFood) 

              }else{

                 updateNormalList(row, rowFood);   

              };
           
               
}// end switch
     
    
    
}

function voltarListaNormal(row){

document.getElementById("foods-"+row).innerHTML = "";
popFoods(row);
    
}

function TACOgruposLoad(row){
    
    document.getElementById("file-"+row).style.display="none";
    document.getElementById("col-qtd-"+row).style.display="block";
    
    var tacoOptions = '<option value="Voltar" style="color:var(--cor8);">Voltar</option>\
                       <option value="Receita" style="color:var(--cor8);">Receita</option>\
<option value="-Bebidas" style="background-color:var(--cor1); color:var(--cor4);">-Bebidas</option>\
<option value="-Carnes e Derivados" style="background-color:var(--cor1); color:var(--cor4);">-Carnes e Derivados</option>\
<option value="-Cereais e Derivados" style="background-color:var(--cor1); color:var(--cor4);">-Cereais e Derivados</option>\
<option value="-Frutas e Derivados" style="background-color:var(--cor1); color:var(--cor4);">-Frutas e Derivados</option>\
<option value="-Leguminosas e Derivados" style="background-color:var(--cor1); color:var(--cor4);">-Leguminosas e Derivados</option>\
<option value="-Leite e Derivados" style="background-color:var(--cor1); color:var(--cor4);">-Leite e Derivados</option>\
<option value="-Nozes e Castanhas" style="background-color:var(--cor1); color:var(--cor4);">-Nozes e Castanhas</option>\
<option value="-Óleos e Gorduras" style="background-color:var(--cor1); color:var(--cor4);">-Óleos e Gorduras</option>\
<option value="-Pescados e Frutos do Mar" style="background-color:var(--cor1); color:var(--cor4);">-Pescados e Frutos do Mar</option>\
<option value="-Produtos Açucarados" style="background-color:var(--cor1); color:var(--cor4);">-Produtos Açucarados</option>\
<option value="-Verduras e Hortaliças" style="background-color:var(--cor1); color:var(--cor4);">-Verduras e Hortaliças</option>'
    
    document.getElementById("foods-"+row).innerHTML = tacoOptions;

}

function TACOgrupoLoad(row, groupData, groupName){

document.getElementById("file-"+row).style.display="none";
document.getElementById("col-qtd-"+row).style.display="block";

TACOgruposLoad(row);

//os arquivos da tabela TACO sao carregados de forma assincrona,
//entao o grupo pode ainda estar vazio quando o usuario seleciona
if(!groupData || groupData.length == 0){
    alert("A tabela TACO ainda nao terminou de carregar (ou falhou). Tente de novo em instantes.");
    document.getElementById("foods-"+row).value = groupName;
    return groupData || [];
}

groupData.sort((a, b) => (a.nome > b.nome) ? 1 : -1);

    for (let i = 0; i < groupData.length; i++){
            var option = document.createElement("option");
            option.value = groupData[i].nome;
            option.text = groupData[i].nome;
            document.getElementById('foods-' + row).appendChild(option);
        }
document.getElementById("foods-"+row).value = groupName;
data[row].nome = groupName;
return groupData;
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

function updateNormalList(row, rowFood){

    aplicaAlimento(row, rowFood, findByName(foods, rowFood));
}

function updateWhenTacoList(row, rowFood){

    //se o alimento nao estiver no grupo TACO carregado, procura na lista principal
    var item = findByName(actualGroup, rowFood) || findByName(foods, rowFood);
    aplicaAlimento(row, rowFood, item);
}

function aplicaAlimento(row, rowFood, item){

          document.getElementById("file-"+row).style.display="none";
          document.getElementById("col-qtd-"+row).style.display="block";

        //atualizar alimento no database
        data[row].nome = rowFood;

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

    switch(el.value){
           case "Manhã": el.style.backgroundColor = corTema[5]; break;
           case "Almoço": el.style.backgroundColor = corTema[4]; break;
           case "Tarde":  el.style.backgroundColor = corTema[3]; break;
           case "Noite":  el.style.backgroundColor = corTema[2]; break;
           }
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
    
            var option = document.createElement("option");
            option.value = "Receita";
            option.text = "Receita";
            option.style.color = "var(--cor8)";
            document.getElementById('foods-' + row).appendChild(option);
            
            var option = document.createElement("option");
            option.value = "Tabela TACO";
            option.text = "Tabela TACO";
            option.style.color = "var(--cor8)";
            document.getElementById('foods-' + row).appendChild(option);
    
    
    foods.sort((a, b) => (a.nome > b.nome) ? 1 : -1);
    
    for (let i = 0; i < foods.length; i++){
            var option = document.createElement("option");
            option.value = foods[i].nome;
            option.text = foods[i].nome;
            document.getElementById('foods-' + row).appendChild(option);
        }
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
    
initializePop();