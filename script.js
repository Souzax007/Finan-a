function menuOnClick(event) {
  event.stopPropagation();
  const nav = document.getElementById("nav");
  const menuBar = document.getElementById("menu-bar");

  nav.classList.toggle("active");
  menuBar.classList.toggle("change");
}

function fecharMenuAoClicarFora(e) {
  const nav = document.getElementById("nav");
  const menuBar = document.getElementById("menu-bar");

  if (!nav.classList.contains("active")) return;

  const clicouNoMenu = nav.contains(e.target);
  const clicouNoBotao = menuBar.contains(e.target);

  if (!clicouNoMenu && !clicouNoBotao) {
    nav.classList.remove("active");
    menuBar.classList.remove("change"); 
  }
}

function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function converterTextoParaNumero(texto) {
  const numerosApenas = texto.replace(/\D/g, ""); 
  return numerosApenas ? Number(numerosApenas) : 0;
}

function calcularTotalHistorico(historico) {
  return historico.reduce((total, item) => {
    const valor = converterTextoParaNumero(item.valor);
    return total + (isNaN(valor) ? 0 : valor);
  }, 0);
}

const STORAGE_KEY = "dadosFinanceiros";

function obterDados() {
  const salvo = localStorage.getItem(STORAGE_KEY);
  return Promise.resolve(salvo ? JSON.parse(salvo) : []);
}

function salvarDados(dados) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
}

function obterDadosStorage() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function exportarJSON() {
  const dados = localStorage.getItem(STORAGE_KEY);
  if (!dados) return alert("Nenhum dado para exportar.");

  const blob = new Blob([dados], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "dados-financeiros.json";
  a.click();
}

function importarJSON(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const dados = JSON.parse(e.target.result);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
      alert("Dados importados com sucesso!");
      location.reload();
    } catch (err) {
      alert("Arquivo inválido. Selecione um JSON válido.");
    }
  };
  reader.readAsText(file);
}

function criarValorBox(dado, indexDado) {
  const box = document.createElement("div");
  box.className = `valor-box valor-${dado.tipo}`;

  box.innerHTML = `
    <div class="header">
      <span class="titulo ${dado.tipo}">${dado.tipo}</span>
      <span class="valor">${formatarMoeda(calcularTotalHistorico(dado.historico))}</span>
      <button class="catraca ${dado.tipo}"><i class="bi bi-chevron-up"></i></button>
    </div>
    <div class="historico">
      ${dado.historico.map((item, i) => `
        <div class="historico-item ${dado.tipo}">
            <div class="historico-descricao">
              <p>${item.descricao}:</p>
            </div>

            <div class="historico-valor">
              <p> ${formatarMoeda(converterTextoParaNumero(item.valor))}</p>
            </div>
            
            <div class="historico-acoes ${dado.tipo}">
              <button class="editar-item" data-index="${i}"><i class="bi bi-pencil-square"></i></button>
              <button class="remover-item" data-index="${i}"><i class="bi bi-trash3-fill"></i></button>
            </div>
        </div>
      `).join("")}
    </div>
  `;

  const btnCatraca = box.querySelector(".catraca");
  btnCatraca.addEventListener("click", () => box.classList.toggle("aberto"));

  const dados = obterDadosStorage();

  box.querySelectorAll(".remover-item").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const indexItem = Number(btn.dataset.index);
      dados[indexDado].historico.splice(indexItem, 1);
      salvarDados(dados);
      renderizar(dados);
    });
  });

  box.querySelectorAll(".editar-item").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const indexItem = Number(btn.dataset.index);
      const item = dados[indexDado].historico[indexItem];

      const novaDescricao = prompt("Editar descrição:", item.descricao);
      if (novaDescricao === null) return;

      let novoValor = prompt("Editar valor (somente números):", item.valor);
      if (novoValor === null) return;

      novoValor = novoValor.replace(/\D/g, "");

      dados[indexDado].historico[indexItem] = { descricao: novaDescricao, valor: novoValor };
      salvarDados(dados);
      renderizar(dados);
    });
  });

  return box;
}

function criarBoxValorAtual(dados) {
  const entradas = (dados.find(d => d.tipo === "inicial")?.historico || []);
  const saidas = (dados.find(d => d.tipo === "retirado")?.historico || []);
  const totalAtual = calcularTotalHistorico(entradas) - calcularTotalHistorico(saidas);

  const box = document.createElement("div");
  box.className = "valor-box valor-atual";

  box.innerHTML = `
    <div class="header">
      <span class="titulo atual">Valor Atual</span>
      <span class="valor">${formatarMoeda(totalAtual)}</span>
      <button class="catraca atual"><i class="bi bi-chevron-up"></i></button>
    </div>
    <div class="historico">
      ${[...entradas.map(v => ({...v, tipo:"inicial"})), ...saidas.map(v => ({...v, tipo:"retirado"}))]
        .map(item => `<div class="historico-item">
  <span class="ponto_paragrafo ${item.tipo}">
    ${item.descricao}: ${formatarMoeda(converterTextoParaNumero(item.valor))}
  </span>
</div>`).join("")}
    </div>
  `;

  box.querySelector(".catraca").addEventListener("click", () => box.classList.toggle("aberto"));
  return box;
}

