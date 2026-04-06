-- X5 P3: 입금 확인 필드 추가
-- 실행: Supabase SQL Editor에서 실행

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_confirmed BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_date TEXT;

-- 기존 입금대기 주문 확인
SELECT order_idx, goods_name, state_subject, sale_price * sale_cnt AS amount
FROM orders
WHERE state_subject = '입금대기'
ORDER BY reg_time DESC;
