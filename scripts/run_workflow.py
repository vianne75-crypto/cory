#!/usr/bin/env python3
"""
B2G 납품 워크플로 통합 실행
------------------------------------
사용법:
  python3 scripts/run_workflow.py [주문번호]

흐름:
  1. 주문번호 입력 (CLI 인자 또는 대화식)
  2. Supabase에서 주문 + 기관 정보 자동 조회
  3. 거래명세서 PDF 자동 생성 + Preview 오픈
  4. 홈택스 세금계산서 자동 발행 여부 선택

필요 설치:
  pip3 install requests anthropic pyautogui pyperclip pillow reportlab
"""

import sys, os, math, subprocess
from datetime import date

# Supabase 접속 정보
SUPABASE_URL = "https://rvqkoiqjjhlrgqitnxwt.supabase.co"
SUPABASE_KEY = "sb_publishable_LhUYFVbX3M_8zbiBzaLgZQ_MSOfc1TU"


def supabase_get(table: str, params: dict) -> list:
    try:
        import requests
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
        }
        resp = requests.get(
            f"{SUPABASE_URL}/rest/v1/{table}",
            headers=headers, params=params, timeout=10
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print(f"  ⚠ Supabase 조회 실패: {e}")
        return []


def fmt(n: int) -> str:
    return f"{n:,}"


def calc_vat(total: int) -> tuple[int, int]:
    """VAT 포함 총액 → (공급가액, 세액)"""
    supply = math.floor(total / 1.1)
    tax = total - supply
    return supply, tax


def get_order_from_supabase(order_no: str) -> dict | None:
    """Supabase orders 테이블에서 주문 조회 + 기관 정보 자동 연결"""
    print(f"\n  Supabase 조회 중 (주문번호: {order_no})...")
    rows = supabase_get("orders", {
        "order_idx": f"eq.{order_no}",
        "select": "order_idx,goods_name,sale_price,sale_cnt,reg_time,addr,option_user,institution_id",
        "limit": "10",
    })
    if not rows:
        print("  ⚠ 주문 미발견. 수동 입력으로 전환합니다.")
        return None

    # 상품별 행 합산 (동일 주문번호 여러 행 가능)
    row = rows[0]
    total_cnt = sum(int(r.get("sale_cnt") or 1) for r in rows)
    total_price = sum(int(r.get("sale_price") or 0) * int(r.get("sale_cnt") or 1) for r in rows)
    goods = rows[0].get("goods_name", "APS알쓰패치")
    print(f"  ✓ 주문 발견: {goods} × {total_cnt}개 = {total_price:,}원")

    # 기관 정보 조회 (institution_id 기반)
    inst_info = {}
    inst_id = row.get("institution_id")
    if inst_id:
        insts = supabase_get("institutions", {
            "id": f"eq.{inst_id}",
            "select": "id,name,region,district,metadata",
            "limit": "1",
        })
        if insts:
            inst_info = insts[0]
            print(f"  ✓ 기관 연결: {inst_info.get('name', '')} (ID:{inst_id})")

    row["_total_price"] = total_price
    row["_total_cnt"] = total_cnt
    return {"row": row, "inst": inst_info}


def build_order_manual(order_no: str) -> dict:
    """수동 입력으로 ORDER dict 구성"""
    print("\n[주문 정보 수동 입력]")
    receiver = input("  기관명: ").strip()

    today = date.today()
    date_str = input(f"  납품일 [YYYY-MM-DD, 기본={today}]: ").strip()
    if not date_str:
        order_date = today
    else:
        y, m, d = date_str.split("-")
        order_date = date(int(y), int(m), int(d))

    product = input("  품목명 [기본=APS알쓰패치]: ").strip() or "APS알쓰패치"
    qty = int(input("  수량: ").strip())
    total = int(input("  총금액 (VAT포함, 원): ").strip())
    vat_incl = input("  VAT포함 여부? (y=포함/n=별도) [기본=y]: ").strip().lower()

    if vat_incl != "n":
        supply_amt, tax_amt = calc_vat(total)
        unit_price = math.floor(supply_amt / qty)
    else:
        supply_amt = total
        tax_amt = math.floor(supply_amt * 0.1)
        unit_price = math.floor(supply_amt / qty)

    print(f"\n  단가: {fmt(unit_price)}원 / 공급가액: {fmt(supply_amt)}원 / 세액: {fmt(tax_amt)}원")

    return {
        "date":      order_date,
        "receiver":  receiver,
        "items": [{
            "name":       product,
            "qty":        qty,
            "unit_price": unit_price,
            "supply_amt": supply_amt,
            "tax_amt":    tax_amt,
        }],
        "order_no": order_no,
    }


def run_invoice(order: dict) -> str:
    """거래명세서 PDF 생성 → 파일 경로 반환"""
    # generate_invoice.py의 make_pdf 재사용
    script_dir = os.path.dirname(os.path.abspath(__file__))
    sys.path.insert(0, script_dir)
    from generate_invoice import make_pdf, SUPPLIER, fmt as inv_fmt

    d = order["date"]
    folder = f"/Users/olive/Qsync/계약서류/{order['receiver']}"
    os.makedirs(folder, exist_ok=True)
    filename = f"{str(d.year)[2:]}{d.month:02d}_거래명세서_{order['receiver']}.pdf"
    out_path = os.path.join(folder, filename)

    print(f"\n[거래명세서 생성]")
    print(f"  기관: {order['receiver']}")
    print(f"  날짜: {d.year}년 {d.month}월 {d.day}일")
    print(f"  품목: {order['items'][0]['name']} × {order['items'][0]['qty']}개")
    total_amt = order['items'][0]['supply_amt'] + order['items'][0]['tax_amt']
    print(f"  금액: {fmt(total_amt)}원")
    print(f"  저장: {out_path}")

    make_pdf(order, SUPPLIER, out_path)
    print("  ✅ 생성 완료")
    subprocess.Popen(["open", out_path])
    return out_path


def build_hometax_invoice(order: dict):
    """hometax_cu.py의 INVOICE dict 구성"""
    d = order["date"]
    item = order["items"][0]
    return {
        "date":     d.strftime("%Y-%m-%d"),
        "receiver": {
            "type":   "non-business",
            "reg_no": "",        # Supabase 또는 수동 입력 필요
            "name":   order["receiver"],
            "ceo":    "",
            "addr":   "",
        },
        "items": [{
            "name":       item["name"],
            "qty":        item["qty"],
            "unit_price": item["unit_price"],
            "supply_amt": item["supply_amt"],
            "tax_amt":    item["tax_amt"],
        }],
        "billing_type": "청구",
        "memo": f"주문번호 {order['order_no']}",
    }


def run_hometax(order: dict, inst_meta: dict = None):
    """hometax_cu.py 실행 — DB에 정보 있으면 자동 입력, 없을 때만 수동"""
    invoice = build_hometax_invoice(order)
    meta = inst_meta or {}

    # DB에서 reg_no/ceo/addr 자동 추출
    reg_no = meta.get("reg_no", "").strip()
    ceo    = meta.get("ceo", "").strip()
    addr   = meta.get("address", "").strip()

    print("\n[홈택스 발행 정보]")
    if reg_no:
        print(f"  고유번호: {reg_no} (DB 자동)")
    else:
        reg_no = input("  고유번호/사업자번호: ").strip()

    if ceo:
        print(f"  대표자명: {ceo} (DB 자동)")
    else:
        ceo = input("  대표자명: ").strip()

    if addr:
        print(f"  소재지: {addr} (DB 자동)")
    else:
        addr = input("  소재지 (간략 입력 가능): ").strip()

    invoice["receiver"]["reg_no"] = reg_no
    invoice["receiver"]["ceo"]    = ceo
    invoice["receiver"]["addr"]   = addr

    # hometax_cu.py에 INVOICE 주입 후 실행
    import hometax_cu
    hometax_cu.INVOICE = invoice
    hometax_cu.main()


def main():
    # 주문번호 확인
    if len(sys.argv) > 1:
        order_no = sys.argv[1].strip()
    else:
        order_no = input("\n주문번호를 입력하세요: ").strip()

    if not order_no:
        print("주문번호가 없습니다. 종료.")
        return

    print(f"\n{'='*50}")
    print(f"  B2G 납품 워크플로 — 주문번호 {order_no}")
    print(f"{'='*50}")

    # 1. 주문 정보 조회
    db_result = get_order_from_supabase(order_no)

    inst_meta = {}
    if db_result:
        # Supabase 실제 스키마 기반 필드 매핑
        row  = db_result["row"]
        inst = db_result["inst"]
        inst_meta = inst.get("metadata") or {}

        # 날짜: reg_time (YYYYMMDD or ISO string)
        try:
            reg_time = str(row.get("reg_time", ""))
            if len(reg_time) == 8 and reg_time.isdigit():
                order_date = date(int(reg_time[:4]), int(reg_time[4:6]), int(reg_time[6:8]))
            else:
                order_date = date.fromisoformat(reg_time[:10])
        except Exception:
            order_date = date.today()

        total   = row.get("_total_price", 0)
        qty     = row.get("_total_cnt", 1)
        product = row.get("goods_name", "APS알쓰패치")
        # 기관명: institutions 테이블 우선, 없으면 option_user 파싱
        receiver = inst.get("name", "")
        if not receiver:
            import re
            m = re.search(r"사용처명\(필수\)\s*:\s*([^\n<]+)", row.get("option_user", ""))
            receiver = m.group(1).strip() if m else row.get("addr", "")[:20]

        if total == 0:
            total = int(input(f"  총금액 (VAT포함, 원): ").strip())

        supply_amt, tax_amt = calc_vat(total)
        unit_price = math.floor(supply_amt / qty) if qty > 0 else 0

        order = {
            "date":     order_date,
            "receiver": receiver,
            "items": [{
                "name":       product,
                "qty":        qty,
                "unit_price": unit_price,
                "supply_amt": supply_amt,
                "tax_amt":    tax_amt,
            }],
            "order_no": order_no,
        }

        print(f"\n  ┌─ 조회 결과 ─────────────────────")
        print(f"  │ 기관: {receiver}")
        print(f"  │ 품목: {product} × {qty}개")
        print(f"  │ 금액: {fmt(total)}원 (공급가 {fmt(supply_amt)} + 세액 {fmt(tax_amt)})")
        print(f"  └────────────────────────────────")
    else:
        order = build_order_manual(order_no)

    # 2. 거래명세서 PDF 생성 (확인 없이 자동 진행)
    pdf_path = run_invoice(order)

    # 3. 홈택스 세금계산서 발행
    print("\n" + "─"*40)
    hometax_yn = input("홈택스 세금계산서 자동 발행하시겠습니까? (y/n) [기본=n]: ").strip().lower()
    if hometax_yn == "y":
        run_hometax(order, inst_meta)
    else:
        print("\n[홈택스 수동 발행 정보]")
        item = order["items"][0]
        print(f"  작성일자: {order['date']}")
        print(f"  기관명: {order['receiver']}")
        print(f"  품목: {item['name']} / 수량: {fmt(item['qty'])} / 단가: {fmt(item['unit_price'])}")
        print(f"  공급가액: {fmt(item['supply_amt'])} / 세액: {fmt(item['tax_amt'])}")
        print(f"  비고: 주문번호 {order_no}")
        print(f"\n  거래명세서: {pdf_path}")

    print("\n✅ 워크플로 완료")


if __name__ == "__main__":
    main()
