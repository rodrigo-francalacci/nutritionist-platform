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
e `detalhes`. **Os macros são por unidade**, não por 100 g: se a unidade é `gramas`,
`cal` é a caloria de **um** grama.

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

## Editando a base pessoal

Não edite `foods.json` na mão — use o gerenciador (só precisa de Node, sem `npm install`):

```bash
node tools/foods.js list [termo]     # lista, filtrando por nome ou categoria
node tools/foods.js categorias       # categorias e quantos alimentos tem cada
node tools/foods.js add              # acrescenta (pergunta campo a campo)
node tools/foods.js edit "<nome>"    # edita (Enter mantém o valor atual)
node tools/foods.js rm "<nome>"      # remove (pede confirmação)
node tools/foods.js check            # procura erros na base
```

A busca por nome ignora acentos e maiúsculas, e aceita pedaço do nome:
`edit "tofu"` acha `Tofu Firme`.

Acrescente `--push` para commitar e enviar ao GitHub de uma vez:

```bash
node tools/foods.js add --push
```

Estando na `main`, o workflow em `.github/workflows/static.yml` republica o site
em cerca de um minuto. Sem `--push`, o arquivo é só salvo localmente.

`check` avisa sobre campos faltando, nomes repetidos, números inválidos e
calorias que destoam dos macros (a conta `4P + 4C + 9G`) — útil depois de
digitar um rótulo errado.

## Arquivos

```
index.html        tela principal
main-script.js    linhas, cálculo, receitas e relatório
data-loader.js    carrega foods.json e a tabela TACO
modal-window.js   janela de salvar receita
relatorio.html    página de impressão
foods.json        base pessoal
tabela_taco/      Tabela TACO (json + planilhas de origem)
receitas/         receitas salvas (json)
tools/foods.js    gerenciador da base pessoal
```

## Rodando localmente

A página busca os JSON via `fetch`, então precisa de um servidor HTTP —
abrir o `index.html` direto do disco não funciona:

```bash
npx serve .        # ou: python -m http.server
```
