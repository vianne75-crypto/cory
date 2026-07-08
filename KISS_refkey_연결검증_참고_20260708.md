---
title: KISS ref_key 신청↔진단 연결 검증 (참고용)
date: 2026-07-08
type: reference
product: [알쓰패치]
tags: [KISS, refkey, 진단, 연결검증, CRM, PULSE]
agent: PULSE
status: active
---

# KISS ref_key 신청↔진단 연결 검증 (대표 참고용)

> **결론(2026-07-08)**: ref_key 연결 로직 **정상 작동 확인**. 학회 실유입 기다리면 자동으로 연결됨.
> 낮은 절대수·미연결은 대부분 **초기 테스트 데이터** 때문(학회 7/6~10 초기).

---

## 어떻게 연결되나 (원리)

신청과 진단은 둘 다 **`ref_key`(전화번호 해시)**를 가지며, 이 값으로 연결됩니다.

| 단계 | ref_key 계산 |
|------|-------------|
| **신청** `/kiss-submit` | `sha256(정규화전화 + salt)` |
| **진단** `/kiss-diagnosis` | 프론트가 원본 전화(`ref_phone`) 전송 → Worker가 `sha256(정규화전화 + salt)` |

- 전화 정규화·salt가 **양쪽 동일** → 같은 사람이 "신청 후 이어서 진단"하면 두 ref_key가 **반드시 일치** = 연결 성공.
- 진단 뷰에서 연결된 건은 **이름·기관**이 표시되고, 안 된 건은 🟠**미연결**.

**미연결이 나오는 정상 경우**: ①신청 없이 진단만 함 ②캠페인 도중 salt 변경(안 바꿨으면 무관) ③테스트행.

---

## 📊 스냅샷 숫자 해석 (2026-07-08)

| 지표 | 값 | 의미 |
|------|----|----|
| 진단_전체 | 7 | 이 중 **테스트행 다수**(스모크·38에이전트·PIXEL 테스트) |
| 진단_refkey보유 | 3 | 전화가 넘어온 진단 |
| └ **신청연결성공** | **2** | ✅ 실연결 = **검증 통과**(salt·정규화·프론트 정상 증명) |
| └ 미연결(refkey有·신청無) | 1 | 신청 안 함 or 전화 오타·중복차단 1건 |
| refkey 없음 | 4 | 전화 미전송(테스트행 포함) |

> **핵심**: `신청연결성공=2`가 곧 검증 통과. salt가 어긋나면 이 값이 0이 됨. **2건 성공 = 파이프라인 정상.**

---

## 재검증 SQL (나중에 실유입 후 확인용)

Supabase SQL Editor에 붙여넣기:

```sql
SELECT
  (SELECT count(*) FROM kiss_signups   WHERE ref_key IS NOT NULL) AS 신청_refkey보유,
  (SELECT count(*) FROM kiss_diagnosis  WHERE ref_key IS NOT NULL) AS 진단_refkey보유,
  (SELECT count(*) FROM kiss_diagnosis) AS 진단_전체,
  (SELECT count(*) FROM kiss_diagnosis d
     WHERE d.ref_key IS NOT NULL
       AND EXISTS (SELECT 1 FROM kiss_signups s WHERE s.ref_key = d.ref_key)) AS 진단_신청연결성공;
```

**판정 기준**:
- **연결률** = `진단_신청연결성공 / 진단_refkey보유` — 높을수록 정상.
- `진단_refkey보유`가 `진단_전체`보다 크게 적으면 → **진단만 하고 전화 안 넘어온 케이스 多** → 프론트 완료화면 흐름 점검(PIXEL).
- `진단_신청연결성공=0`인데 양쪽 refkey는 있으면 → **salt 불일치**(신청·진단 시점 salt 다름) → 원인 추적.

## 목록 확인 SQL (누가 뭘 답했나 + 테스트행 식별)

```sql
SELECT d.id, d.created_at,
       (s.name IS NOT NULL) AS 연결됨, s.name, s.institution_name,
       d.q1_attendance, d.q2_channels, d.q2_channels_etc
FROM kiss_diagnosis d
LEFT JOIN kiss_signups s ON s.ref_key = d.ref_key
ORDER BY d.id;
```

**테스트행 정리(선택)**:
```sql
DELETE FROM kiss_diagnosis
WHERE q2_channels_etc = 'SMOKE_TEST_학회현장배너'
   OR ref_key IN ('diag_test','harden_test','fw_test');
```

---

## 관련
- 대시보드 진단 뷰: cory admin → KISS 리드 탭 → 진단 (신청자 이름·기관 표시)
- Worker: `cory/workers/aps-lead-worker.js` (kissSubmit·kissDiagnosis)
