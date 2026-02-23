#!/usr/bin/env python3
"""
상담내역 CSV → data.js 구매단계 업데이트

상담 태그 기반 구매단계 매핑:
  [문의], [업체문의], [딜러문의], [단가문의] → 관심
  [견적], [시안], [샘플], [샘플요청], [단가표] → 고려
  [수주], [긴급수주], [수주예정], [카드결제] → 고려 (이미 구매 처리된 건은 유지)
"""

import csv
import json
import re
import sys
from collections import defaultdict

# ── 상담 태그 → 구매단계 매핑 ──
TAG_STAGE_MAP = {
    # 관심 단계
    '문의': '관심', '업체문의': '관심', '딜러문의': '관심', '대리점문의': '관심',
    '단가문의': '관심', '구매문의': '관심',
    # 고려 단계
    '견적': '고려', '견적서': '고려', '시안': '고려', '참고시안': '고려',
    '시안견적': '고려', '시안.견적': '고려', '수정시안': '고려',
    '샘플': '고려', '샘플요청': '고려', '샘플신청예정': '고려',
    '단가표': '고려', '단가표요청': '고려',
    '수주': '고려', '긴급수주': '고려', '수주예정': '고려',
    '수주,견적': '고려', '카드결제': '고려',
}

# 구매단계 우선순위 (높을수록 상위)
STAGE_PRIORITY = {'인지': 0, '관심': 1, '고려': 2, '구매': 3, '만족': 4, '추천': 5}


def load_institutions(data_js_path):
    """data.js에서 기관 데이터 로드"""
    with open(data_js_path, 'r', encoding='utf-8') as f:
        content = f.read()

    match = re.search(r'institutionData\s*=\s*\n?\[', content)
    arr_start = content.index('[', match.start())
    depth = 0
    for i in range(arr_start, len(content)):
        if content[i] == '[':
            depth += 1
        elif content[i] == ']':
            depth -= 1
            if depth == 0:
                end = i + 1
                break

    data = json.loads(content[arr_start:end])
    return data, content[:arr_start], content[end:]


def build_name_index(institutions):
    """기관명 검색 인덱스 구축"""
    index = {}
    # 정확한 이름 매핑
    for inst in institutions:
        name = inst['name']
        index[name] = inst

        # 간소화된 이름 (공백, 특수문자 제거)
        simplified = re.sub(r'\s+', '', name)
        index[simplified] = inst

        # 보건소: "XX군보건소" → "XX보건소" 변형 등록
        if '보건소' in name:
            # "강남구보건소 금연클리닉" → "강남구보건소"
            base = name.split()[0] if ' ' in name else name
            if base not in index:
                index[base] = inst

    return index


def extract_institution_from_content(content_text):
    """상담 내용에서 기관명 후보들 추출"""
    candidates = []

    # 태그 제거 후 내용 추출
    cleaned = re.sub(r'\[[^\]]*\]', '', content_text).strip()

    # 기관명 키워드 패턴
    patterns = [
        # "XX보건소", "XX군보건소", "XX시보건소", "XX구보건소"
        r'([가-힣]{1,10}(?:시|군|구)?보건(?:소|의료원))',
        # "XX정신건강복지센터", "XX중독관리통합지원센터"
        r'([가-힣]{1,10}(?:정신건강복지센터|중독관리통합지원센터|중독관리센터|중독))',
        # "XX대학교", "XX대학"
        r'([가-힣]{1,15}(?:대학교|대학))',
        # "XX건강생활지원센터", "XX건강증진센터"
        r'([가-힣]{1,10}(?:건강생활지원센터|건강증진센터|금연지원센터))',
        # "XX병원"
        r'([가-힣]{1,15}병원)',
        # "XX시청", "XX군청", "XX구청"
        r'([가-힣]{1,8}(?:시청|군청|구청))',
        # "XX소방본부", "XX소방서"
        r'([가-힣]{1,10}(?:소방본부|소방서|경찰서))',
        # 기업명 패턴 (주) 또는 유명 기업
        r'((?:주\)|㈜)?[가-힣A-Za-z]{2,10}(?:\(주\))?)',
    ]

    for pat in patterns:
        matches = re.findall(pat, content_text)
        candidates.extend(matches)

    return candidates


def match_institution(candidates, name_index, institutions):
    """후보 기관명을 기존 기관 데이터와 매칭"""

    # 1순위: 정확 매칭
    for cand in candidates:
        cand_clean = re.sub(r'\s+', '', cand)
        if cand_clean in name_index:
            return name_index[cand_clean]

    # 2순위: 기관 이름에 후보가 포함됨
    for cand in candidates:
        if len(cand) < 3:
            continue
        for inst in institutions:
            if cand in inst['name']:
                return inst

    # 3순위: 후보에 기관 이름이 포함됨
    for cand in candidates:
        if len(cand) < 4:
            continue
        for inst in institutions:
            name = inst['name'].split()[0] if ' ' in inst['name'] else inst['name']
            if len(name) >= 3 and name in cand:
                return inst

    return None


def determine_stage(tags):
    """태그 목록에서 최상위 구매단계 결정"""
    max_stage = '관심'  # 상담 기록이 있으면 최소 관심
    max_priority = STAGE_PRIORITY[max_stage]

    for tag in tags:
        tag = tag.strip()
        stage = TAG_STAGE_MAP.get(tag, None)
        if stage and STAGE_PRIORITY[stage] > max_priority:
            max_stage = stage
            max_priority = STAGE_PRIORITY[max_stage]

    return max_stage


