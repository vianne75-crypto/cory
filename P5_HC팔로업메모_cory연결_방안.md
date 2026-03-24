---
title: P5 HC 팔로업 메모 → cory 상담내역 연결 방안
date: 2026-03-24
type: spec
product: [알쓰패치]
segment: [대학_보건센터]
tags: [PULSE, FLUX, HUNTER, cory, CRM, HC, 팔로업]
agent: SAGE
status: active
---

# P5 HC 팔로업 메모 → cory 상담내역 연결 방안

> 발신: SAGE 슬기 | 수신: PULSE 다온 · FLUX 이음 | 날짜: 2026-03-24
> 원래 요청: HUNTER 다래 (cory INBOX #5, 마감 3/27)

---

## 요청 내용

HUNTER가 HC 샘플 발송 7건을 전화 팔로업한 결과를 기록하고 싶음.
현재 구글시트에 수동 메모 중 → cory 상담내역과 연결 방법 필요.

**HUNTER가 기록하는 데이터:**
- 기관명 + 담당자
- 통화 일시
- 통화 결과: 반응 온도 (긍정/보통/부정), 교육 일정 계획 여부, 다음 연락 시점

---

## 방안 비교

| 방안 | 구현 | 정확도 | 공수 | 권고 |
|------|------|--------|------|------|
| **A. cory 수동 입력** | 즉시 가능 | 높음 | 매번 수동 | ✅ 단기 즉시 적용 |
| **B. 구글시트 → cory 자동 동기화** | FLUX Apps Script 개발 (1~2일) | 중간 | 초기 구축 후 자동 | 🟡 중기 구축 |
| **C. cory 상담내역 입력 UI 추가** | FLUX JS 개발 (0.5~1일) | 높음 | 초기 구축 후 편리 | 🟡 중기 구축 |

---

## SAGE 권고

### 즉시 (3/27 마감 충족): 방안 A — cory 수동 입력

**절차:**
1. HUNTER → 통화 후 cory 대시보드 해당 기관 클릭
2. 상담내역에 아래 형식으로 메모 입력:

```
[HC 팔로업] 2026-03-XX 통화
담당자: {이름} ({전화번호})
반응: 긍정/보통/부정
교육 일정: {있음 → 날짜} / 없음
다음 연락: {날짜 또는 "현재 불필요"}
메모: {자유 기술}
```

3. 구매단계 업데이트 여부 판단:
   - 관심 표명 → "고려" 유지 + 교육 일정 확인 시 → "구매 대기" 메모 추가
   - 부정 반응 → "관심" 하향 검토

**HUNTER가 할 일**: 통화 후 cory에서 기관 검색 → 상담내역 입력 (약 2분/건)

---

### 중기 (4월): 방안 C — cory 상담내역 입력 UI 개선

**배경**: 현재 cory 상담내역은 Supabase `contacts` 또는 `counseling_records` 테이블에 저장.
HUNTER가 기관 화면에서 [팔로업 기록 추가] 버튼으로 간편 입력할 수 있도록 UI 개선.

**FLUX에게 요청할 사항:**
- 기관 상세 패널에 "팔로업 메모 추가" 폼 버튼 추가
- 입력 필드: 날짜·담당자·반응(드롭다운)·일정·메모
- 저장 시 Supabase 상담내역 테이블에 자동 기록
- 추가 기관 유형 필터: `HC 팔로업` 태그로 조회 가능

---

## 확정: 방안 B — 구글시트 → Supabase 자동 동기화 (2026-03-24 대표 결정)

### 구현 스펙 (FLUX 이음에게)

#### 1. 구글시트 탭 추가 (HUNTER가 직접 추가)
- 시트명: `HC_팔로업`
- 컬럼 구조 (A~H):

| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| utm_code | 기관명 | 담당자 | 통화일 (YYYY-MM-DD) | 반응온도 (긍정/보통/부정) | 교육일정 (날짜 or 없음) | 다음연락 (날짜 or 불필요) | 메모 |

#### 2. GAS 함수 추가 (기존 Code.gs에 추가)
```javascript
// HC 팔로업 탭 → Supabase consultations 동기화
function syncHcFollowups() {
  const ss = SpreadsheetApp.openById('1wdfX6X_PcKKwQBiD3x2uungtqyyMhsewsX0buOAHst4');
  const sheet = ss.getSheetByName('HC_팔로업');
  if (!sheet) return;
  const rows = sheet.getDataRange().getValues().slice(1); // 헤더 제외

  const records = rows
    .filter(r => r[1] && r[3]) // 기관명 + 통화일 필수
    .map(r => ({
      raw_institution_name: String(r[1]).trim(),
      md_name:   String(r[2] || 'HUNTER 다래').trim(),
      date:      String(r[3]).trim(),
      tags:      ['HC팔로업', r[4] === '긍정' ? '긍정반응' : r[4] === '부정' ? '부정반응' : '보통반응'],
      content:   `[HC 팔로업] 반응:${r[4]} | 교육일정:${r[5]||'없음'} | 다음연락:${r[6]||'불필요'} | ${r[7]||''}`.trim(),
    }));

  if (records.length === 0) return;

  const CF_URL = 'https://aps-webhook.vianne75.workers.dev/sync-consultations';
  UrlFetchApp.fetch(CF_URL, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(records),
    muteHttpExceptions: true,
  });
}
```

#### 3. 트리거 설정
- 매일 오전 9시 자동 실행: `syncHcFollowups` 시간 기반 트리거
- 또는 HUNTER가 수동 실행 버튼 클릭으로도 실행 가능

#### 4. 검증
- GAS 실행 후 cory 대시보드 → 기관 검색 → 상담내역에서 `[HC 팔로업]` 태그 확인

---

## 액션 요약 (업데이트)

| 담당 | 액션 | 마감 |
|------|------|------|
| HUNTER 다래 | farm360 구글시트에 `HC_팔로업` 탭 추가 + 기존 메모 이전 입력 | **4/3** |
| FLUX 이음 | GAS `syncHcFollowups()` 작성 + 트리거 설정 | **4/7** |
| PULSE 다온 | 동기화 완료 후 cory 상담내역 확인 + HUNTER 안내 | 4/8 |

---

## 관련 문서

- [[cory/P1_HC리드_분류기준_퍼널배치]] — HC 기관 구매단계 기준
- [[cory/P2_교육도입수준_필드설계서]] — 추가 필드 설계 참고
