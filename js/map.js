// 지도 관련 변수
let map;
let geoJsonLayer;       // 광역시도 레이어
let districtGeoLayer;   // 시/군/구 레이어
let markersLayer;       // 시군구 줌: 전체 기관 마커
let regionMarkersLayer; // 광역시도 줌: 광역 기관 마커
let regionLabelsLayer;
let districtGeoData;    // 시/군/구 GeoJSON 데이터 캐시
const DISTRICT_ZOOM = 9; // 이 줌 이상이면 시/군/구 표시

// 지도 초기화
function initMap() {
  const koreaBounds = L.latLngBounds([33.0, 124.5], [38.7, 131.0]);

  map = L.map('map', {
    minZoom: 7,
    maxZoom: 18,
    maxBounds: koreaBounds,
    maxBoundsViscosity: 1.0
  }).setView([36.0, 127.8], 7);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  markersLayer = L.layerGroup();       // 시군구 줌에서만 표시
  regionMarkersLayer = L.layerGroup().addTo(map); // 광역시도 줌에서 광역 기관 표시
  regionLabelsLayer = L.layerGroup().addTo(map);

  // 광역시도 GeoJSON 로드
  fetch('data/korea-geo.json')
    .then(res => res.json())
    .then(data => {
      geoJsonLayer = L.geoJSON(data, {
        style: feature => getRegionStyle(feature.properties.name),
        onEachFeature: (feature, layer) => {
          layer.on({
            mouseover: e => {
              e.target.setStyle({ weight: 3, fillOpacity: 0.6 });
              e.target.bindTooltip(getRegionTooltip(feature.properties.name), { sticky: true }).openTooltip();
            },
            mouseout: e => { geoJsonLayer.resetStyle(e.target); },
            click: e => {
              updateInfoRegionSummary(feature.properties.name);
              showRegionModal(feature.properties.name);
            }
          });
        }
      }).addTo(map);
      updateMarkers();
      updateRegionLabels();
    })
    .catch(err => {
      console.warn('GeoJSON 로드 실패:', err);
      updateMarkers();
    });

  // 시/군/구 GeoJSON 로드
  fetch('data/korea-district-geo.json')
    .then(res => res.json())
    .then(data => {
      districtGeoData = data;
      districtGeoLayer = L.geoJSON(data, {
        style: feature => getDistrictStyle(feature.properties.region, feature.properties.district),
        onEachFeature: (feature, layer) => {
          layer.on({
            mouseover: e => {
              e.target.setStyle({ weight: 3, fillOpacity: 0.7 });
              e.target.bindTooltip(getDistrictTooltip(feature.properties.region, feature.properties.district), { sticky: true }).openTooltip();
            },
            mouseout: e => { districtGeoLayer.resetStyle(e.target); },
            click: e => {
              const p = feature.properties;
              document.getElementById('filterRegion').value = p.region;
              updateDistrictFilter();
              document.getElementById('filterDistrict').value = p.district;
              applyFilters();
            }
          });
        }
      });
      // 줌 레벨에 따라 초기 표시 여부 결정
      toggleLayersByZoom();
    })
    .catch(err => console.warn('시/군/구 GeoJSON 로드 실패:', err));

  // 줌 변경 시 레이어 전환
  map.on('zoomend', toggleLayersByZoom);
}

// 줌 레벨에 따라 광역시도/시군구 레이어 전환
function toggleLayersByZoom() {
  const zoom = map.getZoom();
  if (zoom >= DISTRICT_ZOOM) {
    // 시/군/구 + 전체 기관 마커 표시
    if (geoJsonLayer && map.hasLayer(geoJsonLayer)) map.removeLayer(geoJsonLayer);
    if (regionLabelsLayer && map.hasLayer(regionLabelsLayer)) map.removeLayer(regionLabelsLayer);
    if (regionMarkersLayer && map.hasLayer(regionMarkersLayer)) map.removeLayer(regionMarkersLayer);
    if (districtGeoLayer && !map.hasLayer(districtGeoLayer)) map.addLayer(districtGeoLayer);
    if (markersLayer && !map.hasLayer(markersLayer)) map.addLayer(markersLayer);
  } else {
    // 광역시도 + 광역 기관 마커만 표시
    if (districtGeoLayer && map.hasLayer(districtGeoLayer)) map.removeLayer(districtGeoLayer);
    if (markersLayer && map.hasLayer(markersLayer)) map.removeLayer(markersLayer);
    if (geoJsonLayer && !map.hasLayer(geoJsonLayer)) map.addLayer(geoJsonLayer);
    if (regionLabelsLayer && !map.hasLayer(regionLabelsLayer)) map.addLayer(regionLabelsLayer);
    if (regionMarkersLayer && !map.hasLayer(regionMarkersLayer)) map.addLayer(regionMarkersLayer);
  }
}

