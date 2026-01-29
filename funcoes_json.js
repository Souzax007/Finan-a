// Pure JS
function updateValorHistoricoInicial(caminho, tipo, novoConteudo) {
  const fs = require('fs');
  const data = fs.readFileSync(caminho, 'utf8');
  const json = JSON.parse(data);
  // json[0] = inicial, json[1] = atual, ...
  json[0].historico.push(novoConteudo);
  fs.writeFileSync(caminho, JSON.stringify(json, null, 2), 'utf8');
}

function updateValorHistoricoAtual(caminho, tipo, novoConteudo) {
  const fs = require('fs');
  const data = fs.readFileSync(caminho, 'utf8');
  const json = JSON.parse(data);
  // json[0] = inicial, json[1] = atual, ...
  json[1].historico.push(novoConteudo);
  fs.writeFileSync(caminho, JSON.stringify(json, null, 2), 'utf8');
}

function updateValorHistoricoRetirado(caminho, tipo, novoConteudo) {
  const fs = require('fs');
  const data = fs.readFileSync(caminho, 'utf8');
  const json = JSON.parse(data);
  // json[0] = inicial, json[1] = atual, ...
  json[2].historico.push(novoConteudo);
  fs.writeFileSync(caminho, JSON.stringify(json, null, 2), 'utf8');
}

// Exemplo de uso
updateValorHistoricoInicial('dados.json', 'inicial', 'Nova receita adicionada em ' + new Date().toLocaleDateString());

updateValorHistoricoAtual('dados.json', 'atual', 'Despesa paga em ' + new Date().toLocaleDateString());

updateValorHistoricoRetirado('dados.json', 'retirado', 'Valor retirado em ' + new Date().toLocaleDateString());
