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
  return Number(texto.replace(/[^\d,-]/g, "").replace(".", "").replace(",", "."));
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
          <p>${item.descricao}: ${formatarMoeda(converterTextoParaNumero(item.valor))}</p>
        </div>
      `).join("")}
    </div>
  `;

  const btnCatraca = box.querySelector(".catraca");
  btnCatraca.addEventListener("click", () => {
    box.classList.toggle("aberto");
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
  const cor = totalAtual / totalInicial < 0.5 ? "#e74c3c" : "#2ecc71";
  const status = totalAtual / totalInicial < 0.5 ? "Crítico" : "Saudável";

  const options = {
    chart: { type: "radialBar", height: 280, sparkline: { enabled: true } },
    series: [percentual],
    colors: [cor],
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 90,
        hollow: { size: "65%" },
        track: { background: "#2c2c2c" },
        dataLabels: { value: { formatter: () => formatarMoeda(totalAtual), color: "#fff", fontSize: "18px" } }
      }
    },
    subtitle: { text: status, align: "center", style: { color: cor } }
  };

  if (!grafico) {
    grafico = new ApexCharts(document.querySelector("#graficoFinanceiro"), options);
    grafico.render();
  } else {
    grafico.updateOptions(options);
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

function inicializarRegistro() {
  const btnRegistrar = document.getElementById("btnRegistrar");
  const formContainer = document.getElementById("formRegistroContainer");
  const form = document.getElementById("formRegistro");
  const valorContainer = document.getElementById("valorContainer");
  const graficoContainer = document.querySelector(".grafico");
  const btnCancelar = document.getElementById("cancelarRegistro");

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
    const valor = document.getElementById("valor").value;

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
