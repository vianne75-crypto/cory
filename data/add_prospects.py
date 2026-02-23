#!/usr/bin/env python3
"""구글시트 예상 고객(대학교) 데이터를 data.js에 추가"""
import csv, json, re
from collections import defaultdict

# ─── 1. data.js 로드 ───
with open('/Users/olive/Qsync/cory/js/data.js', 'r') as f:
    content = f.read()

match = re.search(r'const institutionData\s*=\s*\n(\[[\s\S]*?\]);', content)
data = json.loads(match.group(1))
print(f"기존 데이터 (전체): {len(data)}개 기관")

# 이전에 add_prospects.py로 추가된 항목 제거 (이름이 "~학과"로 끝나는 전공교육 미구매)
data = [d for d in data if not (
    d['type'] == '전공교육' and
    d['purchaseStage'] == '인지' and
    d['purchaseAmount'] == 0 and
    re.search(r'학과$', d['name'])
)]
print(f"이전 prospect 제거 후: {len(data)}개 기관")

# 기존 기관명 세트 (중복 방지)
existing_names = set(d['name'] for d in data)

# 기존 대학교 이름 추출 (정확한 매칭용)
# "대구한의대학교 보건학부" → "대구한의대학교"
# "이화여자대학교" → "이화여자대학교"
existing_universities = set()
for d in data:
    name = d['name']
    # "대학교" 또는 "대학"이 포함된 경우
    m = re.search(r'(\S*대학교?\S*)', name)
    if m:
        uni_name = m.group(1)
        # 뒤에 붙은 부속 표현 제거
        uni_name = re.sub(r'(사범대학부속|부속|중고등학교|병원).*', '', uni_name)
        existing_universities.add(uni_name)

print(f"기존 대학교 이름: {len(existing_universities)}개")
for u in sorted(existing_universities):
    print(f"  {u}")

# ─── 2. 주소 → 지역/시군구 매핑 ───
REGION_MAP = {
    '서울특별시': '서울특별시', '서울': '서울특별시',
    '부산광역시': '부산광역시', '부산': '부산광역시',
    '대구광역시': '대구광역시', '대구': '대구광역시',
    '인천광역시': '인천광역시', '인천': '인천광역시',
    '광주광역시': '광주광역시', '광주': '광주광역시',
    '대전광역시': '대전광역시', '대전': '대전광역시',
    '울산광역시': '울산광역시', '울산': '울산광역시',
    '세종특별자치시': '세종특별자치시', '세종': '세종특별자치시',
    '경기도': '경기도', '경기': '경기도',
    '강원특별자치도': '강원특별자치도', '강원': '강원특별자치도',
    '충청북도': '충청북도', '충북': '충청북도',
    '충청남도': '충청남도', '충남': '충청남도',
    '전북특별자치도': '전북특별자치도', '전북': '전북특별자치도',
    '전라남도': '전라남도', '전남': '전라남도',
    '경상북도': '경상북도', '경북': '경상북도',
    '경상남도': '경상남도', '경남': '경상남도',
    '제주특별자치도': '제주특별자치도', '제주': '제주특별자치도',
}

def parse_address(addr):
    """주소에서 region, district 추출"""
    if not addr or not addr.strip():
        return None, None
    addr = addr.strip()

    # 광역시/도 추출
    region = None
    district = None

    parts = addr.split()
    if not parts:
        return None, None

    # 첫 번째 토큰으로 region 매핑
    first = parts[0]
    region = REGION_MAP.get(first)

    if not region:
        # "경북", "충남" 등 약어
        for key, val in REGION_MAP.items():
            if first.startswith(key):
                region = val
                break

    if not region:
        # "강릉시" 같은 경우 → 강원특별자치도
        city_to_region = {
            '강릉시': '강원특별자치도', '강릉': '강원특별자치도',
            '김천대학교': '경상북도',
        }
        for key, val in city_to_region.items():
            if first.startswith(key):
                region = val
                district = first if first.endswith(('시', '군', '구')) else None
                break

    if not region:
        return None, None

    # district 추출
    if not district and len(parts) > 1:
        second = parts[1]
        # 시/군/구로 끝나는 것
        if second.endswith(('시', '군', '구')):
            district = second
        elif len(parts) > 2 and parts[2].endswith(('시', '군', '구')):
            # "경기도 수원시 영통구" → district = "수원시"
            district = second if second.endswith(('시', '군')) else parts[2]

    # 광역시는 구가 district
    if region in ('서울특별시', '부산광역시', '대구광역시', '인천광역시',
                   '광주광역시', '대전광역시', '울산광역시'):
        # 두 번째 토큰이 구
        if len(parts) > 1 and parts[1].endswith('구'):
            district = parts[1]
        elif len(parts) > 1 and parts[1].endswith('시'):
            # 울산광역시 울주군
            district = parts[1]

    # 세종은 district 없음
    if region == '세종특별자치시':
        district = '세종시'

    return region, district

