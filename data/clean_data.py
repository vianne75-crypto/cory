#!/usr/bin/env python3
"""기관 데이터 정제 스크립트"""
import json, re
from collections import defaultdict

# ─── 1. 데이터 로드 ───
with open('/Users/olive/Qsync/cory/js/data.js', 'r') as f:
    content = f.read()

match = re.search(r'const institutionData\s*=\s*\n(\[[\s\S]*?\]);', content)
data = json.loads(match.group(1))
print(f"원본 데이터: {len(data)}개 기관")

# ─── 2. 시/군/구 → 광역시도 매핑 (한국 행정구역) ───
DISTRICT_TO_REGION = {
    # 서울특별시
    '강남구': '서울특별시', '강동구': '서울특별시', '강북구': '서울특별시', '강서구_서울': '서울특별시',
    '관악구': '서울특별시', '광진구': '서울특별시', '구로구': '서울특별시', '금천구': '서울특별시',
    '노원구': '서울특별시', '도봉구': '서울특별시', '동대문구': '서울특별시', '동작구': '서울특별시',
    '마포구': '서울특별시', '서대문구': '서울특별시', '서초구': '서울특별시', '성동구': '서울특별시',
    '성북구': '서울특별시', '송파구': '서울특별시', '양천구': '서울특별시', '영등포구': '서울특별시',
    '용산구': '서울특별시', '은평구': '서울특별시', '종로구': '서울특별시', '중구_서울': '서울특별시',
    '중랑구': '서울특별시',
    # 부산광역시
    '중구_부산': '부산광역시', '서구_부산': '부산광역시', '동구_부산': '부산광역시', '영도구': '부산광역시',
    '부산진구': '부산광역시', '동래구': '부산광역시', '남구_부산': '부산광역시', '북구_부산': '부산광역시',
    '해운대구': '부산광역시', '사하구': '부산광역시', '금정구': '부산광역시', '강서구_부산': '부산광역시',
    '연제구': '부산광역시', '수영구': '부산광역시', '사상구': '부산광역시', '기장군': '부산광역시',
    # 대구광역시
    '중구_대구': '대구광역시', '동구_대구': '대구광역시', '서구_대구': '대구광역시',
    '남구_대구': '대구광역시', '북구_대구': '대구광역시', '수성구': '대구광역시',
    '달서구': '대구광역시', '달성군': '대구광역시', '군위군': '대구광역시',
    # 인천광역시
    '중구_인천': '인천광역시', '동구_인천': '인천광역시', '미추홀구': '인천광역시',
    '연수구': '인천광역시', '남동구': '인천광역시', '부평구': '인천광역시',
    '계양구': '인천광역시', '서구_인천': '인천광역시', '강화군': '인천광역시', '옹진군': '인천광역시',
    # 광주광역시
    '동구_광주': '광주광역시', '서구_광주': '광주광역시', '남구_광주': '광주광역시',
    '북구_광주': '광주광역시', '광산구': '광주광역시',
    # 대전광역시
    '동구_대전': '대전광역시', '중구_대전': '대전광역시', '서구_대전': '대전광역시',
    '유성구': '대전광역시', '대덕구': '대전광역시',
    # 울산광역시
    '중구_울산': '울산광역시', '남구_울산': '울산광역시', '동구_울산': '울산광역시',
    '북구_울산': '울산광역시', '울주군': '울산광역시',
    # 세종특별자치시
    '세종시': '세종특별자치시',
    # 경기도
    '수원시': '경기도', '성남시': '경기도', '의정부시': '경기도', '안양시': '경기도',
    '부천시': '경기도', '광명시': '경기도', '평택시': '경기도', '동두천시': '경기도',
    '안산시': '경기도', '고양시': '경기도', '과천시': '경기도', '구리시': '경기도',
    '남양주시': '경기도', '오산시': '경기도', '시흥시': '경기도', '군포시': '경기도',
    '의왕시': '경기도', '하남시': '경기도', '용인시': '경기도', '파주시': '경기도',
    '이천시': '경기도', '안성시': '경기도', '김포시': '경기도', '화성시': '경기도',
    '광주시': '경기도', '양주시': '경기도', '포천시': '경기도', '여주시': '경기도',
    '연천군': '경기도', '가평군': '경기도', '양평군': '경기도',
    # 강원특별자치도
    '춘천시': '강원특별자치도', '원주시': '강원특별자치도', '강릉시': '강원특별자치도',
    '동해시': '강원특별자치도', '태백시': '강원특별자치도', '속초시': '강원특별자치도',
    '삼척시': '강원특별자치도', '홍천군': '강원특별자치도', '횡성군': '강원특별자치도',
    '영월군': '강원특별자치도', '평창군': '강원특별자치도', '정선군': '강원특별자치도',
    '철원군': '강원특별자치도', '화천군': '강원특별자치도', '양구군': '강원특별자치도',
    '인제군': '강원특별자치도', '고성군_강원': '강원특별자치도', '양양군': '강원특별자치도',
    # 충청북도
    '청주시': '충청북도', '충주시': '충청북도', '제천시': '충청북도',
    '보은군': '충청북도', '옥천군': '충청북도', '영동군': '충청북도',
    '증평군': '충청북도', '진천군': '충청북도', '괴산군': '충청북도',
    '음성군': '충청북도', '단양군': '충청북도',
    # 충청남도
    '천안시': '충청남도', '공주시': '충청남도', '보령시': '충청남도', '아산시': '충청남도',
    '서산시': '충청남도', '논산시': '충청남도', '계룡시': '충청남도', '당진시': '충청남도',
    '금산군': '충청남도', '부여군': '충청남도', '서천군': '충청남도',
    '청양군': '충청남도', '홍성군': '충청남도', '예산군': '충청남도', '태안군': '충청남도',
    # 전북특별자치도
    '전주시': '전북특별자치도', '군산시': '전북특별자치도', '익산시': '전북특별자치도',
    '정읍시': '전북특별자치도', '남원시': '전북특별자치도', '김제시': '전북특별자치도',
    '완주군': '전북특별자치도', '진안군': '전북특별자치도', '무주군': '전북특별자치도',
    '장수군': '전북특별자치도', '임실군': '전북특별자치도', '순창군': '전북특별자치도',
    '고창군': '전북특별자치도', '부안군': '전북특별자치도',
    # 전라남도
    '목포시': '전라남도', '여수시': '전라남도', '순천시': '전라남도', '나주시': '전라남도',
    '광양시': '전라남도', '담양군': '전라남도', '곡성군': '전라남도', '구례군': '전라남도',
    '고흥군': '전라남도', '보성군': '전라남도', '화순군': '전라남도', '장흥군': '전라남도',
    '강진군': '전라남도', '해남군': '전라남도', '영암군': '전라남도', '무안군': '전라남도',
    '함평군': '전라남도', '영광군': '전라남도', '장성군': '전라남도', '완도군': '전라남도',
    '진도군': '전라남도', '신안군': '전라남도',
    # 경상북도
    '포항시': '경상북도', '경주시': '경상북도', '김천시': '경상북도', '안동시': '경상북도',
    '구미시': '경상북도', '영주시': '경상북도', '영천시': '경상북도', '상주시': '경상북도',
    '문경시': '경상북도', '경산시': '경상북도', '의성군': '경상북도', '청송군': '경상북도',
    '영양군': '경상북도', '영덕군': '경상북도', '청도군': '경상북도', '고령군': '경상북도',
    '성주군': '경상북도', '칠곡군': '경상북도', '예천군': '경상북도',
    '봉화군': '경상북도', '울진군': '경상북도', '울릉군': '경상북도',
    # 경상남도
    '창원시': '경상남도', '진주시': '경상남도', '통영시': '경상남도', '사천시': '경상남도',
    '김해시': '경상남도', '밀양시': '경상남도', '거제시': '경상남도', '양산시': '경상남도',
    '의령군': '경상남도', '함안군': '경상남도', '창녕군': '경상남도', '고성군_경남': '경상남도',
    '남해군': '경상남도', '하동군': '경상남도', '산청군': '경상남도',
    '함양군': '경상남도', '거창군': '경상남도', '합천군': '경상남도',
    # 제주특별자치도
    '제주시': '제주특별자치도', '서귀포시': '제주특별자치도',
}

