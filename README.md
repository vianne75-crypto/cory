# APS제품 납품현황 대시보드

건강증진사업 기관별 구매현황 및 지역별 점유율을 시각화하는 대시보드

## 주요 기능

- **지도 뷰**: 전국 기관별 마커 + 지역별 점유율 색상 표시
- **차트 분석**: 구매단계 퍼널, 지역별/기관유형별 납품액
- **점유율**: 17개 광역시도별 구매기관 점유율 + 예상고객 리스트
- **기관 목록**: 838개 기관 정렬/필터 (상담횟수, 구매단계 등)
- **실시간 동기화**: 애니빌드 webhook → Google Sheets → 대시보드 연동

## 데이터 흐름

```
애니빌드 주문발생
  → Cloudflare Worker (aps-webhook.vianne75.workers.dev)
  → Google Apps Script (doPost)
  → Google Sheet 저장

대시보드 "불러오기" 클릭
  → Cloudflare Worker (GET)
  → Google Apps Script (doGet)
  → JSON 응답 → 기관 매칭 → 대시보드 업데이트
```

## 프로젝트 구조

```
├── index.html              # 메인 대시보드 페이지
├── css/
│   └── style.css           # 스타일시트
├── js/
│   ├── data.js             # 838개 기관 데이터
│   ├── app.js              # 앱 초기화
│   ├── map.js              # Leaflet 지도
│   ├── charts.js           # Chart.js 차트
│   ├── filters.js          # 필터 (기관유형, 지역, 구매단계, 기간, 제품)
│   ├── table.js            # 기관 목록 테이블
│   ├── prospects.js        # 예상고객 + 점유율 테이블
│   ├── info-panel.js       # 지역현황 패널
│   ├── sync.js             # 애니빌드 webhook 동기화
│   └── utils.js            # 유틸리티 함수
├── gas/
│   ├── Code.gs             # Google Apps Script - webhook 수신
│   ├── Api.gs              # Google Apps Script - 데이터 API
│   └── cloudflare-worker.js # Cloudflare Worker 프록시
└── data/
    ├── clean_data.py        # Order.xls → 중복제거/정제
    ├── add_unpurchased.py   # 미구매 기관 추가
    ├── add_prospects.py     # 대학교 등 예상고객 추가
    ├── reclassify.py        # 기관유형 재분류
    ├── process_sangdam.py   # 상담내역 → 구매단계 업데이트
    ├── scrape_sangdam.js    # 상담내역 브라우저 스크래핑
    ├── Order.xls            # 원본 주문 데이터
    ├── sangdam_all.csv      # 상담내역 9,613건
    ├── prospects.csv        # 대학교 예상고객 목록
    └── korea-geo.json       # 지도 GeoJSON
```

## 데이터 파이프라인

```bash
cd data
python3 clean_data.py          # Order.xls 정제 → data.js 생성
python3 add_unpurchased.py     # 미구매 기관 추가
python3 add_prospects.py       # 대학교 예상고객 추가
python3 reclassify.py          # 기관유형 재분류
python3 process_sangdam.py     # 상담내역 분석 → 구매단계 업데이트
```

## 기관 구매단계

| 단계 | 설명 | 기관 수 |
|------|------|---------|
| 인지 | 접촉 없음 | 377 |
| 관심 | 문의 이력 있음 | 37 |
| 고려 | 견적/시안/샘플 요청 | 161 |
| 구매 | 주문 완료 | 218 |
| 만족 | 반복구매 | 33 |
| 추천 | 타기관 소개 | 12 |

## 기술 스택

- **프론트엔드**: Vanilla JS, Leaflet.js, Chart.js
- **백엔드**: Google Apps Script (서버리스)
- **프록시**: Cloudflare Workers
- **데이터 처리**: Python 3
