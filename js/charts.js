// 차트 인스턴스
let stageChart, regionChart, typeChart, shareChart;

// 전체 차트 업데이트
function updateCharts() {
  updateStageChart();
  updateRegionChart();
  updateTypeChart();
  updateShareChart();
}

// 구매단계별 퍼널 차트
function updateStageChart() {
  const stageCounts = PURCHASE_STAGES.map(stage =>
    filteredData.filter(d => d.purchaseStage === stage).length
  );
  const stageColors = PURCHASE_STAGES.map(s => STAGE_COLORS[s]);

  if (stageChart) stageChart.destroy();
  stageChart = new Chart(document.getElementById('stageChart'), {
    type: 'bar',
    data: {
      labels: PURCHASE_STAGES,
      datasets: [{
        label: '기관 수',
        data: stageCounts,
        backgroundColor: stageColors,
        borderRadius: 6,
        barThickness: 36
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.raw}개 기관`
          }
        }
      },
      scales: {
        x: { beginAtZero: true, ticks: { stepSize: 1 } },
        y: { grid: { display: false } }
      }
    }
  });
}

// 지역별 점유율 도넛 차트
function updateRegionChart() {
  const regionMap = {};
  filteredData.forEach(d => {
    regionMap[d.region] = (regionMap[d.region] || 0) + d.purchaseAmount;
  });

  const sorted = Object.entries(regionMap).sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, 8);
  const etcAmount = sorted.slice(8).reduce((s, [, v]) => s + v, 0);
  if (etcAmount > 0) top.push(['기타', etcAmount]);

  const colors = ['#1a237e','#283593','#3949ab','#5c6bc0','#7986cb','#9fa8da','#c5cae9','#e8eaf6','#bdbdbd'];

  if (regionChart) regionChart.destroy();
  regionChart = new Chart(document.getElementById('regionChart'), {
    type: 'doughnut',
    data: {
      labels: top.map(t => t[0]),
      datasets: [{
        data: top.map(t => t[1]),
        backgroundColor: colors.slice(0, top.length),
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { size: 11 }, padding: 8 }
        },
        tooltip: {
          callbacks: {
            label: ctx => {
              const total = ctx.dataset.data.reduce((s, v) => s + v, 0);
              const pct = ((ctx.raw / total) * 100).toFixed(1);
              return `${ctx.label}: ${formatCurrency(ctx.raw)} (${pct}%)`;
            }
          }
        }
      }
    }
  });
}

// 지역별 점유율 바 차트
function updateShareChart() {
  const regions = Object.keys(REGION_TOTAL_TARGETS);
  const shareData = regions.map(region => {
    const total = REGION_TOTAL_TARGETS[region];
    const purchased = institutionData.filter(d =>
      d.region === region && ['구매', '만족', '추천'].includes(d.purchaseStage)
    ).length;
    return { region, share: total > 0 ? (purchased / total) * 100 : 0 };
  });

  shareData.sort((a, b) => b.share - a.share);

  const shortRegion = name => name.replace('특별자치', '').replace('광역시', '').replace('특별시', '');

  const barColors = shareData.map(d =>
    d.share >= 50 ? '#4CAF50' : d.share >= 25 ? '#FF9800' : '#F44336'
  );

  if (shareChart) shareChart.destroy();
  shareChart = new Chart(document.getElementById('shareChart'), {
    type: 'bar',
    data: {
      labels: shareData.map(d => shortRegion(d.region)),
      datasets: [{
        label: '점유율(%)',
        data: shareData.map(d => parseFloat(d.share.toFixed(1))),
        backgroundColor: barColors,
        borderRadius: 4,
        barThickness: 18
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.raw}%`
          }
        }
      },
      scales: {
        x: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%' } },
        y: { grid: { display: false }, ticks: { font: { size: 11 } } }
      }
    }
  });
}

// 기관유형별 바 차트
function updateTypeChart() {
  const typeNames = Object.keys(INSTITUTION_TYPES);
  const typeAmounts = typeNames.map(t =>
    filteredData.filter(d => d.type === t).reduce((s, d) => s + d.purchaseAmount, 0)
  );
  const typeColors = typeNames.map(t => INSTITUTION_TYPES[t].color);

  const shortLabels = typeNames.map(n => {
    if (n === '중독관리통합지원센터') return '중독관리센터';
    if (n === '광역시도 건강증진부서') return '건강증진부서';
    if (n === '정신건강복지센터') return '정신건강센터';
    return n;
  });

  if (typeChart) typeChart.destroy();
  typeChart = new Chart(document.getElementById('typeChart'), {
    type: 'bar',
    data: {
      labels: shortLabels,
      datasets: [{
        label: '납품액',
        data: typeAmounts,
        backgroundColor: typeColors,
        borderRadius: 6,
        barThickness: 36
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => formatCurrency(ctx.raw)
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: v => {
              if (v >= 100000000) return (v / 100000000).toFixed(0) + '억';
              if (v >= 10000000) return (v / 10000000).toFixed(0) + '천만';
              if (v >= 10000) return (v / 10000).toFixed(0) + '만';
              return v;
            }
          }
        },
        x: {
          ticks: { font: { size: 10 } }
        }
      }
    }
  });
}
