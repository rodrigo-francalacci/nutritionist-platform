var bebidas = [];
$.getJSON("tabela_taco/bebidas.json", function(json) {
            
        //console.log(json); // this will show the info it in firebug console
        bebidas = json.Plan1;
        
    }); 



//abre tabela de carnes e derivados
var carnes_e_derivados = [];
$.getJSON("tabela_taco/carnes_e_derivados.json", function(json) {
            
        //console.log(json); // this will show the info it in firebug console
        carnes_e_derivados = json.Plan1;
        
    }); 


var cereais_e_derivados = [];
$.getJSON("tabela_taco/cereais_e_derivados.json", function(json) {
            
        //console.log(json); // this will show the info it in firebug console
        cereais_e_derivados = json.Plan1;
        
    });  



var frutas_e_derivados = [];
$.getJSON("tabela_taco/frutas_e_derivados.json", function(json) {
            
        //console.log(json); // this will show the info it in firebug console
        frutas_e_derivados = json.Plan1;
        
    });

var leguminosas_e_derivados = [];
$.getJSON("tabela_taco/leguminosas_e_derivados.json", function(json) {
            
        //console.log(json); // this will show the info it in firebug console
        leguminosas_e_derivados = json.Plan1;
        
    });


var leite_e_derivados = [];
$.getJSON("tabela_taco/leite_e_derivados.json", function(json) {
            
        //console.log(json); // this will show the info it in firebug console
        leite_e_derivados = json.Plan1;
        
    }); 

var nozes_castanhas_e_outros = [];
$.getJSON("tabela_taco/nozes_castanhas_e_outros.json", function(json) {
            
        //console.log(json); // this will show the info it in firebug console
        nozes_castanhas_e_outros = json.Plan1;
        
    }); 


var oleos_e_gorduras = [];
$.getJSON("tabela_taco/oleos_e_gorduras.json", function(json) {
            
        //console.log(json); // this will show the info it in firebug console
        oleos_e_gorduras = json.Plan1;
        
    });


var ovos_e_derivados = [];
$.getJSON("tabela_taco/ovos_e_derivados.json", function(json) {
            
        //console.log(json); // this will show the info it in firebug console
        ovos_e_derivados = json.Plan1;
        
    });



var pescados_e_frutos_do_mar = [];
$.getJSON("tabela_taco/pescados_e_frutos_do_mar.json", function(json) {
            
        //console.log(json); // this will show the info it in firebug console
        pescados_e_frutos_do_mar = json.Plan1;
        
    });


var produtos_acucarados = [];
$.getJSON("tabela_taco/produtos_acucarados.json", function(json) {
            
        //console.log(json); // this will show the info it in firebug console
        produtos_acucarados = json.Plan1;
        
    });


var verduras_hortalicas_e_derivados = [];
$.getJSON("tabela_taco/verduras_hortalicas_e_derivados.json", function(json) {
            
        //console.log(json); // this will show the info it in firebug console
        verduras_hortalicas_e_derivados = json.Plan1;
        
    });  