#!/usr/bin/env python3
"""
견적서 자동생성 스크립트

엑셀 템플릿에 거래처명·수량·단가를 채워 견적서를 생성합니다.
계약견적 입력 → 품의견적·타견적(워커스·이알테크) 자동산출

사용법:
  python3 data/generate_quote.py --client "경주시보건소" --product "알쓰패치" --qty 500
  python3 data/generate_quote.py --client "A대학교" --product "알쓰패치" --qty 500 --grade "스카우트" --type "기관"
  python3 data/generate_quote.py --client "B사업장" --product "노담패치" --qty 300 --grade "마스터" --type "기업" --leaflet "기본"
"""

import argparse
import os
import math
from datetime import datetime

import xlrd
from xlutils.copy import copy

# ─── 설정 ───

TEMPLATE_PATH = os.path.join(os.path.dirname(__file__), '..', '2603알쓰패치견적(APS외) 복사본.xls')
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'quotes')

# 수량 구간별 단가 (내림차순 threshold)
PRICING = {
    '알쓰패치': [(500, 2100), (300, 2500), (100, 3000), (0, 4200)],
    '노담패치': [(500, 2500), (300, 3100), (100, 3600), (0, 5000)],
}

PRODUCT_NAMES = {
    '알쓰패치': 'APS알쓰패치(APSalth02) ',
    '노담패치': 'APS노담캠페인알데히드검사패치 ',
}

# 등급 할인율
GRADE_DISCOUNT = {
    '일반': 0.0,
    '스카우트': 0.10,
    '마스터': 0.20,
}

# 타견적 산출 비율 (계약 단가 기준, 10원 반올림)
QUOTE_RATIOS = {
    '품의': 1.05,
    '워커스': 1.065,
    '이알테크': 1.085,
}

# 스티커 가격
STICKER_PRICE = 30000

# 기초서류 경로
ATTACHMENT_PATHS = {
    '기관': '/Users/olive/Qsync/웰니스컴퍼니올리브(이동중)/기초서류/사업자통장여성기업사본(2408).pdf',
    '기업': '/Users/olive/Qsync/웰니스컴퍼니올리브(이동중)/기초서류/사업자통장사본(2408).pdf',
}


def get_unit_price(product, qty):
    """수량 구간별 기본 단가 결정"""
    tiers = PRICING.get(product)
    if not tiers:
        raise ValueError(f'알 수 없는 제품: {product}. 가능: {list(PRICING.keys())}')
    for threshold, price in tiers:
        if qty >= threshold:
            return price
    return tiers[-1][1]


def round10(value):
    """10원 단위 반올림"""
    return int(math.ceil(value / 10) * 10)


def calculate_prices(product, qty, grade, leaflet):
    """모든 시트의 가격 계산"""
    base_price = get_unit_price(product, qty)
    discount = GRADE_DISCOUNT.get(grade, 0)
    contract_price = round10(base_price * (1 - discount))

    # 계약견적 (VAT별도)
    total = qty * contract_price
    supply = int(total / 1.1)
    tax = total - supply

    # 품의/타견적 (VAT포함)
    pumui_price = round10(contract_price * QUOTE_RATIOS['품의'])
    workers_price = round10(contract_price * QUOTE_RATIOS['워커스'])
    eartech_price = round10(contract_price * QUOTE_RATIOS['이알테크'])

    # 스티커
    sticker_note = ''
    sticker_row = None
    if leaflet == '기본':
        if qty >= 500:
            sticker_note = '알쓰패치스티커(기본리플렛 후면 기관명및 슬로건 스티커)무료제공'
        else:
            sticker_row = {'name': '알쓰패치 스티커', 'price': STICKER_PRICE}

    return {
        'contract': {
            'price': contract_price,
            'total': total,
            'supply': supply,
            'tax': tax,
        },
        'pumui': {
            'price': pumui_price,
            'total': qty * pumui_price,
        },
        'workers': {
            'price': workers_price,
            'total': qty * workers_price,
        },
        'eartech': {
            'price': eartech_price,
            'total': qty * eartech_price,
        },
        'sticker_note': sticker_note,
        'sticker_row': sticker_row,
    }


