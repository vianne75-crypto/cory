// ============================================
// 관리자 앱 초기화 및 탭 라우팅
// ============================================

// 구매단계 색상 (data.js의 STAGE_COLORS 사용 가능하나, 독립적으로도 정의)
const ADMIN_STAGE_COLORS = {
  '인지': '#e0e0e0', '관심': '#b0bec5', '고려': '#ffb74d',
  '구매': '#4fc3f7', '만족': '#81c784', '추천': '#e57373'
};

// 페이지 크기
const PAGE_SIZE = 50;

// 관리자 앱 초기화
function initAdminApp() {
  bindAdminTabs();
  loadInstitutions();
  loadPublishStatus();
}

// 탭 전환
function bindAdminTabs() {
  document.querySelectorAll('.admin-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.admin-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const tabId = btn.dataset.tab;
      document.getElementById(tabId).classList.add('active');

      // 탭 진입 시 데이터 로드
      if (tabId === 'tab-consultations') loadConsultations();
      if (tabId === 'tab-unmatched') loadUnmatched();
      if (tabId === 'tab-orders') loadOrders();
      if (tabId === 'tab-settings') loadSettings();
    });
  });
}

// 금액 포맷 (utils.js와 동일)
function adminFormatCurrency(amount) {
  if (amount >= 100000000) return (amount / 100000000).toFixed(1) + '억원';
  if (amount >= 10000) return (amount / 10000).toFixed(0) + '만원';
  return amount.toLocaleString() + '원';
}

// 토스트 알림
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = 'toast ' + type + ' visible';
  setTimeout(() => {
    toast.classList.remove('visible');
  }, 3000);
}

// 페이지네이션 렌더링
function renderPagination(containerId, currentPage, totalPages, callback) {
  const container = document.getElementById(containerId);
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = '';
  html += `<button class="page-btn" onclick="${callback}(1)" ${currentPage === 1 ? 'disabled' : ''}>«</button>`;
  html += `<button class="page-btn" onclick="${callback}(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>‹</button>`;

  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);

  for (let i = start; i <= end; i++) {
    html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="${callback}(${i})">${i}</button>`;
  }

  html += `<button class="page-btn" onclick="${callback}(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>›</button>`;
  html += `<button class="page-btn" onclick="${callback}(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''}>»</button>`;
  html += `<span class="page-info">${currentPage} / ${totalPages}</span>`;

  container.innerHTML = html;
}

// DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  checkSession();
});
