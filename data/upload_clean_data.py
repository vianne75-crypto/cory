#!/usr/bin/env python3
"""정제된 기관 데이터 → Supabase 업로드 스크립트"""
import json, urllib.request, urllib.parse, sys

# ─── Supabase 설정 ───
SUPABASE_URL = 'https://rvqkoiqjjhlrgqitnxwt.supabase.co'
SUPABASE_KEY = 'sb_publishable_LhUYFVbX3M_8zbiBzaLgZQ_MSOfc1TU'

def supa_request(path, method='GET', body=None):
    """Supabase REST API 요청"""
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
            text = resp.read().decode()
            return json.loads(text) if text.strip() else None
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f"  HTTP {e.code}: {error_body[:200]}")
        return None

# ─── 1. 정제 데이터 로드 ───
with open('/Users/olive/Qsync/cory/data/cleaned_institutions.json', 'r') as f:
    cleaned = json.load(f)
print(f"정제된 데이터: {len(cleaned)}개 기관")

# ─── 2. 기존 기관 조회 (FK 재매핑용) ───
print("\n기존 Supabase 기관 조회...")
old_institutions = supa_request('/rest/v1/institutions?select=id,name,region&limit=5000')
if not old_institutions:
    old_institutions = []
print(f"  기존 기관: {len(old_institutions)}개")

# 이름+지역 → old_id 매핑
old_map = {}
for inst in old_institutions:
    key = f"{inst['name']}|{inst['region']}"
    old_map[key] = inst['id']

# ─── 3. 기존 institutions 삭제 ───
print("\n기존 기관 데이터 삭제...")
# id > 0 으로 전체 삭제
supa_request('/rest/v1/institutions?id=gt.0', method='DELETE')
print("  삭제 완료")

# ─── 4. 정제 데이터 삽입 ───
print(f"\n정제 데이터 {len(cleaned)}개 삽입...")
batch_size = 200
inserted = 0

# camelCase → snake_case 매핑
for i in range(0, len(cleaned), batch_size):
    batch = cleaned[i:i+batch_size]
    records = []
    for d in batch:
        records.append({
            'name': d['name'],
            'type': d['type'],
            'region': d['region'],
            'district': d.get('district'),
            'lat': d.get('lat', 0),
            'lng': d.get('lng', 0),
            'products': d.get('products', []),
            'purchase_cycle': d.get('purchaseCycle', '-'),
            'purchase_volume': d.get('purchaseVolume', 0),
            'purchase_amount': d.get('purchaseAmount', 0),
            'purchase_stage': d.get('purchaseStage', '인지'),
            'last_purchase_date': d.get('lastPurchaseDate', '-'),
            'consult_count': d.get('consultCount', 0),
            'last_consult_date': d.get('lastConsultDate'),
        })

    result = supa_request('/rest/v1/institutions', method='POST', body=records)
    if result:
        inserted += len(result)
    else:
        inserted += len(records)
    print(f"  배치 {i//batch_size+1}: {inserted}/{len(cleaned)}")

print(f"\n삽입 완료: {inserted}개")

# ─── 5. 새 기관 조회 (FK 재매핑용) ───
print("\n새 기관 ID 조회...")
new_institutions = supa_request('/rest/v1/institutions?select=id,name,region&limit=5000')
if not new_institutions:
    print("  오류: 새 기관 조회 실패")
    sys.exit(1)

# 이름+지역 → new_id 매핑
new_map = {}
for inst in new_institutions:
    key = f"{inst['name']}|{inst['region']}"
    new_map[key] = inst['id']

print(f"  새 기관: {len(new_institutions)}개")

# ─── 6. consultations FK 재매핑 ───
print("\n상담내역 FK 재매핑...")
consultations = supa_request('/rest/v1/consultations?select=id,institution_id&institution_id=not.is.null&limit=10000')
if consultations:
    # old_id → name+region → new_id 매핑 구축
    old_id_to_key = {v: k for k, v in old_map.items()}

    updated = 0
    for c in consultations:
        old_id = c['institution_id']
        key = old_id_to_key.get(old_id)
        if key and key in new_map:
            new_id = new_map[key]
            if new_id != old_id:
                supa_request(f'/rest/v1/consultations?id=eq.{c["id"]}', method='PATCH',
                           body={'institution_id': new_id})
                updated += 1
    print(f"  {updated}건 업데이트")
else:
    print("  매칭된 상담 없음 (건너뜀)")

# ─── 7. 완료 ───
print(f"\n=== 업로드 완료 ===")
print(f"기관: {len(cleaned)}개 ({len(old_institutions)} → {len(new_institutions)})")
print(f"admin.html 새로고침하여 확인하세요.")