# ─── 3. 시군구 GeoJSON에서 좌표 ───
from shapely.geometry import shape

with open('/Users/olive/Qsync/cory/data/korea-district-geo.json', 'r') as f:
    geo = json.load(f)

district_centers = {}
for feature in geo['features']:
    p = feature['properties']
    key = (p['region'], p['district'])
    try:
        geom = shape(feature['geometry'])
        centroid = geom.centroid
        district_centers[key] = (round(centroid.y, 4), round(centroid.x, 4))
    except:
        pass

# 광역시도별 대표 좌표 (district 매핑 실패 시 사용)
REGION_CENTERS = {
    '서울특별시': (37.5665, 126.9780),
    '부산광역시': (35.1796, 129.0756),
    '대구광역시': (35.8714, 128.6014),
    '인천광역시': (37.4563, 126.7052),
    '광주광역시': (35.1595, 126.8526),
    '대전광역시': (36.3504, 127.3845),
    '울산광역시': (35.5384, 129.3114),
    '세종특별자치시': (36.4800, 127.0000),
    '경기도': (37.4138, 127.5183),
    '강원특별자치도': (37.8228, 128.1555),
    '충청북도': (36.6357, 127.4917),
    '충청남도': (36.5184, 126.8000),
    '전북특별자치도': (35.7175, 127.1530),
    '전라남도': (34.8679, 126.9910),
    '경상북도': (36.4919, 128.8889),
    '경상남도': (35.4606, 128.2132),
    '제주특별자치도': (33.4890, 126.4983),
}

# ─── 4. CSV 파싱 ───
with open('/Users/olive/Qsync/cory/data/prospects.csv', 'r') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

print(f"CSV 행: {len(rows)}개")

# 학교별로 그룹핑 (같은 학교가 간호/의과/보건/약학에 중복 등장)
school_data = {}  # school_name -> {구분 set, 학과 set, 주소, ...}

for row in rows:
    school = row.get('학교명', '').strip()
    if not school:
        continue

    category = row.get('구분', '').strip()
    dept = row.get('학과', '').strip()
    addr = row.get('주소1', '').strip()
    addr2 = row.get('주소2', '').strip()

    # 학교명 정규화 (캠퍼스 표기 통일)
    clean_name = school.replace('(', ' ').replace(')', '').strip()
    clean_name = re.sub(r'\s+', ' ', clean_name)

    if school not in school_data:
        school_data[school] = {
            'categories': set(),
            'depts': set(),
            'addr': addr,
            'addr2': addr2,
            'category': category,
        }

    school_data[school]['categories'].add(category)
    if dept:
        school_data[school]['depts'].add(dept)
    # 주소가 없으면 업데이트
    if addr and not school_data[school]['addr']:
        school_data[school]['addr'] = addr

print(f"고유 학교: {len(school_data)}개")

# ─── 5. 기존 데이터와 중복 제거 후 새 항목 생성 ───
import random
random.seed(42)

new_entries = []
next_id = max(d['id'] for d in data) + 1
skipped = []

