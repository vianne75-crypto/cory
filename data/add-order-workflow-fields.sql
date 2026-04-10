-- X5 P3+ 주문 워크플로 필드 추가
-- 실행: Supabase SQL Editor
-- 선행: add-payment-fields.sql (payment_confirmed, payment_date 이미 포함)

-- 결제
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT;         -- '카드' | '이체'
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_confirmed BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_date TEXT;

-- 세금계산서
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_issued BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_date TEXT;

-- 인쇄 접수
ALTER TABLE orders ADD COLUMN IF NOT EXISTS print_type TEXT;             -- '스티커' | '배너' | '현수막'
ALTER TABLE orders ADD COLUMN IF NOT EXISTS print_rush BOOLEAN DEFAULT false;  -- 당일판 여부
ALTER TABLE orders ADD COLUMN IF NOT EXISTS print_received BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS print_date TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS print_qty INTEGER;

-- 보류/메모
ALTER TABLE orders ADD COLUMN IF NOT EXISTS on_hold BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS memo_parsed BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS memo_raw TEXT;

-- 확인 쿼리
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'orders'
  AND column_name IN ('payment_method','payment_confirmed','payment_date',
                      'invoice_issued','invoice_date',
                      'print_type','print_rush','print_received','print_date','print_qty',
                      'on_hold','memo_parsed','memo_raw')
ORDER BY ordinal_position;