// ─── 시/군/구 스타일 (구매 상태별 색상) ───
function getDistrictStyle(regionName, districtName) {
  const districtInsts = institutionData.filter(d => d.region === regionName && d.district === districtName);

  let fillColor, status;
  if (districtInsts.length === 0) {
    // 미구매
    fillColor = '#EF5350'; // 빨강
    status = 'none';
  } else {
    const hasRepeat = districtInsts.some(d => ['반기', '분기', '연간'].includes(d.purchaseCycle));
    if (hasRepeat) {
      // 반복구매
      fillColor = '#42A5F5'; // 파랑
      status = 'repeat';
    } else {
      // 1회 구매
      fillColor = '#66BB6A'; // 초록
      status = 'single';
    }
  }

  return {
    fillColor,
    weight: 1,
    opacity: 1,
    color: '#fff',
    fillOpacity: 0.5
  };
}

// 시/군/구 툴팁
function getDistrictTooltip(regionName, districtName) {
  const insts = institutionData.filter(d => d.region === regionName && d.district === districtName);
  const amount = insts.reduce((sum, d) => sum + d.purchaseAmount, 0);
  const volume = insts.reduce((sum, d) => sum + d.purchaseVolume, 0);
  const hasRepeat = insts.some(d => ['반기', '분기', '연간'].includes(d.purchaseCycle));

  let statusText, statusColor;
  if (insts.length === 0) {
    statusText = '미구매'; statusColor = '#F44336';
  } else if (hasRepeat) {
    statusText = '반복구매'; statusColor = '#1976D2';
  } else {
    statusText = '1회구매'; statusColor = '#388E3C';
  }

  return `<strong>${districtName}</strong> <span style="color:${statusColor}; font-weight:700;">[${statusText}]</span><br>
    기관수: ${insts.length}개<br>
    ${insts.length > 0 ? `납품액: ${formatCurrency(amount)}<br>구매량: ${volume.toLocaleString()}개` : '구매 기관 없음'}`;
}

// ─── 광역시도 스타일 (구매 상태별 색상) ───
function getRegionStyle(regionName) {
  const regionData = filteredData.filter(d => d.region === regionName);
  if (regionData.length === 0) {
    return { fillColor: '#EF5350', weight: 1.5, opacity: 1, color: '#fff', fillOpacity: 0.35 };
  }
  const hasRepeat = regionData.some(d => ['반기', '분기', '연간'].includes(d.purchaseCycle));
  const totalAmount = regionData.reduce((sum, d) => sum + d.purchaseAmount, 0);

  let fillColor;
  if (hasRepeat) {
    // 파랑 계열 (금액 기준 진하기)
    if (totalAmount > 50000000) fillColor = '#1565C0';
    else if (totalAmount > 20000000) fillColor = '#1976D2';
    else if (totalAmount > 10000000) fillColor = '#1E88E5';
    else fillColor = '#42A5F5';
  } else {
    // 초록 계열
    if (totalAmount > 20000000) fillColor = '#2E7D32';
    else if (totalAmount > 10000000) fillColor = '#388E3C';
    else fillColor = '#66BB6A';
  }

  return { fillColor, weight: 1.5, opacity: 1, color: '#fff', fillOpacity: 0.45 };
}

// 지역 툴팁
function getRegionTooltip(regionName) {
  const regionData = filteredData.filter(d => d.region === regionName);
  const totalAmount = regionData.reduce((sum, d) => sum + d.purchaseAmount, 0);
  const totalVolume = regionData.reduce((sum, d) => sum + d.purchaseVolume, 0);
  const total = REGION_TOTAL_TARGETS[regionName] || 0;
  const purchased = regionData.filter(d => ['구매', '만족', '추천'].includes(d.purchaseStage)).length;
  const notPurchased = total - purchased;
  return `<strong>${regionName}</strong><br>기관수: ${regionData.length}개<br>납품액: ${formatCurrency(totalAmount)}<br>구매량: ${totalVolume.toLocaleString()}개<br><span style="color:#F44336;">미구매: ${notPurchased}개</span>`;
}

