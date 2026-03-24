#!/usr/bin/env python3
"""
거래명세표 PDF 자동 생성
-----------------------
사용법:
  python3 scripts/generate_invoice.py

출력:
  /Users/olive/Qsync/계약서류/[기관명]/YYMM_거래명세서_[기관명].pdf
  + 자동으로 미리보기 오픈
"""

import os, subprocess, tempfile
from datetime import date
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Image
from reportlab.lib.styles import ParagraphStyle

# ── 폰트 등록 ────────────────────────────────────────────────
FONT_REG  = "/Users/olive/Library/Fonts/HU진고딕250.ttf"
FONT_BOLD = "/Users/olive/Library/Fonts/HU진고딕250.ttf"
pdfmetrics.registerFont(TTFont("KR",     FONT_REG))
pdfmetrics.registerFont(TTFont("KRBold", FONT_BOLD))

STAMP_PATH = "/Users/olive/Qsync/웰니스컴퍼니올리브(이동중)/기초서류/법인인감-안영관m.png"

# ── 공급자 고정 정보 ─────────────────────────────────────────
SUPPLIER = {
    "reg_no": "720-88-02148",
    "name":   "(주)웰니스컴퍼니 올리브",
    "ceo":    "안영관, 엄세은",
    "addr":   "경기 고양시 덕양구 삼원로 73 한일윈스타 지식산업센터 303호",
    "biz":    "제조 도소매 서비스",
    "item":   "보건교육기자재, 웰니스기기, 웹에이젼시",
}

# ── 발행 정보 (여기만 수정) ──────────────────────────────────
ORDER = {
    "date":      date(2026, 3, 24),
    "receiver":  "경주시보건소",
    "items": [
        {
            "name":       "APS알쓰패치",
            "qty":        500,
            "unit_price": 1909,
            "supply_amt": 954545,
            "tax_amt":    95455,
        }
    ],
    "order_no":  "137565",
}
# ────────────────────────────────────────────────────────────

def fmt(n: int) -> str:
    return f"{n:,}"

def prep_stamp(path: str):
    """도장 흰 배경 → 투명 처리, 임시 PNG 경로 반환 (실패 시 None)"""
    if not os.path.exists(path):
        return None
    try:
        from PIL import Image as PILImg
        img = PILImg.open(path).convert("RGBA")
        px = list(img.getdata())
        new_px = [(255,255,255,0) if r>210 and g>210 and b>210 else (r,g,b,a)
                  for r,g,b,a in px]
        img.putdata(new_px)
        tmp = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
        img.save(tmp.name, "PNG")
        return tmp.name
    except Exception:
        return None


