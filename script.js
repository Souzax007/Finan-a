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
  box.classList.add('valor-box', 'valor-inicial');

  box.innerHTML = `
    <div class="header">
      <span class="titulo ${dado.tipo}">${dado.titulo}</span>
      <span class="valor">${formatarMoeda(dado.valor)}</span>
      <button class="catraca ${dado.tipo}">
        <i class="bi bi-chevron-up"></i>
      </button>
    </div>

    <div class="historico">
      ${dado.historico.map(item => `<p>• ${item}</p>`).join('')}
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
