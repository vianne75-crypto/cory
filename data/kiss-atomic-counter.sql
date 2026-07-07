-- ============================================
-- KISS 카운터 원자적 슬롯 확보 (초과신청 방지)
-- 작성: 2026-07-05 (FLUX)
-- 목적: "COUNT 읽고 → INSERT" 2단계의 race를 제거.
--       동시 요청이 100 상한을 넘겨 저장하는 것을 DB가 물리적으로 차단.
-- 실행: Supabase SQL Editor (fast-follow — 라이브 동작에는 지장 없음)
-- ============================================

-- 원리: settings 행에 FOR UPDATE 락을 걸어 동시 클레임을 '한 줄로 세운다'.
--       락 안에서 COUNT를 읽고 상한 미만일 때만 INSERT → 초과 불가능.

CREATE OR REPLACE FUNCTION public.kiss_claim_slot(payload jsonb)
RETURNS TABLE(new_id int, cur int, cap int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cap int;
  v_cur int;
  v_closed boolean;
  v_id int;
BEGIN
  -- 1) 설정 행 락 (동시 클레임 직렬화)
  SELECT COALESCE((value->>'max')::int, 100),
         COALESCE((value->>'closed')::boolean, false)
    INTO v_cap, v_closed
    FROM public.settings
    WHERE key = 'kiss_counter'
    FOR UPDATE;

  -- 2) 현재 신청 수 (락 안에서 읽어야 정확)
  SELECT COUNT(*) INTO v_cur
    FROM public.kiss_signups
    WHERE created_at >= '2026-07-02';

  -- 3) 마감 판정 → 마감이면 new_id NULL 반환
  IF v_closed OR v_cur >= v_cap THEN
    RETURN QUERY SELECT NULL::int, v_cur, v_cap;
    RETURN;
  END IF;

  -- 4) 슬롯 확보 성공 → INSERT
  INSERT INTO public.kiss_signups
    SELECT * FROM jsonb_populate_record(NULL::public.kiss_signups, payload)
    RETURNING id INTO v_id;

  RETURN QUERY SELECT v_id, v_cur + 1, v_cap;
END;
$$;

-- Worker(service_role)가 RPC 호출할 수 있도록 실행 권한
GRANT EXECUTE ON FUNCTION public.kiss_claim_slot(jsonb) TO service_role;

-- ─── 실행 후: Worker를 이 RPC 호출로 전환해야 효과 발생 ───
-- POST /rest/v1/rpc/kiss_claim_slot  body: { "payload": { ...신청 필드... } }
-- 반환 new_id가 NULL이면 410 마감 응답.
-- (FLUX가 aps-lead-worker.js kissSubmit의 2단계 read+insert를 이 호출로 교체)

-- ─── 검증 (별도 실행) ───
/*
SELECT * FROM public.kiss_claim_slot('{"name":"락테스트","phone":"010-0000-0000","institution_name":"테스트","privacy_agreed":true}'::jsonb);
-- 성공 시 new_id/cur/cap 반환. 이후 DELETE FROM kiss_signups WHERE name='락테스트';
*/
