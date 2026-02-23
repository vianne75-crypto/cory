// ============================================
// 관리자 로그인 (ID/PW 방식)
// ============================================

let currentUser = null;

const ADMIN_CREDENTIALS = {
  id: 'admin',
  pw: '1234'
};

// 로그인
function loginWithCredentials() {
  const id = document.getElementById('loginId').value.trim();
  const pw = document.getElementById('loginPw').value;

  if (id === ADMIN_CREDENTIALS.id && pw === ADMIN_CREDENTIALS.pw) {
    currentUser = { email: 'admin' };
    sessionStorage.setItem('admin_logged_in', 'true');
    showAdminMain();
  } else {
    document.getElementById('loginError').textContent = '아이디 또는 비밀번호가 올바르지 않습니다.';
  }
}

// 로그아웃
function logout() {
  currentUser = null;
  sessionStorage.removeItem('admin_logged_in');
  showLoginScreen();
}

// 세션 확인
function checkSession() {
  if (sessionStorage.getItem('admin_logged_in') === 'true') {
    currentUser = { email: 'admin' };
    showAdminMain();
  } else {
    showLoginScreen();
  }
}

// 화면 전환
function showLoginScreen() {
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('adminMain').style.display = 'none';
}

function showAdminMain() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminMain').style.display = 'block';
  document.getElementById('userEmail').textContent = currentUser.email;
  initAdminApp();
}
