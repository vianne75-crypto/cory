#!/usr/bin/env python3
"""6월 대리점 세금계산서 — 팝빌 API 즉시발행 (국세청 전자세금계산서)
------------------------------------------------------------------
- 공급자: (주)웰니스컴퍼니 올리브 720-88-02148 (팝빌 국세청 위임 완료)
- 작성일자 2026-06-30(월말) · 항목 거래일자=입금일 · 단가 공란 · 청구
- 안전장치: 연동 확인 → 건별 대표 승인(y) → registIssue → Supabase invoice_issued 반영

실행:
  # 팝빌 연동키 (팝빌 → 연동관리 → 연동인증정보)
  export POPBILL_LINKID='...'  POPBILL_SECRETKEY='...'
  export POPBILL_TEST=1        # 테스트환경(국세청 미전송) — 실발행은 0 또는 미설정
  python3 scripts/issue_invoices_asp.py
"""
import os, requests
from popbill import TaxinvoiceService, Taxinvoice, TaxinvoiceDetail, PopbillException

LINKID    = os.environ.get("POPBILL_LINKID", "")
SECRETKEY = os.environ.get("POPBILL_SECRETKEY", "")
IS_TEST   = os.environ.get("POPBILL_TEST", "0") == "1"

CORP_NUM  = "7208802148"  # 공급자(팝빌 회원) 사업자번호
SUPABASE_URL = "https://rvqkoiqjjhlrgqitnxwt.supabase.co"
SUPABASE_KEY = "sb_publishable_LhUYFVbX3M_8zbiBzaLgZQ_MSOfc1TU"

# ── 공급자 고정 정보 ──
INVOICER = dict(
    corpName="(주)웰니스컴퍼니 올리브", ceoName="안영관",
    addr="경기 고양시 덕양구 삼원로 73 한일윈스타 지식산업센터 303호",
    bizType="제조 도소매 서비스", bizClass="보건교육기자재",
    contactName="안영관", email="",
)

# ── 발행 4장 (발행목록 2026-06 · 기프트수림 합산 2줄) ──
INVOICES = [
    dict(order="138455", corpNum="2248160485", corpName="(주)아이에스", ceo="성영석",
         email="is9779@naver.com",
         details=[dict(dt="20260604", name="APS알쓰패치(인쇄별도)", qty="300", supply="619090", tax="61910")],
         supply="619090", taxv="61910", total="681000"),
    dict(order="138485", corpNum="1120485620", corpName="정수메디칼", ceo="이정일",
         email="icatskr@naver.com",
         details=[dict(dt="20260609", name="APS알쓰패치(인쇄포함)", qty="800", supply="1389090", tax="138910")],
         supply="1389090", taxv="138910", total="1528000"),
    dict(order="138595", corpNum="8682001193", corpName="맥선", ceo="김지수",
         email="sooew20@naver.com",
         details=[dict(dt="20260622", name="APS알쓰패치(인쇄포함)", qty="1200", supply="1941818", tax="194182")],
         supply="1941818", taxv="194182", total="2136000"),
    dict(order="138565+138655", corpNum="1311085864", corpName="기프트수림", ceo="김은주 외 1명",
         email="sulim7113@hanmail.net",
         details=[dict(dt="20260617", name="APS알쓰패치(인쇄포함)", qty="500", supply="809090", tax="80910"),
                  dict(dt="20260630", name="APS알쓰패치(인쇄포함)", qty="500", supply="809090", tax="80910")],
         supply="1618180", taxv="161820", total="1780000", orders=["138565", "138655"]),
]

WRITE_DATE = "20260630"


def build_taxinvoice(inv, mgtkey):
    details = []
    for i, d in enumerate(inv["details"], 1):
        details.append(TaxinvoiceDetail(
            serialNum=i, purchaseDT=d["dt"], itemName=d["name"], spec="",
            qty=d["qty"], unitCost="", supplyCost=d["supply"], tax=d["tax"],
            remark=f"주문 {inv['order']}"))
    return Taxinvoice(
        writeDate=WRITE_DATE, chargeDirection="정과금", issueType="정발행",
        purposeType="청구", taxType="과세",
        invoicerCorpNum=CORP_NUM, invoicerMgtKey=mgtkey,
        invoicerCorpName=INVOICER["corpName"], invoicerCEOName=INVOICER["ceoName"],
        invoicerAddr=INVOICER["addr"], invoicerBizType=INVOICER["bizType"],
        invoicerBizClass=INVOICER["bizClass"], invoicerContactName=INVOICER["contactName"],
        invoicerEmail=INVOICER["email"],
        invoiceeType="사업자", invoiceeCorpNum=inv["corpNum"],
        invoiceeCorpName=inv["corpName"], invoiceeCEOName=inv["ceo"],
        invoiceeEmail1=inv["email"],
        supplyCostTotal=inv["supply"], taxTotal=inv["taxv"], totalAmount=inv["total"],
        detailList=details)


def mark_issued(order_ids):
    h = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}",
         "Content-Type": "application/json", "Prefer": "return=minimal"}
    for oid in order_ids:
        requests.patch(f"{SUPABASE_URL}/rest/v1/orders?order_idx=eq.{oid}",
                       headers=h, json={"invoice_issued": True, "invoice_date": "2026-06-30"}, timeout=10)


def main():
    if not LINKID or not SECRETKEY:
        print("❌ POPBILL_LINKID / POPBILL_SECRETKEY 환경변수를 설정하세요.")
        print("   팝빌 → 연동관리 → 연동인증정보 (LinkID·SecretKey)")
        return

    svc = TaxinvoiceService(LINKID, SECRETKEY)
    svc.IsTest = IS_TEST
    print(f"\n{'='*54}\n  팝빌 세금계산서 발행 {'[테스트환경]' if IS_TEST else '[실발행·국세청 전송]'}")
    print(f"  공급자 {CORP_NUM} · 대상 {len(INVOICES)}장\n{'='*54}")

    # 연동 확인
    try:
        bal = svc.getBalance(CORP_NUM)
        print(f"  연동 OK · 잔여포인트 {bal}")
    except PopbillException as e:
        print(f"  ❌ 연동 실패 [{e.code}] {e.message}")
        return

    if not IS_TEST:
        if input("\n⚠️ 실발행(국세청 전송)입니다. 진행? (yes 입력): ").strip() != "yes":
            print("중단."); return

    for inv in INVOICES:
        total = int(inv["total"])
        print(f"\n── {inv['corpName']} ({inv['corpNum']}) ──")
        for d in inv["details"]:
            print(f"   {d['dt'][4:6]}/{d['dt'][6:8]} {d['name']} 수량{d['qty']} 공급{int(d['supply']):,} 세액{int(d['tax']):,}")
        print(f"   합계 {total:,} (공급 {int(inv['supply']):,} + 세액 {int(inv['taxv']):,}) → {inv['email']}")
        if input("   발행? (y/skip): ").strip().lower() != "y":
            print("   건너뜀."); continue

        mgtkey = f"D202606{inv['corpNum']}"  # 문서관리번호(공급자 내 유일)
        try:
            svc.registIssue(CORP_NUM, build_taxinvoice(inv, mgtkey), False, "6월 대리점 정기발행")
            print(f"   ✅ 발행 완료 (관리번호 {mgtkey})")
            mark_issued(inv.get("orders", [inv["order"]]))
        except PopbillException as e:
            print(f"   ❌ 발행 실패 [{e.code}] {e.message}")

    print("\n완료.")


if __name__ == "__main__":
    main()
