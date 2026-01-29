# Aplicacao de Financas Pessoais
Este é um aplicativo de finanças pessoais desenvolvido em JS puro.


# Funções Json
Arquivo: funcoes_json.js
Nome: updateValorJson

Propósito: Realizar adição, update e remoção de valores no arquivo Json: dados.json

USO: updateValorJson(json, indice, operacao, novoConteudo) onde json = objeto json, indice = índice do item a ser modificado, operacao = 'add' -> Adiciona valores ao json, 'update' -> Atualiza valores no json, 'remove' -> Remove valores do json, novoConteudo = conteúdo a ser adicionado ou atualizado.

Exemplo de Chamada:

```js
updateValorJson(dadosJson, 0, 'add', ['2023-10-01', 'Salário', 5000]);
updateValorJson(dadosJson, 0, 'update', { old: ['2023-10-01', 'Salário', 5000], new: ['2023-10-01', 'Salário', 5500] });
updateValorJson(dadosJson, 0, 'remove', ['2023-10-01', 'Salário', 5500]);
```

# Melhorias a serem feitas
- Implementar validação de dados antes de adicionar ou atualizar valores no JSON.
- Revisar tratamento de erros para operações inválidas.
- Adicionar suporte para múltiplas operações em uma única chamada de função.
- Otimizar a função para lidar com grandes volumes de dados de forma eficiente.
