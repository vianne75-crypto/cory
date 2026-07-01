#!/usr/bin/env python3
"""전월 대리점 판매 → 세금계산서 발행 목록 추출 (월초 루틴)

대리점(유통회원·APS대리점·대리점) 전월 주문을 cory Supabase orders에서 추출하여
run_workflow.py 배치 발행용 목록을 출력. 공동인증서 로그인·최종 발급은 수동.

사용: python3 cory/scripts/dealer_invoices_prev_month.py [YYYY-MM]
      (인자 없으면 전월 자동)

⚠️ 선결: DEALER_MEMLV = 대리점 3종의 실제 memlv 코드. wcolive 회원등급에서 확인 후 채울 것.
        (cory memlv_classification은 individual/institutional만 분류 — 대리점 라벨 부재)
        미분류 후보 코드: 1300 · 1800 · 2200 · 2000
"""
import sys, json, datetime, urllib.request

SUPABASE_URL = "https://rvqkoiqjjhlrgqitnxwt.supabase.co/rest/v1"
ANON_KEY = "sb_publishable_LhUYFVbX3M_8zbiBzaLgZQ_MSOfc1TU"

# 대리점 3종 memlv (wcolive 회원등급 확인 2026-07-01):
#   1100=유통회원 · 1400=APS대리점 · 3000=대리점
DEALER_MEMLV = ["1100", "1400", "3000"]
# 보조: 기관명/ID 기반 식별 (memlv 미채움 대비)
DEALER_NAME_KEYS = ["대리점", "유통"]


def prev_month(ym=None):
    if ym:
        y, m = map(int, ym.split("-"))
    else:
        t = datetime.date.today()
        y, m = (t.year, t.month - 1) if t.month > 1 else (t.year - 1, 12)
    start = datetime.date(y, m, 1)
    end = datetime.date(y + (m // 12), (m % 12) + 1, 1)
    return start.isoformat(), end.isoformat(), f"{y}-{m:02d}"


def fetch(start, end):
    q = (f"{SUPABASE_URL}/orders?select=order_idx,option_user,goods_name,sale_price,"
         f"sale_cnt,reg_time,memlv,mem_id,invoice_issued,state_subject&reg_time=gte.{start}&reg_time=lt.{end}")
    req = urllib.request.Request(q, headers={"apikey": ANON_KEY, "Authorization": f"Bearer {ANON_KEY}"})
    with urllib.request.urlopen(req, timeout=25) as r:
        return json.load(r)


def is_dealer(o):
    if DEALER_MEMLV and (o.get("memlv") or "") in DEALER_MEMLV:
        return True
    blob = (o.get("option_user") or "") + (o.get("mem_id") or "")
    return any(k in blob for k in DEALER_NAME_KEYS)


def main():
    ym = sys.argv[1] if len(sys.argv) > 1 else None
    start, end, label = prev_month(ym)
    orders = fetch(start, end)
    # 세금계산서 대상: 대리점 판매 + 고객취소 제외
    dealers = [o for o in orders if is_dealer(o) and o.get("state_subject") != "고객취소"]

    print(f"=== {label} 대리점 세금계산서 발행 목록 ===")
    if not DEALER_MEMLV:
        print("⚠️ DEALER_MEMLV 미설정 — 이름 기반만 탐지 중. memlv 코드 확인 후 채우면 정확도↑\n")
    if not dealers:
        print("대리점 주문 0건 (또는 memlv 코드 미설정으로 탐지 불가)")
        return
    total = 0
    for o in dealers:
        amt = (o.get("sale_price") or 0) * (o.get("sale_cnt") or 0)
        total += amt
        st = "발행완료" if o.get("invoice_issued") else "미발행"
        print(f"  주문 {o.get('order_idx')} | {o.get('option_user','')[:20]} | memlv {o.get('memlv')} "
              f"| {amt:,}원 | {st}")
    print(f"\n총 {len(dealers)}건 / {total:,}원 (VAT포함 기준)")
    print("\n▶ 배치 발행: 미발행 건별로")
    for o in dealers:
        if not o.get("invoice_issued"):
            print(f"    python3 cory/scripts/run_workflow.py {o.get('order_idx')}")


if __name__ == "__main__":
    main()
