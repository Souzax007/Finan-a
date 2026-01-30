function menuOnClick() {
  document.getElementById("nav").classList.toggle("active");
  toggleClasse("menu-bar", "change");
  toggleClasse("nav", "change");
}

function toggleClasse(id, classe) {
  document.getElementById(id).classList.toggle(classe);
}

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function converterTextoParaNumero(texto) {
  return Number(
    texto.replace(/[^\d,-]/g, '')
         .replace('.', '')
         .replace(',', '.')
  );
}

function calcularTotalHistorico(historico) {
  return historico.reduce((total, item) => {
    const valor = converterTextoParaNumero(item);
    return total + (isNaN(valor) ? 0 : valor);
  }, 0);
}


const STORAGE_KEY = 'dadosFinanceiros';

function obterDados() {
  const salvo = localStorage.getItem(STORAGE_KEY);
  if (salvo) return Promise.resolve(JSON.parse(salvo));

  return fetch('dados.json')
    .then(res => res.json())
    .then(dados => {
      salvarDados(dados);
      return dados;
    });
}

function salvarDados(dados) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
}


function criarValorBox(dado, indexDado) {
  const box = document.createElement('div');
  box.className = `valor-box valor-${dado.tipo}`;

  box.innerHTML = `
    ${criarHeader(dado)}
    ${criarHistorico(dado, indexDado)}
  `;

  adicionarEventoCatraca(box);
  return box;
}

function criarHeader(dado) {
  const total = calcularTotalHistorico(dado.historico);

  return `
    <div class="header">
      <span class="titulo ${dado.tipo}">${dado.titulo}</span>
      <span class="valor">${formatarMoeda(total)}</span>
      <button class="catraca ${dado.tipo}">
        <i class="bi bi-chevron-up"></i>
      </button>
    </div>
  `;
}

function criarHistorico(dado, indexDado) {
  return `
    <div class="historico">
      ${dado.historico.map((item, indexItem) =>
        criarItemHistorico(item, dado.tipo, indexDado, indexItem)
      ).join('')}
    </div>
  `;
}

function criarItemHistorico(item, tipo, indexDado, indexItem) {
  return `
    <div class="historico-item ${tipo}">
      <p>
        <span class="ponto_paragrafo ${tipo}">•</span> ${item}
      </p>
      <div class="acoes">
        <button class="editar" data-dado="${indexDado}" data-item="${indexItem}">
          <i class="bi bi-pencil-square"></i>
        </button>
        <button class="excluir" data-dado="${indexDado}" data-item="${indexItem}">
          <i class="bi bi-trash3-fill"></i>
        </button>
      </div>
    </div>
  `;
}

function adicionarEventoCatraca(box) {
  const botao = box.querySelector('.catraca');
  botao.addEventListener('click', e => {
    e.stopPropagation();
    box.classList.toggle('aberto');
    botao.classList.toggle('girado');
  });
}

function renderizar(dados) {
  const container = document.getElementById('valorContainer');
  container.innerHTML = '';
  dados.forEach((dado, index) => {
    container.appendChild(criarValorBox(dado, index));
  });
  atualizarGrafico(dados);
}


document.addEventListener('click', e => {
  const botaoExcluir = e.target.closest('.excluir');
  const botaoEditar = e.target.closest('.editar');

  if (botaoExcluir) excluirItem(botaoExcluir);
  if (botaoEditar) editarItem(botaoEditar);
});

function excluirItem(botao) {
  const dados = obterDadosStorage();
  const { dado, item } = botao.dataset;

  dados[dado].historico.splice(item, 1);
  salvarDados(dados);
  renderizar(dados);
}

function editarItem(botao) {
  const dados = obterDadosStorage();
  const { dado, item } = botao.dataset;

  const novoValor = prompt('Editar valor:', dados[dado].historico[item]);
  if (novoValor && novoValor.trim()) {
    dados[dado].historico[item] = novoValor;
    salvarDados(dados);
    renderizar(dados);
  }
}

function obterDadosStorage() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY));
}

let grafico;

function atualizarGrafico(dados) {
  const inicial = buscarPorTipo(dados, 'inicial');
  const atual = buscarPorTipo(dados, 'atual');

  const totalInicial = calcularTotalHistorico(inicial?.historico || []);
  const totalAtual = calcularTotalHistorico(atual?.historico || []);
  if (!totalInicial) return;

  const ratio = totalAtual / totalInicial;
  const percentual = Math.min(Math.round(ratio * 100), 100);
  const { cor, status } = definirStatus(ratio);

  const options = criarOpcoesGrafico(percentual, totalAtual, cor, status);

  if (!grafico) {
    grafico = new ApexCharts(
      document.querySelector("#graficoFinanceiro"),
      options
    );
    grafico.render();
  } else {
    grafico.updateOptions(options);
  }
}

function buscarPorTipo(dados, tipo) {
  return dados.find(d => d.tipo === tipo);
}

function definirStatus(ratio) {
  if (ratio < 0.5) return { cor: '#e74c3c', status: 'Crítico' };
  if (ratio < 0.9) return { cor: '#f1c40f', status: 'Atenção' };
  return { cor: '#2ecc71', status: 'Saudável' };
}

function criarOpcoesGrafico(percentual, totalAtual, cor, status) {
  return {
    chart: { type: 'radialBar', height: 280, sparkline: { enabled: true } },
    series: [percentual],
    colors: [cor],
    labels: ['Situação Financeira'],
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 90,
        hollow: { size: '65%' },
        track: { background: '#2c2c2c' },
        dataLabels: {
          value: {
            formatter: () => formatarMoeda(totalAtual),
            color: '#fff',
            fontSize: '18px'
          }
        }
      }
    },
    subtitle: {
      text: status,
      align: 'center',
      style: { color: cor }
    }
  };
}


obterDados().then(renderizar);
