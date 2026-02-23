#!/usr/bin/env python3
"""미구매 기관 데이터 생성 - 보건소, 정신건강복지센터, 중독관리통합지원센터"""
import json, re
from shapely.geometry import shape

# ─── 1. 데이터 로드 ───
with open('/Users/olive/Qsync/cory/js/data.js', 'r') as f:
    content = f.read()

match = re.search(r'const institutionData\s*=\s*\n(\[[\s\S]*?\]);', content)
data = json.loads(match.group(1))
print(f"기존 데이터: {len(data)}개 기관")

# ─── 2. 시군구 GeoJSON에서 중심 좌표 추출 ───
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
        # fallback: bounding box center
        coords = json.dumps(feature['geometry']['coordinates'])
        import re as re2
        nums = [float(x) for x in re2.findall(r'[\d.]+', coords)]
        lngs = nums[0::2]
        lats = nums[1::2]
        district_centers[key] = (
            round(sum(lats)/len(lats), 4),
            round(sum(lngs)/len(lngs), 4)
        )

print(f"시군구 GeoJSON: {len(district_centers)}개 지역")

# ─── 3. 기존 기관 매핑 ───
existing_bogunso = set()
existing_mental = set()
existing_addiction = set()

for d in data:
    key = (d['region'], d['district'])
    if d['type'] == '보건소':
        existing_bogunso.add(key)
    if '정신건강' in d['name']:
        existing_mental.add(key)
    if '중독' in d['name']:
        existing_addiction.add(key)

# ─── 4. 중독관리통합지원센터 대상 지역 (시/도 단위 + 주요 시/군/구) ───
# 전국 약 50개소 운영 중 - 광역시도 + 인구 30만 이상 시군구 중심
ADDICTION_CENTERS_TARGET = set()

# 광역시도별 최소 1개
MAIN_DISTRICTS = {
    '서울특별시': ['강남구', '강서구', '노원구', '송파구', '마포구', '영등포구', '성북구', '도봉구', '관악구', '종로구'],
    '부산광역시': ['해운대구', '사하구', '부산진구', '동래구'],
    '대구광역시': ['달서구', '수성구', '동구', '북구'],
    '인천광역시': ['남동구', '부평구', '연수구', '서구'],
    '광주광역시': ['북구', '광산구', '서구'],
    '대전광역시': ['서구', '유성구', '중구'],
    '울산광역시': ['남구', '중구'],
    '세종특별자치시': ['세종시'],
    '경기도': ['수원시', '성남시', '고양시', '용인시', '안산시', '안양시', '파주시', '김포시', '화성시', '평택시'],
    '강원특별자치도': ['춘천시', '원주시', '강릉시'],
    '충청북도': ['청주시', '충주시'],
    '충청남도': ['천안시', '아산시', '서산시'],
    '전북특별자치도': ['전주시', '군산시', '익산시'],
    '전라남도': ['목포시', '순천시', '여수시'],
    '경상북도': ['포항시', '구미시', '경산시'],
    '경상남도': ['창원시', '김해시', '진주시', '양산시'],
    '제주특별자치도': ['제주시', '서귀포시'],
}

for region, districts in MAIN_DISTRICTS.items():
    for district in districts:
        ADDICTION_CENTERS_TARGET.add((region, district))

# ─── 5. 미구매 기관 생성 ───
new_entries = []
next_id = max(d['id'] for d in data) + 1
import random
random.seed(42)

# 5-1. 미구매 보건소
for key in sorted(district_centers.keys()):
    if key in existing_bogunso:
        continue
    region, district = key
    center = district_centers[key]
    # 약간의 좌표 오프셋
    lat = round(center[0] + random.uniform(-0.01, 0.01), 4)
    lng = round(center[1] + random.uniform(-0.01, 0.01), 4)

    new_entries.append({
        "id": next_id,
        "name": f"{district}보건소",
        "type": "보건소",
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

# 5-2. 미구매 정신건강복지센터
for key in sorted(district_centers.keys()):
    if key in existing_mental:
        continue
    region, district = key
    center = district_centers[key]
    lat = round(center[0] + random.uniform(-0.01, 0.01), 4)
    lng = round(center[1] + random.uniform(-0.01, 0.01), 4)

    new_entries.append({
        "id": next_id,
        "name": f"{district}정신건강복지센터",
        "type": "전문기관",
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

# 5-3. 미구매 중독관리통합지원센터
for key in sorted(ADDICTION_CENTERS_TARGET):
    if key in existing_addiction:
        continue
    if key not in district_centers:
        continue
    region, district = key
    center = district_centers[key]
    lat = round(center[0] + random.uniform(-0.01, 0.01), 4)
    lng = round(center[1] + random.uniform(-0.01, 0.01), 4)

    new_entries.append({
        "id": next_id,
        "name": f"{district}중독관리통합지원센터",
        "type": "전문기관",
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

print(f"\n미구매 기관 생성:")
from collections import defaultdict
by_type = defaultdict(int)
for e in new_entries:
    if '보건소' in e['name'] and e['type'] == '보건소':
        by_type['보건소'] += 1
    elif '정신건강' in e['name']:
        by_type['정신건강복지센터'] += 1
    elif '중독' in e['name']:
        by_type['중독관리통합지원센터'] += 1
for t, c in by_type.items():
    print(f"  {t}: {c}개")
print(f"  합계: {len(new_entries)}개")

# ─── 6. 데이터 병합 ───
all_data = data + new_entries

# ID 재부여
for i, d in enumerate(all_data):
    d['id'] = i + 1

print(f"\n최종 데이터: {len(all_data)}개 기관")

# 유형별 집계
by_type2 = defaultdict(int)
by_stage = defaultdict(int)
for d in all_data:
    by_type2[d['type']] += 1
    by_stage[d['purchaseStage']] += 1

print("\n유형별:")
for t, c in sorted(by_type2.items(), key=lambda x: -x[1]):
    print(f"  {t}: {c}개")

print("\n단계별:")
for s, c in sorted(by_stage.items(), key=lambda x: -x[1]):
    print(f"  {s}: {c}개")

# 지역별 총 대상 기관수 업데이트
region_totals = defaultdict(int)
for d in all_data:
    region_totals[d['region']] += 1

print("\n지역별 (REGION_TOTAL_TARGETS 업데이트용):")
for r, c in sorted(region_totals.items()):
    print(f"  '{r}': {c},")

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

print(f"\ndata.js 업데이트 완료!")
