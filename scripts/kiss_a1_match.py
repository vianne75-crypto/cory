#!/usr/bin/env python3
# ============================================================
# KISS A1 반복참석률 — 과거(2024·2025) 방문자 ∩ 2026 KISS 신청자
# 학회 종료(7/10) 후 실행. 2026 최종 신청자와 과거 방문 이력을 대조.
#
# 실행:  ADMIN_KEY='<대시보드 관리자 키>' python3 scripts/kiss_a1_match.py
#   - ADMIN_KEY = wrangler secret ADMIN_KEY와 동일 값(대시보드 최초 입력값)
#   - 환경변수로만 전달 → 코드/깃에 미포함(시크릿 보호)
#
# 매칭: ① 전화 정확매칭(정규화 후) ② 소속(기관명) 포함매칭 보완
# 데이터: _SECRET/kiss_past_visitors_2024_2025.json (2024 3,426 + 2025 1,400)
# ============================================================
import os, re, json, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
MASTER = os.path.join(HERE, '..', '_SECRET', 'kiss_past_visitors_2024_2025.json')
WORKER = 'https://aps-lead.vianne75.workers.dev'

ADMIN_KEY = os.environ.get('ADMIN_KEY')
if not ADMIN_KEY:
    raise SystemExit("ADMIN_KEY 환경변수 필요:  ADMIN_KEY='...' python3 scripts/kiss_a1_match.py")

def norm_phone(v):
    d = re.sub(r'[^0-9]', '', str(v or ''))
    return d if (len(d) in (10, 11) and d.startswith('01')) else None

def norm_org(v):
    if not v or str(v) == 'nan':
        return None
    s = re.sub(r'\s+', '', str(v))
    s = re.sub(r'\(주\)|주식회사|㈜|\(재\)|\(사\)', '', s)
    return s.lower() or None

# 과거 방문자 마스터
past = json.load(open(MASTER, encoding='utf-8'))
past_phones = {m['phone'] for m in past if m.get('phone')}
past_orgs = {norm_org(m['org']) for m in past if m.get('org')}
past_orgs.discard(None)

# 2026 신청자 (관리자 엔드포인트, service_role)
req = urllib.request.Request(WORKER + '/kiss-admin-list?limit=1000',
                             headers={'X-Admin-Key': ADMIN_KEY})
signups = json.load(urllib.request.urlopen(req))
real = [s for s in signups if s.get('ref_key')]     # 실신청(전화 있는 것)

rows = []
n_phone = n_org = 0
for s in real:
    ph = norm_phone(s.get('phone'))
    org = norm_org(s.get('institution_name'))
    by_phone = bool(ph and ph in past_phones)
    by_org = bool(org and any((org in po or po in org) for po in past_orgs))
    if by_phone or by_org:
        n_phone += by_phone
        n_org += (by_org and not by_phone)
        rows.append((s.get('institution_name'), s.get('name'), '전화' if by_phone else '소속'))

total = len(real)
repeat = len(rows)
print("=" * 48)
print(f"KISS A1 반복참석률 (과거 2024·2025 → 2026)")
print("=" * 48)
print(f"2026 실신청(ref_key 有): {total}명")
if total:
    print(f"과거 방문 이력 有: {repeat}명 → 반복참석률 {100*repeat/total:.1f}%")
    print(f"  ├ 전화 정확매칭: {n_phone}명")
    print(f"  └ 소속 매칭(전화 無): {n_org}명")
    print(f"\n[참고] 과거 자체 반복치 2024∩2025 = 91명(전화 기준)")
    print("\n연결 상세:")
    for org, name, how in rows:
        print(f"  · {org} ({name}) [{how}]")
else:
    print("신청 0 — 학회 종료 후 재실행")