# 단순 이름으로도 매핑 (접미사 없이)
SIMPLE_DISTRICT_MAP = {}
for k, v in DISTRICT_TO_REGION.items():
    clean = k.split('_')[0]  # Remove disambiguation suffix
    if clean not in SIMPLE_DISTRICT_MAP:
        SIMPLE_DISTRICT_MAP[clean] = v

# 보건소/기관 이름에서 지역 추출을 위한 매핑
# "강남구보건소" → "강남구" → "서울특별시"
ALL_DISTRICTS = {}
for k, v in DISTRICT_TO_REGION.items():
    clean = k.split('_')[0]
    ALL_DISTRICTS[clean] = v

# ─── 3. 기관명 정제 함수 ───
def clean_institution_name(name, inst_type):
    """기관명에서 실제 기관명 추출"""
    original = name

    # 배송 메모/주문 메모 제거
    name = re.sub(r'\s*/\s*스티커.*$', '', name)
    name = re.sub(r'\s*/\s*메일.*$', '', name)
    name = re.sub(r'「.*?」.*$', '', name)
    name = re.sub(r'\s*문구넣어서.*$', '', name)

    # "(보건소로고)" 같은 주문 메모 제거
    name = re.sub(r'\(보건소로고\)', '', name)

    # 공급업체 패턴: "업체명(기관명)" → 기관명
    supplier_patterns = [
        r'^성은약품\((.+?)\)$',
        r'^기프트수림\((.+?)\)$',
        r'^엠앤엠디자인\((.+?)\)$',
        r'^다원인쇄\((.+?)\)$',
        r'^삼성씨앤씨\((.+?)\)$',
    ]
    for pat in supplier_patterns:
        m = re.match(pat, name)
        if m:
            name = m.group(1)
            break

    # 패턴 A: "담당자이름(기관명)" - 이름이 2~4글자 한글이고 괄호 안에 기관 키워드
    inst_keywords = ['보건소', '센터', '복지', '대학', '학교', '사단', '의무대',
                     '사업단', '지원단', '병원', '증진', '건강', '금연', '중독',
                     '소방', '경찰', '군부대', '교육']

    m = re.match(r'^([가-힣]{2,4})\((.+?)\)$', name)
    if m:
        person, org = m.group(1), m.group(2)
        if any(kw in org for kw in inst_keywords):
            name = org

    # 패턴 B: "기관명(담당자이름)" - 괄호 안이 2~4글자 한글 이름
    m = re.match(r'^(.+?)\(([가-힣]{2,4})\)$', name)
    if m:
        org, person = m.group(1), m.group(2)
        if len(org) > 3:
            name = org

    # 패턴 C: "기관명(담당자이름선생님/님)"
    m = re.match(r'^(.+?)\(([가-힣]{2,4}(?:선생님|님|담당))\)$', name)
    if m:
        name = m.group(1)

    # 패턴 D: "담당자(기관명 세부정보)"
    m = re.match(r'^([가-힣]{2,4})\((.+?보건소.*?)\)$', name)
    if m:
        name = m.group(2)
    m = re.match(r'^([가-힣]{2,4})\((.+?센터.*?)\)$', name)
    if m:
        name = m.group(2)

    # "서울금연" 같은 약칭이 괄호 안에 있는 경우: "고윤(서울금연)"
    m = re.match(r'^([가-힣]{2,4})\((.+?금연.*?)\)$', name)
    if m:
        name = m.group(2)

    # 남은 괄호 - 기관명 뒤 부서/세부정보
    # "강남구보건소 금연클리닉(박미영)" → "강남구보건소 금연클리닉"
    m = re.match(r'^(.{4,}?)\(([가-힣]{2,4})\)$', name)
    if m and any(kw in m.group(1) for kw in inst_keywords):
        name = m.group(1)

    # 앞뒤 공백 제거
    name = name.strip()

    # "OO시/군/구 보건소" 공백 정규화
    name = re.sub(r'\s+', ' ', name)

    return name


