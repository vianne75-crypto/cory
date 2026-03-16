#!/usr/bin/env python3
"""
공공데이터포털 대학정보 CSV ↔ cory HC 기관 대조 스크립트

사용법:
  1. data.go.kr에서 '전국대학및전문대학정보표준데이터' CSV 다운로드
  2. 다운로드 파일을 이 스크립트와 같은 디렉토리에 배치
  3. python3 data/reconcile_public_data.py <공공데이터.csv>

기능:
  - 기존 HC(대학보건관리자) 기관과 공공데이터 매칭
  - 변동 감지: 명칭변경 / 주소이전 / 폐교
  - api_source_id 매핑 (fingerprint 기반)
  - 미등록 대학 리스트 추출

⚠️ UTM 코드(HC-001~HC-385)는 절대 변경 불가
   매칭 결과는 metadata에만 반영 (utm_code는 건드리지 않음)
"""

import csv
import json
import urllib.request
import urllib.parse
import os
import sys
from difflib import SequenceMatcher

SUPABASE_URL = 'https://rvqkoiqjjhlrgqitnxwt.supabase.co'
SUPABASE_KEY = os.environ.get('SUPABASE_KEY', 'sb_publishable_LhUYFVbX3M_8zbiBzaLgZQ_MSOfc1TU')


def supabase_request(path, method='GET', body=None):
    url = f'{SUPABASE_URL}{path}'
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
    }
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        print(f'  HTTP {e.code}: {e.read().decode()[:200]}')
        return None


def normalize_name(name):
    """대학명 정규화"""
    name = name.strip()
    for suffix in ['대학교', '대학', '학교']:
        name = name.replace(suffix, '')
    return name.strip()


def name_similarity(a, b):
    return SequenceMatcher(None, normalize_name(a), normalize_name(b)).ratio()


def domain_match(url_a, url_b):
    """도메인 비교 (0/15/25)"""
    def extract(url):
        if not url:
            return ''
        for prefix in ['https://', 'http://', 'www.']:
            url = url.replace(prefix, '')
        return url.split('/')[0].lower().rstrip('/')

    da, db = extract(url_a), extract(url_b)
    if not da or not db:
        return 0
    if da == db:
        return 25
    # 2차 도메인 비교 (ac.kr 앞)
    pa = da.split('.')
    pb = db.split('.')
    if len(pa) >= 3 and len(pb) >= 3 and pa[-3:] == pb[-3:]:
        return 15
    return 0


def address_similarity(addr_a, addr_b):
    """주소 유사도 (0~25)"""
    if not addr_a or not addr_b:
        return 0
    return SequenceMatcher(None, addr_a, addr_b).ratio() * 25


def fingerprint(pub_row, db_row):
    """Identity Fingerprint 매칭 점수 (0~100)
    대학명 40 + 도메인 25 + 주소 25 + 전화번호 10
    """
    score = 0
    pub_name = pub_row.get('학교명', '') or pub_row.get('대학명', '')
    db_name = db_row.get('name', '')
    score += name_similarity(pub_name, db_name) * 40

    pub_url = pub_row.get('홈페이지주소', '') or pub_row.get('홈페이지', '')
    db_meta = db_row.get('metadata', {}) or {}
    db_url = db_meta.get('website', '') or db_meta.get('homepage_url', '')
    score += domain_match(pub_url, db_url)

    pub_addr = pub_row.get('소재지도로명주소', '') or pub_row.get('주소', '')
    db_addr = db_meta.get('address', '') or db_meta.get('full_address', '')
    score += address_similarity(pub_addr, db_addr)

    # 전화번호 (있으면 보너스)
    pub_phone = (pub_row.get('대표전화번호', '') or '').replace('-', '')
    if pub_phone and db_meta.get('contact_phone', ''):
        db_phone = db_meta['contact_phone'].replace('-', '').replace('미확인', '')
        if pub_phone == db_phone:
            score += 10

    return round(score, 1)


def detect_changes(pub_row, db_row):
    """변동 감지: 명칭변경 / 주소이전"""
    changes = []
    db_meta = db_row.get('metadata', {}) or {}

    # 명칭 변경
    pub_name = pub_row.get('학교명', '') or pub_row.get('대학명', '')
    if pub_name and pub_name != db_row['name']:
        changes.append({
            'type': 'renamed',
            'field': 'name',
            'old': db_row['name'],
            'new': pub_name,
        })

    # 주소 이전
    pub_addr = pub_row.get('소재지도로명주소', '') or pub_row.get('주소', '')
    db_addr = db_meta.get('address', '') or db_meta.get('full_address', '')
    if pub_addr and db_addr:
        if address_similarity(pub_addr, db_addr) < 15:  # 60% 미만이면 이전 의심
            changes.append({
                'type': 'relocated',
                'field': 'address',
                'old': db_addr,
                'new': pub_addr,
            })

    # 홈페이지 변경
    pub_url = pub_row.get('홈페이지주소', '') or pub_row.get('홈페이지', '')
    db_url = db_meta.get('website', '') or db_meta.get('homepage_url', '')
    if pub_url and db_url and domain_match(pub_url, db_url) == 0:
        changes.append({
            'type': 'url_changed',
            'field': 'homepage_url',
            'old': db_url,
            'new': pub_url,
        })

    return changes