// 지역별 미구매 라벨 업데이트
function updateRegionLabels() {
  regionLabelsLayer.clearLayers();

  Object.keys(REGION_TOTAL_TARGETS).forEach(region => {
    const center = REGION_CENTERS[region];
    if (!center) return;

    const total = REGION_TOTAL_TARGETS[region];
    const purchased = institutionData.filter(d =>
      d.region === region && ['구매', '만족', '추천'].includes(d.purchaseStage)
    ).length;
    const notPurchased = total - purchased;

    if (notPurchased <= 0) return;

    const label = L.divIcon({
      className: 'region-label',
      html: `<div class="region-label-inner" data-region="${region}">
        <span class="region-label-count">${notPurchased}</span>
        <span class="region-label-text">미구매</span>
      </div>`,
      iconSize: [52, 28],
      iconAnchor: [26, 14]
    });

    const marker = L.marker(center, { icon: label, interactive: true });
    marker.on('click', () => {
      updateInfoRegionSummary(region);
      showRegionModal(region);
    });
    marker.addTo(regionLabelsLayer);
  });
}

// 광역시도 줌용 마커 (광역 기관만)
function updateRegionMarkers() {
  regionMarkersLayer.clearLayers();

  filteredData
    .filter(d => d.type === '광역시도 건강증진부서')
    .forEach(inst => {
      const typeInfo = INSTITUTION_TYPES[inst.type] || { color: '#999', icon: '?' };
      const stageColor = STAGE_COLORS[inst.purchaseStage] || '#ccc';
      const isPurchased = ['구매', '만족', '추천'].includes(inst.purchaseStage);

      const markerIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          background: ${typeInfo.color};
          width: 32px; height: 32px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: white; font-weight: bold; font-size: 13px;
          border: 3px solid ${stageColor};
          box-shadow: 0 2px 8px rgba(0,0,0,0.35);
          cursor: pointer;
          ${!isPurchased ? 'opacity: 0.6;' : ''}
        ">${typeInfo.icon}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([inst.lat, inst.lng], { icon: markerIcon });
      marker.bindPopup(`
        <div style="min-width:200px; font-size:13px; line-height:1.6;">
          <strong style="font-size:14px; color:#1a237e;">${inst.name}</strong><br>
          <span style="display:inline-block; padding:2px 8px; border-radius:10px; background:${typeInfo.color}; color:white; font-size:11px; margin:4px 0;">${inst.type}</span>
          <span style="display:inline-block; padding:2px 8px; border-radius:10px; background:${stageColor}; font-size:11px; margin:4px 0;">${inst.purchaseStage}</span>
          <hr style="margin:6px 0; border:none; border-top:1px solid #eee;">
          <b>제품:</b> ${inst.products.join(', ')}<br>
          <b>구매량:</b> ${inst.purchaseVolume.toLocaleString()}개<br>
          <b>납품액:</b> ${formatCurrency(inst.purchaseAmount)}<br>
          <b>구매주기:</b> ${inst.purchaseCycle}<br>
          <b>최근구매:</b> ${inst.lastPurchaseDate || '-'}
        </div>
      `);
      marker.addTo(regionMarkersLayer);
    });
}

