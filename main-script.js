//----------------------------------------------------------//
var data = [];    
var sum = {};
var newLine = {refeicao: "Manhã", nome:"Ovo", unidade: "ovos", qtd: "0",  cal:"0",  fats: "0",  carb:"0", protein:"0", detalhes: "Sem detalhes."};
var actualGroup = [];
var outPage = "";
    
function uptadeRefeicao(rowID){
var row = parseInt(rowID.replace("-",""));

    data[row].refeicao = document.getElementById('refeicao-'+row).value;
    
    switch(data[row].refeicao){
           
           case "Manhã":
           document.getElementById('refeicao-'+row).style.backgroundColor = corTema[5];
           break;
           
           case "Almoço":
           document.getElementById('refeicao-'+row).style.backgroundColor = corTema[4];
           break;
            
           case "Tarde":
           document.getElementById('refeicao-'+row).style.backgroundColor = corTema[3];
           break;
            
           case "Noite":
           document.getElementById('refeicao-'+row).style.backgroundColor = corTema[2];
           break;
            
           }
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
    //document.getElementById("foods-"+row).value = "-Bebidas"
    data[row].nome = "-Bebidas";

    
}

function TACOgrupoLoad(row, groupData, groupName){
    
document.getElementById("file-"+row).style.display="none";
document.getElementById("col-qtd-"+row).style.display="block";
    
TACOgruposLoad(row);
    
groupData.sort((a, b) => (a.nome > b.nome) ? 1 : -1);
    
    for (let i = 0; i < groupData.length; i++){
            var option = document.createElement("option");
            option.value = groupData[i].nome;
            option.text = groupData[i].nome;
            document.getElementById('foods-' + row).appendChild(option);
        }
document.getElementById("foods-"+row).value = groupName;
return groupData;
}

function updateNormalList(row, rowFood){
    
          document.getElementById("file-"+row).style.display="none";
          document.getElementById("col-qtd-"+row).style.display="block";
     
        //atualizar alimento no database
        data[row].nome = rowFood;
    
        //encontrar e atualizar fatos deste alimento
        var n = 0;
        var q = 0;
        while(rowFood != foods[n].nome){n=n+1;}
        
        
        //atualiza a unidade
        document.getElementById('uni-'+row).innerHTML = foods[n].unidade;
        data[row].unidade = foods[n].unidade;
        
        //atualiza os detalhes
        document.getElementById('detalhes-'+row).innerHTML = foods[n].detalhes;
        data[row].detalhes = foods[n].detalhes;
        
        //atualiza a quantidade
        data[row].qtd = document.getElementById('qtd-'+row).value;
        q = data[row].qtd;
        
        //atualiza a quantidade de proteínas
        document.getElementById('qtd-protein-'+row).innerHTML = rd(q*parseFloat(foods[n].protein));
        data[row].protein = rd(q*parseFloat(foods[n].protein));
    
        //atualiza a quantidade de carboidratos
        document.getElementById('qtd-carb-'+row).innerHTML = rd(q*parseFloat(foods[n].carb));
        data[row].carb = rd(q*parseFloat(foods[n].carb));
    
        //atualiza a quantidade de gorduras
        document.getElementById('qtd-fat-'+row).innerHTML = rd(q*parseFloat(foods[n].fats));
        data[row].fats = rd(q*parseFloat(foods[n].fats));
    
        //atualiza a quantidade de calorias
        document.getElementById('qtd-cal-'+row).innerHTML = rd(q*parseFloat(foods[n].cal));
        data[row].cal = rd(q*parseFloat(foods[n].cal));
    
        sumFacts();  
}
    
