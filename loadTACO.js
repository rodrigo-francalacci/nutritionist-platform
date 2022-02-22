var bebidas = [];
$.getJSON("tabela_taco/bebidas.json", function(json) {
        bebidas = json.Plan1;
    }); 

var carnes_e_derivados = [];
$.getJSON("tabela_taco/carnes_e_derivados.json", function(json) {
        carnes_e_derivados = json.Plan1;
    }); 


var cereais_e_derivados = [];
$.getJSON("tabela_taco/cereais_e_derivados.json", function(json) {
        cereais_e_derivados = json.Plan1;
    });  

var frutas_e_derivados = [];
$.getJSON("tabela_taco/frutas_e_derivados.json", function(json) {
        frutas_e_derivados = json.Plan1;
    });

var leguminosas_e_derivados = [];
$.getJSON("tabela_taco/leguminosas_e_derivados.json", function(json) {
        leguminosas_e_derivados = json.Plan1;
    });


var leite_e_derivados = [];
$.getJSON("tabela_taco/leite_e_derivados.json", function(json) {
        leite_e_derivados = json.Plan1;
    }); 

var nozes_castanhas_e_outros = [];
$.getJSON("tabela_taco/nozes_castanhas_e_outros.json", function(json) {
        nozes_castanhas_e_outros = json.Plan1;
    }); 


var oleos_e_gorduras = [];
$.getJSON("tabela_taco/oleos_e_gorduras.json", function(json) {
        oleos_e_gorduras = json.Plan1;
    });


var ovos_e_derivados = [];
$.getJSON("tabela_taco/ovos_e_derivados.json", function(json) {
        ovos_e_derivados = json.Plan1;   
    });

var pescados_e_frutos_do_mar = [];
$.getJSON("tabela_taco/pescados_e_frutos_do_mar.json", function(json) {
        pescados_e_frutos_do_mar = json.Plan1;
    });


var produtos_acucarados = [];
$.getJSON("tabela_taco/produtos_acucarados.json", function(json) {
        produtos_acucarados = json.Plan1;
    });


var verduras_hortalicas_e_derivados = [];
$.getJSON("tabela_taco/verduras_hortalicas_e_derivados.json", function(json) {
        verduras_hortalicas_e_derivados = json.Plan1;
    });  