// 전체 기관 마커 업데이트 (시군구 줌용)
function updateMarkers() {
  markersLayer.clearLayers();

  filteredData.forEach(inst => {
    const typeInfo = INSTITUTION_TYPES[inst.type] || { color: '#999', icon: '?' };
    const stageColor = STAGE_COLORS[inst.purchaseStage] || '#ccc';
    const isPurchased = ['구매', '만족', '추천'].includes(inst.purchaseStage);

    const markerIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        background: ${typeInfo.color};
        width: 28px; height: 28px;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        color: white; font-weight: bold; font-size: 12px;
        border: 3px solid ${stageColor};
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        cursor: pointer;
        ${!isPurchased ? 'opacity: 0.6;' : ''}
      ">${typeInfo.icon}</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const marker = L.marker([inst.lat, inst.lng], { icon: markerIcon });

    marker.bindPopup(`
      <div style="min-width:200px; font-size:13px; line-height:1.6;">
        <strong style="font-size:14px; color:#1a237e;">${inst.name}</strong><br>
        <span style="display:inline-block; padding:2px 8px; border-radius:10px; background:${typeInfo.color}; color:white; font-size:11px; margin:4px 0;">${inst.type}</span>
        <span style="display:inline-block; padding:2px 8px; border-radius:10px; background:${stageColor}; font-size:11px; margin:4px 0;">${inst.purchaseStage}</span>
        <hr style="margin:6px 0; border:none; border-top:1px solid #eee;">
        <b>제품:</b> ${inst.products.join(', ')}<br>
        <b>구매량:</b> ${inst.purchaseVolume.toLocaleString()}개<br>
        <b>납품액:</b> ${formatCurrency(inst.purchaseAmount)}<br>
        <b>구매주기:</b> ${inst.purchaseCycle}<br>
        <b>최근구매:</b> ${inst.lastPurchaseDate || '-'}
      </div>
    `);

    marker.addTo(markersLayer);
  });
}

// 지역 클릭 시 미구매 기관 모달 표시
function showRegionModal(regionName) {
  const total = REGION_TOTAL_TARGETS[regionName] || 0;
  const allInRegion = institutionData.filter(d => d.region === regionName);
  const purchased = allInRegion.filter(d => ['구매', '만족', '추천'].includes(d.purchaseStage));
  const prospects = allInRegion.filter(d => ['인지', '관심', '고려'].includes(d.purchaseStage));
  const untouched = total - allInRegion.length;
  const sharePercent = total > 0 ? ((purchased.length / total) * 100).toFixed(1) : '0.0';

  const stageOrder = { '고려': 0, '관심': 1, '인지': 2 };
  prospects.sort((a, b) => stageOrder[a.purchaseStage] - stageOrder[b.purchaseStage]);

  let prospectRows = '';
  if (prospects.length > 0) {
    prospectRows = prospects.map(d => {
      const typeInfo = INSTITUTION_TYPES[d.type] || { color: '#999' };
      const stageColor = STAGE_COLORS[d.purchaseStage] || '#ccc';
      return `<tr>
        <td style="font-weight:600;">${d.name}</td>
        <td><span style="color:${typeInfo.color}; font-weight:600; font-size:0.78rem;">${d.type}</span></td>
        <td><span style="display:inline-block; padding:1px 8px; border-radius:10px; background:${stageColor}; font-size:0.75rem;">${d.purchaseStage}</span></td>
        <td>${d.products.join(', ')}</td>
      </tr>`;
    }).join('');
  } else {
    prospectRows = '<tr><td colspan="4" style="text-align:center; color:#999; padding:16px;">예상고객 없음</td></tr>';
  }

  let purchasedRows = '';
  if (purchased.length > 0) {
    purchasedRows = purchased.map(d => {
      const typeInfo = INSTITUTION_TYPES[d.type] || { color: '#999' };
      return `<tr>
        <td style="font-weight:600;">${d.name}</td>
        <td><span style="color:${typeInfo.color}; font-weight:600; font-size:0.78rem;">${d.type}</span></td>
        <td>${formatCurrency(d.purchaseAmount)}</td>
        <td>${d.lastPurchaseDate || '-'}</td>
      </tr>`;
    }).join('');
  }

  const modal = document.getElementById('regionModal');
  const content = document.getElementById('regionModalContent');

  content.innerHTML = `
    <div class="modal-header">
      <h3>${regionName}</h3>
      <button class="modal-close" onclick="closeRegionModal()">&times;</button>
    </div>
    <div class="modal-summary">
      <div class="modal-stat">
        <span class="modal-stat-label">전체 대상</span>
        <span class="modal-stat-value">${total}개</span>
      </div>
      <div class="modal-stat">
        <span class="modal-stat-label">구매기관</span>
        <span class="modal-stat-value" style="color:#4CAF50;">${purchased.length}개</span>
      </div>
      <div class="modal-stat">
        <span class="modal-stat-label">예상고객</span>
        <span class="modal-stat-value" style="color:#FF9800;">${prospects.length}개</span>
      </div>
      <div class="modal-stat">
        <span class="modal-stat-label">미접촉</span>
        <span class="modal-stat-value" style="color:#F44336;">${untouched}개</span>
      </div>
      <div class="modal-stat">
        <span class="modal-stat-label">점유율</span>
        <span class="modal-stat-value" style="color:#1a237e;">${sharePercent}%</span>
      </div>
    </div>

    <div class="modal-table-section">
      <h4>예상고객 (미구매 접촉기관) - ${prospects.length}개</h4>
      <div class="modal-table-wrap">
        <table class="modal-table prospect-modal-table">
          <thead>
            <tr><th>기관명</th><th>기관유형</th><th>구매단계</th><th>관심제품</th></tr>
          </thead>
          <tbody>${prospectRows}</tbody>
        </table>
      </div>
    </div>

    ${purchased.length > 0 ? `
    <div class="modal-table-section">
      <h4>구매완료 기관 - ${purchased.length}개</h4>
      <div class="modal-table-wrap">
        <table class="modal-table purchased-modal-table">
          <thead>
            <tr><th>기관명</th><th>기관유형</th><th>납품액</th><th>최근구매일</th></tr>
          </thead>
          <tbody>${purchasedRows}</tbody>
        </table>
      </div>
    </div>` : ''}

    <div class="modal-footer">
      <button class="modal-filter-btn" onclick="filterByRegion('${regionName}')">이 지역만 필터링</button>
      <button class="modal-close-btn" onclick="closeRegionModal()">닫기</button>
    </div>
  `;

  modal.classList.add('active');
}