def fill_sheet0_contract(ws, client, date_str, product, qty, prices):
    """Sheet 0: 견적서(계약) — VAT별도"""
    p = prices['contract']
    product_name = PRODUCT_NAMES.get(product, product)

    ws.write(8, 1, date_str)
    ws.write(9, 1, client)

    # 상품행
    ws.write(18, 0, product_name)
    ws.write(18, 9, qty)
    ws.write(18, 11, p['price'])
    ws.write(18, 15, p['supply'])
    ws.write(18, 19, p['tax'])

    # 스티커 별도 행
    sticker = prices.get('sticker_row')
    if sticker:
        ws.write(19, 0, sticker['name'])
        ws.write(19, 9, 1)
        ws.write(19, 11, sticker['price'])
        total_supply = p['supply'] + int(sticker['price'] / 1.1)
        total_tax = p['tax'] + (sticker['price'] - int(sticker['price'] / 1.1))
        sticker_supply = int(sticker['price'] / 1.1)
        sticker_tax = sticker['price'] - sticker_supply
        ws.write(19, 15, sticker_supply)
        ws.write(19, 19, sticker_tax)
        grand_total = p['total'] + sticker['price']
        ws.write(29, 15, p['supply'] + sticker_supply)
        ws.write(29, 19, p['tax'] + sticker_tax)
    else:
        ws.write(19, 0, '이하여백')
        grand_total = p['total']
        ws.write(29, 15, p['supply'])
        ws.write(29, 19, p['tax'])

    # 합계
    ws.write(14, 6, grand_total)
    ws.write(14, 17, grand_total)

    # 비고
    note = prices.get('sticker_note', '')
    if note:
        ws.write(31, 0, note)


def fill_sheet1_pumui(ws, client, date_str, product, qty, prices):
    """Sheet 1: 견적서(품의) — VAT포함"""
    p = prices['pumui']
    product_name = PRODUCT_NAMES.get(product, product)

    ws.write(8, 1, date_str)
    ws.write(9, 1, client)

    ws.write(18, 0, product_name)
    ws.write(18, 9, qty)
    ws.write(18, 11, p['price'])
    ws.write(18, 15, p['total'])
    ws.write(18, 19, '포함')

    # 스티커 별도 행
    sticker = prices.get('sticker_row')
    if sticker:
        ws.write(19, 0, sticker['name'])
        ws.write(19, 9, 1)
        ws.write(19, 11, sticker['price'])
        ws.write(19, 15, sticker['price'])
        ws.write(19, 19, '포함')
        grand_total = p['total'] + sticker['price']
    else:
        ws.write(19, 0, '이하여백')
        ws.write(19, 9, 0)
        ws.write(19, 11, 0)
        ws.write(19, 15, 0)
        ws.write(19, 19, '포함')
        grand_total = p['total']

    ws.write(14, 6, grand_total)
    ws.write(14, 17, grand_total)
    ws.write(29, 15, grand_total)
    ws.write(29, 19, 0)


def fill_sheet2_workers(ws, client, date_str, product, qty, prices):
    """Sheet 2: 타견적서1(워커스) — VAT포함"""
    p = prices['workers']
    product_name = PRODUCT_NAMES.get(product, product)

    ws.write(4, 0, date_str)
    ws.write(5, 0, client)

    ws.write(12, 0, product_name)
    ws.write(12, 6, '개')
    ws.write(12, 9, qty)
    ws.write(12, 11, p['price'])
    ws.write(12, 15, p['total'])
    ws.write(12, 19, '포함')

    ws.write(13, 0, '이하여백')

    ws.write(10, 6, p['total'])
    ws.write(10, 17, p['total'])
    ws.write(31, 15, p['total'])


def fill_sheet3_eartech(ws, client, date_str, product, qty, prices):
    """Sheet 3: 타견적서2(이알테크) — VAT포함"""
    p = prices['eartech']
    product_name = PRODUCT_NAMES.get(product, product)

    ws.write(6, 0, date_str)
    ws.write(7, 0, client)

    ws.write(14, 0, product_name)
    ws.write(14, 6, '개')
    ws.write(14, 9, qty)
    ws.write(14, 11, p['price'])
    ws.write(14, 15, p['total'])
    ws.write(14, 19, '포함')

    ws.write(12, 6, p['total'])
    ws.write(12, 17, p['total'])
    ws.write(29, 15, p['total'])


