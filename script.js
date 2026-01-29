function menuOnClick() {
  document.getElementById("menu-bar").classList.toggle("change");
  document.getElementById("nav").classList.toggle("change");
}

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function criarValorBox(dado) {
  const box = document.createElement('div');
  box.classList.add('valor-box', `valor-${dado.tipo}`);

  //  calcula o total baseado no histórico
  const totalCalculado = calcularTotalHistorico(dado.historico);

  box.innerHTML = `
    <div class="header">
      <span class="titulo ${dado.tipo}">${dado.titulo}</span>
      <span class="valor">${formatarMoeda(totalCalculado)}</span>
      <button class="catraca ${dado.tipo}">
        <i class="bi bi-chevron-up"></i>
      </button>
    </div>

    <div class="historico">
      ${dado.historico.map(item => `
        <div class="historico-item">
          <p>• ${item}</p>
          <div class="acoes">
            <button><i class="bi bi-pencil-square"></i></button>
            <button><i class="bi bi-trash3-fill"></i></button>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  const botao = box.querySelector('.catraca');
  botao.addEventListener('click', (e) => {
    e.stopPropagation();
    box.classList.toggle('aberto');
    botao.classList.toggle('girado');
  });

  return box;
}


fetch('dados.json')
  .then(res => res.json())
  .then(dados => {
    const container = document.getElementById('valorContainer');
    dados.forEach(dado => {
      container.appendChild(criarValorBox(dado));
    });
  })
  .catch(err => console.error('Erro ao carregar JSON:', err));

  function calcularTotalHistorico(historico) {
  return historico.reduce((total, item) => {
    // Remove tudo que não for número, vírgula ou sinal de menos
    let valorTexto = item.replace(/[^\d,-]/g, '');

    // Converte formato brasileiro para número
    let valorNumero = Number(
      valorTexto.replace('.', '').replace(',', '.')
    );

    return total + (isNaN(valorNumero) ? 0 : valorNumero);
  }, 0);
}
