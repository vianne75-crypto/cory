# AskUserQuestion 버튼식 질문 가이드

> 작성: BOND 가온 | 일자: 2026-03-20 | 대상: 전체 에이전트

---

## 핵심 원칙

**대표에게 선택지를 제시할 때는 텍스트 나열 대신 반드시 AskUserQuestion 도구를 사용한다.**

❌ 하지 말 것:
```
어떻게 할까요?
1. A 방법
2. B 방법
3. C 방법
```

✅ 이렇게 할 것: AskUserQuestion 도구 호출 (아래 형식 참조)

---

## 도구 호출 형식

```json
{
  "questions": [
    {
      "question": "명확한 질문 내용?",
      "header": "짧은 라벨 (12자 이내)",
      "multiSelect": false,
      "options": [
        {
          "label": "선택지 1 (1~5단어)",
          "description": "이 선택지를 고르면 어떻게 되는지 한 줄 설명"
        },
        {
          "label": "선택지 2",
          "description": "설명"
        }
      ]
    }
  ]
}
```

---

## 규칙

| 항목 | 기준 |
|------|------|
| 선택지 수 | 2~4개 (초과 불가) |
| label | 1~5단어, 짧고 명확하게 |
| header | 12자 이내 (예: "B1 전략", "다음 업무") |
| multiSelect | 복수 선택 허용 시 true, 아니면 false |
| description | 선택 시 어떤 일이 일어나는지 구체적으로 |

---

## 실전 예시

### 예시 1 — 단순 진행 여부

```json
{
  "questions": [{
    "question": "PULSE 다온 회신 미수령 — 어떻게 할까요?",
    "header": "B1 대응",
    "multiSelect": false,
    "options": [
      { "label": "독촉 메시지 보내기", "description": "다온 폴더에 재확인 요청 남기기" },
      { "label": "오늘 더 대기", "description": "오늘 중 회신 올 수 있으니 잠시 대기" }
    ]
  }]
}
```

### 예시 2 — 다음 업무 선택

```json
{
  "questions": [{
    "question": "다음 업무는?",
    "header": "다음",
    "multiSelect": false,
    "options": [
      { "label": "B4 카피 확인", "description": "나래 M4 수정 여부 재확인" },
      { "label": "B5 빛나 재촉", "description": "설문 폼 동의 절차 결과 재확인" },
      { "label": "오늘 마무리", "description": "현황 정리 후 종료" }
    ]
  }]
}
```

---

## 언제 사용하나

- 진행 방향을 대표가 결정해야 할 때
- 두 가지 이상 방법 중 선택이 필요할 때
- 다음 업무 순서를 물어볼 때
- 확인/취소가 필요한 중요한 액션 전

## 언제 사용하지 않나

- 단순 보고·결과 전달 (선택지 없음)
- 답이 명확해서 물어볼 필요 없을 때
- 에이전트끼리 협업 문서 작성 시 (대표에게만 사용)