function updateWhenTacoList(row, rowFood){
          
          document.getElementById("file-"+row).style.display="none";
          document.getElementById("col-qtd-"+row).style.display="block";
     
        //atualizar alimento no database
        data[row].nome = rowFood;
    
        //encontrar e atualizar fatos deste alimento
        var n = 0;
        var q = 0;
        while(rowFood != actualGroup[n].nome){n=n+1;}
        
        
        //atualiza a unidade
        document.getElementById('uni-'+row).innerHTML = actualGroup[n].unidade;
        data[row].unidade = actualGroup[n].unidade;
        
        //atualiza os detalhes
        document.getElementById('detalhes-'+row).innerHTML = actualGroup[n].detalhes;
        data[row].detalhes = actualGroup[n].detalhes;
        
        //atualiza a quantidade
        data[row].qtd = document.getElementById('qtd-'+row).value;
        q = data[row].qtd;
        
        //atualiza a quantidade de proteínas
        document.getElementById('qtd-protein-'+row).innerHTML = rd(q*parseFloat(actualGroup[n].protein));
        data[row].protein = rd(q*parseFloat(actualGroup[n].protein));
    
        //atualiza a quantidade de carboidratos
        document.getElementById('qtd-carb-'+row).innerHTML = rd(q*parseFloat(actualGroup[n].carb));
        data[row].carb = rd(q*parseFloat(actualGroup[n].carb));
    
        //atualiza a quantidade de gorduras
        document.getElementById('qtd-fat-'+row).innerHTML = rd(q*parseFloat(actualGroup[n].fats));
        data[row].fats = rd(q*parseFloat(actualGroup[n].fats));
    
        //atualiza a quantidade de calorias
        document.getElementById('qtd-cal-'+row).innerHTML = rd(q*parseFloat(actualGroup[n].cal));
        data[row].cal = rd(q*parseFloat(actualGroup[n].cal));
    
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
   
   //var thisRowID = "form-row"+rowID;
   var row = parseInt(rowID.replace("-",""));  
   var rows = listRows();
   var lastRow = rows.length-1;
   
   //se sor a última linha
   if (row == lastRow){
   createLastRow(row+1);
   sumFacts();
   }
    
   //se for outra linha
   if (row != lastRow){
   createSpace(row+1);
   createMidRow(row+1);
   sumFacts()
   }
    
}

function delRow(rowID){
   var row = parseInt(rowID.replace("-",""));   
   if(row !=0){removeSpace(row);} 
}