def make_pdf(order: dict, supplier: dict, out_path: str):
    doc = SimpleDocTemplate(
        out_path, pagesize=A4,
        leftMargin=12*mm, rightMargin=12*mm,
        topMargin=10*mm,  bottomMargin=10*mm,
    )
    W = A4[0] - 24*mm   # ≈ 186mm

    BD = colors.black
    BG = colors.HexColor("#EEF2FF")

    def st(size=8, bold=False, align="LEFT", color=colors.black):
        return ParagraphStyle(
            "s", fontName="KRBold" if bold else "KR",
            fontSize=size, leading=size*1.4, textColor=color,
            alignment={"LEFT":0, "CENTER":1, "RIGHT":2}[align],
        )

    elems = []

    # ── 1. 제목 행 ───────────────────────────────────────────
    # 책번호 그리드: 18+10+7+10+7 = 52mm
    BOOK_W = 52*mm
    book_grid = Table(
        [["책  번  호", "", "권", "", "호"],
         ["일련번호",   "", "",  "", ""]],
        colWidths=[18*mm, 10*mm, 7*mm, 10*mm, 7*mm],
        style=TableStyle([
            ("FONTNAME",      (0,0),(-1,-1),"KR"),
            ("FONTSIZE",      (0,0),(-1,-1),7),
            ("BOX",           (0,0),(-1,-1),0.5,BD),
            ("INNERGRID",     (0,0),(-1,-1),0.5,BD),
            ("VALIGN",        (0,0),(-1,-1),"MIDDLE"),
            ("ALIGN",         (0,0),(-1,-1),"CENTER"),
            ("TOPPADDING",    (0,0),(-1,-1),2),
            ("BOTTOMPADDING", (0,0),(-1,-1),2),
        ])
    )
    book_grid.hAlign = "RIGHT"

    # 85 + 49 + 52 = 186mm
    title_data = [[
        Paragraph("거  래  명  세  표", st(14, bold=True, align="CENTER")),
        Paragraph("(공급받는자  보관용)", st(8, align="LEFT")),
        book_grid,
    ]]
    title_tbl = Table(title_data, colWidths=[85*mm, W-85*mm-BOOK_W, BOOK_W])
    title_tbl.setStyle(TableStyle([
        ("VALIGN",        (0,0),(-1,-1),"MIDDLE"),
        ("BOX",           (0,0),(-1,-1),0.8,BD),
        ("TOPPADDING",    (0,0),(-1,-1),5),
        ("BOTTOMPADDING", (0,0),(-1,-1),5),
        ("LEFTPADDING",   (0,0),(0,0),6),
        ("ALIGN",         (2,0),(2,0),"RIGHT"),
        ("RIGHTPADDING",  (2,0),(2,0),0),
        ("TOPPADDING",    (2,0),(2,0),0),
        ("BOTTOMPADDING", (2,0),(2,0),0),
    ]))
    elems.append(title_tbl)

    # ── 2. 헤더 (3열 × 6행 플랫 테이블) ────────────────────
    d = order["date"]
    total = sum(i["supply_amt"] + i["tax_amt"] for i in order["items"])

    left_para = Paragraph(
        f"<b>{d.year}년  {d.month:02d}월  {d.day:02d}일</b>  No.<br/><br/>"
        f"<b>{order['receiver']}</b>  귀하<br/><br/>"
        f"아래와 같이 공급합니다.<br/><br/>"
        f"합계금액&nbsp;&nbsp;<b>{fmt(total)}</b>  원정",
        st(9)
    )

    LEFT_W  = W * 0.50          # 93mm
    LABEL_W = 15*mm
    VALUE_W = W * 0.50 - LABEL_W  # 78mm

    # 도장 처리
    stamp_tmp = prep_stamp(STAMP_PATH)
    STAMP_SZ  = 13*mm

    if stamp_tmp:
        stamp_img = Image(stamp_tmp, width=STAMP_SZ, height=STAMP_SZ)
        stamp_img.hAlign = "RIGHT"
        # 성명 셀 내부: 이름 텍스트 + 도장 이미지
        cell_avail = VALUE_W - 4*mm  # 4mm left padding 제외
        name_cell = Table(
            [[Paragraph(supplier["ceo"], st(8)), stamp_img]],
            colWidths=[cell_avail - STAMP_SZ - 1*mm, STAMP_SZ + 1*mm],
            style=TableStyle([
                ("VALIGN",        (0,0),(-1,-1),"MIDDLE"),
                ("LEFTPADDING",   (0,0),(-1,-1),0),
                ("RIGHTPADDING",  (0,0),(-1,-1),0),
                ("TOPPADDING",    (0,0),(-1,-1),0),
                ("BOTTOMPADDING", (0,0),(-1,-1),0),
            ])
        )
    else:
        name_cell = Paragraph(supplier["ceo"], st(8))

    hdr_rows = [
        [left_para,  "등록번호",        Paragraph(supplier["reg_no"], st(8))],
        ["",         "상 호\n(법인명)", Paragraph(supplier["name"],   st(8))],
        ["",         "성  명",          name_cell],
        ["",         "사업장\n소재지",  Paragraph(supplier["addr"],   st(7))],
        ["",         "업  태",          Paragraph(supplier["biz"],    st(7))],
        ["",         "종  목",          Paragraph(supplier["item"],   st(7))],
    ]

    header_tbl = Table(hdr_rows, colWidths=[LEFT_W, LABEL_W, VALUE_W])
    header_tbl.setStyle(TableStyle([
        # 왼쪽 셀 6행 병합
        ("SPAN",          (0,0),(0,5)),
        ("VALIGN",        (0,0),(0,5),"TOP"),
        ("LEFTPADDING",   (0,0),(0,5),6),
        ("RIGHTPADDING",  (0,0),(0,5),6),
        ("TOPPADDING",    (0,0),(0,5),7),
        ("BOTTOMPADDING", (0,0),(0,5),7),
        # 외부 박스 + 구분선
        ("BOX",           (0,0),(-1,-1),0.8,BD),
        ("LINEAFTER",     (0,0),(0,5),0.5,BD),
        # 공급자 그리드
        ("INNERGRID",     (1,0),(2,5),0.5,BD),
        # 라벨 열
        ("FONTNAME",      (1,0),(1,5),"KR"),
        ("FONTSIZE",      (1,0),(1,5),7),
        ("ALIGN",         (1,0),(1,5),"CENTER"),
        ("VALIGN",        (1,0),(2,5),"MIDDLE"),
        ("TOPPADDING",    (1,0),(2,5),2),
        ("BOTTOMPADDING", (1,0),(2,5),2),
        ("LEFTPADDING",   (2,0),(2,5),4),
        # 성명 셀 패딩 줄임 (도장 공간)
        ("LEFTPADDING",   (2,2),(2,2),2),
    ]))
    elems.append(header_tbl)

    # ── 3. 품목 테이블 ──────────────────────────────────────
    # 8+8+62+14+20+22+28+24 = 186mm = W
    col_w = [8*mm, 8*mm, 62*mm, 14*mm, 20*mm, 22*mm, 28*mm, 24*mm]

    hdr = [Paragraph(h, st(7, bold=True, align="CENTER"))
           for h in ["월","일","품목 / 규격","단위","수량","단가","공급가격","세  액"]]

    item_rows = [hdr]
    for it in order["items"]:
        item_rows.append([
            Paragraph(str(d.month),          st(8, align="CENTER")),
            Paragraph(str(d.day),            st(8, align="CENTER")),
            Paragraph(it["name"],            st(8)),
            Paragraph("",                    st(8)),
            Paragraph(fmt(it["qty"]),        st(8, align="RIGHT")),
            Paragraph(fmt(it["unit_price"]), st(8, align="RIGHT")),
            Paragraph(fmt(it["supply_amt"]), st(8, align="RIGHT")),
            Paragraph(fmt(it["tax_amt"]),    st(8, align="RIGHT")),
        ])

    iha_row = len(item_rows)
    item_rows.append([Paragraph("***  이 하 여 백  ***", st(7, align="CENTER"))] + [""]*7)
    for _ in range(4):
        item_rows.append([""]*8)

    sub_row = len(item_rows)
    ts = sum(i["supply_amt"] for i in order["items"])
    tt = sum(i["tax_amt"]    for i in order["items"])
    item_rows.append([
        "","",
        Paragraph("소  계", st(8, bold=True, align="CENTER")),
        "","","",
        Paragraph(fmt(ts), st(8, bold=True, align="RIGHT")),
        Paragraph(fmt(tt), st(8, bold=True, align="RIGHT")),
    ])

    items_tbl = Table(item_rows, colWidths=col_w, repeatRows=1)
    items_tbl.setStyle(TableStyle([
        ("FONTNAME",      (0,0),(-1,-1),"KR"),
        ("BOX",           (0,0),(-1,-1),0.8,BD),
        ("INNERGRID",     (0,0),(-1,-1),0.4,BD),
        ("BACKGROUND",    (0,0),(-1,0),BG),
        ("VALIGN",        (0,0),(-1,-1),"MIDDLE"),
        ("TOPPADDING",    (0,0),(-1,-1),3),
        ("BOTTOMPADDING", (0,0),(-1,-1),3),
        ("RIGHTPADDING",  (4,1),(-1,-1),4),
        ("LEFTPADDING",   (2,1),(2,-1),4),
        # 이하여백 병합
        ("SPAN",          (0,iha_row),(-1,iha_row)),
        ("ALIGN",         (0,iha_row),(-1,iha_row),"CENTER"),
        # 소계 행
        ("SPAN",          (0,sub_row),(1,sub_row)),
        ("SPAN",          (2,sub_row),(5,sub_row)),
    ]))
    elems.append(items_tbl)

    # ── 4. 합계 행 ────────────────────────────────────────
    grand = ts + tt
    # 25+25+50+25+61 = 186mm = W
    foot_w = [25*mm, 25*mm, 50*mm, 25*mm, 61*mm]
    footer_tbl = Table(
        [[Paragraph("미수금",    st(8, align="CENTER")),
          Paragraph("합  계",    st(8, bold=True, align="CENTER")),
          Paragraph(fmt(grand),  st(10, bold=True, align="CENTER")),
          Paragraph("인수자",    st(8, align="CENTER")),
          Paragraph("",          st(8))]],
        colWidths=foot_w
    )
    footer_tbl.setStyle(TableStyle([
        ("FONTNAME",      (0,0),(-1,-1),"KR"),
        ("BOX",           (0,0),(-1,-1),0.8,BD),
        ("INNERGRID",     (0,0),(-1,-1),0.4,BD),
        ("VALIGN",        (0,0),(-1,-1),"MIDDLE"),
        ("TOPPADDING",    (0,0),(-1,-1),5),
        ("BOTTOMPADDING", (0,0),(-1,-1),5),
        ("BACKGROUND",    (1,0),(1,0),BG),
    ]))
    elems.append(footer_tbl)

    doc.build(elems)

    if stamp_tmp and stamp_tmp != STAMP_PATH:
        try: os.unlink(stamp_tmp)
        except: pass


def main():
    order = ORDER
    d = order["date"]

    folder = f"/Users/olive/Qsync/계약서류/{order['receiver']}"
    os.makedirs(folder, exist_ok=True)
    filename = f"{str(d.year)[2:]}{d.month:02d}_거래명세서_{order['receiver']}.pdf"
    out_path = os.path.join(folder, filename)

    print(f"\n[거래명세서 생성]")
    print(f"  기관: {order['receiver']}")
    print(f"  날짜: {d.year}년 {d.month}월 {d.day}일")
    print(f"  품목: {order['items'][0]['name']} × {order['items'][0]['qty']}개")
    print(f"  금액: {fmt(order['items'][0]['supply_amt'] + order['items'][0]['tax_amt'])}원")
    print(f"  저장: {out_path}")

    make_pdf(order, SUPPLIER, out_path)

    print("  ✅ 생성 완료")
    subprocess.run(["open", out_path])
    print("  미리보기 오픈됨")


if __name__ == "__main__":
    main()
