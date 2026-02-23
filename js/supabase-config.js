// ============================================
// Supabase 클라이언트 초기화
// ============================================

// ★ Supabase 프로젝트 설정에서 복사한 값으로 교체
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';

// Supabase 클라이언트 생성
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
