#!/usr/bin/env python3
"""기관 유형 재분류 스크립트"""
import json, re

# ─── 1. 데이터 로드 ───
with open('/Users/olive/Qsync/cory/js/data.js', 'r') as f:
    content = f.read()

match = re.search(r'const institutionData\s*=\s*\n(\[[\s\S]*?\]);', content)
data = json.loads(match.group(1))
print(f"원본 데이터: {len(data)}개 기관")

# ─── 2. 재분류 규칙 ───

# 사업장 키워드 (이름에 포함되면 사업장으로 분류)
BUSINESS_KEYWORDS = [
    '사업장', '건강관리실', '서울교통공사', 'GC녹십자',
    '한화솔루션', '한화큐셀', '삼성전자', 'CJ대한통운',
    '한화시스템', '발렉스', '동서발전', '양수발전소',
    '조은요양병원', '온누리안과병원', '태평서울병원',
    '국민건강의료기', '판촉사랑',
]

# 군/경/소방 키워드
MILITARY_KEYWORDS = [
    '국군', '사단', '의무대', '군부대', '부대',
    '육군', '해양경찰', '사관학교', '훈련소',
    '방위사령부', '군사경찰',
]

# 전공교육 기관 (전공교육회원 확인 기반)
PROFESSIONAL_EDU = [
    '대구한의대학교 보건학부',
    '대구한의대학교',
    '전주대학교 의과학대학 행정실',
    '전주대학교',
    '이화여대 약학대학',
    '경상대예방의학교실',
    '경상국립대학교 예방의학교실',
    '약학대학 학부실습 과정에 사용 예정',
    '순천향대학교',  # 의대 보유 대학
]

# 광역시도 건강증진부서로 유지할 기관 (실제 광역 단위 사업단)
KEEP_AS_REGIONAL = [
    '서울시통합건강증진사업지원단',
    '서울시통합건강증진사업단',
]

# 공공기관(기타)에서 군/경/소방으로 이동할 기관
MILITARY_FROM_PUBLIC = [
    '국군수도병원', '국군양주병원', '국군강릉병원',
    '국군춘천병원', '국군서울지구병원', '국군구리병원',
    '국군홍천병원', '국군고양병원', '국군강릉병원',
    '국립부곡병원', '국립부곡병원 중독진단과',
]

# 보건소로 재분류할 기관
RECLASSIFY_TO_BOGUNSO = [
    '남양주동부보건센터',
    '우산건강생활지원센터',
    '구미건강생활지원센터',
    '건강생활팀',
]

# 공공기관(기타)로 재분류할 기관
RECLASSIFY_TO_PUBLIC = [
    '국민건강보험공단 김제지사',
    '국민건강보험공단 김제지사 2026년 캠페인 홍보 물품 납품',
    '국민건강보험공단 서귀포지사',
    '한국건강관리협회 울산광역시지부',
    '한국건강관리협회',
    '대구광역시청',
    '김포시청',
    '서울시청',
    '한국보훈복지의료공단 광주보훈병원',
    '강원대병원 강원지역암센터',
    '화순전남대학교병원',
]

changes = []

for d in data:
    old_type = d['type']
    name = d['name']

    # ── 규칙 1: 정신건강복지센터 → 전문기관
    if old_type == '정신건강복지센터':
        d['type'] = '전문기관'
        changes.append(f"  전문기관: {name} (← 정신건강복지센터)")
        continue

    # ── 규칙 2: 중독관리통합지원센터 → 전문기관
    if old_type == '중독관리통합지원센터':
        d['type'] = '전문기관'
        changes.append(f"  전문기관: {name} (← 중독관리통합지원센터)")
        continue

    # ── 규칙 3: 사업장 판별 (모든 유형에서)
    if any(kw in name for kw in BUSINESS_KEYWORDS):
        d['type'] = '사업장'
        changes.append(f"  사업장: {name} (← {old_type})")
        continue

    # ── 규칙 4: 광역시도 건강증진부서 재분류
    if old_type == '광역시도 건강증진부서':
        if name in KEEP_AS_REGIONAL:
            continue  # 유지
        if name in RECLASSIFY_TO_BOGUNSO:
            d['type'] = '보건소'
            changes.append(f"  보건소: {name} (← 광역시도)")
        elif name in RECLASSIFY_TO_PUBLIC:
            d['type'] = '공공기관(기타)'
            changes.append(f"  공공기관: {name} (← 광역시도)")
        elif any(kw in name for kw in MILITARY_KEYWORDS):
            d['type'] = '군/경/소방'
            changes.append(f"  군/경/소방: {name} (← 광역시도)")
        else:
            d['type'] = '공공기관(기타)'
            changes.append(f"  공공기관: {name} (← 광역시도)")
        continue

    # ── 규칙 5: 공공기관(기타)에서 군/경/소방으로
    if old_type == '공공기관(기타)':
        if name in MILITARY_FROM_PUBLIC or any(kw in name for kw in MILITARY_KEYWORDS):
            d['type'] = '군/경/소방'
            changes.append(f"  군/경/소방: {name} (← 공공기관)")
            continue
        if name in RECLASSIFY_TO_BOGUNSO:
            d['type'] = '보건소'
            changes.append(f"  보건소: {name} (← 공공기관)")
            continue
        if name in RECLASSIFY_TO_PUBLIC:
            continue  # 이미 공공기관
        continue

    # ── 규칙 6: 학교/대학 → 교육기관 또는 전공교육
    if old_type == '학교/대학':
        # 군사 학교 → 군/경/소방
        if any(kw in name for kw in MILITARY_KEYWORDS):
            d['type'] = '군/경/소방'
            changes.append(f"  군/경/소방: {name} (← 학교/대학)")
            continue
        # 전공교육 기관
        if name in PROFESSIONAL_EDU:
            d['type'] = '전공교육'
            changes.append(f"  전공교육: {name} (← 학교/대학)")
            continue
        # 나머지 → 교육기관
        d['type'] = '교육기관'
        changes.append(f"  교육기관: {name} (← 학교/대학)")
        continue

    # ── 규칙 7: 금연지원센터 - 대학 프로젝트는 교육기관으로
    if old_type == '금연지원센터':
        if '대학교' in name or '대학' in name:
            d['type'] = '교육기관'
            changes.append(f"  교육기관: {name} (← 금연지원센터)")
            continue
        # 사업단은 광역시도 건강증진부서로
        if '통합건강증진사업' in name:
            d['type'] = '광역시도 건강증진부서'
            changes.append(f"  광역시도: {name} (← 금연지원센터)")
            continue

# ─── 3. 결과 출력 ───
print(f"\n변경 사항 ({len(changes)}건):")
for c in changes:
    print(c)

# 유형별 집계
from collections import defaultdict
by_type = defaultdict(int)
for d in data:
    by_type[d['type']] += 1

print(f"\n유형별 집계:")
for t, c in sorted(by_type.items(), key=lambda x: -x[1]):
    print(f"  {t}: {c}개")

# 광역시도 건강증진부서 확인
regional = [d for d in data if d['type'] == '광역시도 건강증진부서']
print(f"\n광역시도 건강증진부서 ({len(regional)}개):")
for d in regional:
    print(f"  {d['name']} ({d['region']})")

# ─── 4. 저장 ───
# data.js 헤더 부분 보존
header_match = re.match(r'([\s\S]*?const institutionData\s*=\s*\n)', content)
header = header_match.group(1)

output = header + json.dumps(data, ensure_ascii=False, indent=2) + ';\n'

with open('/Users/olive/Qsync/cory/js/data.js', 'w') as f:
    f.write(output)

print(f"\ndata.js 업데이트 완료")
