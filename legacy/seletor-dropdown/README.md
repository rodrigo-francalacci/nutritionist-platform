# Legado — seletor de alimentos em dropdown

Este é o seletor **antigo**, baseado em um único `<select>` que funcionava
como um menu de vários níveis (você abria a caixa, escolhia "Minha base por
categoria" ou "Tabela TACO", a lista se repopulava, e assim por diante).

Ele foi **substituído** pelo seletor em colunas (estilo Finder do Mac) +
busca. Veja no app o botão/etiqueta com o nome do alimento: clicar nele abre
o novo seletor (`abrirPicker`).

## Importante: o dropdown NÃO foi removido do código

Toda a lógica do dropdown continua viva em `main-script.js`
(`updateFood`, `mostrarMenuPrincipal`, `mostrarCategoriasPessoais`,
`mostrarCategoriaPessoal`, `mostrarGruposTaco`, `mostrarGrupoTaco`,
`opcaoNav`, `opcoesDeAlimentos`, `prepararSelect`, `opcaoTitulo`).
O `<select id="foods-N">` também continua no HTML de cada linha — só está
**escondido** por CSS (`.foods-oculto { display: none; }`) e ainda guarda o
valor do alimento (é ele que salva/carrega as sessões).

Este arquivo guarda uma **cópia** dessas funções como referência, caso um dia
elas sejam refatoradas ou removidas do `main-script.js`.

## Como voltar ao dropdown (reversão rápida)

Como o `<select>` continua sendo populado normalmente na carga da página, dá
para reativar o visual antigo só trocando o CSS. Em `index.html`, no bloco de
estilo do seletor:

```css
/* mostrar de novo o dropdown antigo... */
.foods-oculto{ display: inline; }
/* ...e esconder a etiqueta nova */
.alimento-chip{ display: none; }
```

Isso basta para o dropdown de vários níveis voltar a funcionar exatamente
como antes. Para remover de vez o novo seletor, apague também o
`<div id="pickerModal">` e as funções `abrirPicker`/`renderPickerColunas`/
`escolherAlimentoDoPicker` etc. — mas isso é opcional.

## Arquivo de referência

`seletor-dropdown.js` — cópia das funções do dropdown como estavam quando o
novo seletor foi introduzido.
