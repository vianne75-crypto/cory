#!/usr/bin/env python3
"""
기존 대학보건관리자(HC) 기관의 metadata 교정 + CRM 필드 추가

핵심 교정 사항:
  - DB의 기존 utm_code(h001~h385, 임의 순서)를 DM QR 실제 코드(HC-001~HC-385)로 교정
  - 학교 이름 기준 매칭 (UTM 번호가 아닌 학교명으로 정확 매칭)

⚠️ 교정 사유:
   DM QR URL: ?uid=HC-001 (대문자, CSV 순서)
   기존 DB:   h001 (소문자, import 순서) ← 다른 학교에 할당됨!
   → HC-001(가야대학교) ≠ h001(서울사이버대학교) — 0건 일치
   → QR 클릭 추적(Phase 2)을 위해 DB를 DM QR 기준으로 통일 필요

사용법:
  python3 data/update_hc_metadata.py [--dry-run]
"""

import csv
import json
import urllib.request
import urllib.parse
import os
import sys
from difflib import SequenceMatcher

# ─── 설정 ───
SUPABASE_URL = 'https://rvqkoiqjjhlrgqitnxwt.supabase.co'
SUPABASE_KEY = os.environ.get('SUPABASE_KEY', 'sb_publishable_LhUYFVbX3M_8zbiBzaLgZQ_MSOfc1TU')
HC_CSV_PATH = '/Users/olive/Qsync/마케팅전략/farm360/주소확인용 - 학생건강센터.csv'

DRY_RUN = '--dry-run' in sys.argv


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


def name_similarity(a, b):
    """대학명 유사도 (0~1)"""
    for suffix in ['대학교', '대학', '학교']:
        a = a.replace(suffix, '').strip()
        b = b.replace(suffix, '').strip()
    return SequenceMatcher(None, a, b).ratio()


def domain_from_url(url):
    if not url:
        return ''
    url = url.strip().rstrip('/')
    for prefix in ['https://', 'http://', 'www.']:
        url = url.replace(prefix, '')
    return url.split('/')[0].lower()


def fingerprint_score(csv_row, db_row):
    """Identity Fingerprint 매칭 점수 (0~100)
    대학명 40 + 도메인 25 + 주소 25 + 전화번호 10
    """
    score = 0
    csv_name = csv_row.get('학교명', '')
    db_name = db_row.get('name', '')
    score += name_similarity(csv_name, db_name) * 40

    csv_domain = domain_from_url(csv_row.get('추출url', ''))
    db_meta = db_row.get('metadata', {}) or {}
    db_domain = domain_from_url(db_meta.get('website', '') or db_meta.get('homepage_url', ''))
    if csv_domain and db_domain:
        if csv_domain == db_domain:
            score += 25
        elif csv_domain.split('.')[-2:] == db_domain.split('.')[-2:]:
            score += 15

    csv_addr = csv_row.get('주소', '')
    db_addr = db_meta.get('address', '') or db_meta.get('full_address', '')
    if csv_addr and db_addr:
        score += SequenceMatcher(None, csv_addr, db_addr).ratio() * 25

    db_phone = (db_meta.get('contact_phone', '') or '').replace('-', '').replace('미확인', '')
    # CSV에 전화번호 없으므로 스킵

    return round(score, 1)


def new_crm_fields(csv_row=None):
    """기존 metadata에 추가할 새 CRM 관리 필드"""
    fields = {
        'status': 'active',
        'dm_campaign': '2026hc',
        'dm_sent_date': '2026-03-06',
        'last_verified_date': '2026-03-09',
        'verification_method': 'manual',
        'api_source_id': None,
        'fingerprint_score': None,
        'scoring': {
            'student_count': 0,
            'dormitory': 0,
            'medical_school': 0,
            'center_level': 0,
            'region_influence': 0,
            'total': 0
        },
        'change_log': [],
    }
    if csv_row:
        sample = csv_row.get('샘플동봉', '').strip()
        fields['sample_included'] = sample == 'Y'
    return fields


