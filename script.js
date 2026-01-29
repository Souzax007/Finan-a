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
          <p><span class="ponto_paragrafo atual">•</span> ${item}</p>
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
     atualizarGrafico(dados);
  })
  .catch(err => console.error('Erro ao carregar JSON:', err));

  function calcularTotalHistorico(historico) {
  return historico.reduce((total, item) => {
  
    let valorTexto = item.replace(/[^\d,-]/g, '');

    let valorNumero = Number(
      valorTexto.replace('.', '').replace(',', '.')
    );

    return total + (isNaN(valorNumero) ? 0 : valorNumero);
  }, 0);
}

let grafico;

function atualizarGrafico(dados) {
  const inicial = dados.find(d => d.tipo === 'inicial');
  const atual = dados.find(d => d.tipo === 'atual');

  const totalInicial = calcularTotalHistorico(inicial?.historico || []);
  const totalAtual = calcularTotalHistorico(atual?.historico || []);

  if (totalInicial === 0) return;

  const ratio = totalAtual / totalInicial;
  const percentual = Math.min(Math.round(ratio * 100), 100);

  let cor = '#2ecc71'; 
  let status = 'Saudável';

  if (ratio < 0.5) {
    cor = '#e74c3c'; 
    status = 'Crítico';
  } else if (ratio < 0.9) {
    cor = '#f1c40f'; 
    status = 'Atenção';
  }

  const options = {
    chart: {
      type: 'radialBar',
      height: 280,
      sparkline: { enabled: true }
    },
    series: [percentual],
    colors: [cor],
    labels: ['Situação Financeira'],
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 90,
        hollow: {
          size: '65%'
        },
        track: {
          background: '#2c2c2c'
        },
        dataLabels: {
          name: {
            offsetY: -10,
            color: '#fff',
            fontSize: '14px'
          },
          value: {
            formatter: () => formatarMoeda(totalAtual),
            color: '#fff',
            fontSize: '18px',
            offsetY: 10
          }
        }
      }
    },
    subtitle: {
      text: status,
      align: 'center',
      style: {
        color: cor,
        fontSize: '14px'
      }
    }
  };

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
