// ============================================
// 대시보드 게시 (institutions → dashboard_cache)
// ============================================

async function loadPublishStatus() {
  const { data, error } = await supabase
    .from('dashboard_cache')
    .select('*')
    .eq('id', 1)
    .single();

  if (error || !data) return;

  document.getElementById('lastPublishTime').textContent =
    data.published_at ? new Date(data.published_at).toLocaleString('ko-KR') : '-';
  document.getElementById('lastPublishBy').textContent = data.published_by || '-';

  const cacheData = data.data || {};
  const instCount = (cacheData.institutions || []).length;
  document.getElementById('publishInstCount').textContent = instCount > 0 ? instCount + '개' : '-';
}

async function publishDashboard() {
  const btn = document.getElementById('publishBtn');
  const log = document.getElementById('publishLog');
  btn.disabled = true;
  btn.textContent = '게시 중...';
  log.classList.add('visible');
  log.textContent = '';

  try {
    log.textContent += '기관 데이터 로딩...\n';

    // 전체 기관 데이터 로드
    const { data: institutions, error } = await supabase
      .from('institutions')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;

    log.textContent += `${institutions.length}개 기관 로드 완료\n`;

    // 대시보드용 포맷으로 변환 (data.js 형식과 호환)
    const dashboardInstitutions = institutions.map(d => ({
      id: d.id,
      name: d.name,
      type: d.type,
      region: d.region,
      district: d.district,
      lat: d.lat,
      lng: d.lng,
      products: d.products || [],
      purchaseCycle: d.purchase_cycle || '-',
      purchaseVolume: d.purchase_volume || 0,
      purchaseAmount: d.purchase_amount || 0,
      purchaseStage: d.purchase_stage || '인지',
      lastPurchaseDate: d.last_purchase_date || '-',
      consultCount: d.consult_count || 0,
      lastConsultDate: d.last_consult_date || null
    }));

    // 설정값 로드
    const { data: settingsData } = await supabase
      .from('settings')
      .select('*');

    const settings = {};
    (settingsData || []).forEach(s => { settings[s.key] = s.value; });

    log.textContent += '캐시 데이터 구성...\n';

    const cacheData = {
      institutions: dashboardInstitutions,
      regionTargets: settings.region_targets || null,
      publishedAt: new Date().toISOString(),
      totalCount: dashboardInstitutions.length
    };

    // dashboard_cache 업데이트
    const { error: updateError } = await supabase
      .from('dashboard_cache')
      .update({
        data: cacheData,
        published_at: new Date().toISOString(),
        published_by: currentUser ? currentUser.email : 'unknown'
      })
      .eq('id', 1);

    if (updateError) throw updateError;

    log.textContent += `게시 완료! (${dashboardInstitutions.length}개 기관)\n`;
    showToast('대시보드 게시 완료', 'success');
    loadPublishStatus();

    // 마이그레이션 탭의 상태도 업데이트
    const migStatus3 = document.getElementById('migStatus3');
    if (migStatus3) {
      migStatus3.textContent = '완료';
      migStatus3.className = 'step-status success';
    }

  } catch (err) {
    log.textContent += '오류: ' + err.message + '\n';
    showToast('게시 실패: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '대시보드에 게시';
  }
}
