# nutritionist-platform

Montagem de planos alimentares com cálculo de macros, em HTML/CSS/JavaScript puro,
sem dependências e sem build. Publicado pelo GitHub Pages em
<https://rodrigo-francalacci.github.io/nutritionist-platform/>.

## Bases de alimentos

| arquivo | o que é |
|---|---|
| `foods.json` | base pessoal, editável pelo `tools/foods.js` |
| `tabela_taco/*.json` | Tabela TACO 4ª edição (UNICAMP), somente leitura |

Cada alimento tem `nome`, `categoria`, `unidade`, `cal`, `protein`, `carb`, `fats`
e `detalhes`.

### A unidade

`unidade` é o que você digita na tela ao montar o plano — a quantidade que faz
sentido para aquele alimento. Ovo se conta em `ovos`, queijo em `fatias (25g)`,
azeite em `colher de sopa`, carne em `gramas`.

**Os macros são sempre por UMA unidade**, nunca por 100 g. Se a unidade é
`gramas`, `cal` é a caloria de **um** grama; se é `colher de sopa`, é a de
**uma** colher.

```json
{
  "nome": "Manteiga",
  "categoria": "Óleos e Gorduras",
  "unidade": "colher de sopa",
  "cal": 102,
  "protein": 0.12,
  "carb": 0.01,
  "fats": 11.52,
  "detalhes": "Rico em vitamina A e butirato, uma gordura benéfica para os intestinos"
}
```

As duas bases usam o mesmo vocabulário de categorias, então o seletor de alimentos
navega igual nas duas: **Minha base por categoria** ou **Tabela TACO** → categoria → alimento.

## Gerenciando pela linha de comando

A forma mais fácil: **dois cliques no `Gerenciar.bat`**. Ele abre um menu com
comandos curtos e lista tudo ao iniciar (só precisa do Node instalado, sem
`npm install`):

```
BASE DE ALIMENTOS
  add                 adiciona um alimento
  edit <nome>         edita um alimento
  rm <nome>           remove um alimento
  list [termo]        lista os alimentos (filtra)
  cats                mostra as categorias
  check               procura erros na base

SESSÕES
  pub <arquivo>       publica um estado/receita baixado
  unpub <nome>        remove um estado/receita
  sessions            lista estados e receitas
  reindex             reconstrói os índices

GITHUB
  publish             envia tudo ao site (commit + push)
  pull                baixa as últimas alterações

  help                mostra esta lista
  exit                sair
```

No menu você digita só `add`, `edit Ovo`, `list frango`, `publish` e por aí vai.
Para `pub`, pode **arrastar o arquivo** `.json` para dentro da janela — o caminho
aparece sozinho. Editar não publica na hora: as mudanças ficam locais até você
digitar `publish`, que faz o commit e o push (o site republica em ~1 min).

A busca por nome ignora acentos e maiúsculas, e aceita pedaço do nome:
`edit tofu` acha `Tofu Firme`.

> Por baixo, o menu é o `tools/gerenciar.js` chamando `tools/foods.js` e
> `tools/sessions.js`. Dá para usar esses direto também
> (`node tools/foods.js add --push`), mas o menu é mais simples.

Ao perguntar a **categoria** e a **unidade**, o gerenciador lista as que já
existem e aceita o número da opção — ou uma nova, digitada por extenso. Se a
nova só difere por acento, caixa ou plural (`ovo` quando já existe `ovos`), ele
reaproveita a existente. Foi assim que a base acabou com `grama`, `gramas`,
`gram` e `grams` convivendo.

Mudando a unidade de um alimento no `edit`, ele avisa para você revisar os
macros — eles passam a valer por outra coisa.

`check` avisa sobre campos faltando, nomes repetidos, números inválidos,
unidades quase iguais e calorias que destoam dos macros (a conta
`4P + 4C + 9G`) — útil depois de digitar um rótulo errado.

Publicar (pelo `publish` no menu, ou `--push` nos utilitários) faz o commit e o
push. Estando na `main`, o workflow em `.github/workflows/static.yml` republica
o site em cerca de um minuto.

## Montando o plano

Cada linha é um alimento. Os botões na ponta direita da linha:

| botão | o que faz |
|---|---|
| `+` | adiciona uma linha logo abaixo |
| `-` | remove a linha |
| ▲ ▼ | sobe / desce a linha (reordena) |

## Sessões: salvar e carregar o plano inteiro

O botão **Sessões** abre uma janela com três coisas:

- **Salvar estado atual** — baixa o plano inteiro (todas as linhas, nome e
  notas) como um `.json`.
- **Carregar do repositório** — lista o que já foi publicado no repositório.
  Um *estado* substitui o plano inteiro; uma *receita* entra como uma nova linha.
- **Abrir arquivo local** — carrega um `.json` do seu computador (estado ou receita).

Como o app roda no GitHub Pages, ele **lê** do repositório à vontade, mas não
**escreve** — isso exigiria guardar um token do GitHub no navegador. Então salvar
é em dois passos: o app baixa o arquivo, e você publica pelo menu (`pub <arquivo>`
seguido de `publish`).

O `pub` detecta sozinho se o arquivo é um estado (`itens[]`) ou uma receita
(`nome` + `cal`) e o coloca em `estados/` ou `receitas/`. Cada pasta tem um
`index.json` — a lista que o app consulta, já que o Pages não faz listagem de
diretório. O `reindex` reconstrói essa lista a partir do conteúdo da pasta.

## Arquivos

```
index.html         tela principal
main-script.js     linhas, cálculo, receitas, relatório, sessões
data-loader.js     carrega foods.json e a tabela TACO
modal-window.js    janela de salvar receita
relatorio.html     página de impressão
foods.json         base pessoal
tabela_taco/       Tabela TACO (json + planilhas de origem)
receitas/          receitas salvas (json) + index.json
estados/           planos inteiros salvos (json) + index.json
Gerenciar.bat      abre o menu (dois cliques)
tools/gerenciar.js o menu de comandos curtos
tools/foods.js     gerenciador da base pessoal
tools/sessions.js  publica e indexa estados e receitas
tools/serve.js     servidor local para testar antes de publicar
```

## Rodando localmente

A página busca os JSON via `fetch`, e o navegador bloqueia `fetch` em `file://` —
então abrir o `index.html` direto do disco **não funciona**. Use o servidor
que vem junto (só precisa de Node):

```bash
node tools/serve.js          # http://localhost:8080
node tools/serve.js 3000     # se a porta estiver ocupada
```

Ele não guarda cache, então recarregar a página já mostra a última alteração.
