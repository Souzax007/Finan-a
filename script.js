function menuOnClick(event) {
  event.stopPropagation(); 

  document.getElementById("nav").classList.toggle("active");
  toggleClasse("menu-bar", "change");
  toggleClasse("nav", "change");
}

function fecharMenuAoClicarFora(e) {
  const menu = document.getElementById('nav');
  const menuBar = document.getElementById('menu-bar');

  if (!menu.classList.contains('active')) return;

  const clicouNoMenu = menu.contains(e.target);
  const clicouNoBotao = menuBar.contains(e.target);

  if (!clicouNoMenu && !clicouNoBotao) {
    menu.classList.remove('active');
    menu.classList.remove('change');
    menuBar.classList.remove('change');
  }
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

  // Se não houver nada no storage, retorna array vazio
  return Promise.resolve([]);
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
  const graficoContainer = document.querySelector('.grafico');
  const btnRegistrar = document.getElementById('btnRegistrar');

  if (!dados || dados.length === 0) {
    container.style.display = 'none';
    graficoContainer.style.display = 'none';
    btnRegistrar.style.display = 'block';
    return;
  }

  btnRegistrar.style.display = 'block';
  container.style.display = 'block';
  graficoContainer.style.display = 'block';
  container.innerHTML = '';
  dados.forEach((dado, index) => {
    container.appendChild(criarValorBox(dado, index));
  });

  container.innerHTML = '';
dados.forEach((dado, index) => {
  container.appendChild(criarValorBox(dado, index));
});

container.appendChild(criarBoxValorAtual(dados));

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

  const valorExcluido = dados[dado].historico[item];

  if (!confirm(`Tem certeza que deseja excluir este valor ${valorExcluido}?`)) return;

  dados[dado].historico.splice(item, 1);
  salvarDados(dados);
  renderizar(dados);

  alert(`Valor excluído: ${valorExcluido}`);
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
  const retirado = buscarPorTipo(dados, 'retirado');

  const totalInicial = calcularTotalHistorico(inicial?.historico || []);
  const totalRetirado = calcularTotalHistorico(retirado?.historico || []);

  const totalAtual = totalInicial - totalRetirado;

  if (!totalInicial) return; // nada para mostrar se não houver entrada inicial

  const ratio = totalAtual / totalInicial; // percentual do valor atual em relação ao inicial
  const percentual = Math.min(Math.round(ratio * 100), 100);
  const { cor, status } = definirStatus(ratio);

  const options = criarOpcoesGrafico(percentual, totalAtual, cor, status);

  if (!grafico) {
    grafico = new ApexCharts(document.querySelector("#graficoFinanceiro"), options);
    grafico.render();
  } else {
    grafico.updateOptions(options);
  }
}

function criarBoxValorAtual(dados) {
  const entradas = buscarPorTipo(dados, 'inicial')?.historico.map(v => ({ valor: v, tipo: 'inicial' })) || [];
  const saidas = buscarPorTipo(dados, 'retirado')?.historico.map(v => ({ valor: v, tipo: 'retirado' })) || [];

  const historicoAtual = [...entradas, ...saidas];

  const totalAtual = calcularTotalHistorico(entradas.map(e => e.valor)) - calcularTotalHistorico(saidas.map(s => s.valor));

  // Cria o box
  const box = document.createElement('div');
  box.className = 'valor-box valor-atual';
  box.innerHTML = `
    <div class="header">
      <span class="titulo atual">Valor Atual</span>
      <span class="valor">${formatarMoeda(totalAtual)}</span>
      <button class="catraca atual">
        <i class="bi bi-chevron-up"></i>
      </button>
    </div>
    <div class="historico">
      ${historicoAtual.map((item, index) => `
        <div class="historico-item ${item.tipo}">
          <p>
            <span class="ponto_paragrafo ${item.tipo}">•</span> ${item.valor} (${item.tipo === 'inicial' ? 'Adicionado' : 'Retirado'})
          </p>
        </div>
      `).join('')}
    </div>
  `;

  adicionarEventoCatraca(box);
  return box;
}





function buscarPorTipo(dados, tipo) {
  return dados.find(d => d.tipo === tipo);
}

function definirStatus(ratio) {
  if (ratio < 0.5) return { cor: '#e74c3c', status: 'Crítico' };
  if (ratio < 0.9) return { cor: '#f1c40f', status: 'Atenção' };
  if (ratio < 1.2) return { cor: '#2ecc71', status: 'Saudável' }; // verde normal
  return { cor: '#27ae60', status: 'Excelente' }; // verde escuro para quando superou
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


document.addEventListener('DOMContentLoaded', () => {
  inicializarRegistro();
  obterDados().then(renderizar);
});

function inicializarRegistro() {
  const btnRegistrar = document.getElementById('btnRegistrar');
  const valorContainer = document.getElementById('valorContainer');
  const graficoContainer = document.querySelector('.grafico');
  const formRegistroContainer = document.getElementById('formRegistroContainer');
  const formRegistro = document.getElementById('formRegistro');
  const btnCancelar = document.getElementById('cancelarRegistro');

  // Mostrar formulário
  btnRegistrar.addEventListener('click', () => {
    valorContainer.style.display = 'none';
    graficoContainer.style.display = 'none';
    formRegistroContainer.style.display = 'block';
  });

  // Cancelar formulário
  btnCancelar.addEventListener('click', () => {
    formRegistroContainer.style.display = 'none';
    valorContainer.style.display = 'block';
    graficoContainer.style.display = 'block';
  });

  // Salvar formulário
  formRegistro.addEventListener('submit', (e) => {
    e.preventDefault();

    const dados = obterDadosStorage() || [];

    const novoRegistro = {
      tipo: document.getElementById('tipo').value,
      titulo: document.getElementById('titulo').value,
      historico: [document.getElementById('valor').value]
    };

    // Verifica se já existe o tipo
    const indiceExistente = dados.findIndex(d => d.tipo === novoRegistro.tipo);
    if (indiceExistente !== -1) {
      dados[indiceExistente].historico.push(novoRegistro.historico[0]);
    } else {
      dados.push(novoRegistro);
    }

    salvarDados(dados);
    renderizar(dados);

    // Voltar para tela principal
    formRegistroContainer.style.display = 'none';
    valorContainer.style.display = 'block';
    graficoContainer.style.display = 'block';

    formRegistro.reset();
  });
}


document.addEventListener('click', fecharMenuAoClicarFora);
obterDados().then(renderizar);