def process_sangdam(csv_path, data_js_path):
    """메인 처리"""
    # 기관 데이터 로드
    institutions, prefix, suffix = load_institutions(data_js_path)
    name_index = build_name_index(institutions)

    print(f"기관 수: {len(institutions)}")

    # 현재 단계 분포
    from collections import Counter
    current_stages = Counter(inst['purchaseStage'] for inst in institutions)
    print(f"현재 구매단계: {dict(current_stages)}")

    # CSV 읽기
    with open(csv_path, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    print(f"상담 레코드: {len(rows)}건")

    # 기관별 상담 기록 집계
    inst_consultations = defaultdict(lambda: {
        'tags': set(), 'count': 0, 'last_date': '',
        'matched_name': '', 'sample_content': []
    })

    matched_count = 0
    unmatched_count = 0
    unmatched_samples = []

    for row in rows:
        content = row.get('내용', '')
        date = row.get('작성일', '')

        # 태그 추출
        raw_tags = re.findall(r'\[([^\]]+)\]', content)
        tags = []
        for tag in raw_tags:
            for t in re.split(r'[,，\s]+', tag):
                t = t.strip()
                if t:
                    tags.append(t)

        # APS 관련 제품 키워드 확인 (알쓰패치, 노담패치 관련 상담만)
        is_aps_related = bool(re.search(
            r'알쓰|노담|패치|칼로밥|가제손수건|황금옥|지압기',
            content
        ))

        # 기관명 후보 추출 및 매칭
        candidates = extract_institution_from_content(content)
        inst = match_institution(candidates, name_index, institutions)

        if inst:
            key = inst['name']
            rec = inst_consultations[key]
            rec['tags'].update(tags)
            rec['count'] += 1
            if date > rec['last_date']:
                rec['last_date'] = date
            rec['matched_name'] = inst['name']
            if len(rec['sample_content']) < 3:
                rec['sample_content'].append(content[:100])
            matched_count += 1
        else:
            unmatched_count += 1
            if len(unmatched_samples) < 30 and is_aps_related and tags:
                unmatched_samples.append({
                    'date': date,
                    'content': content[:120],
                    'candidates': candidates[:3],
                    'tags': tags[:3]
                })

    print(f"\n매칭 결과: {matched_count}건 매칭, {unmatched_count}건 미매칭")
    print(f"상담 기록 있는 기관: {len(inst_consultations)}개")

    # 구매단계 업데이트
    updated = 0
    updates_detail = []

    for inst in institutions:
        name = inst['name']
        if name not in inst_consultations:
            continue

        rec = inst_consultations[name]
        current_stage = inst['purchaseStage']
        suggested_stage = determine_stage(rec['tags'])

        # 현재 단계보다 높은 단계만 적용 (구매/만족/추천은 유지)
        if STAGE_PRIORITY.get(suggested_stage, 0) > STAGE_PRIORITY.get(current_stage, 0):
            old_stage = current_stage
            inst['purchaseStage'] = suggested_stage
            updated += 1
            updates_detail.append({
                'name': name,
                'from': old_stage,
                'to': suggested_stage,
                'consult_count': rec['count'],
                'tags': list(rec['tags'])[:5],
                'last_date': rec['last_date']
            })

    # 상담 횟수도 기관 데이터에 추가
    for inst in institutions:
        name = inst['name']
        if name in inst_consultations:
            rec = inst_consultations[name]
            inst['consultCount'] = rec['count']
            inst['lastConsultDate'] = rec['last_date'][:10].replace('/', '-') if rec['last_date'] else ''
        else:
            inst['consultCount'] = 0
            inst['lastConsultDate'] = ''

    print(f"구매단계 업데이트: {updated}건")

    # 업데이트 상세
    if updates_detail:
        print(f"\n=== 업데이트 상세 (상위 50건) ===")
        for u in sorted(updates_detail, key=lambda x: x['consult_count'], reverse=True)[:50]:
            print(f"  {u['name']}: {u['from']} → {u['to']} (상담 {u['consult_count']}건, 태그: {u['tags']}, 최근: {u['last_date'][:10]})")

    # 미매칭 APS 관련 샘플
    if unmatched_samples:
        print(f"\n=== 미매칭 APS 관련 상담 (샘플 {len(unmatched_samples)}건) ===")
        for s in unmatched_samples:
            print(f"  {s['date'][:10]} | 후보: {s['candidates']} | 태그: {s['tags']}")
            print(f"    {s['content']}")

    # 최종 분포
    final_stages = Counter(inst['purchaseStage'] for inst in institutions)
    print(f"\n최종 구매단계: {dict(final_stages)}")

    # data.js 저장
    json_str = json.dumps(institutions, ensure_ascii=False, indent=2)
    new_content = prefix + json_str + suffix

    with open(data_js_path, 'w', encoding='utf-8') as f:
        f.write(new_content)

    print(f"\n{data_js_path} 업데이트 완료!")

    return institutions


if __name__ == '__main__':
    csv_path = 'sangdam_all.csv'
    data_js_path = '../js/data.js'

    if len(sys.argv) > 1:
        csv_path = sys.argv[1]
    if len(sys.argv) > 2:
        data_js_path = sys.argv[2]

    process_sangdam(csv_path, data_js_path)