def extract_district_from_name(name):
    """기관명에서 시/군/구 추출"""
    # "강남구보건소" → "강남구"
    # "춘천시보건소" → "춘천시"
    m = re.match(r'^(?:.*?)?([가-힣]+(?:시|군|구))', name)
    if m:
        district = m.group(1)
        # "대구광역시 중구보건소" 같은 케이스
        if '광역시' in name or '특별시' in name:
            m2 = re.search(r'(?:광역시|특별시)\s*([가-힣]+구)', name)
            if m2:
                return m2.group(1)
        return district
    return None


def find_region_for_district(district):
    """시/군/구로 광역시도 찾기"""
    if district in ALL_DISTRICTS:
        return ALL_DISTRICTS[district]
    # 부분 매칭
    for k, v in ALL_DISTRICTS.items():
        if district.endswith('구') or district.endswith('시') or district.endswith('군'):
            if k == district:
                return v
    return None


# ─── 4. 기관명 정제 실행 ───
for d in data:
    d['_original_name'] = d['name']
    d['name'] = clean_institution_name(d['name'], d['type'])

# ─── 5. 구/군 오타 수정 + 지역 보정 ───
# 기관명에서 district 추출 → 실제 행정구역과 대조
corrections = []
for d in data:
    extracted = extract_district_from_name(d['name'])
    if not extracted:
        continue

    found_region = find_region_for_district(extracted)
    if not found_region:
        continue

    # 지역 보정
    if d['region'] != found_region and d['region'] != '기타':
        corrections.append(f"  지역보정: {d['name']} ({d['region']}→{found_region})")
        d['region'] = found_region
        d['district'] = extracted

    # district 보정
    if d['district'] != extracted and found_region == d['region']:
        corrections.append(f"  구역보정: {d['name']} district({d['district']}→{extracted})")
        d['district'] = extracted