let grafico;

function atualizarGrafico(dados) {
  const entradas = dados.find(d => d.tipo === "inicial")?.historico || [];
  const retiradas = dados.find(d => d.tipo === "retirado")?.historico || [];
  const totalInicial = calcularTotalHistorico(entradas);
  const totalAtual = totalInicial - calcularTotalHistorico(retiradas);
  if (!totalInicial) return;

  const percentual = Math.min(Math.round((totalAtual / totalInicial) * 100), 100);

  let cor, frase;
  if (percentual <= 30) {
    cor = "#e74c3c";
    frase = "Atenção! Estoque baixo!";
  } else if (percentual <= 60) {
    cor = "#f1c40f";
    frase = "Em andamento, mantenha o controle!";
  } else {
    cor = "#2ecc71";
    frase = "Tudo saudável, ótimo trabalho!";
  }

  const options = {
    chart: { 
      type: "radialBar", 
      height: 400, 
      sparkline: { enabled: true },
      animations: { enabled: true, easing: 'easeinout', speed: 1500 }
    },
    series: [percentual],
    colors: [cor],
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 90,
        hollow: { size: "70%" },
        track: { background: "#ffffff" },
        dataLabels: {
          name: { show: false },
          value: { 
            formatter: () => formatarMoeda(totalAtual), 
            color: "#fcfbfb", 
            fontSize: "50px", 
            fontWeight: "bold",
            offsetY: -40,
            offsetX: 0
          },
          total: {
            show: true,
            label: frase,
            color: cor,
            fontSize: "16px",
            fontWeight: 500
          }
        }
      }
    },
    stroke: { lineCap: 'round' },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        type: 'horizontal',
        gradientToColors: ['#2ecc71'],
        stops: [0, 100]
      }
    },
    subtitle: {
      text: frase,
      align: "center",
      style: { color: cor, fontSize: '14px', fontWeight: 'bold' }
    }
  };

  if (!grafico) {
    grafico = new ApexCharts(document.querySelector("#graficoFinanceiro"), options);
    grafico.render();
  } else {
    grafico.updateOptions(options, true); 
  }
}

function renderizar(dados) {
  const container = document.getElementById("valorContainer");
  const graficoContainer = document.querySelector(".grafico");
  const btnRegistrar = document.getElementById("btnRegistrar");

  if (!dados || dados.length === 0) {
    container.style.display = "none";
    graficoContainer.style.display = "none";
    btnRegistrar.style.display = "block";
    return;
  }

  container.style.display = "flex";
  graficoContainer.style.display = "block";
  container.innerHTML = "";
  dados.forEach((d, i) => container.appendChild(criarValorBox(d, i)));
  container.appendChild(criarBoxValorAtual(dados));
  atualizarGrafico(dados);
}

function aplicarMascaraMoeda(input) {
  input.addEventListener("input", (e) => {
    let valor = e.target.value.replace(/\D/g, ""); 
    valor = (valor / 100).toFixed(2); 
    valor = valor.toString().replace(".", ","); 

    valor = valor.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    e.target.value = valor;
  });
}

function inicializarRegistro() {
  const btnRegistrar = document.getElementById("btnRegistrar");
  const formContainer = document.getElementById("formRegistroContainer");
  const form = document.getElementById("formRegistro");
  const valorContainer = document.getElementById("valorContainer");
  const graficoContainer = document.querySelector(".grafico");
  const btnCancelar = document.getElementById("cancelarRegistro");
  const inputValor = document.getElementById("valor");

  aplicarMascaraMoeda(inputValor); 

  btnRegistrar.addEventListener("click", () => {
    formContainer.style.display = "block";
    valorContainer.style.display = "none";
    graficoContainer.style.display = "none";
  });

  btnCancelar.addEventListener("click", () => {
    formContainer.style.display = "none";
    valorContainer.style.display = "flex";
    graficoContainer.style.display = "block";
  });

  form.addEventListener("submit", e => {
    e.preventDefault();
    const dados = obterDadosStorage();
    const tipo = document.getElementById("tipo").value;
    const descricao = document.getElementById("descricao").value;
    let valor = document.getElementById("valor").value;

    valor = valor.replace(/\D/g, ""); 

    const indice = dados.findIndex(d => d.tipo === tipo);
    if (indice !== -1) dados[indice].historico.push({ descricao, valor });
    else dados.push({ tipo, historico: [{ descricao, valor }] });

    salvarDados(dados);
    renderizar(dados);
    form.reset();
    formContainer.style.display = "none";
    valorContainer.style.display = "flex";
    graficoContainer.style.display = "block";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  inicializarRegistro();
  obterDados().then(renderizar);
  document.addEventListener("click", fecharMenuAoClicarFora);
});
