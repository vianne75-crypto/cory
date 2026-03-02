// ============================================
// Supabase 클라이언트 초기화
// ============================================

// ★ Supabase 프로젝트 설정에서 복사한 값으로 교체
const SUPABASE_URL = 'https://rvqkoiqjjhlrgqitnxwt.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_LhUYFVbX3M_8zbiBzaLgZQ_MSOfc1TU';

// Supabase 클라이언트 생성 (CDN이 만든 전역 supabase를 클라이언트로 교체)
supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