// 모달 닫기
function closeRegionModal() {
  document.getElementById('regionModal').classList.remove('active');
}

// 모달에서 지역 필터링
function filterByRegion(regionName) {
  document.getElementById('filterRegion').value = regionName;
  updateDistrictFilter();
  applyFilters();
  zoomToRegion(regionName);
  closeRegionModal();
}

// 광역시도 선택 시 지도 줌
function zoomToRegion(regionName) {
  if (!regionName || regionName === 'all') {
    // 전체 보기로 복귀
    map.setView([36.0, 127.8], 7);
    return;
  }

  // GeoJSON 레이어에서 해당 지역의 bounds 찾기
  let bounds = null;
  if (geoJsonLayer) {
    geoJsonLayer.eachLayer(layer => {
      if (layer.feature.properties.name === regionName) {
        bounds = layer.getBounds();
      }
    });
  }

  if (bounds) {
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 10 });
  } else if (REGION_CENTERS[regionName]) {
    // GeoJSON 로드 전이면 좌표 기반 줌
    map.setView(REGION_CENTERS[regionName], 9);
  }
}

// 시/군/구 선택 시 지도 줌
function zoomToDistrict(regionName, districtName) {
  if (!districtName || districtName === 'all') {
    // 광역시도 레벨로 줌
    zoomToRegion(regionName);
    return;
  }

  // 시/군/구 GeoJSON 레이어에서 해당 지역 bounds 찾기
  let bounds = null;
  if (districtGeoLayer) {
    districtGeoLayer.eachLayer(layer => {
      const p = layer.feature.properties;
      if (p.region === regionName && p.district === districtName) {
        bounds = layer.getBounds();
      }
    });
  }

  if (bounds) {
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 13 });
  } else {
    // 해당 시/군/구 기관 좌표 기반 줌
    const insts = institutionData.filter(d => d.region === regionName && d.district === districtName);
    if (insts.length > 0) {
      const lats = insts.map(d => d.lat);
      const lngs = insts.map(d => d.lng);
      map.fitBounds([
        [Math.min(...lats) - 0.02, Math.min(...lngs) - 0.02],
        [Math.max(...lats) + 0.02, Math.max(...lngs) + 0.02]
      ], { maxZoom: 13 });
    }
  }
}

// GeoJSON 스타일 업데이트
function updateGeoJsonStyle() {
  if (geoJsonLayer) {
    geoJsonLayer.eachLayer(layer => {
      const name = layer.feature.properties.name;
      layer.setStyle(getRegionStyle(name));
    });
  }
  if (districtGeoLayer) {
    districtGeoLayer.eachLayer(layer => {
      const p = layer.feature.properties;
      layer.setStyle(getDistrictStyle(p.region, p.district));
    });
  }
  updateRegionLabels();
}