# 구/군 오타: 이름에 있는 지역명과 district 비교
for d in data:
    if '보건소' in d['name']:
        # "강진구보건소" + district="강진군" → "강진군보건소"
        m = re.match(r'^([가-힣]+)(구)(보건소.*)$', d['name'])
        if m and '군' in d['district']:
            old_name = d['name']
            district_base = d['district'].replace('군', '')
            if m.group(1) == district_base:
                d['name'] = m.group(1) + '군' + m.group(3)
                corrections.append(f"  구→군: {old_name} → {d['name']}")

        m = re.match(r'^([가-힣]+)(군)(보건소.*)$', d['name'])
        if m and '구' in d['district'] and '군' not in d['district']:
            old_name = d['name']
            district_base = d['district'].replace('구', '')
            if m.group(1) == district_base:
                d['name'] = m.group(1) + '구' + m.group(3)
                corrections.append(f"  군→구: {old_name} → {d['name']}")

# "홍선군보건소" → "홍성군보건소" (오타)
TYPO_FIXES = {
    '홍선군보건소': '홍성군보건소',
    '홍선군': '홍성군',
}
for d in data:
    for old, new in TYPO_FIXES.items():
        if old in d['name']:
            corrections.append(f"  오타수정: {d['name']} → {d['name'].replace(old, new)}")
            d['name'] = d['name'].replace(old, new)

print(f"\n수정 사항 ({len(corrections)}건):")
for c in corrections[:30]:
    print(c)
if len(corrections) > 30:
    print(f"  ... 외 {len(corrections)-30}건")

# ─── 6. 기타 지역 기관 매핑 ───
for d in data:
    if d['region'] == '기타':
        extracted = extract_district_from_name(d['name'])
        if extracted:
            found = find_region_for_district(extracted)
            if found:
                print(f"  기타→{found}: {d['name']} (district: {extracted})")
                d['region'] = found
                d['district'] = extracted
                continue
        # district에서 시도
        found = find_region_for_district(d['district'])
        if found:
            print(f"  기타→{found}: {d['name']} (district: {d['district']})")
            d['region'] = found

# 여전히 기타인 기관
etc_remaining = [d for d in data if d['region'] == '기타']
if etc_remaining:
    print(f"\n여전히 '기타' 지역인 기관 ({len(etc_remaining)}개):")
    for d in etc_remaining:
        print(f"  {d['name']} | district: {d['district']}")

# ─── 7. 중복 병합 ───
# 같은 정제된 이름의 기관들을 병합
def normalize_name(name):
    """병합을 위한 이름 정규화"""
    n = name.strip()
    n = re.sub(r'\s+', '', n)  # 공백 제거
    n = re.sub(r'금연클리닉$', '', n)  # 금연클리닉 접미사 제거
    n = re.sub(r'건강증진과$', '', n)
    return n

name_groups = defaultdict(list)
for d in data:
    key = normalize_name(d['name']) + '|' + d['region']
    name_groups[key].append(d)