def main():
    if len(sys.argv) < 2:
        print('사용법: python3 data/reconcile_public_data.py <공공데이터.csv>')
        print('  data.go.kr → "전국대학및전문대학정보표준데이터" CSV 다운로드 후 실행')
        sys.exit(1)

    pub_csv_path = sys.argv[1]

    # 1. 공공데이터 CSV 읽기
    encodings = ['utf-8-sig', 'cp949', 'euc-kr']
    pub_rows = None
    for enc in encodings:
        try:
            with open(pub_csv_path, encoding=enc) as f:
                reader = csv.DictReader(f)
                pub_rows = list(reader)
            break
        except (UnicodeDecodeError, UnicodeError):
            continue

    if not pub_rows:
        print(f'CSV 읽기 실패: {pub_csv_path}')
        sys.exit(1)

    print(f'공공데이터: {len(pub_rows)}건')
    print(f'컬럼: {list(pub_rows[0].keys())[:10]}...')

    # 2. DB 기존 데이터 읽기
    type_encoded = urllib.parse.quote('대학보건관리자')
    db_rows = supabase_request(
        f'/rest/v1/institutions?type=eq.{type_encoded}'
        f'&select=id,name,region,district,metadata'
    )
    if not db_rows:
        print('DB에서 대학보건관리자 기관을 찾을 수 없습니다.')
        sys.exit(1)

    print(f'DB 대학보건관리자: {len(db_rows)}건\n')

    # 3. 매칭
    matched = []     # (pub_row, db_row, score)
    review = []      # (pub_row, db_row, score) — 점수 50~79
    new_unis = []    # pub_row — DB에 없는 대학
    changes_found = []

    matched_db_ids = set()

    for pub in pub_rows:
        pub_name = pub.get('학교명', '') or pub.get('대학명', '')
        if not pub_name:
            continue

        best_score = 0
        best_db = None

        for db in db_rows:
            if db['id'] in matched_db_ids:
                continue
            score = fingerprint(pub, db)
            if score > best_score:
                best_score = score
                best_db = db

        if best_score >= 80:
            matched.append((pub, best_db, best_score))
            matched_db_ids.add(best_db['id'])
            # 변동 감지
            ch = detect_changes(pub, best_db)
            if ch:
                changes_found.append({
                    'db_name': best_db['name'],
                    'utm_code': (best_db.get('metadata') or {}).get('utm_code', '?'),
                    'changes': ch,
                })
        elif best_score >= 50:
            review.append((pub, best_db, best_score))
        else:
            new_unis.append(pub)

    # 4. DB에만 있고 공공데이터에 없는 기관 (폐교 의심)
    missing_from_pub = []
    for db in db_rows:
        if db['id'] not in matched_db_ids:
            meta = db.get('metadata', {}) or {}
            missing_from_pub.append({
                'name': db['name'],
                'utm_code': meta.get('utm_code', '?'),
                'id': db['id'],
            })

    # 5. 리포트
    print('=' * 60)
    print('대조 결과 리포트')
    print('=' * 60)

    print(f'\n✅ 확인 매칭: {len(matched)}건 (점수 80+)')
    print(f'🔍 검토 필요: {len(review)}건 (점수 50~79)')
    print(f'🆕 미등록 대학: {len(new_unis)}건')
    print(f'⚠️ 폐교 의심: {len(missing_from_pub)}건')

    if changes_found:
        print(f'\n📋 변동 감지: {len(changes_found)}건')
        for c in changes_found:
            print(f'  [{c["utm_code"]}] {c["db_name"]}')
            for ch in c['changes']:
                print(f'    {ch["type"]}: {ch["old"][:30]} → {ch["new"][:30]}')

    if review:
        print('\n🔍 검토 필요 (수동 확인):')
        for pub, db, score in review[:20]:
            pub_name = pub.get('학교명', '') or pub.get('대학명', '')
            meta = db.get('metadata', {}) or {}
            print(f'  [{score:.0f}점] 공공: "{pub_name}" ↔ DB: "{db["name"]}" (UTM: {meta.get("utm_code", "?")})')

    if missing_from_pub:
        print('\n⚠️ 공공데이터에 없는 기관 (폐교/명칭변경 의심):')
        for m in missing_from_pub[:20]:
            print(f'  [{m["utm_code"]}] {m["name"]}')

    if new_unis:
        print(f'\n🆕 미등록 대학 (상위 20건):')
        for pub in new_unis[:20]:
            name = pub.get('학교명', '') or pub.get('대학명', '')
            addr = pub.get('소재지도로명주소', '') or pub.get('주소', '')
            print(f'  {name} ({addr[:30]})')

    # 6. 결과 JSON 저장
    report = {
        'run_date': '2026-03-09',
        'public_data_count': len(pub_rows),
        'db_count': len(db_rows),
        'matched': len(matched),
        'review_needed': len(review),
        'new_universities': len(new_unis),
        'missing_from_public': len(missing_from_pub),
        'changes_detected': changes_found,
        'review_list': [
            {
                'public_name': (p.get('학교명', '') or p.get('대학명', '')),
                'db_name': d['name'],
                'utm_code': (d.get('metadata') or {}).get('utm_code', '?'),
                'score': s
            }
            for p, d, s in review
        ],
        'missing_list': missing_from_pub,
    }

    report_path = os.path.join(os.path.dirname(__file__), 'hc_reconcile_report.json')
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print(f'\n리포트 저장: {report_path}')


if __name__ == '__main__':
    main()