function createSpace(newRowLocation){
    
    var rows = listRows();
    var lastRow = rows.length-1;
    var i = lastRow;
    var n=0;
    
    
    while (i >= newRowLocation) {
         var el = document.getElementById('form-row-'+i)
         var rowCode = el.innerHTML;
         var values = copyRowValues(i);
         
        
         n = i+1;
         //data[n]=data[i];
         pasteInData(copyFromData(i),n);
        
         rowCode = rowCode.replaceAll("-"+i, "-"+n);
         el.innerHTML = rowCode;
         el.id = "form-row-" + n;
         pasteRowValues(n, values);
         i=i-1;
    }
    
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
        document.getElementById('detalhes-'+row).innerHTML = values.detalhes;
    

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
    
function createMidRow(newRowLocation){
    
var referenceRow = newRowLocation-1;
var referenceNode = document.getElementById('form-row-'+referenceRow);
var rowCode = document.getElementById('form-row-0').innerHTML;
    
    rowCode = rowCode.replaceAll('-0', '-'+newRowLocation);
    var newRow = document.createElement("div");
    newRow.id = "form-row-" + newRowLocation;
    newRow.className = "form-row";
    newRow.innerHTML = rowCode;
    insertAfter(newRow, referenceNode);
    
    //data[newRowLocation]=data[0];
    pasteInData(newLine,newRowLocation);
    popNewLine(newRowLocation);
    
}

function insertAfter(newNode, referenceNode) {
referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}
   
function createLastRow(row){
    
    var rowCode = document.getElementById('form-row-0').innerHTML;
    rowCode = rowCode.replace(/-0/g, '-'+row);
    var newRow = document.createElement("div");
    newRow.id = "form-row-" + row;
    newRow.className = "form-row";
    newRow.innerHTML = rowCode;
    document.getElementById('row-container').appendChild(newRow);
    pasteInData(newLine, row);
    popNewLine(row);
    
    //data[row]=data[0];
}
    
function removeRow(row){
    var delRow = document.getElementById('form-row-'+row);
    delRow.remove();
}
    
function removeSpace(removedRow){
    
    var rows = listRows();
    var lastRow = rows.length-1;
    var i = removedRow;
    var n=0;
    
    
   for(i=removedRow; i<lastRow; i++) {
         n = i+1;
         var el = document.getElementById('form-row-'+n)// copia o codigo do elemento da frente
         var rowCode = el.innerHTML;
         var values = copyRowValues(n); //copia os valores do elemento da frente
         
        
         
         //data[n]=data[i];
         pasteInData(copyFromData(n),i); //cola o elemento da frente no elemento anterior no data Base
        
         rowCode = rowCode.replaceAll("-"+n, "-"+i); // substitui os Ids das tags do elemento da frente para o anterior
         document.getElementById('form-row-'+i).innerHTML = rowCode;
         //el.innerHTML = rowCode;
         //el.id = "form-row-" + n;
         pasteRowValues(i, values);
        
    }
    removeRow(lastRow);
    data.pop();
    sumFacts();
    
}    

function popNewLine(row){
        document.getElementById('uni-'+row).innerHTML = "ovos";
        document.getElementById('foods-'+row).value = "Ovo"
        document.getElementById('qtd-'+row).value = 0;
        document.getElementById('qtd-protein-'+row).innerHTML = 0;
        document.getElementById('qtd-carb-'+row).innerHTML = 0;
        document.getElementById('qtd-fat-'+row).innerHTML = 0;
        document.getElementById('qtd-cal-'+row).innerHTML = 0;
        document.getElementById('detalhes-'+row).innerHTML = "Sem detalhes."
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
    
  

data[0] = {refeicao: "Manhã", 
           nome:"Ovo", 
           unidade: "ovos", 
           qtd: "2", 
           cal:"77", 
           fats: "5.28", 
           carb:"0.56", 
           protein:"6.26",
           detalhes: "trala"};

data[1] = {refeicao: "Manhã", 
           nome:"Mozzarella", 
           unidade: "grama", 
           qtd: "1", 
           cal:"3", 
           fats: "0.22", 
           carb:"0.02", 
           protein:"0.22",
           detalhes: "trala"};
    
data[2] = {refeicao: "Manhã", 
           nome:"Carne Moída",
           unidade: "grama", 
           qtd: "1", 
           cal:"3", 
           fats: "0.19", 
           carb:"0", 
           protein:"0.25",
           detalhes: "trala"};
    
    var n=0;
    for (n = 0; n <=2; n++){
        popFoods(n);
    }
    
    for (n = 0; n <=2; n++){
        pasteRowValues(n, data[n]);
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
    valuesCopied.detalhes = data[row].detalhes;

        
    return valuesCopied;

}
    
function pasteInData(values, DataRow){

data[DataRow] = {refeicao: "Manhã", 
           nome:"Ovo", 
           unidade: "ovos", 
           qtd: "2", 
           cal:"77", 
           fats: "5.28", 
           carb:"0.56", 
           protein:"6.26",
           detalhes: "trala"};

data[DataRow] = {
    nome: values.nome,
    unidade: values.unidade,
    qtd: values.qtd,
    cal: values.cal,
    fats: values.fats,
    carb: values.carb,
    protein: values.protein,
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
    
function replaceIDS(){
///fazer esta função
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
  document.getElementById("qtd-fat-receita").innerHTML = receita.protein;
    
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
// (A) VARIABLES TO PASS
var first = outPage;
  
// (B) OPEN NEW WINDOW
// Just pass variables over to new window
var newwin = window.open("relatorio.html");
newwin.onload = function(){
// "this" refers to newwin
this.first = first;
};
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