def main():
    if DRY_RUN:
        print('=== DRY RUN 모드 (실제 업데이트 없음) ===\n')

    # 1. CSV 읽기
    with open(HC_CSV_PATH, encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        csv_rows = list(reader)
    print(f'CSV: {len(csv_rows)}건')

    # 학교명 → CSV 행 매핑
    csv_by_name = {}
    for r in csv_rows:
        name = r.get('학교명', '').strip()
        if name:
            csv_by_name[name] = r

    # 2. 기존 DB 데이터 읽기
    type_encoded = urllib.parse.quote('대학보건관리자')
    db_rows = supabase_request(
        f'/rest/v1/institutions?type=eq.{type_encoded}'
        f'&select=id,name,region,district,metadata'
    )
    if not db_rows:
        print('DB에서 대학보건관리자 기관을 찾을 수 없습니다.')
        return

    print(f'DB 대학보건관리자: {len(db_rows)}건')

    has_meta = sum(1 for r in db_rows if (r.get('metadata') or {}).get('utm_code'))
    no_meta = len(db_rows) - has_meta
    print(f'  기존 metadata 보유: {has_meta}건, 미보유: {no_meta}건\n')

    # 3. 학교명 기준 매칭 + metadata 업데이트
    updates = []
    utm_corrections = []
    unmatched = []
    used_csv_names = set()

    for db in db_rows:
        db_name = db['name']
        db_meta = db.get('metadata', {}) or {}
        old_utm = db_meta.get('utm_code', '')

        # 이미 CRM 필드가 있으면 스킵
        if db_meta.get('status') and db_meta.get('scoring'):
            continue

        # ── 학교명으로 CSV 매칭 ──
        csv_row = csv_by_name.get(db_name)

        if not csv_row:
            # 유사도 매칭 (80% 이상만)
            best_score = 0
            best_match = None
            for name, row in csv_by_name.items():
                if name in used_csv_names:
                    continue
                sim = name_similarity(db_name, name)
                if sim > best_score:
                    best_score = sim
                    best_match = row
            if best_score >= 0.85:  # 80% → 85%로 올림 (오매칭 방지)
                csv_row = best_match
                print(f'  유사 매칭: "{db_name}" → "{best_match["학교명"]}" ({best_score:.0%})')

        if csv_row:
            csv_name = csv_row['학교명'].strip()
            used_csv_names.add(csv_name)
            correct_utm = csv_row.get('UTM고유번호', '').strip()  # h001 형식

            # 새 CRM 필드
            crm_fields = new_crm_fields(csv_row)
            fp = fingerprint_score(csv_row, db)
            crm_fields['fingerprint_score'] = fp

            # UTM 코드 교정 (h001 → HC-001)
            if old_utm and old_utm != correct_utm:
                crm_fields['old_utm_code'] = old_utm  # 이전 코드 보존
                utm_corrections.append(f'  {db_name}: {old_utm} → {correct_utm}')

            crm_fields['utm_code'] = correct_utm

            # 기존 metadata 보존 + 새 필드 추가 (utm_code는 교정)
            merged = {**db_meta, **crm_fields}

            updates.append({
                'id': db['id'],
                'name': db_name,
                'utm_code': correct_utm,
                'old_utm': old_utm,
                'metadata': merged,
            })
        else:
            unmatched.append(db_name)

    # 4. 결과 요약
    print(f'\n=== 업데이트 계획 ===')
    print(f'  총 업데이트 대상: {len(updates)}건')
    print(f'  UTM 코드 교정: {len(utm_corrections)}건 (h→HC)')
    print(f'  미매칭 (업데이트 불가): {len(unmatched)}건')

    if utm_corrections and DRY_RUN:
        print(f'\n=== UTM 코드 교정 상세 (상위 20건) ===')
        for c in utm_corrections[:20]:
            print(c)
        if len(utm_corrections) > 20:
            print(f'  ... 외 {len(utm_corrections) - 20}건')

    if unmatched:
        print(f'\n미매칭 기관 ({len(unmatched)}건):')
        for name in unmatched:
            print(f'  {name}')

    if DRY_RUN:
        print(f'\n=== DRY RUN 상세 (상위 10건) ===')
        for u in updates[:10]:
            m = u['metadata']
            utm_change = f' (← {u["old_utm"]})' if u["old_utm"] and u["old_utm"] != u["utm_code"] else ''
            print(f'  [{u["utm_code"]}{utm_change}] {u["name"]}')
            print(f'    fp={m.get("fingerprint_score")} status={m.get("status")} '
                  f'sample={m.get("sample_included")} scoring_total={m.get("scoring",{}).get("total")}')
        if len(updates) > 10:
            print(f'  ... 외 {len(updates) - 10}건')
        print(f'\n실제 실행: python3 data/update_hc_metadata.py')
        return

    # 5. 배치 업데이트
    success = 0
    for u in updates:
        result = supabase_request(
            f'/rest/v1/institutions?id=eq.{u["id"]}',
            method='PATCH',
            body={'metadata': u['metadata']}
        )
        if result is not None:
            success += 1
        else:
            print(f'  실패: [{u["utm_code"]}] {u["name"]}')

    print(f'\n완료: {success}/{len(updates)}건 업데이트')

    # 6. UTM 코드 무결성 검증
    print('\n=== UTM 코드 무결성 검증 ===')
    all_hc = supabase_request(
        f'/rest/v1/institutions?type=eq.{type_encoded}'
        f'&select=id,name,metadata'
    )
    utm_map = {}
    missing_utm = []
    for row in (all_hc or []):
        meta = row.get('metadata', {}) or {}
        utm = meta.get('utm_code')
        if utm:
            if utm in utm_map:
                print(f'  ⚠️ 중복 UTM! {utm}: {utm_map[utm]} vs {row["name"]}')
            utm_map[utm] = row['name']
        else:
            missing_utm.append(row['name'])

    print(f'UTM 할당: {len(utm_map)}건')
    if missing_utm:
        print(f'UTM 미할당: {len(missing_utm)}건 → {missing_utm[:5]}')
    print('중복 없음 ✅' if len(utm_map) == len(set(utm_map.keys())) else '⚠️ 중복 발견!')


if __name__ == '__main__':
    main()