merged_data = []
merge_count = 0
for key, group in name_groups.items():
    if len(group) == 1:
        merged_data.append(group[0])
    else:
        # 병합: 납품액/구매량 합산, 최근 구매일 사용, 제품 합집합
        base = group[0].copy()
        base['purchaseAmount'] = sum(d['purchaseAmount'] for d in group)
        base['purchaseVolume'] = sum(d['purchaseVolume'] for d in group)

        # 최근 구매일
        dates = [d['lastPurchaseDate'] for d in group if d.get('lastPurchaseDate') and d['lastPurchaseDate'] != '-']
        if dates:
            base['lastPurchaseDate'] = max(dates)

        # 제품 합집합
        all_products = set()
        for d in group:
            all_products.update(d['products'])
        base['products'] = sorted(list(all_products))

        # 구매단계: 가장 높은 단계 사용
        stage_order = {'추천': 5, '만족': 4, '구매': 3, '고려': 2, '관심': 1, '인지': 0}
        best_stage = max(group, key=lambda d: stage_order.get(d['purchaseStage'], 0))
        base['purchaseStage'] = best_stage['purchaseStage']

        # 구매주기 보정
        order_count = len(group)
        if order_count >= 4:
            base['purchaseCycle'] = '분기'
        elif order_count >= 2:
            base['purchaseCycle'] = '반기'

        # 가장 짧지 않은 이름 사용
        best_name = max(group, key=lambda d: len(d['name']))
        base['name'] = best_name['name']

        merged_data.append(base)
        merge_count += len(group) - 1
        if len(group) > 2:
            print(f"  병합({len(group)}→1): {[d['_original_name'] for d in group]} → {base['name']}")

print(f"\n중복 병합: {merge_count}건 제거, {len(data)} → {len(merged_data)}개")

# ─── 8. ID 재부여 + 정리 ───
for i, d in enumerate(merged_data):
    d['id'] = i + 1
    if '_original_name' in d:
        del d['_original_name']

# ─── 9. 좌표 보정 (지역 중심 기반) ───
import random
random.seed(42)

REGION_CENTERS_PY = {
    '서울특별시': (37.5665, 126.978),
    '부산광역시': (35.1796, 129.0756),
    '대구광역시': (35.8714, 128.6014),
    '인천광역시': (37.4563, 126.7052),
    '광주광역시': (35.1595, 126.8526),
    '대전광역시': (36.3504, 127.3845),
    '울산광역시': (35.5384, 129.3114),
    '세종특별자치시': (36.48, 127.0),
    '경기도': (37.275, 127.01),
    '강원특별자치도': (37.8228, 128.1555),
    '충청북도': (36.6357, 127.4912),
    '충청남도': (36.5184, 126.8),
    '전북특별자치도': (35.82, 127.11),
    '전라남도': (34.816, 126.463),
    '경상북도': (36.576, 128.506),
    '경상남도': (35.46, 128.213),
    '제주특별자치도': (33.489, 126.498),
}

# 지역이 변경된 기관의 좌표를 보정
for d in merged_data:
    region = d['region']
    if region in REGION_CENTERS_PY:
        center = REGION_CENTERS_PY[region]
        # 현재 좌표가 해당 지역 중심에서 너무 먼 경우 보정
        lat_diff = abs(d['lat'] - center[0])
        lng_diff = abs(d['lng'] - center[1])
        if lat_diff > 2 or lng_diff > 2:
            d['lat'] = round(center[0] + random.uniform(-0.3, 0.3), 4)
            d['lng'] = round(center[1] + random.uniform(-0.3, 0.3), 4)

# ─── 10. 최종 통계 ───
print(f"\n최종 데이터: {len(merged_data)}개 기관")
by_region = defaultdict(int)
by_type = defaultdict(int)
for d in merged_data:
    by_region[d['region']] += 1
    by_type[d['type']] += 1

print("\n지역별:")
for r, c in sorted(by_region.items()):
    print(f"  {r}: {c}개")

print("\n유형별:")
for t, c in sorted(by_type.items(), key=lambda x: -x[1]):
    print(f"  {t}: {c}개")

# ─── 11. 저장 ───
with open('/Users/olive/Qsync/cory/data/cleaned_institutions.json', 'w') as f:
    json.dump(merged_data, f, ensure_ascii=False, indent=2)

print(f"\n정제된 데이터 저장: data/cleaned_institutions.json")
