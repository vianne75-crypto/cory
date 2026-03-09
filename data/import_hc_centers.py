#!/usr/bin/env python3
"""
대학보건관리자(HC) 기관 데이터 Import
CSV → Supabase institutions 테이블

사용법:
  python3 data/import_hc_centers.py

소스: 마케팅전략/farm360/대학교_학생건강센터_주소록.csv
"""

import csv
import json
import urllib.request
import urllib.parse
import os

# ─── 설정 ───
SUPABASE_URL = 'https://rvqkoiqjjhlrgqitnxwt.supabase.co'
SUPABASE_KEY = os.environ.get('SUPABASE_KEY', 'sb_publishable_LhUYFVbX3M_8zbiBzaLgZQ_MSOfc1TU')
CSV_PATH = '/Users/olive/Qsync/마케팅전략/farm360/대학교_학생건강센터_주소록.csv'

# ─── 지역 매핑 ───
REGION_MAP = {
    '서울': '서울특별시',
    '부산': '부산광역시',
    '대구': '대구광역시',
    '인천': '인천광역시',
    '광주': '광주광역시',
    '대전': '대전광역시',
    '울산': '울산광역시',
    '세종': '세종특별자치시',
    '경기': '경기도',
    '강원': '강원특별자치도',
    '충북': '충청북도',
    '충남': '충청남도',
    '전북': '전북특별자치도',
    '전남': '전라남도',
    '경북': '경상북도',
    '경남': '경상남도',
    '제주': '제주특별자치도',
}

def parse_district(addr):
    """주소에서 시/군/구 추출"""
    if not addr:
        return None
    parts = addr.strip().split()
    if len(parts) >= 2:
        d = parts[1]
        if d.endswith('시') or d.endswith('군') or d.endswith('구'):
            return d
    return None

def supabase_request(path, method='GET', body=None):
    url = f'{SUPABASE_URL}{path}'
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation' if method == 'POST' else 'return=minimal',
    }
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode()) if method in ('GET', 'POST') else resp.status
    except urllib.error.HTTPError as e:
        print(f'  HTTP {e.code}: {e.read().decode()[:200]}')
        return None

def main():
    # CSV 읽기
    with open(CSV_PATH, encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    # DM 발송대상만 필터
    dm_targets = [r for r in rows if r.get('DM발송대상', '').strip() == 'Y']
    print(f'CSV 전체: {len(rows)}건, DM발송대상: {len(dm_targets)}건')

    # 기존 대학보건관리자 기관 확인 (중복 방지)
    existing = supabase_request(
        f'/rest/v1/institutions?type=eq.{urllib.parse.quote("대학보건관리자")}&select=name'
    )
    existing_names = set(d['name'] for d in (existing or []))
    print(f'기존 대학보건관리자: {len(existing_names)}건')

    # 데이터 변환
    institutions = []
    skipped = 0
    for r in dm_targets:
        name = r.get('학교명', '').strip()
        if not name:
            continue
        if name in existing_names:
            skipped += 1
            continue

        region_short = r.get('소재지역', '').strip()
        region = REGION_MAP.get(region_short, '')
        addr = r.get('주소', '').strip()
        district = parse_district(addr)

        # 구매이력 확인 → 구매단계 결정
        has_purchase = r.get('알쓰패치구매이력', '').strip() == 'Y'
        total_qty = int(r.get('총구매수량', '0') or '0')

        if has_purchase and total_qty > 0:
            purchase_stage = '구매'
        else:
            purchase_stage = '관심'  # DM 발송 → 관심 단계

        # 구매 정보
        purchase_amount = 0
        if has_purchase:
            purchase_amount = total_qty * 800  # 알쓰패치 단가 추정

        products = ['알쓰패치'] if has_purchase else []

        institutions.append({
            'name': name,
            'type': '대학보건관리자',
            'region': region,
            'district': district,
            'purchase_stage': purchase_stage,
            'purchase_amount': purchase_amount,
            'purchase_volume': total_qty,
            'products': products,
            'last_purchase_date': r.get('최근구매일', '').strip() or '-',
        })
        existing_names.add(name)

    print(f'신규 import 대상: {len(institutions)}건 (중복 스킵: {skipped}건)')

    if not institutions:
        print('import할 데이터가 없습니다.')
        return

    # 배치 insert (50건씩)
    batch_size = 50
    total_inserted = 0
    for i in range(0, len(institutions), batch_size):
        batch = institutions[i:i + batch_size]
        result = supabase_request('/rest/v1/institutions', 'POST', batch)
        if result:
            total_inserted += len(batch)
            print(f'  배치 {i // batch_size + 1}: {len(batch)}건 삽입')
        else:
            print(f'  배치 {i // batch_size + 1}: 삽입 실패')

    print(f'\n완료: {total_inserted}건 삽입')

    # 지역별 통계
    region_counts = {}
    stage_counts = {}
    for inst in institutions:
        r = inst['region']
        s = inst['purchase_stage']
        region_counts[r] = region_counts.get(r, 0) + 1
        stage_counts[s] = stage_counts.get(s, 0) + 1

    print('\n지역별:')
    for k, v in sorted(region_counts.items(), key=lambda x: -x[1]):
        print(f'  {k}: {v}')

    print(f'\n구매단계: {stage_counts}')

if __name__ == '__main__':
    main()
