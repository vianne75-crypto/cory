#!/usr/bin/env python3
"""6월 대리점 세금계산서 미리보기 (거래명세표 PDF) — 홈택스 발행 전 검토용.
작성일자 2026-06-30(월말) · 항목 거래일자=입금일 · 단가 공란 · 금액=애니빌드 실결제.
사용: python3 scripts/dealer_invoice_preview.py
"""
import os, subprocess
from datetime import date
from generate_invoice import make_pdf, SUPPLIER

WORK_DATE = date(2026, 6, 30)  # 작성일자 = 월말

# 발행 4장 (기프트수림은 합산·세부 2줄)
INVOICES = [
    {"receiver": "(주)아이에스", "biz_num": "224-81-60485",
     "items": [{"name": "APS알쓰패치(인쇄별도)", "qty": 300, "unit_price": "",
                "supply_amt": 619090, "tax_amt": 61910, "month": 6, "day": 4}]},
    {"receiver": "정수메디칼", "biz_num": "112-04-85620",
     "items": [{"name": "APS알쓰패치(인쇄포함)", "qty": 800, "unit_price": "",
                "supply_amt": 1389090, "tax_amt": 138910, "month": 6, "day": 9}]},
    {"receiver": "맥선", "biz_num": "868-20-01193",
     "items": [{"name": "APS알쓰패치(인쇄포함)", "qty": 1200, "unit_price": "",
                "supply_amt": 1941818, "tax_amt": 194182, "month": 6, "day": 22}]},
    {"receiver": "기프트수림", "biz_num": "131-10-85864",
     "items": [{"name": "APS알쓰패치(인쇄포함)", "qty": 500, "unit_price": "",
                "supply_amt": 809090, "tax_amt": 80910, "month": 6, "day": 17},
               {"name": "APS알쓰패치(인쇄포함)", "qty": 500, "unit_price": "",
                "supply_amt": 809090, "tax_amt": 80910, "month": 6, "day": 30}]},
]

OUT_DIR = "/Users/olive/Qsync/계약서류/세금계산서_미리보기_202606"


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    paths = []
    for inv in INVOICES:
        order = {"date": WORK_DATE, "receiver": inv["receiver"],
                 "items": inv["items"], "order_no": inv["biz_num"]}
        total = sum(i["supply_amt"] + i["tax_amt"] for i in inv["items"])
        out = os.path.join(OUT_DIR, f"세금계산서미리보기_{inv['receiver']}.pdf")
        make_pdf(order, SUPPLIER, out)
        paths.append(out)
        print(f"  ✓ {inv['receiver']} ({inv['biz_num']}) — 합계 {total:,}원 → {out}")
    print(f"\n총 {len(paths)}장 생성. 미리보기 오픈...")
    subprocess.run(["open"] + paths)


if __name__ == "__main__":
    main()