for school, info in sorted(school_data.items()):
    # 기존 데이터에 이미 있는지 확인
    # 학교명의 핵심 부분 추출 (캠퍼스명 제거)
    base_name = school.split('(')[0].strip()
    # "가톨릭대학교 간호대학" → "가톨릭대학교"
    base_name = base_name.split()[0] if base_name else school

    # 정확한 대학교명 매칭만 (부분 문자열 X)
    is_duplicate = False
    if base_name in existing_universities:
        is_duplicate = True
        skipped.append(f"  {school} ← 기존 대학: {base_name}")

    if is_duplicate:
        continue

    # 주소에서 지역 파싱
    region, district = parse_address(info['addr'])
    if not region:
        skipped.append(f"  {school} ← 주소 파싱 실패: {info['addr']}")
        continue

    # 좌표
    if district and (region, district) in district_centers:
        center = district_centers[(region, district)]
    else:
        center = REGION_CENTERS.get(region, (36.5, 127.5))

    lat = round(center[0] + random.uniform(-0.005, 0.005), 4)
    lng = round(center[1] + random.uniform(-0.005, 0.005), 4)

    # 구분에 따라 분류
    cats = info['categories']
    if '의과대학' in cats or '보건대학' in cats or '약학대학' in cats:
        inst_type = '전공교육'
    else:
        inst_type = '전공교육'  # 간호대학/간호전문대학도 전공교육

    # 학과 목록으로 이름 구성
    cat_labels = []
    if '간호대학' in cats or '간호전문대학' in cats:
        cat_labels.append('간호')
    if '의과대학' in cats:
        cat_labels.append('의과')
    if '보건대학' in cats:
        cat_labels.append('보건')
    if '약학대학' in cats:
        cat_labels.append('약학')

    dept_suffix = '/'.join(cat_labels) if cat_labels else '간호'
    display_name = f"{school} {dept_suffix}학과"

    if not district:
        district = region.replace('특별시', '').replace('광역시', '').replace('특별자치도', '').replace('특별자치시', '').replace('도', '')

    new_entries.append({
        "id": next_id,
        "name": display_name,
        "type": inst_type,
        "region": region,
        "district": district,
        "lat": lat,
        "lng": lng,
        "products": ["알쓰패치"],
        "purchaseCycle": "-",
        "purchaseVolume": 0,
        "purchaseAmount": 0,
        "purchaseStage": "인지",
        "lastPurchaseDate": "-"
    })
    next_id += 1

print(f"\n중복 건너뜀 ({len(skipped)}건):")
for s in skipped:
    print(s)

print(f"\n새로 추가할 기관: {len(new_entries)}개")

# 지역별 집계
by_region = defaultdict(int)
by_category = defaultdict(int)
for e in new_entries:
    by_region[e['region']] += 1

print("\n지역별 추가 기관:")
for r, c in sorted(by_region.items()):
    print(f"  {r}: {c}개")

# ─── 6. 데이터 병합 ───
all_data = data + new_entries

# ID 재부여
for i, d in enumerate(all_data):
    d['id'] = i + 1

print(f"\n최종 데이터: {len(all_data)}개 기관")

# 유형별 집계
by_type = defaultdict(int)
for d in all_data:
    by_type[d['type']] += 1

print("\n유형별:")
for t, c in sorted(by_type.items(), key=lambda x: -x[1]):
    print(f"  {t}: {c}개")

# 지역별 총 대상 기관수
region_totals = defaultdict(int)
for d in all_data:
    region_totals[d['region']] += 1

# ─── 7. data.js 저장 ───
header_match = re.match(r'([\s\S]*?const institutionData\s*=\s*\n)', content)
header = header_match.group(1)

# REGION_TOTAL_TARGETS 업데이트
new_targets = "const REGION_TOTAL_TARGETS = {\n"
for r, c in sorted(region_totals.items()):
    new_targets += f"  '{r}': {c},\n"
new_targets += "};"

header = re.sub(
    r'const REGION_TOTAL_TARGETS\s*=\s*\{[\s\S]*?\};',
    new_targets,
    header
)

output = header + json.dumps(all_data, ensure_ascii=False, indent=2) + ';\n'

with open('/Users/olive/Qsync/cory/js/data.js', 'w') as f:
    f.write(output)

print(f"\ndata.js 업데이트 완료! ({len(all_data)}개 기관)")