def main():
    parser = argparse.ArgumentParser(description='견적서 자동생성')
    parser.add_argument('--client', required=True, help='거래처명 (예: 경주시보건소)')
    parser.add_argument('--product', default='알쓰패치', choices=list(PRICING.keys()), help='제품명')
    parser.add_argument('--qty', type=int, required=True, help='수량')
    parser.add_argument('--grade', default='일반', choices=list(GRADE_DISCOUNT.keys()), help='회원등급')
    parser.add_argument('--type', default='기관', choices=['기관', '기업'], help='거래처유형')
    parser.add_argument('--leaflet', default='기본', choices=['기본', '스카우트'], help='리플렛종류')
    parser.add_argument('--date', default=None, help='견적일 (기본: 오늘, 형식: 2026. 03. 17)')
    args = parser.parse_args()

    # 견적일
    today = datetime.now()
    if args.date:
        date_str = args.date
    else:
        date_str = f'{today.year}. {today.month:02d}. {today.day:02d}'

    # 가격 계산
    prices = calculate_prices(args.product, args.qty, args.grade, args.leaflet)

    print(f'=== 견적서 자동생성 ===')
    print(f'거래처: {args.client}')
    print(f'제품: {args.product} × {args.qty}개')
    print(f'등급: {args.grade} (할인 {GRADE_DISCOUNT[args.grade]*100:.0f}%)')
    print(f'리플렛: {args.leaflet}')
    print()

    c = prices['contract']
    print(f'[계약] 단가 {c["price"]:,}원 × {args.qty} = {c["total"]:,}원 (공급가 {c["supply"]:,} + 세액 {c["tax"]:,})')
    print(f'[품의] 단가 {prices["pumui"]["price"]:,}원 × {args.qty} = {prices["pumui"]["total"]:,}원 (VAT포함)')
    print(f'[워커스] 단가 {prices["workers"]["price"]:,}원 × {args.qty} = {prices["workers"]["total"]:,}원')
    print(f'[이알테크] 단가 {prices["eartech"]["price"]:,}원 × {args.qty} = {prices["eartech"]["total"]:,}원')

    if prices['sticker_note']:
        print(f'[스티커] 무상제공 (500개 이상)')
    elif prices.get('sticker_row'):
        print(f'[스티커] 유상 {STICKER_PRICE:,}원')
    elif args.leaflet == '스카우트':
        print(f'[스티커] 해당없음 (스카우트 리플렛)')

    # 템플릿 복사
    template = os.path.abspath(TEMPLATE_PATH)
    if not os.path.exists(template):
        print(f'\n❌ 템플릿 파일 없음: {template}')
        return

    rb = xlrd.open_workbook(template, formatting_info=True)
    wb = copy(rb)

    # 각 시트 채우기
    fill_sheet0_contract(wb.get_sheet(0), args.client, date_str, args.product, args.qty, prices)
    fill_sheet1_pumui(wb.get_sheet(1), args.client, date_str, args.product, args.qty, prices)
    fill_sheet2_workers(wb.get_sheet(2), args.client, date_str, args.product, args.qty, prices)
    fill_sheet3_eartech(wb.get_sheet(3), args.client, date_str, args.product, args.qty, prices)

    # 출력 디렉토리 생성
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # 파일명
    date_compact = today.strftime('%y%m%d')
    filename = f'견적서_{args.client}_{date_compact}.xls'
    output_path = os.path.join(OUTPUT_DIR, filename)
    wb.save(output_path)

    print(f'\n✅ 견적서 생성 완료: {output_path}')

    # 첨부파일 안내
    attachment = ATTACHMENT_PATHS.get(args.type)
    if attachment and os.path.exists(attachment):
        print(f'📎 기초서류: {attachment}')
    elif attachment:
        print(f'⚠️ 기초서류 파일 없음: {attachment}')

    print(f'\n메일 발송 시 첨부:')
    print(f'  1. {output_path}')
    if attachment:
        print(f'  2. {attachment}')


if __name__ == '__main__':
    main()
