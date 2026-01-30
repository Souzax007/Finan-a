// Pure JS
function updateValorJson(caminho, tipo, operacao, novoConteudo) {
  const fs = require('fs');
  const data = fs.readFileSync(caminho, 'utf8');
  const json = JSON.parse(data);

  const indice = tipo === 'inicial' ? 0 : tipo === 'atual' ? 1 : tipo === 'retirado' ? 2 : -1;
  if (indice === -1) {
    console.error('Tipo inválido fornecido.');
    return;
  }

  if (operacao === 'add') {
    json[indice].historico.push(novoConteudo);
  } else if (operacao === 'remove') {
    json[indice].historico.splice(0, 1)
  } else if (operacao === 'update') {
    json[indice].historico = novoConteudo;
  } else {
    console.error('Operação inválida fornecida.');
    return;
  }

  fs.writeFileSync(caminho, JSON.stringify(json, null, 2), 'utf8');
}

// Exemplo de uso add
updateValorJson('dados.json', 'inicial', 'add', 'Nova receita adicionada em ' + new Date().toLocaleDateString());

// Exemplo de uso remove
updateValorJson('dados.json', 'inicial', 'remove', 'Despesa paga em ' + new Date().toLocaleDateString());

// Exemplo de uso update
updateValorJson('dados.json', 'retirado', 'update', { old: 'Valor retirado em 01/01/2024', new: 'Valor retirado em ' + new Date().toLocaleDateString() });
updateValorJson('dados.json', 'atual', 'update', { old: 'Valor retirado em 01/01/2024', new: 'Valor atualizado em ' + new Date().toLocaleDateString() });

