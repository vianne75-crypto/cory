// 구매단계 정의
const PURCHASE_STAGES = ['인지', '관심', '고려', '구매', '만족', '추천'];

// 기관 유형 정의 및 색상
const INSTITUTION_TYPES = {
  '보건소': { color: '#2196F3', icon: 'H' },
  '전문기관': { color: '#9C27B0', icon: 'M' },
  '금연지원센터': { color: '#4CAF50', icon: 'S' },
  '광역시도 건강증진부서': { color: '#F44336', icon: 'G' },
  '교육기관': { color: '#3F51B5', icon: 'E' },
  '전공교육': { color: '#E91E63', icon: 'P' },
  '군/경/소방': { color: '#795548', icon: 'D' },
  '사업장': { color: '#FF9800', icon: 'B' },
  '복지기관': { color: '#009688', icon: 'W' },
  '공공기관(기타)': { color: '#607D8B', icon: 'C' }
};

// 구매단계별 색상
const STAGE_COLORS = {
  '인지': '#e0e0e0', '관심': '#b0bec5', '고려': '#ffb74d',
  '구매': '#4fc3f7', '만족': '#81c784', '추천': '#e57373'
};

// 제품 유형
const PRODUCT_TYPES = ['알쓰패치', '노담패치'];

// 지역별 전체 대상기관 수 (추정)
const REGION_TOTAL_TARGETS = {
  '강원특별자치도': 64,
  '경기도': 124,
  '경상남도': 55,
  '경상북도': 71,
  '광주광역시': 26,
  '대구광역시': 37,
  '대전광역시': 25,
  '부산광역시': 56,
  '서울특별시': 104,
  '세종특별자치시': 5,
  '울산광역시': 16,
  '인천광역시': 34,
  '전라남도': 60,
  '전북특별자치도': 54,
  '제주특별자치도': 8,
  '충청남도': 58,
  '충청북도': 41,
};

// 지역별 중심 좌표
const REGION_CENTERS = {
  '서울특별시': [37.5665, 126.978],
  '부산광역시': [35.1796, 129.0756],
  '대구광역시': [35.8714, 128.6014],
  '인천광역시': [37.4563, 126.7052],
  '광주광역시': [35.1595, 126.8526],
  '대전광역시': [36.3504, 127.3845],
  '울산광역시': [35.5384, 129.3114],
  '세종특별자치시': [36.48, 127.0],
  '경기도': [37.275, 127.01],
  '강원특별자치도': [37.8228, 128.1555],
  '충청북도': [36.6357, 127.4912],
  '충청남도': [36.5184, 126.8],
  '전북특별자치도': [35.82, 127.11],
  '전라남도': [34.816, 126.463],
  '경상북도': [36.576, 128.506],
  '경상남도': [35.46, 128.213],
  '제주특별자치도': [33.489, 126.498]
};

// 정제된 주문 데이터 기반 공공기관 (263개)
const institutionData = 
[
  {
    "id": 1,
    "name": "강진군보건소",
    "type": "보건소",
    "region": "전라남도",
    "district": "강진군",
    "lat": 34.9097,
    "lng": 126.8485,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 500,
    "purchaseAmount": 890000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2026-02-13",
    "consultCount": 31,
    "lastConsultDate": "2019-03-26"
  },
  {
    "id": 2,
    "name": "한국기술교육대학교",
    "type": "교육기관",
    "region": "충청남도",
    "district": "천안시",
    "lat": 36.4509,
    "lng": 126.717,
    "products": [
      "노담패치",
      "알쓰패치"
    ],
    "purchaseCycle": "반기",
    "purchaseVolume": 6120,
    "purchaseAmount": 8040000,
    "purchaseStage": "추천",
    "lastPurchaseDate": "2026-02-11",
    "consultCount": 7,
    "lastConsultDate": "2026-02-06"
  },
  {
    "id": 3,
    "name": "청주시서원보건소",
    "type": "보건소",
    "region": "충청북도",
    "district": "청주시",
    "lat": 36.7066,
    "lng": 127.5447,
    "products": [
      "노담패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 10,
    "purchaseAmount": 50000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2026-02-11",
    "consultCount": 8,
    "lastConsultDate": "2025-02-18"
  },
  {
    "id": 4,
    "name": "청주시서원보건소건강증진팀",
    "type": "보건소",
    "region": "충청북도",
    "district": "청주시",
    "lat": 36.7534,
    "lng": 127.3678,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 10,
    "purchaseAmount": 42000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2026-02-11",
    "consultCount": 13,
    "lastConsultDate": "2024-10-14"
  },
  {
    "id": 5,
    "name": "이천시보건소",
    "type": "보건소",
    "region": "경기도",
    "district": "이천시",
    "lat": 37.7994,
    "lng": 128.0144,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "반기",
    "purchaseVolume": 1302,
    "purchaseAmount": 1473000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2026-02-10",
    "consultCount": 15,
    "lastConsultDate": "2022-05-20"
  },
  {
    "id": 6,
    "name": "전북특별자치도 정신건강복지센터",
    "type": "전문기관",
    "region": "전북특별자치도",
    "district": "전주시",
    "lat": 35.7359,
    "lng": 127.1105,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "반기",
    "purchaseVolume": 2786,
    "purchaseAmount": 3450300,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2026-02-04",
    "consultCount": 7,
    "lastConsultDate": "2026-01-29"
  },
  {
    "id": 7,
    "name": "횡성군보건소",
    "type": "보건소",
    "region": "강원특별자치도",
    "district": "횡성군",
    "lat": 37.6808,
    "lng": 128.0652,
    "products": [
      "노담패치",
      "알쓰패치"
    ],
    "purchaseCycle": "월간",
    "purchaseVolume": 2856,
    "purchaseAmount": 3985000,
    "purchaseStage": "추천",
    "lastPurchaseDate": "2026-02-03",
    "consultCount": 24,
    "lastConsultDate": "2026-01-02"
  },
  {
    "id": 8,
    "name": "국민건강보험공단 김제지사",
    "type": "공공기관(기타)",
    "region": "전북특별자치도",
    "district": "김제시",
    "lat": 35.8653,
    "lng": 127.1224,
    "products": [
      "노담패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 300,
    "purchaseAmount": 492000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2026-01-30",
    "consultCount": 11,
    "lastConsultDate": "2022-12-13"
  },
  {
    "id": 9,
    "name": "국민건강보험공단 김제지사 2026년 캠페인 홍보 물품 납품",
    "type": "공공기관(기타)",
    "region": "전북특별자치도",
    "district": "김제시",
    "lat": 35.7364,
    "lng": 127.1357,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 300,
    "purchaseAmount": 409500,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2026-01-30",
    "consultCount": 8,
    "lastConsultDate": "2025-04-17"
  },
  {
    "id": 10,
    "name": "함평군보건소",
    "type": "보건소",
    "region": "전라남도",
    "district": "함평군",
    "lat": 34.9607,
    "lng": 126.8429,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "반기",
    "purchaseVolume": 1500,
    "purchaseAmount": 3150000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2026-01-27",
    "consultCount": 18,
    "lastConsultDate": "2026-01-26"
  },
  {
    "id": 11,
    "name": "경상북도 구미시 선산읍 선주로 121 선산보건소 건강증진팀 조윤호 T.054-480-4134",
    "type": "보건소",
    "region": "경상북도",
    "district": "구미시",
    "lat": 36.5836,
    "lng": 128.9483,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 500,
    "purchaseAmount": 955000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2026-01-14",
    "consultCount": 23,
    "lastConsultDate": "2026-01-06"
  },
  {
    "id": 12,
    "name": "조은요양병원",
    "type": "사업장",
    "region": "경기도",
    "district": "평택시",
    "lat": 37.3659,
    "lng": 127.4149,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 2,
    "purchaseAmount": 8400,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2026-01-05",
    "consultCount": 2,
    "lastConsultDate": "2020-04-21"
  },
  {
    "id": 13,
    "name": "김해중독관리통합지원센터",
    "type": "전문기관",
    "region": "경상남도",
    "district": "김해시",
    "lat": 35.5978,
    "lng": 128.1642,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "반기",
    "purchaseVolume": 1702,
    "purchaseAmount": 3070168,
    "purchaseStage": "만족",
    "lastPurchaseDate": "2025-12-26",
    "consultCount": 40,
    "lastConsultDate": "2025-11-13"
  },
  {
    "id": 14,
    "name": "진주중독관리통합지원센터",
    "type": "전문기관",
    "region": "경상남도",
    "district": "진주시",
    "lat": 35.3384,
    "lng": 128.0922,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 1100,
    "purchaseAmount": 2310000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-12-26",
    "consultCount": 4,
    "lastConsultDate": "2015-10-23"
  },
  {
    "id": 15,
    "name": "삼척시정신건강복지센터",
    "type": "전문기관",
    "region": "강원특별자치도",
    "district": "삼척시",
    "lat": 37.927,
    "lng": 128.1866,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "반기",
    "purchaseVolume": 2002,
    "purchaseAmount": 3617020,
    "purchaseStage": "추천",
    "lastPurchaseDate": "2025-12-23",
    "consultCount": 5,
    "lastConsultDate": "2025-12-23"
  },
  {
    "id": 16,
    "name": "파주시중독관리통합지원센터",
    "type": "전문기관",
    "region": "경기도",
    "district": "파주시",
    "lat": 37.5059,
    "lng": 127.5872,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 1413,
    "purchaseAmount": 987500,
    "purchaseStage": "만족",
    "lastPurchaseDate": "2025-12-22",
    "consultCount": 19,
    "lastConsultDate": "2025-11-25"
  },
  {
    "id": 17,
    "name": "군위군보건소",
    "type": "보건소",
    "region": "대구광역시",
    "district": "군위군",
    "lat": 35.8823,
    "lng": 128.7433,
    "products": [
      "노담패치",
      "알쓰패치"
    ],
    "purchaseCycle": "분기",
    "purchaseVolume": 1752,
    "purchaseAmount": 3975000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-12-19",
    "consultCount": 6,
    "lastConsultDate": "2012-03-15"
  },
  {
    "id": 18,
    "name": "광진구보건소",
    "type": "보건소",
    "region": "서울특별시",
    "district": "광진구",
    "lat": 37.5301,
    "lng": 126.9936,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "반기",
    "purchaseVolume": 12560,
    "purchaseAmount": 7885000,
    "purchaseStage": "추천",
    "lastPurchaseDate": "2025-12-18",
    "consultCount": 32,
    "lastConsultDate": "2025-12-18"
  },
  {
    "id": 19,
    "name": "부산중독관리통합지원센터",
    "type": "전문기관",
    "region": "부산광역시",
    "district": "서구",
    "lat": 35.2784,
    "lng": 129.1112,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "반기",
    "purchaseVolume": 7310,
    "purchaseAmount": 9051000,
    "purchaseStage": "만족",
    "lastPurchaseDate": "2025-12-17",
    "consultCount": 6,
    "lastConsultDate": "2025-12-04"
  },
  {
    "id": 20,
    "name": "대구광역시청",
    "type": "공공기관(기타)",
    "region": "대구광역시",
    "district": "중구",
    "lat": 35.9799,
    "lng": 128.6246,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "월간",
    "purchaseVolume": 1665,
    "purchaseAmount": 2789530,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-12-16",
    "consultCount": 1,
    "lastConsultDate": "2020-10-30"
  },
  {
    "id": 21,
    "name": "통영시보건소",
    "type": "보건소",
    "region": "경상남도",
    "district": "통영시",
    "lat": 35.522,
    "lng": 128.0769,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "반기",
    "purchaseVolume": 2132,
    "purchaseAmount": 4102000,
    "purchaseStage": "만족",
    "lastPurchaseDate": "2025-12-15",
    "consultCount": 63,
    "lastConsultDate": "2024-11-21"
  },
  {
    "id": 22,
    "name": "구미중독관리통합지원센터",
    "type": "전문기관",
    "region": "경상북도",
    "district": "구미시",
    "lat": 36.4103,
    "lng": 128.8257,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 500,
    "purchaseAmount": 1050000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-12-15",
    "consultCount": 3,
    "lastConsultDate": "2025-12-09"
  },
  {
    "id": 23,
    "name": "군포시 산본보건지소",
    "type": "보건소",
    "region": "경기도",
    "district": "군포시",
    "lat": 37.2877,
    "lng": 127.4381,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "반기",
    "purchaseVolume": 1300,
    "purchaseAmount": 2730000,
    "purchaseStage": "만족",
    "lastPurchaseDate": "2025-12-12",
    "consultCount": 54,
    "lastConsultDate": "2025-10-24"
  },
  {
    "id": 24,
    "name": "포항북구보건소",
    "type": "보건소",
    "region": "경상북도",
    "district": "포항시",
    "lat": 36.3722,
    "lng": 128.8223,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 500,
    "purchaseAmount": 955000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-12-08",
    "consultCount": 8,
    "lastConsultDate": "2017-06-09"
  },
  {
    "id": 25,
    "name": "남양주시 동부보건소",
    "type": "보건소",
    "region": "경기도",
    "district": "남양주시",
    "lat": 37.4545,
    "lng": 127.4777,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 2000,
    "purchaseAmount": 2100000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-12-05",
    "consultCount": 43,
    "lastConsultDate": "2025-12-02"
  },
  {
    "id": 26,
    "name": "정선고등학교",
    "type": "교육기관",
    "region": "강원특별자치도",
    "district": "정선군",
    "lat": 37.7839,
    "lng": 128.0684,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 110,
    "purchaseAmount": 330000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-12-02",
    "consultCount": 4,
    "lastConsultDate": "2025-11-06"
  },
  {
    "id": 27,
    "name": "제주중독관리통합지원센터",
    "type": "전문기관",
    "region": "제주특별자치도",
    "district": "제주시",
    "lat": 33.4191,
    "lng": 126.6293,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 360,
    "purchaseAmount": 900000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-12-02",
    "consultCount": 4,
    "lastConsultDate": "2020-11-16"
  },
  {
    "id": 28,
    "name": "여수시보건소",
    "type": "보건소",
    "region": "전라남도",
    "district": "여수시",
    "lat": 34.9123,
    "lng": 127.0237,
    "products": [
      "노담패치",
      "알쓰패치"
    ],
    "purchaseCycle": "반기",
    "purchaseVolume": 1800,
    "purchaseAmount": 3285000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-12-01",
    "consultCount": 24,
    "lastConsultDate": "2024-05-13"
  },
  {
    "id": 29,
    "name": "경상남도광역정신건강복지센터",
    "type": "전문기관",
    "region": "경상남도",
    "district": "창원시",
    "lat": 35.3619,
    "lng": 128.2819,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 1908,
    "purchaseAmount": 1333000,
    "purchaseStage": "만족",
    "lastPurchaseDate": "2025-11-26",
    "consultCount": 5,
    "lastConsultDate": "2021-04-23"
  },
  {
    "id": 30,
    "name": "충북광역정신건강복지센터",
    "type": "전문기관",
    "region": "충청북도",
    "district": "청주시",
    "lat": 36.5347,
    "lng": 127.4555,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 550,
    "purchaseAmount": 863500,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-11-25",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 31,
    "name": "대전광역정신건강복지센터",
    "type": "전문기관",
    "region": "대전광역시",
    "district": "중구",
    "lat": 36.4973,
    "lng": 127.4265,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 8102,
    "purchaseAmount": 7500000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-11-24",
    "consultCount": 1,
    "lastConsultDate": "2025-11-10"
  },
  {
    "id": 32,
    "name": "창원중독관리통합지원센터",
    "type": "전문기관",
    "region": "경상남도",
    "district": "창원시",
    "lat": 36.5171,
    "lng": 127.5554,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "반기",
    "purchaseVolume": 38000,
    "purchaseAmount": 27400000,
    "purchaseStage": "추천",
    "lastPurchaseDate": "2025-11-24",
    "consultCount": 30,
    "lastConsultDate": "2025-11-24"
  },
  {
    "id": 33,
    "name": "강북구보건소",
    "type": "보건소",
    "region": "서울특별시",
    "district": "강북구",
    "lat": 37.6694,
    "lng": 127.0608,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "반기",
    "purchaseVolume": 5142,
    "purchaseAmount": 5730000,
    "purchaseStage": "만족",
    "lastPurchaseDate": "2025-11-24",
    "consultCount": 41,
    "lastConsultDate": "2025-11-24"
  },
  {
    "id": 34,
    "name": "우산건강생활지원센터",
    "type": "보건소",
    "region": "광주광역시",
    "district": "광산구",
    "lat": 35.0782,
    "lng": 126.7122,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "반기",
    "purchaseVolume": 2410,
    "purchaseAmount": 3768000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-11-24",
    "consultCount": 8,
    "lastConsultDate": "2025-10-29"
  },
  {
    "id": 35,
    "name": "서울여자대학교 금연 캠페인 프로젝트팀 포장불가",
    "type": "교육기관",
    "region": "서울특별시",
    "district": "성북구",
    "lat": 37.5111,
    "lng": 126.9083,
    "products": [
      "노담패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 80,
    "purchaseAmount": 248000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-11-21",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 36,
    "name": "성동구보건소",
    "type": "보건소",
    "region": "서울특별시",
    "district": "성동구",
    "lat": 37.4798,
    "lng": 127.1109,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "분기",
    "purchaseVolume": 2102,
    "purchaseAmount": 4170000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-11-20",
    "consultCount": 57,
    "lastConsultDate": "2025-11-19"
  },
  {
    "id": 37,
    "name": "동해시정신건강복지센터",
    "type": "전문기관",
    "region": "강원특별자치도",
    "district": "동해시",
    "lat": 37.9357,
    "lng": 128.0999,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "반기",
    "purchaseVolume": 1800,
    "purchaseAmount": 3900000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-11-20",
    "consultCount": 13,
    "lastConsultDate": "2023-08-31"
  },
  {
    "id": 38,
    "name": "아산시보건소",
    "type": "보건소",
    "region": "충청남도",
    "district": "아산시",
    "lat": 36.565,
    "lng": 126.7687,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "분기",
    "purchaseVolume": 2700,
    "purchaseAmount": 5405000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-11-20",
    "consultCount": 36,
    "lastConsultDate": "2025-11-12"
  },
  {
    "id": 39,
    "name": "국군포천병원 외래간호과",
    "type": "군/경/소방",
    "region": "경기도",
    "district": "포천시",
    "lat": 37.5382,
    "lng": 127.506,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 201,
    "purchaseAmount": 600000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-11-19",
    "consultCount": 1,
    "lastConsultDate": "2025-11-18"
  },
  {
    "id": 40,
    "name": "괴산군보건소",
    "type": "보건소",
    "region": "충청북도",
    "district": "괴산군",
    "lat": 36.4295,
    "lng": 127.424,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 340,
    "purchaseAmount": 771800,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-11-19",
    "consultCount": 5,
    "lastConsultDate": "2025-11-03"
  },
  {
    "id": 41,
    "name": "광문고등학교",
    "type": "교육기관",
    "region": "서울특별시",
    "district": "강동구",
    "lat": 37.5849,
    "lng": 126.9068,
    "products": [
      "노담패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 680,
    "purchaseAmount": 1700000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-11-18",
    "consultCount": 1,
    "lastConsultDate": "2025-11-10"
  },
  {
    "id": 42,
    "name": "대전서구중독관리통합지원센터",
    "type": "전문기관",
    "region": "대전광역시",
    "district": "서구",
    "lat": 36.3758,
    "lng": 127.5038,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 600,
    "purchaseAmount": 1260000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-11-13",
    "consultCount": 5,
    "lastConsultDate": "2025-11-10"
  },
  {
    "id": 43,
    "name": "울릉군보건의료원",
    "type": "보건소",
    "region": "경상북도",
    "district": "울릉군",
    "lat": 36.4617,
    "lng": 128.8047,
    "products": [
      "노담패치",
      "알쓰패치"
    ],
    "purchaseCycle": "분기",
    "purchaseVolume": 602,
    "purchaseAmount": 1410000,
    "purchaseStage": "만족",
    "lastPurchaseDate": "2025-11-13",
    "consultCount": 10,
    "lastConsultDate": "2025-11-11"
  },
  {
    "id": 44,
    "name": "제주보건소",
    "type": "보건소",
    "region": "제주특별자치도",
    "district": "제주시",
    "lat": 33.6383,
    "lng": 126.5012,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 3000,
    "purchaseAmount": 1780000,
    "purchaseStage": "만족",
    "lastPurchaseDate": "2025-11-12",
    "consultCount": 31,
    "lastConsultDate": "2025-12-02"
  },
  {
    "id": 45,
    "name": "구미건강생활지원센터",
    "type": "보건소",
    "region": "경상북도",
    "district": "안동시",
    "lat": 36.3692,
    "lng": 128.753,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 501,
    "purchaseAmount": 955000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-11-11",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 46,
    "name": "포항보건소",
    "type": "보건소",
    "region": "경상북도",
    "district": "포항시",
    "lat": 36.3748,
    "lng": 128.9271,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 500,
    "purchaseAmount": 955000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-11-10",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 47,
    "name": "김포시청",
    "type": "공공기관(기타)",
    "region": "경기도",
    "district": "김포시",
    "lat": 37.5014,
    "lng": 127.4949,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 55,
    "purchaseAmount": 231000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-11-10",
    "consultCount": 22,
    "lastConsultDate": "2025-11-11"
  },
  {
    "id": 48,
    "name": "남양주보건소",
    "type": "보건소",
    "region": "경기도",
    "district": "남양주시",
    "lat": 37.2829,
    "lng": 127.4828,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "분기",
    "purchaseVolume": 1102,
    "purchaseAmount": 1830000,
    "purchaseStage": "만족",
    "lastPurchaseDate": "2025-11-10",
    "consultCount": 18,
    "lastConsultDate": "2025-11-03"
  },
  {
    "id": 49,
    "name": "무주군보건의료원",
    "type": "보건소",
    "region": "전북특별자치도",
    "district": "무주군",
    "lat": 35.9691,
    "lng": 127.1176,
    "products": [
      "노담패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 200,
    "purchaseAmount": 656000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-11-06",
    "consultCount": 4,
    "lastConsultDate": "2015-06-10"
  },
  {
    "id": 50,
    "name": "김해시보건소",
    "type": "보건소",
    "region": "경상남도",
    "district": "김해시",
    "lat": 35.6019,
    "lng": 128.3214,
    "products": [
      "노담패치",
      "알쓰패치"
    ],
    "purchaseCycle": "반기",
    "purchaseVolume": 1734,
    "purchaseAmount": 4039300,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-11-04",
    "consultCount": 46,
    "lastConsultDate": "2025-10-30"
  },
  {
    "id": 51,
    "name": "국군수도병원",
    "type": "군/경/소방",
    "region": "경기도",
    "district": "성남시",
    "lat": 37.2672,
    "lng": 127.5845,
    "products": [
      "노담패치",
      "알쓰패치"
    ],
    "purchaseCycle": "반기",
    "purchaseVolume": 250,
    "purchaseAmount": 930000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-11-04",
    "consultCount": 4,
    "lastConsultDate": "2025-10-16"
  },
  {
    "id": 52,
    "name": "서초구보건소",
    "type": "보건소",
    "region": "서울특별시",
    "district": "서초구",
    "lat": 37.621,
    "lng": 126.9891,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "연간",
    "purchaseVolume": 3266,
    "purchaseAmount": 3690000,
    "purchaseStage": "추천",
    "lastPurchaseDate": "2025-11-03",
    "consultCount": 51,
    "lastConsultDate": "2025-11-03"
  },
  {
    "id": 53,
    "name": "무안군보건소",
    "type": "보건소",
    "region": "전라남도",
    "district": "무안군",
    "lat": 34.7979,
    "lng": 127.0333,
    "products": [
      "노담패치",
      "알쓰패치"
    ],
    "purchaseCycle": "반기",
    "purchaseVolume": 1700,
    "purchaseAmount": 2173000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-11-03",
    "consultCount": 11,
    "lastConsultDate": "2024-04-25"
  },
  {
    "id": 54,
    "name": "중1동행정복지센터",
    "type": "복지기관",
    "region": "부산광역시",
    "district": "해운대구",
    "lat": 35.0631,
    "lng": 129.056,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 150,
    "purchaseAmount": 450000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-10-29",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 55,
    "name": "부산 기장군보건소",
    "type": "보건소",
    "region": "부산광역시",
    "district": "기장군",
    "lat": 35.1657,
    "lng": 129.2117,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "반기",
    "purchaseVolume": 1600,
    "purchaseAmount": 2777000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-10-29",
    "consultCount": 17,
    "lastConsultDate": "2024-02-06"
  },
  {
    "id": 56,
    "name": "동대문구보건소",
    "type": "보건소",
    "region": "서울특별시",
    "district": "동대문구",
    "lat": 37.6793,
    "lng": 126.907,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "반기",
    "purchaseVolume": 2706,
    "purchaseAmount": 3170000,
    "purchaseStage": "만족",
    "lastPurchaseDate": "2025-10-28",
    "consultCount": 44,
    "lastConsultDate": "2025-10-28"
  },
  {
    "id": 57,
    "name": "춘천시보건소",
    "type": "보건소",
    "region": "강원특별자치도",
    "district": "춘천시",
    "lat": 37.823,
    "lng": 128.0591,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 500,
    "purchaseAmount": 1050000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-10-27",
    "consultCount": 14,
    "lastConsultDate": "2025-06-20"
  },
  {
    "id": 58,
    "name": "완산고등학교",
    "type": "교육기관",
    "region": "전북특별자치도",
    "district": "전주시",
    "lat": 35.9441,
    "lng": 127.2201,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 50,
    "purchaseAmount": 210000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-10-24",
    "consultCount": 1,
    "lastConsultDate": "2025-03-07"
  },
  {
    "id": 59,
    "name": "금산군보건소",
    "type": "보건소",
    "region": "충청남도",
    "district": "금산군",
    "lat": 36.2899,
    "lng": 127.4262,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 742,
    "purchaseAmount": 842170,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-10-22",
    "consultCount": 6,
    "lastConsultDate": "2015-12-16"
  },
  {
    "id": 60,
    "name": "구미시보건소",
    "type": "보건소",
    "region": "경상북도",
    "district": "구미시",
    "lat": 36.5246,
    "lng": 128.7848,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 501,
    "purchaseAmount": 955000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-10-22",
    "consultCount": 3,
    "lastConsultDate": "2016-09-23"
  },
  {
    "id": 61,
    "name": "상경중학교",
    "type": "교육기관",
    "region": "서울특별시",
    "district": "노원구",
    "lat": 37.6453,
    "lng": 126.9898,
    "products": [
      "노담패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 120,
    "purchaseAmount": 367200,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-10-22",
    "consultCount": 3,
    "lastConsultDate": "2024-09-23"
  },
  {
    "id": 62,
    "name": "덕양구보건소",
    "type": "보건소",
    "region": "경기도",
    "district": "고양시",
    "lat": 37.4974,
    "lng": 127.5274,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 300,
    "purchaseAmount": 561000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-10-22",
    "consultCount": 9,
    "lastConsultDate": "2024-05-01"
  },
  {
    "id": 63,
    "name": "60사단 의무대",
    "type": "군/경/소방",
    "region": "경기도",
    "district": "고양시",
    "lat": 37.264,
    "lng": 127.4655,
    "products": [
      "노담패치",
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 1038,
    "purchaseAmount": 959700,
    "purchaseStage": "만족",
    "lastPurchaseDate": "2025-10-20",
    "consultCount": 7,
    "lastConsultDate": "2025-10-13"
  },
  {
    "id": 64,
    "name": "옹진군보건소",
    "type": "보건소",
    "region": "인천광역시",
    "district": "옹진군",
    "lat": 37.3121,
    "lng": 126.8339,
    "products": [
      "노담패치",
      "알쓰패치"
    ],
    "purchaseCycle": "월간",
    "purchaseVolume": 1552,
    "purchaseAmount": 2774500,
    "purchaseStage": "만족",
    "lastPurchaseDate": "2025-10-20",
    "consultCount": 17,
    "lastConsultDate": "2025-08-29"
  },
  {
    "id": 65,
    "name": "마포구정신건강복지센터",
    "type": "전문기관",
    "region": "서울특별시",
    "district": "마포구",
    "lat": 37.6801,
    "lng": 127.0775,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "반기",
    "purchaseVolume": 550,
    "purchaseAmount": 1275000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-10-14",
    "consultCount": 10,
    "lastConsultDate": "2025-09-04"
  },
  {
    "id": 66,
    "name": "보령시보건소",
    "type": "보건소",
    "region": "충청남도",
    "district": "보령시",
    "lat": 36.4607,
    "lng": 126.6674,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 380,
    "purchaseAmount": 862600,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-10-14",
    "consultCount": 33,
    "lastConsultDate": "2021-02-26"
  },
  {
    "id": 67,
    "name": "도봉중독관리통합지원센터",
    "type": "전문기관",
    "region": "서울특별시",
    "district": "도봉구",
    "lat": 37.6799,
    "lng": 127.1121,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "월간",
    "purchaseVolume": 2753,
    "purchaseAmount": 2550000,
    "purchaseStage": "만족",
    "lastPurchaseDate": "2025-10-10",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 68,
    "name": "한국보훈복지의료공단 광주보훈병원",
    "type": "공공기관(기타)",
    "region": "광주광역시",
    "district": "광산구",
    "lat": 35.0352,
    "lng": 126.8484,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 302,
    "purchaseAmount": 750000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-09-30",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 69,
    "name": "대구북구보건소",
    "type": "보건소",
    "region": "대구광역시",
    "district": "북구",
    "lat": 35.7422,
    "lng": 128.6796,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "반기",
    "purchaseVolume": 2000,
    "purchaseAmount": 4200000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-09-30",
    "consultCount": 19,
    "lastConsultDate": "2025-09-30"
  },
  {
    "id": 70,
    "name": "서울시통합건강증진사업지원단",
    "type": "광역시도 건강증진부서",
    "region": "서울특별시",
    "district": "광진구",
    "lat": 37.6463,
    "lng": 126.8665,
    "products": [
      "노담패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 400,
    "purchaseAmount": 1000000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-09-30",
    "consultCount": 27,
    "lastConsultDate": "2025-09-26"
  },
  {
    "id": 71,
    "name": "약학대학 학부실습 과정에 사용 예정",
    "type": "전공교육",
    "region": "인천광역시",
    "district": "연수구",
    "lat": 37.4489,
    "lng": 126.7201,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 40,
    "purchaseAmount": 117600,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-09-30",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 72,
    "name": "마포구보건소",
    "type": "보건소",
    "region": "서울특별시",
    "district": "마포구",
    "lat": 37.496,
    "lng": 127.0897,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "반기",
    "purchaseVolume": 4272,
    "purchaseAmount": 5499600,
    "purchaseStage": "추천",
    "lastPurchaseDate": "2025-09-26",
    "consultCount": 28,
    "lastConsultDate": "2025-12-09"
  },
  {
    "id": 73,
    "name": "국립정신건강센터 정신건강사업과 키트 제작",
    "type": "전문기관",
    "region": "경기도",
    "district": "평택시",
    "lat": 37.3907,
    "lng": 127.4318,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 500,
    "purchaseAmount": 955000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-09-22",
    "consultCount": 1,
    "lastConsultDate": "2016-12-20"
  },
  {
    "id": 74,
    "name": "부산가톨릭대학교중독이음센터",
    "type": "전문기관",
    "region": "부산광역시",
    "district": "금정구",
    "lat": 35.1914,
    "lng": 129.1446,
    "products": [
      "노담패치",
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 1936,
    "purchaseAmount": 2100000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-09-22",
    "consultCount": 2,
    "lastConsultDate": "2021-09-01"
  },
  {
    "id": 75,
    "name": "양천구보건소",
    "type": "보건소",
    "region": "서울특별시",
    "district": "양천구",
    "lat": 37.4768,
    "lng": 126.9215,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 800,
    "purchaseAmount": 1256000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-09-18",
    "consultCount": 15,
    "lastConsultDate": "2020-08-31"
  },
  {
    "id": 76,
    "name": "안양범계중학교",
    "type": "교육기관",
    "region": "경기도",
    "district": "남양주시",
    "lat": 37.5623,
    "lng": 127.5633,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 10,
    "purchaseAmount": 35700,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-09-16",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 77,
    "name": "광주 광산중독관리통합지원센터",
    "type": "전문기관",
    "region": "전라남도",
    "district": "화순군",
    "lat": 34.8493,
    "lng": 126.9963,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 500,
    "purchaseAmount": 890000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-09-15",
    "consultCount": 2,
    "lastConsultDate": "2018-09-28"
  },
  {
    "id": 78,
    "name": "군산시보건소",
    "type": "보건소",
    "region": "전북특별자치도",
    "district": "군산시",
    "lat": 35.7066,
    "lng": 127.0263,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 1000,
    "purchaseAmount": 1910000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-09-12",
    "consultCount": 9,
    "lastConsultDate": "2023-05-11"
  },
  {
    "id": 79,
    "name": "사천시보건소",
    "type": "보건소",
    "region": "경상남도",
    "district": "사천시",
    "lat": 35.412,
    "lng": 128.2397,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "반기",
    "purchaseVolume": 1600,
    "purchaseAmount": 3360000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-09-11",
    "consultCount": 35,
    "lastConsultDate": "2025-09-10"
  },
  {
    "id": 80,
    "name": "대구광역시 중구보건소",
    "type": "보건소",
    "region": "대구광역시",
    "district": "중구",
    "lat": 35.8691,
    "lng": 128.6063,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 1000,
    "purchaseAmount": 955000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-09-11",
    "consultCount": 4,
    "lastConsultDate": "2024-02-29"
  },
  {
    "id": 81,
    "name": "전남여자상업고등학교",
    "type": "교육기관",
    "region": "경기도",
    "district": "남양주시",
    "lat": 37.2851,
    "lng": 127.5576,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 20,
    "purchaseAmount": 71400,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-09-09",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 82,
    "name": "안성시정신건강복지센터",
    "type": "전문기관",
    "region": "경기도",
    "district": "안성시",
    "lat": 37.3325,
    "lng": 127.6399,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 100,
    "purchaseAmount": 225000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-09-09",
    "consultCount": 56,
    "lastConsultDate": "2024-04-29"
  },
  {
    "id": 83,
    "name": "전북대학교 소방공무원 심리지원센터",
    "type": "교육기관",
    "region": "전북특별자치도",
    "district": "전주시",
    "lat": 35.9282,
    "lng": 126.9802,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 4000,
    "purchaseAmount": 7300000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-09-05",
    "consultCount": 4,
    "lastConsultDate": "2025-09-04"
  },
  {
    "id": 84,
    "name": "서대문구보건소",
    "type": "보건소",
    "region": "서울특별시",
    "district": "서대문구",
    "lat": 37.4808,
    "lng": 126.8677,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "반기",
    "purchaseVolume": 2000,
    "purchaseAmount": 4200000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-09-02",
    "consultCount": 61,
    "lastConsultDate": "2024-10-07"
  },
  {
    "id": 85,
    "name": "[육군]66보병사단 의무대",
    "type": "군/경/소방",
    "region": "경기도",
    "district": "가평군",
    "lat": 37.5445,
    "lng": 127.5396,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 502,
    "purchaseAmount": 1050000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-09-02",
    "consultCount": 3,
    "lastConsultDate": "2021-08-26"
  },
  {
    "id": 86,
    "name": "송파구정신건강복지센터",
    "type": "전문기관",
    "region": "서울특별시",
    "district": "송파구",
    "lat": 37.5583,
    "lng": 127.0634,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 4000,
    "purchaseAmount": 2100000,
    "purchaseStage": "만족",
    "lastPurchaseDate": "2025-09-02",
    "consultCount": 4,
    "lastConsultDate": "2025-09-01"
  },
  {
    "id": 87,
    "name": "한양대학교 학생지원팀 한양보건센터",
    "type": "교육기관",
    "region": "경기도",
    "district": "안산시",
    "lat": 37.506,
    "lng": 127.4254,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 300,
    "purchaseAmount": 750000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-08-28",
    "consultCount": 4,
    "lastConsultDate": "2021-02-15"
  },
  {
    "id": 88,
    "name": "서울중구보건소",
    "type": "보건소",
    "region": "서울특별시",
    "district": "중구",
    "lat": 37.4456,
    "lng": 126.9573,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 1503,
    "purchaseAmount": 1000000,
    "purchaseStage": "만족",
    "lastPurchaseDate": "2025-08-27",
    "consultCount": 4,
    "lastConsultDate": "2025-08-19"
  },
  {
    "id": 89,
    "name": "국립부곡병원",
    "type": "군/경/소방",
    "region": "경상남도",
    "district": "창녕군",
    "lat": 35.4377,
    "lng": 128.2033,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "반기",
    "purchaseVolume": 2500,
    "purchaseAmount": 4930000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-08-27",
    "consultCount": 10,
    "lastConsultDate": "2024-12-09"
  },
  {
    "id": 90,
    "name": "양평군보건소",
    "type": "보건소",
    "region": "경기도",
    "district": "양평군",
    "lat": 37.8915,
    "lng": 128.2075,
    "products": [
      "노담패치",
      "알쓰패치"
    ],
    "purchaseCycle": "반기",
    "purchaseVolume": 1300,
    "purchaseAmount": 2605000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-08-24",
    "consultCount": 21,
    "lastConsultDate": "2025-11-14"
  },
  {
    "id": 91,
    "name": "대구수성구보건소",
    "type": "보건소",
    "region": "대구광역시",
    "district": "수성구",
    "lat": 36.0166,
    "lng": 128.4809,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 625,
    "purchaseAmount": 981250,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-08-20",
    "consultCount": 10,
    "lastConsultDate": "2023-06-14"
  },
  {
    "id": 92,
    "name": "국군양주병원",
    "type": "군/경/소방",
    "region": "경기도",
    "district": "양주시",
    "lat": 37.3846,
    "lng": 127.4701,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "반기",
    "purchaseVolume": 1350,
    "purchaseAmount": 3150000,
    "purchaseStage": "만족",
    "lastPurchaseDate": "2025-08-11",
    "consultCount": 4,
    "lastConsultDate": "2025-08-11"
  },
  {
    "id": 93,
    "name": "경주시보건소",
    "type": "보건소",
    "region": "경상북도",
    "district": "경주시",
    "lat": 36.6004,
    "lng": 128.8135,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "반기",
    "purchaseVolume": 7502,
    "purchaseAmount": 11580000,
    "purchaseStage": "추천",
    "lastPurchaseDate": "2025-08-08",
    "consultCount": 36,
    "lastConsultDate": "2025-08-07"
  },
  {
    "id": 94,
    "name": "울주군보건소",
    "type": "보건소",
    "region": "울산광역시",
    "district": "울주군",
    "lat": 35.4455,
    "lng": 129.296,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "반기",
    "purchaseVolume": 4603,
    "purchaseAmount": 10500000,
    "purchaseStage": "추천",
    "lastPurchaseDate": "2025-08-07",
    "consultCount": 58,
    "lastConsultDate": "2025-04-21"
  },
  {
    "id": 95,
    "name": "서울금연지원센터",
    "type": "금연지원센터",
    "region": "서울특별시",
    "district": "서대문구",
    "lat": 37.5431,
    "lng": 126.9116,
    "products": [
      "노담패치"
    ],
    "purchaseCycle": "반기",
    "purchaseVolume": 2000,
    "purchaseAmount": 4750000,
    "purchaseStage": "만족",
    "lastPurchaseDate": "2025-08-05",
    "consultCount": 7,
    "lastConsultDate": "2025-02-17"
  },
  {
    "id": 96,
    "name": "3사단 의무대",
    "type": "군/경/소방",
    "region": "강원특별자치도",
    "district": "철원군",
    "lat": 37.8057,
    "lng": 128.2639,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "연간",
    "purchaseVolume": 600,
    "purchaseAmount": 1500000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-07-30",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 97,
    "name": "영동군보건소",
    "type": "보건소",
    "region": "충청북도",
    "district": "영동군",
    "lat": 36.6508,
    "lng": 127.3569,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "분기",
    "purchaseVolume": 2500,
    "purchaseAmount": 3925000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-07-29",
    "consultCount": 15,
    "lastConsultDate": "2021-07-02"
  },
  {
    "id": 98,
    "name": "연수구중독관리통합지원센터",
    "type": "전문기관",
    "region": "인천광역시",
    "district": "연수구",
    "lat": 37.6061,
    "lng": 126.806,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 600,
    "purchaseAmount": 1260000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-07-25",
    "consultCount": 20,
    "lastConsultDate": "2025-07-25"
  },
  {
    "id": 99,
    "name": "송파구보건소",
    "type": "보건소",
    "region": "서울특별시",
    "district": "송파구",
    "lat": 37.7072,
    "lng": 127.1059,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "반기",
    "purchaseVolume": 1500,
    "purchaseAmount": 3150000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-07-22",
    "consultCount": 8,
    "lastConsultDate": "2025-07-21"
  },
  {
    "id": 100,
    "name": "경기도중독관리센터",
    "type": "전문기관",
    "region": "경기도",
    "district": "수원시",
    "lat": 37.5184,
    "lng": 127.4182,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 500,
    "purchaseAmount": 890000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-07-04",
    "consultCount": 52,
    "lastConsultDate": "2024-10-31"
  },
  {
    "id": 101,
    "name": "국군강릉병원",
    "type": "군/경/소방",
    "region": "인천광역시",
    "district": "남동구",
    "lat": 37.452,
    "lng": 126.6193,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 300,
    "purchaseAmount": 636000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-07-03",
    "consultCount": 8,
    "lastConsultDate": "2024-10-04"
  },
  {
    "id": 102,
    "name": "마산중독관리통합지원센터",
    "type": "전문기관",
    "region": "경상남도",
    "district": "창원시",
    "lat": 35.4309,
    "lng": 128.0808,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 3000,
    "purchaseAmount": 2000000,
    "purchaseStage": "만족",
    "lastPurchaseDate": "2025-07-02",
    "consultCount": 9,
    "lastConsultDate": "2025-08-29"
  },
  {
    "id": 103,
    "name": "대전세종금연지원센터",
    "type": "금연지원센터",
    "region": "대전광역시",
    "district": "중구",
    "lat": 36.3141,
    "lng": 127.5301,
    "products": [
      "노담패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 500,
    "purchaseAmount": 1250000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-06-27",
    "consultCount": 2,
    "lastConsultDate": "2025-06-25"
  },
  {
    "id": 104,
    "name": "진주시보건소",
    "type": "보건소",
    "region": "경상남도",
    "district": "진주시",
    "lat": 35.3902,
    "lng": 128.2984,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 2000,
    "purchaseAmount": 3140000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-06-27",
    "consultCount": 25,
    "lastConsultDate": "2022-10-21"
  },
  {
    "id": 105,
    "name": "육군제2062부대",
    "type": "군/경/소방",
    "region": "경기도",
    "district": "남양주시",
    "lat": 37.4003,
    "lng": 127.4952,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 150,
    "purchaseAmount": 450000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-06-23",
    "consultCount": 1,
    "lastConsultDate": "2019-06-17"
  },
  {
    "id": 106,
    "name": "춘천시보건소 건강관리과",
    "type": "보건소",
    "region": "강원특별자치도",
    "district": "춘천시",
    "lat": 37.96,
    "lng": 128.3041,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "월간",
    "purchaseVolume": 1502,
    "purchaseAmount": 2130000,
    "purchaseStage": "만족",
    "lastPurchaseDate": "2025-06-20",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 107,
    "name": "한국건강관리협회 울산광역시지부",
    "type": "공공기관(기타)",
    "region": "울산광역시",
    "district": "중구",
    "lat": 35.5551,
    "lng": 129.3769,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 45,
    "purchaseAmount": 189000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-06-17",
    "consultCount": 8,
    "lastConsultDate": "2020-05-14"
  },
  {
    "id": 108,
    "name": "홍성군보건소",
    "type": "보건소",
    "region": "대전광역시",
    "district": "중구",
    "lat": 36.2468,
    "lng": 127.3235,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 3060,
    "purchaseAmount": 712000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-06-13",
    "consultCount": 24,
    "lastConsultDate": "2025-09-23"
  },
  {
    "id": 109,
    "name": "홍성군보건소",
    "type": "보건소",
    "region": "충청남도",
    "district": "홍성군",
    "lat": 36.491,
    "lng": 127.4083,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 9180,
    "purchaseAmount": 2011400,
    "purchaseStage": "추천",
    "lastPurchaseDate": "2025-06-13",
    "consultCount": 24,
    "lastConsultDate": "2025-09-23"
  },
  {
    "id": 110,
    "name": "부안보건소",
    "type": "보건소",
    "region": "전북특별자치도",
    "district": "부안군",
    "lat": 35.833,
    "lng": 127.1833,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 600,
    "purchaseAmount": 1146000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-06-11",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 111,
    "name": "설천중·고등학교",
    "type": "교육기관",
    "region": "전북특별자치도",
    "district": "무주군",
    "lat": 35.6874,
    "lng": 127.1342,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 201,
    "purchaseAmount": 600000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-06-11",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 112,
    "name": "남해군보건소",
    "type": "보건소",
    "region": "경상남도",
    "district": "남해군",
    "lat": 35.4615,
    "lng": 128.319,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 100,
    "purchaseAmount": 273000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-06-05",
    "consultCount": 43,
    "lastConsultDate": "2024-05-28"
  },
  {
    "id": 113,
    "name": "보건소 납품",
    "type": "보건소",
    "region": "광주광역시",
    "district": "북구",
    "lat": 35.0567,
    "lng": 126.9908,
    "products": [
      "노담패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 320,
    "purchaseAmount": 902400,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-06-04",
    "consultCount": 769,
    "lastConsultDate": "2026-01-12"
  },
  {
    "id": 114,
    "name": "예산덕산중학교",
    "type": "교육기관",
    "region": "충청남도",
    "district": "예산군",
    "lat": 36.3924,
    "lng": 126.7057,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 180,
    "purchaseAmount": 459000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-05-30",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 115,
    "name": "한국건강관리협회",
    "type": "공공기관(기타)",
    "region": "서울특별시",
    "district": "강서구",
    "lat": 37.595,
    "lng": 127.0306,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 20,
    "purchaseAmount": 76400,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-05-29",
    "consultCount": 3,
    "lastConsultDate": "2024-02-06"
  },
  {
    "id": 116,
    "name": "한국경마축산고등학교",
    "type": "교육기관",
    "region": "전북특별자치도",
    "district": "남원시",
    "lat": 35.7409,
    "lng": 126.9949,
    "products": [
      "노담패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 100,
    "purchaseAmount": 360000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-05-27",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 117,
    "name": "달성군보건소",
    "type": "보건소",
    "region": "대구광역시",
    "district": "달성군",
    "lat": 35.9885,
    "lng": 128.5253,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 906,
    "purchaseAmount": 810000,
    "purchaseStage": "만족",
    "lastPurchaseDate": "2025-05-26",
    "consultCount": 83,
    "lastConsultDate": "2025-05-26"
  },
  {
    "id": 118,
    "name": "강남구보건소 금연클리닉",
    "type": "보건소",
    "region": "서울특별시",
    "district": "강남구",
    "lat": 37.5949,
    "lng": 127.0138,
    "products": [
      "노담패치",
      "알쓰패치"
    ],
    "purchaseCycle": "분기",
    "purchaseVolume": 11487,
    "purchaseAmount": 15111600,
    "purchaseStage": "추천",
    "lastPurchaseDate": "2025-05-19",
    "consultCount": 92,
    "lastConsultDate": "2025-07-09"
  },
  {
    "id": 119,
    "name": "줄포자동차공업고등학교",
    "type": "교육기관",
    "region": "전북특별자치도",
    "district": "부안군",
    "lat": 35.7961,
    "lng": 127.134,
    "products": [
      "노담패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 30,
    "purchaseAmount": 150000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-05-19",
    "consultCount": 2,
    "lastConsultDate": "2015-11-04"
  },
  {
    "id": 120,
    "name": "종로구정신건강복지센터",
    "type": "전문기관",
    "region": "서울특별시",
    "district": "종로구",
    "lat": 37.5733,
    "lng": 127.1084,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 150,
    "purchaseAmount": 450000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-05-14",
    "consultCount": 13,
    "lastConsultDate": "2025-04-14"
  },
  {
    "id": 121,
    "name": "대구한의대학교 보건학부",
    "type": "전공교육",
    "region": "경상북도",
    "district": "경산시",
    "lat": 36.4032,
    "lng": 128.9538,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 400,
    "purchaseAmount": 700000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-05-13",
    "consultCount": 2,
    "lastConsultDate": "2024-06-07"
  },
  {
    "id": 122,
    "name": "용인 3개구 보건소",
    "type": "보건소",
    "region": "경기도",
    "district": "용인시",
    "lat": 37.2411,
    "lng": 127.1776,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 550,
    "purchaseAmount": 1050500,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-05-13",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 123,
    "name": "무주중학교",
    "type": "교육기관",
    "region": "전북특별자치도",
    "district": "무주군",
    "lat": 35.8718,
    "lng": 127.0489,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 121,
    "purchaseAmount": 360000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-05-12",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 124,
    "name": "카프성모병원",
    "type": "공공기관(기타)",
    "region": "경기도",
    "district": "고양시",
    "lat": 37.3587,
    "lng": 127.5939,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 20,
    "purchaseAmount": 84000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-05-08",
    "consultCount": 1,
    "lastConsultDate": "2020-04-17"
  },
  {
    "id": 125,
    "name": "청평고등학교",
    "type": "교육기관",
    "region": "경기도",
    "district": "가평군",
    "lat": 37.2856,
    "lng": 127.5058,
    "products": [
      "노담패치",
      "알쓰패치"
    ],
    "purchaseCycle": "분기",
    "purchaseVolume": 72,
    "purchaseAmount": 334000,
    "purchaseStage": "만족",
    "lastPurchaseDate": "2025-05-08",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 126,
    "name": "학교 보건수업",
    "type": "교육기관",
    "region": "전북특별자치도",
    "district": "익산시",
    "lat": 35.9698,
    "lng": 127.2577,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 150,
    "purchaseAmount": 450000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-05-07",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 127,
    "name": "서산시보건소",
    "type": "보건소",
    "region": "충청남도",
    "district": "서산시",
    "lat": 36.3904,
    "lng": 126.7139,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 500,
    "purchaseAmount": 1050000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-05-01",
    "consultCount": 7,
    "lastConsultDate": "2025-05-01"
  },
  {
    "id": 128,
    "name": "대구한의대학교",
    "type": "전공교육",
    "region": "경상북도",
    "district": "경산시",
    "lat": 36.4215,
    "lng": 129.0189,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "반기",
    "purchaseVolume": 240,
    "purchaseAmount": 717600,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-04-25",
    "consultCount": 1,
    "lastConsultDate": "2023-05-15"
  },
  {
    "id": 129,
    "name": "서울금연",
    "type": "금연지원센터",
    "region": "서울특별시",
    "district": "서대문구",
    "lat": 37.6808,
    "lng": 127.0918,
    "products": [
      "노담패치"
    ],
    "purchaseCycle": "월간",
    "purchaseVolume": 1600,
    "purchaseAmount": 2500000,
    "purchaseStage": "만족",
    "lastPurchaseDate": "2025-04-15",
    "consultCount": 1,
    "lastConsultDate": "2025-04-04"
  },
  {
    "id": 130,
    "name": "17사단의무대대",
    "type": "군/경/소방",
    "region": "인천광역시",
    "district": "부평구",
    "lat": 37.4172,
    "lng": 126.6025,
    "products": [
      "노담패치",
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 5724,
    "purchaseAmount": 1550000,
    "purchaseStage": "추천",
    "lastPurchaseDate": "2025-04-14",
    "consultCount": 7,
    "lastConsultDate": "2025-04-09"
  },
  {
    "id": 131,
    "name": "전주중학교",
    "type": "교육기관",
    "region": "전북특별자치도",
    "district": "전주시",
    "lat": 35.9204,
    "lng": 127.17,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "반기",
    "purchaseVolume": 1120,
    "purchaseAmount": 2010000,
    "purchaseStage": "만족",
    "lastPurchaseDate": "2025-04-08",
    "consultCount": 3,
    "lastConsultDate": "2023-08-25"
  },
  {
    "id": 132,
    "name": "동국대학교사범대학부속고등학교",
    "type": "교육기관",
    "region": "서울특별시",
    "district": "동대문구",
    "lat": 37.6,
    "lng": 127.1242,
    "products": [
      "노담패치",
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 316,
    "purchaseAmount": 590000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-04-03",
    "consultCount": 4,
    "lastConsultDate": "2024-10-18"
  },
  {
    "id": 133,
    "name": "서울교통공사",
    "type": "사업장",
    "region": "서울특별시",
    "district": "성동구",
    "lat": 37.6127,
    "lng": 126.8303,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 501,
    "purchaseAmount": 1050000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-03-27",
    "consultCount": 3,
    "lastConsultDate": "2025-03-24"
  },
  {
    "id": 134,
    "name": "한국나노마이스터고등학교",
    "type": "교육기관",
    "region": "경상남도",
    "district": "밀양시",
    "lat": 35.5557,
    "lng": 128.153,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 150,
    "purchaseAmount": 382500,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-03-20",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 135,
    "name": "아산시보건소 중독관리통합지원센터",
    "type": "전문기관",
    "region": "충청남도",
    "district": "아산시",
    "lat": 36.2407,
    "lng": 127.2691,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 300,
    "purchaseAmount": 534000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-03-19",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 136,
    "name": "전주호성중학교",
    "type": "교육기관",
    "region": "전북특별자치도",
    "district": "전주시",
    "lat": 35.7024,
    "lng": 127.1249,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 41,
    "purchaseAmount": 172200,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-03-18",
    "consultCount": 2,
    "lastConsultDate": "2024-03-27"
  },
  {
    "id": 137,
    "name": "유성구중독관리통합지원센터",
    "type": "전문기관",
    "region": "대전광역시",
    "district": "유성구",
    "lat": 36.2821,
    "lng": 127.4159,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 100,
    "purchaseAmount": 420000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-03-07",
    "consultCount": 4,
    "lastConsultDate": "2020-12-07"
  },
  {
    "id": 138,
    "name": "사업장 건강증진프로그램",
    "type": "사업장",
    "region": "경기도",
    "district": "이천시",
    "lat": 37.4791,
    "lng": 127.4294,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 70,
    "purchaseAmount": 294000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-03-05",
    "consultCount": 11,
    "lastConsultDate": "2026-01-12"
  },
  {
    "id": 139,
    "name": "판촉사랑->국군강릉병원으로 납품",
    "type": "사업장",
    "region": "인천광역시",
    "district": "남동구",
    "lat": 37.4966,
    "lng": 126.6344,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 200,
    "purchaseAmount": 510000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-03-05",
    "consultCount": 52,
    "lastConsultDate": "2025-03-04"
  },
  {
    "id": 140,
    "name": "성남시중독관리통합지원센터",
    "type": "전문기관",
    "region": "경기도",
    "district": "성남시",
    "lat": 37.4104,
    "lng": 127.6399,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 100,
    "purchaseAmount": 300000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-03-05",
    "consultCount": 4,
    "lastConsultDate": "2021-02-24"
  },
  {
    "id": 141,
    "name": "광주광역시 서구보건소",
    "type": "보건소",
    "region": "광주광역시",
    "district": "서구",
    "lat": 35.1525,
    "lng": 126.8895,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 550,
    "purchaseAmount": 979000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-02-28",
    "consultCount": 5,
    "lastConsultDate": "2023-11-28"
  },
  {
    "id": 142,
    "name": "아산시중독관리통합지원센터",
    "type": "전문기관",
    "region": "충청남도",
    "district": "아산시",
    "lat": 36.3275,
    "lng": 127.3175,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 500,
    "purchaseAmount": 890000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-02-26",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 143,
    "name": "온누리안과병원",
    "type": "사업장",
    "region": "전북특별자치도",
    "district": "전주시",
    "lat": 35.6714,
    "lng": 127.1902,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 100,
    "purchaseAmount": 300000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-02-24",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 144,
    "name": "GC녹십자 건강관리실",
    "type": "사업장",
    "region": "경기도",
    "district": "용인시",
    "lat": 37.4549,
    "lng": 127.4469,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 301,
    "purchaseAmount": 750000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-02-05",
    "consultCount": 2,
    "lastConsultDate": "2025-02-04"
  },
  {
    "id": 145,
    "name": "순천향대학교",
    "type": "전공교육",
    "region": "충청남도",
    "district": "아산시",
    "lat": 36.5908,
    "lng": 126.8155,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 10,
    "purchaseAmount": 42000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2025-01-14",
    "consultCount": 2,
    "lastConsultDate": "2019-10-23"
  },
  {
    "id": 146,
    "name": "고등학교 동아리 행사",
    "type": "교육기관",
    "region": "경상북도",
    "district": "영주시",
    "lat": 36.4702,
    "lng": 128.7418,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 36,
    "purchaseAmount": 147000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-12-31",
    "consultCount": 9,
    "lastConsultDate": "2024-06-24"
  },
  {
    "id": 147,
    "name": "창원시중독관리통합지원센터",
    "type": "전문기관",
    "region": "경상남도",
    "district": "창원시",
    "lat": 36.3726,
    "lng": 127.6149,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 9000,
    "purchaseAmount": 6300000,
    "purchaseStage": "만족",
    "lastPurchaseDate": "2024-12-23",
    "consultCount": 11,
    "lastConsultDate": "2020-10-08"
  },
  {
    "id": 148,
    "name": "경북기계공업고등학교",
    "type": "교육기관",
    "region": "경상북도",
    "district": "경산시",
    "lat": 36.6131,
    "lng": 128.9026,
    "products": [
      "노담패치",
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 220,
    "purchaseAmount": 426700,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-12-20",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 149,
    "name": "김포시정신건강복지센터 부설 중독관리통합지원센터",
    "type": "전문기관",
    "region": "경기도",
    "district": "김포시",
    "lat": 37.5142,
    "lng": 127.5431,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 1250,
    "purchaseAmount": 2625000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-12-20",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 150,
    "name": "바이플러스,김제시보건소",
    "type": "보건소",
    "region": "전북특별자치도",
    "district": "김제시",
    "lat": 35.7147,
    "lng": 126.9971,
    "products": [
      "노담패치",
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 600,
    "purchaseAmount": 841500,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-12-13",
    "consultCount": 19,
    "lastConsultDate": "2023-05-22"
  },
  {
    "id": 151,
    "name": "춘성중학교",
    "type": "교육기관",
    "region": "강원특별자치도",
    "district": "춘천시",
    "lat": 37.7653,
    "lng": 128.2752,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 40,
    "purchaseAmount": 168000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-12-11",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 152,
    "name": "무안군보건소",
    "type": "보건소",
    "region": "전라남도",
    "district": "무안군",
    "lat": 35.2792,
    "lng": 126.7656,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 540,
    "purchaseAmount": 961200,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-12-09",
    "consultCount": 11,
    "lastConsultDate": "2024-04-25"
  },
  {
    "id": 153,
    "name": "인천동구중독관리통합지원센터",
    "type": "전문기관",
    "region": "인천광역시",
    "district": "동구",
    "lat": 37.4738,
    "lng": 126.6432,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 4014,
    "purchaseAmount": 4560000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-12-05",
    "consultCount": 4,
    "lastConsultDate": "2024-11-22"
  },
  {
    "id": 154,
    "name": "광주북구중독관리통합지원센터",
    "type": "전문기관",
    "region": "광주광역시",
    "district": "북구",
    "lat": 35.1314,
    "lng": 126.8888,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 1000,
    "purchaseAmount": 2100000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-12-05",
    "consultCount": 4,
    "lastConsultDate": "2012-03-22"
  },
  {
    "id": 155,
    "name": "동두천정신건강복지센터",
    "type": "전문기관",
    "region": "경기도",
    "district": "동두천시",
    "lat": 37.3102,
    "lng": 127.6473,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "월간",
    "purchaseVolume": 60,
    "purchaseAmount": 200000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-12-03",
    "consultCount": 2,
    "lastConsultDate": "2024-12-06"
  },
  {
    "id": 156,
    "name": "청양정산중학교",
    "type": "교육기관",
    "region": "충청남도",
    "district": "청양군",
    "lat": 36.6278,
    "lng": 126.9429,
    "products": [
      "노담패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 150,
    "purchaseAmount": 459000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-12-03",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 157,
    "name": "금산군보건소",
    "type": "보건소",
    "region": "충청남도",
    "district": "금산군",
    "lat": 36.4436,
    "lng": 127.4989,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 1150,
    "purchaseAmount": 2047000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-11-26",
    "consultCount": 6,
    "lastConsultDate": "2015-12-16"
  },
  {
    "id": 158,
    "name": "육군사관학교 의무대대",
    "type": "군/경/소방",
    "region": "서울특별시",
    "district": "노원구",
    "lat": 37.4239,
    "lng": 127.049,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 300,
    "purchaseAmount": 750000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-11-25",
    "consultCount": 4,
    "lastConsultDate": "2024-11-25"
  },
  {
    "id": 159,
    "name": "국민건강의료기",
    "type": "사업장",
    "region": "경상북도",
    "district": "포항시",
    "lat": 36.5826,
    "lng": 128.9981,
    "products": [
      "노담패치",
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 1200,
    "purchaseAmount": 1170000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-11-18",
    "consultCount": 12,
    "lastConsultDate": "2025-05-07"
  },
  {
    "id": 160,
    "name": "진주보건소, 맥선",
    "type": "보건소",
    "region": "경상남도",
    "district": "진주시",
    "lat": 35.5538,
    "lng": 128.1432,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 900,
    "purchaseAmount": 1413000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-11-15",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 161,
    "name": "국군춘천병원",
    "type": "군/경/소방",
    "region": "강원특별자치도",
    "district": "춘천시",
    "lat": 37.909,
    "lng": 128.0379,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 40,
    "purchaseAmount": 126000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-11-14",
    "consultCount": 2,
    "lastConsultDate": "2019-04-22"
  },
  {
    "id": 162,
    "name": "국군서울지구병원",
    "type": "군/경/소방",
    "region": "서울특별시",
    "district": "종로구",
    "lat": 37.6782,
    "lng": 127.0856,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 74,
    "purchaseAmount": 147000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-11-13",
    "consultCount": 6,
    "lastConsultDate": "2024-11-11"
  },
  {
    "id": 163,
    "name": "대구남구보건소",
    "type": "보건소",
    "region": "대구광역시",
    "district": "남구",
    "lat": 35.7881,
    "lng": 128.6964,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "반기",
    "purchaseVolume": 3902,
    "purchaseAmount": 4125000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-11-01",
    "consultCount": 26,
    "lastConsultDate": "2025-05-12"
  },
  {
    "id": 164,
    "name": "기장군보건소",
    "type": "보건소",
    "region": "부산광역시",
    "district": "기장군",
    "lat": 35.1677,
    "lng": 129.0172,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "반기",
    "purchaseVolume": 1502,
    "purchaseAmount": 2150000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-11-01",
    "consultCount": 8,
    "lastConsultDate": "2023-10-06"
  },
  {
    "id": 165,
    "name": "남양주동부보건센터",
    "type": "보건소",
    "region": "경기도",
    "district": "남양주시",
    "lat": 37.5024,
    "lng": 127.4366,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 1,
    "purchaseAmount": 1050000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-10-31",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 166,
    "name": "15사단 의무대대",
    "type": "군/경/소방",
    "region": "강원특별자치도",
    "district": "화천군",
    "lat": 37.6799,
    "lng": 128.0634,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 100,
    "purchaseAmount": 300000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-10-29",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 167,
    "name": "75사단 의무대",
    "type": "군/경/소방",
    "region": "경기도",
    "district": "남양주시",
    "lat": 37.3623,
    "lng": 127.6276,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 402,
    "purchaseAmount": 630000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-10-17",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 168,
    "name": "대구동구중독관리통합지원센터",
    "type": "전문기관",
    "region": "대구광역시",
    "district": "동구",
    "lat": 36.0115,
    "lng": 128.5351,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 100,
    "purchaseAmount": 300000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-10-16",
    "consultCount": 7,
    "lastConsultDate": "2015-04-13"
  },
  {
    "id": 169,
    "name": "국군강릉병원",
    "type": "군/경/소방",
    "region": "강원특별자치도",
    "district": "강릉시",
    "lat": 37.8652,
    "lng": 128.1254,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "반기",
    "purchaseVolume": 386,
    "purchaseAmount": 990000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-10-08",
    "consultCount": 8,
    "lastConsultDate": "2024-10-04"
  },
  {
    "id": 170,
    "name": "서울시통합건강증진사업단",
    "type": "광역시도 건강증진부서",
    "region": "서울특별시",
    "district": "광진구",
    "lat": 37.6983,
    "lng": 126.8626,
    "products": [
      "노담패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 3735,
    "purchaseAmount": 3610500,
    "purchaseStage": "만족",
    "lastPurchaseDate": "2024-09-30",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 171,
    "name": "수성구보건소",
    "type": "보건소",
    "region": "대구광역시",
    "district": "수성구",
    "lat": 36.0125,
    "lng": 128.505,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 500,
    "purchaseAmount": 785000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-09-19",
    "consultCount": 2,
    "lastConsultDate": "2019-07-12"
  },
  {
    "id": 172,
    "name": "종로구보건소",
    "type": "보건소",
    "region": "서울특별시",
    "district": "종로구",
    "lat": 37.7053,
    "lng": 126.9076,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 230,
    "purchaseAmount": 600000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-09-12",
    "consultCount": 13,
    "lastConsultDate": "2024-07-23"
  },
  {
    "id": 173,
    "name": "동대문구정신건강복지센터",
    "type": "전문기관",
    "region": "서울특별시",
    "district": "동대문구",
    "lat": 37.449,
    "lng": 126.9584,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 50,
    "purchaseAmount": 210000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-09-09",
    "consultCount": 1,
    "lastConsultDate": "2017-08-14"
  },
  {
    "id": 174,
    "name": "동작구정신보건복지센터",
    "type": "전문기관",
    "region": "서울특별시",
    "district": "동작구",
    "lat": 37.6351,
    "lng": 126.9221,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 500,
    "purchaseAmount": 1050000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-09-06",
    "consultCount": 14,
    "lastConsultDate": "2024-09-06"
  },
  {
    "id": 175,
    "name": "울산 남구보건소",
    "type": "보건소",
    "region": "울산광역시",
    "district": "남구",
    "lat": 35.5703,
    "lng": 129.3148,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "반기",
    "purchaseVolume": 2301,
    "purchaseAmount": 5880000,
    "purchaseStage": "만족",
    "lastPurchaseDate": "2024-09-06",
    "consultCount": 40,
    "lastConsultDate": "2023-08-28"
  },
  {
    "id": 176,
    "name": "예산군보건소",
    "type": "보건소",
    "region": "충청남도",
    "district": "예산군",
    "lat": 36.484,
    "lng": 126.823,
    "products": [
      "노담패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 2000,
    "purchaseAmount": 2500000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-09-05",
    "consultCount": 18,
    "lastConsultDate": "2024-09-06"
  },
  {
    "id": 177,
    "name": "서울시청",
    "type": "공공기관(기타)",
    "region": "서울특별시",
    "district": "중구",
    "lat": 37.417,
    "lng": 127.1057,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 2000,
    "purchaseAmount": 1570000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-08-30",
    "consultCount": 17,
    "lastConsultDate": "2024-10-29"
  },
  {
    "id": 178,
    "name": "정선군보건소",
    "type": "보건소",
    "region": "강원특별자치도",
    "district": "정선군",
    "lat": 37.8343,
    "lng": 128.2213,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 1000,
    "purchaseAmount": 890000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-08-28",
    "consultCount": 37,
    "lastConsultDate": "2023-10-23"
  },
  {
    "id": 179,
    "name": "영등포구보건소",
    "type": "보건소",
    "region": "서울특별시",
    "district": "영등포구",
    "lat": 37.5258,
    "lng": 126.849,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 1842,
    "purchaseAmount": 1932000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-08-26",
    "consultCount": 24,
    "lastConsultDate": "2025-03-21"
  },
  {
    "id": 180,
    "name": "경상대예방의학교실",
    "type": "전공교육",
    "region": "경상남도",
    "district": "진주시",
    "lat": 35.5099,
    "lng": 128.1623,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 5,
    "purchaseAmount": 148500,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-08-22",
    "consultCount": 2,
    "lastConsultDate": "2024-08-21"
  },
  {
    "id": 181,
    "name": "경상국립대학교 예방의학교실",
    "type": "전공교육",
    "region": "경상남도",
    "district": "진주시",
    "lat": 35.4048,
    "lng": 128.3176,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 607,
    "purchaseAmount": 784300,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-07-12",
    "consultCount": 3,
    "lastConsultDate": "2024-08-26"
  },
  {
    "id": 182,
    "name": "태백시보건소",
    "type": "보건소",
    "region": "강원특별자치도",
    "district": "태백시",
    "lat": 37.8887,
    "lng": 128.0956,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "반기",
    "purchaseVolume": 1966,
    "purchaseAmount": 4074000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-07-05",
    "consultCount": 13,
    "lastConsultDate": "2024-07-03"
  },
  {
    "id": 183,
    "name": "국군구리병원",
    "type": "군/경/소방",
    "region": "경기도",
    "district": "구리시",
    "lat": 37.3566,
    "lng": 127.4908,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 100,
    "purchaseAmount": 300000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-07-05",
    "consultCount": 3,
    "lastConsultDate": "2024-09-13"
  },
  {
    "id": 184,
    "name": "예산군보건소",
    "type": "보건소",
    "region": "충청남도",
    "district": "예산군",
    "lat": 36.3211,
    "lng": 127.3232,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 1600,
    "purchaseAmount": 1424000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-06-21",
    "consultCount": 18,
    "lastConsultDate": "2024-09-06"
  },
  {
    "id": 185,
    "name": "완도해양경찰서",
    "type": "군/경/소방",
    "region": "전라남도",
    "district": "완도군",
    "lat": 34.7561,
    "lng": 126.9671,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 400,
    "purchaseAmount": 800000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-06-17",
    "consultCount": 3,
    "lastConsultDate": "2024-06-17"
  },
  {
    "id": 186,
    "name": "용산구보건소",
    "type": "보건소",
    "region": "서울특별시",
    "district": "용산구",
    "lat": 37.6873,
    "lng": 127.0127,
    "products": [
      "노담패치",
      "알쓰패치"
    ],
    "purchaseCycle": "반기",
    "purchaseVolume": 804,
    "purchaseAmount": 2160000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-06-14",
    "consultCount": 42,
    "lastConsultDate": "2024-06-14"
  },
  {
    "id": 187,
    "name": "충남 서산시보건소",
    "type": "보건소",
    "region": "충청남도",
    "district": "서산시",
    "lat": 36.4403,
    "lng": 127.5144,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 300,
    "purchaseAmount": 750000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-05-27",
    "consultCount": 13,
    "lastConsultDate": "2024-05-23"
  },
  {
    "id": 188,
    "name": "동국대학교사범대학부속중고등학교",
    "type": "교육기관",
    "region": "서울특별시",
    "district": "동대문구",
    "lat": 37.4166,
    "lng": 126.9141,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 1,
    "purchaseAmount": 0,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-05-24",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 189,
    "name": "무풍고등학교",
    "type": "교육기관",
    "region": "전북특별자치도",
    "district": "무주군",
    "lat": 35.7993,
    "lng": 127.1329,
    "products": [
      "노담패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 30,
    "purchaseAmount": 150000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-05-24",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 190,
    "name": "달서구보건소",
    "type": "보건소",
    "region": "대구광역시",
    "district": "달서구",
    "lat": 35.8634,
    "lng": 128.7218,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 300,
    "purchaseAmount": 750000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-05-21",
    "consultCount": 14,
    "lastConsultDate": "2023-10-23"
  },
  {
    "id": 191,
    "name": "원주시보건소",
    "type": "보건소",
    "region": "강원특별자치도",
    "district": "원주시",
    "lat": 37.9116,
    "lng": 128.0564,
    "products": [
      "노담패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 500,
    "purchaseAmount": 1250000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-05-20",
    "consultCount": 9,
    "lastConsultDate": "2024-05-13"
  },
  {
    "id": 192,
    "name": "서울시 통합건강증진사업지원단 금연사업팀",
    "type": "공공기관(기타)",
    "region": "서울특별시",
    "district": "중구",
    "lat": 37.4419,
    "lng": 126.9826,
    "products": [
      "노담패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 1000,
    "purchaseAmount": 2500000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-05-16",
    "consultCount": 2,
    "lastConsultDate": "2024-04-03"
  },
  {
    "id": 193,
    "name": "영동군보건소",
    "type": "보건소",
    "region": "충청북도",
    "district": "영동군",
    "lat": 36.6756,
    "lng": 127.4423,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 500,
    "purchaseAmount": 785000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-05-16",
    "consultCount": 15,
    "lastConsultDate": "2021-07-02"
  },
  {
    "id": 194,
    "name": "국민건강보험공단 서귀포지사",
    "type": "공공기관(기타)",
    "region": "제주특별자치도",
    "district": "서귀포시",
    "lat": 33.5408,
    "lng": 126.4157,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 170,
    "purchaseAmount": 433500,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-05-14",
    "consultCount": 22,
    "lastConsultDate": "2024-10-14"
  },
  {
    "id": 195,
    "name": "영주시보건소",
    "type": "보건소",
    "region": "경상북도",
    "district": "영주시",
    "lat": 35.7811,
    "lng": 128.4587,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 500,
    "purchaseAmount": 890000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-05-13",
    "consultCount": 4,
    "lastConsultDate": "2023-12-21"
  },
  {
    "id": 196,
    "name": "울산동구정신건강복지센터",
    "type": "전문기관",
    "region": "울산광역시",
    "district": "동구",
    "lat": 35.4619,
    "lng": 129.3039,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 230,
    "purchaseAmount": 600000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-05-10",
    "consultCount": 42,
    "lastConsultDate": "2024-05-13"
  },
  {
    "id": 197,
    "name": "동작구정신건강복지센터",
    "type": "전문기관",
    "region": "서울특별시",
    "district": "동작구",
    "lat": 37.5408,
    "lng": 127.0169,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "월간",
    "purchaseVolume": 501,
    "purchaseAmount": 2100000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-05-07",
    "consultCount": 3,
    "lastConsultDate": "2024-08-09"
  },
  {
    "id": 198,
    "name": "영암군보건소",
    "type": "보건소",
    "region": "전라남도",
    "district": "영암군",
    "lat": 34.7762,
    "lng": 127.0499,
    "products": [
      "노담패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 500,
    "purchaseAmount": 1250000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-05-03",
    "consultCount": 13,
    "lastConsultDate": "2024-05-02"
  },
  {
    "id": 199,
    "name": "강서구정신건강복지센터",
    "type": "전문기관",
    "region": "서울특별시",
    "district": "강서구",
    "lat": 37.551,
    "lng": 126.8495,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 600,
    "purchaseAmount": 636000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-04-25",
    "consultCount": 8,
    "lastConsultDate": "2024-04-25"
  },
  {
    "id": 200,
    "name": "태평서울병원",
    "type": "사업장",
    "region": "경기도",
    "district": "성남시",
    "lat": 37.3166,
    "lng": 127.6557,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 24000,
    "purchaseAmount": 10000000,
    "purchaseStage": "만족",
    "lastPurchaseDate": "2024-04-11",
    "consultCount": 2,
    "lastConsultDate": "2024-04-09"
  },
  {
    "id": 201,
    "name": "건강생활팀",
    "type": "보건소",
    "region": "경기도",
    "district": "남양주시",
    "lat": 37.4192,
    "lng": 127.3834,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 600,
    "purchaseAmount": 1260000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-04-02",
    "consultCount": 1,
    "lastConsultDate": "2019-02-26"
  },
  {
    "id": 202,
    "name": "충주시보건소",
    "type": "보건소",
    "region": "충청북도",
    "district": "충주시",
    "lat": 36.5605,
    "lng": 127.5962,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 1,
    "purchaseAmount": 0,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-03-27",
    "consultCount": 22,
    "lastConsultDate": "2015-03-09"
  },
  {
    "id": 203,
    "name": "용산보건소",
    "type": "보건소",
    "region": "서울특별시",
    "district": "용산구",
    "lat": 37.5534,
    "lng": 127.0684,
    "products": [
      "노담패치",
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 2000,
    "purchaseAmount": 2300000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-03-26",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 204,
    "name": "광진구정신건강복지센터",
    "type": "전문기관",
    "region": "서울특별시",
    "district": "광진구",
    "lat": 37.6168,
    "lng": 127.1244,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "반기",
    "purchaseVolume": 1400,
    "purchaseAmount": 3023000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-03-13",
    "consultCount": 4,
    "lastConsultDate": "2024-03-07"
  },
  {
    "id": 205,
    "name": "서초구보건소마음건강센터",
    "type": "보건소",
    "region": "서울특별시",
    "district": "서초구",
    "lat": 37.5951,
    "lng": 127.113,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 500,
    "purchaseAmount": 1050000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2024-02-19",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 206,
    "name": "제주광역 정신건강복지센터 중독통합관리팀",
    "type": "전문기관",
    "region": "제주특별자치도",
    "district": "제주시",
    "lat": 33.6064,
    "lng": 126.5321,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 500,
    "purchaseAmount": 1050000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2023-12-15",
    "consultCount": 1,
    "lastConsultDate": "2023-12-14"
  },
  {
    "id": 207,
    "name": "서울신목초등학교",
    "type": "교육기관",
    "region": "서울특별시",
    "district": "양천구",
    "lat": 37.6323,
    "lng": 126.9794,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "연간",
    "purchaseVolume": 300,
    "purchaseAmount": 900000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2023-12-05",
    "consultCount": 2,
    "lastConsultDate": "2023-12-05"
  },
  {
    "id": 208,
    "name": "광주남구보건소",
    "type": "보건소",
    "region": "광주광역시",
    "district": "남구",
    "lat": 35.2787,
    "lng": 126.9257,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 500,
    "purchaseAmount": 1050000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2023-11-17",
    "consultCount": 2,
    "lastConsultDate": "2023-11-17"
  },
  {
    "id": 209,
    "name": "전주시 중독관리통합지원센터",
    "type": "전문기관",
    "region": "전북특별자치도",
    "district": "전주시",
    "lat": 35.8127,
    "lng": 127.0367,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "분기",
    "purchaseVolume": 3000,
    "purchaseAmount": 3925000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2023-11-16",
    "consultCount": 8,
    "lastConsultDate": "2023-08-11"
  },
  {
    "id": 210,
    "name": "육군사관학교 군부대",
    "type": "군/경/소방",
    "region": "서울특별시",
    "district": "서초구",
    "lat": 37.4907,
    "lng": 127.0193,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 301,
    "purchaseAmount": 780000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2023-11-09",
    "consultCount": 23,
    "lastConsultDate": "2025-06-23"
  },
  {
    "id": 211,
    "name": "한화솔루션 큐셀 음성제2사업장 건강관리실",
    "type": "사업장",
    "region": "충청북도",
    "district": "음성군",
    "lat": 36.7154,
    "lng": 127.4981,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 100,
    "purchaseAmount": 300000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2023-11-02",
    "consultCount": 4,
    "lastConsultDate": "2022-10-17"
  },
  {
    "id": 212,
    "name": "한화큐셀 진천사업장 건강관리실",
    "type": "사업장",
    "region": "충청북도",
    "district": "진천군",
    "lat": 36.5089,
    "lng": 127.4274,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 150,
    "purchaseAmount": 450000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2023-11-02",
    "consultCount": 2,
    "lastConsultDate": "2024-04-26"
  },
  {
    "id": 213,
    "name": "김포시정신건강복지센터",
    "type": "전문기관",
    "region": "경기도",
    "district": "김포시",
    "lat": 37.3453,
    "lng": 127.4642,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 500,
    "purchaseAmount": 1050000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2023-10-31",
    "consultCount": 4,
    "lastConsultDate": "2025-01-20"
  },
  {
    "id": 214,
    "name": "유성여자고등학교",
    "type": "교육기관",
    "region": "경상북도",
    "district": "포항시",
    "lat": 36.5039,
    "lng": 128.7804,
    "products": [
      "노담패치",
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 270,
    "purchaseAmount": 501000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2023-10-27",
    "consultCount": 1,
    "lastConsultDate": "2023-10-27"
  },
  {
    "id": 215,
    "name": "함양군보건소",
    "type": "보건소",
    "region": "경상남도",
    "district": "함양군",
    "lat": 35.38,
    "lng": 128.2714,
    "products": [
      "노담패치",
      "알쓰패치"
    ],
    "purchaseCycle": "반기",
    "purchaseVolume": 9012,
    "purchaseAmount": 10280000,
    "purchaseStage": "만족",
    "lastPurchaseDate": "2023-10-25",
    "consultCount": 47,
    "lastConsultDate": "2023-10-25"
  },
  {
    "id": 216,
    "name": "달서구중독관리통합지원센터",
    "type": "전문기관",
    "region": "대구광역시",
    "district": "달서구",
    "lat": 35.9333,
    "lng": 128.4707,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "반기",
    "purchaseVolume": 600,
    "purchaseAmount": 1500000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2023-10-23",
    "consultCount": 2,
    "lastConsultDate": "2022-11-15"
  },
  {
    "id": 217,
    "name": "2601부대",
    "type": "군/경/소방",
    "region": "세종특별자치시",
    "district": "연서면",
    "lat": 36.4523,
    "lng": 127.0328,
    "products": [
      "노담패치",
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 640,
    "purchaseAmount": 1056000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2023-10-18",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 218,
    "name": "화순전남금연지원센터",
    "type": "금연지원센터",
    "region": "전라남도",
    "district": "화순군",
    "lat": 34.8931,
    "lng": 127.0497,
    "products": [
      "노담패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 500,
    "purchaseAmount": 1250000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2023-10-05",
    "consultCount": 4,
    "lastConsultDate": "2023-10-26"
  },
  {
    "id": 219,
    "name": "이화여대 약학대학",
    "type": "전공교육",
    "region": "서울특별시",
    "district": "서대문구",
    "lat": 37.5306,
    "lng": 126.8298,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 70,
    "purchaseAmount": 294000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2023-09-25",
    "consultCount": 3,
    "lastConsultDate": "2023-11-22"
  },
  {
    "id": 220,
    "name": "5733부대 60사단 의무대",
    "type": "군/경/소방",
    "region": "경기도",
    "district": "고양시",
    "lat": 37.5198,
    "lng": 127.6543,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 300,
    "purchaseAmount": 750000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2023-09-18",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 221,
    "name": "육군훈련소 지구병원",
    "type": "군/경/소방",
    "region": "충청남도",
    "district": "논산시",
    "lat": 36.4992,
    "lng": 126.6587,
    "products": [
      "노담패치",
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 1200,
    "purchaseAmount": 1680000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2023-09-06",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 222,
    "name": "영진전문대학",
    "type": "교육기관",
    "region": "대구광역시",
    "district": "북구",
    "lat": 35.8222,
    "lng": 128.6551,
    "products": [
      "노담패치",
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 800,
    "purchaseAmount": 1320000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2023-08-30",
    "consultCount": 1,
    "lastConsultDate": "2023-08-18"
  },
  {
    "id": 223,
    "name": "강원과학고등학교 보건실",
    "type": "교육기관",
    "region": "강원특별자치도",
    "district": "원주시",
    "lat": 37.7941,
    "lng": 128.055,
    "products": [
      "노담패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 135,
    "purchaseAmount": 486000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2023-08-30",
    "consultCount": 17,
    "lastConsultDate": "2023-09-19"
  },
  {
    "id": 224,
    "name": "부석중학교",
    "type": "교육기관",
    "region": "충청남도",
    "district": "서산시",
    "lat": 36.5551,
    "lng": 126.6581,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 71,
    "purchaseAmount": 172200,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2023-08-24",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 225,
    "name": "계명대학교",
    "type": "교육기관",
    "region": "대구광역시",
    "district": "달서구",
    "lat": 35.8396,
    "lng": 128.6207,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 400,
    "purchaseAmount": 1000000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2023-08-22",
    "consultCount": 4,
    "lastConsultDate": "2026-02-13"
  },
  {
    "id": 226,
    "name": "수도방위사령부",
    "type": "군/경/소방",
    "region": "서울특별시",
    "district": "관악구",
    "lat": 37.4572,
    "lng": 126.9665,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 302,
    "purchaseAmount": 750000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2023-08-10",
    "consultCount": 10,
    "lastConsultDate": "2023-11-29"
  },
  {
    "id": 227,
    "name": "익산시보건소",
    "type": "보건소",
    "region": "전북특별자치도",
    "district": "익산시",
    "lat": 35.7338,
    "lng": 127.057,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "반기",
    "purchaseVolume": 2500,
    "purchaseAmount": 2350000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2023-07-19",
    "consultCount": 13,
    "lastConsultDate": "2023-09-05"
  },
  {
    "id": 228,
    "name": "김포시보건소",
    "type": "보건소",
    "region": "경기도",
    "district": "김포시",
    "lat": 37.3395,
    "lng": 127.3929,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 400,
    "purchaseAmount": 1000000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2023-07-05",
    "consultCount": 32,
    "lastConsultDate": "2024-06-18"
  },
  {
    "id": 229,
    "name": "강동구보건소",
    "type": "보건소",
    "region": "서울특별시",
    "district": "강동구",
    "lat": 37.4223,
    "lng": 126.9898,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 500,
    "purchaseAmount": 1050000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2023-06-20",
    "consultCount": 23,
    "lastConsultDate": "2023-06-16"
  },
  {
    "id": 230,
    "name": "군포시정신건강복지센터",
    "type": "전문기관",
    "region": "경기도",
    "district": "군포시",
    "lat": 37.5638,
    "lng": 127.4733,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 45,
    "purchaseAmount": 189000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2023-06-14",
    "consultCount": 1,
    "lastConsultDate": "2023-06-14"
  },
  {
    "id": 231,
    "name": "전주대학교 의과학대학 행정실",
    "type": "전공교육",
    "region": "전북특별자치도",
    "district": "전주시",
    "lat": 35.8653,
    "lng": 127.1933,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 45,
    "purchaseAmount": 189000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2023-05-30",
    "consultCount": 3,
    "lastConsultDate": "2022-09-13"
  },
  {
    "id": 232,
    "name": "강원대병원 강원지역암센터",
    "type": "공공기관(기타)",
    "region": "강원특별자치도",
    "district": "춘천시",
    "lat": 37.8683,
    "lng": 128.2318,
    "products": [
      "노담패치",
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 2400,
    "purchaseAmount": 1680000,
    "purchaseStage": "만족",
    "lastPurchaseDate": "2023-05-24",
    "consultCount": 5,
    "lastConsultDate": "2023-11-29"
  },
  {
    "id": 233,
    "name": "이화여자대학교",
    "type": "교육기관",
    "region": "서울특별시",
    "district": "서대문구",
    "lat": 37.4226,
    "lng": 126.8737,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 150,
    "purchaseAmount": 450000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2023-05-18",
    "consultCount": 1,
    "lastConsultDate": "2011-10-04"
  },
  {
    "id": 234,
    "name": "목포대학교",
    "type": "교육기관",
    "region": "전라남도",
    "district": "무안군",
    "lat": 34.9277,
    "lng": 127.0711,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 300,
    "purchaseAmount": 750000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2023-05-12",
    "consultCount": 2,
    "lastConsultDate": "2023-05-11"
  },
  {
    "id": 235,
    "name": "군산고등학교",
    "type": "교육기관",
    "region": "전북특별자치도",
    "district": "군산시",
    "lat": 35.8947,
    "lng": 126.9933,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 202,
    "purchaseAmount": 330000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2023-05-09",
    "consultCount": 1,
    "lastConsultDate": "2023-05-09"
  },
  {
    "id": 236,
    "name": "대구광역정신건강복지센터",
    "type": "전문기관",
    "region": "대구광역시",
    "district": "동구",
    "lat": 35.7538,
    "lng": 128.4591,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 300,
    "purchaseAmount": 750000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2023-04-20",
    "consultCount": 1,
    "lastConsultDate": "2023-04-13"
  },
  {
    "id": 237,
    "name": "증평군보건소",
    "type": "보건소",
    "region": "충청북도",
    "district": "증평군",
    "lat": 36.7408,
    "lng": 127.5218,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 500,
    "purchaseAmount": 785000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2023-03-15",
    "consultCount": 2,
    "lastConsultDate": "2020-12-09"
  },
  {
    "id": 238,
    "name": "화순전남대학교병원",
    "type": "교육기관",
    "region": "전라남도",
    "district": "화순군",
    "lat": 34.9728,
    "lng": 127.0877,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "반기",
    "purchaseVolume": 700,
    "purchaseAmount": 1650000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2023-01-17",
    "consultCount": 9,
    "lastConsultDate": "2023-08-04"
  },
  {
    "id": 239,
    "name": "울산중구중독관리통합지원센터",
    "type": "전문기관",
    "region": "울산광역시",
    "district": "중구",
    "lat": 35.6006,
    "lng": 129.292,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 500,
    "purchaseAmount": 1050000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2022-12-12",
    "consultCount": 16,
    "lastConsultDate": "2023-10-13"
  },
  {
    "id": 240,
    "name": "오산시보건소",
    "type": "보건소",
    "region": "경기도",
    "district": "오산시",
    "lat": 37.4839,
    "lng": 127.6579,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 500,
    "purchaseAmount": 1050000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2022-11-28",
    "consultCount": 26,
    "lastConsultDate": "2022-11-21"
  },
  {
    "id": 241,
    "name": "전주대학교",
    "type": "전공교육",
    "region": "전북특별자치도",
    "district": "전주시",
    "lat": 35.8318,
    "lng": 127.1039,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 50,
    "purchaseAmount": 210000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2022-11-15",
    "consultCount": 1,
    "lastConsultDate": "2023-05-15"
  },
  {
    "id": 242,
    "name": "봉화군정신건강복지센터",
    "type": "전문기관",
    "region": "경상북도",
    "district": "봉화군",
    "lat": 36.4726,
    "lng": 128.9582,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 50,
    "purchaseAmount": 210000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2022-11-15",
    "consultCount": 4,
    "lastConsultDate": "2022-11-15"
  },
  {
    "id": 243,
    "name": "세종특별자치시광역정신건강복지센터",
    "type": "전문기관",
    "region": "세종특별자치시",
    "district": "새롬로",
    "lat": 36.4105,
    "lng": 127.1255,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 300,
    "purchaseAmount": 750000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2022-11-14",
    "consultCount": 3,
    "lastConsultDate": "2022-11-10"
  },
  {
    "id": 244,
    "name": "김제고등학교 보건실",
    "type": "교육기관",
    "region": "전북특별자치도",
    "district": "김제시",
    "lat": 35.9195,
    "lng": 126.9849,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 222,
    "purchaseAmount": 330000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2022-11-14",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 245,
    "name": "장흥군정신건강복지센터",
    "type": "전문기관",
    "region": "전라남도",
    "district": "장흥군",
    "lat": 34.9824,
    "lng": 126.9142,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 300,
    "purchaseAmount": 750000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2022-11-14",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 246,
    "name": "제8기동사단 의무대",
    "type": "군/경/소방",
    "region": "경기도",
    "district": "양주시",
    "lat": 37.3775,
    "lng": 127.3769,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 300,
    "purchaseAmount": 750000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2022-11-07",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 247,
    "name": "국군홍천병원",
    "type": "군/경/소방",
    "region": "강원특별자치도",
    "district": "홍천군",
    "lat": 37.7749,
    "lng": 128.2696,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 702,
    "purchaseAmount": 710000,
    "purchaseStage": "만족",
    "lastPurchaseDate": "2022-10-28",
    "consultCount": 5,
    "lastConsultDate": "2022-10-24"
  },
  {
    "id": 248,
    "name": "60사단 군사경찰대대",
    "type": "군/경/소방",
    "region": "경기도",
    "district": "고양시",
    "lat": 37.2668,
    "lng": 127.6527,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "월간",
    "purchaseVolume": 177,
    "purchaseAmount": 371400,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2022-10-27",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 249,
    "name": "광주시보건소",
    "type": "보건소",
    "region": "경기도",
    "district": "광주시",
    "lat": 37.2895,
    "lng": 127.5843,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 602,
    "purchaseAmount": 780000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2022-10-27",
    "consultCount": 68,
    "lastConsultDate": "2026-02-10"
  },
  {
    "id": 250,
    "name": "대구달서구보건소",
    "type": "보건소",
    "region": "대구광역시",
    "district": "달서구",
    "lat": 35.868,
    "lng": 128.6788,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 1002,
    "purchaseAmount": 1080000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2022-10-20",
    "consultCount": 3,
    "lastConsultDate": "2023-04-07"
  },
  {
    "id": 251,
    "name": "화천군보건의료원",
    "type": "보건소",
    "region": "강원특별자치도",
    "district": "화천군",
    "lat": 37.82,
    "lng": 128.2434,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "월간",
    "purchaseVolume": 2000,
    "purchaseAmount": 3560000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2022-10-07",
    "consultCount": 43,
    "lastConsultDate": "2022-09-30"
  },
  {
    "id": 252,
    "name": "성주군보건소",
    "type": "보건소",
    "region": "경상북도",
    "district": "성주군",
    "lat": 36.5494,
    "lng": 128.8308,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 50,
    "purchaseAmount": 150000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2022-10-04",
    "consultCount": 27,
    "lastConsultDate": "2022-10-04"
  },
  {
    "id": 253,
    "name": "국립부곡병원 중독진단과",
    "type": "군/경/소방",
    "region": "경상남도",
    "district": "창녕군",
    "lat": 35.4851,
    "lng": 128.2052,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 1000,
    "purchaseAmount": 2100000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2022-10-04",
    "consultCount": 1,
    "lastConsultDate": "2023-12-14"
  },
  {
    "id": 254,
    "name": "인천중구보건소",
    "type": "보건소",
    "region": "인천광역시",
    "district": "중구",
    "lat": 37.5172,
    "lng": 126.6365,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 1506,
    "purchaseAmount": 867500,
    "purchaseStage": "만족",
    "lastPurchaseDate": "2022-09-22",
    "consultCount": 16,
    "lastConsultDate": "2023-09-18"
  },
  {
    "id": 255,
    "name": "60사단",
    "type": "군/경/소방",
    "region": "경기도",
    "district": "고양시",
    "lat": 37.3193,
    "lng": 127.4332,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 602,
    "purchaseAmount": 830000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2022-08-29",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 256,
    "name": "제주서귀포시보건소",
    "type": "보건소",
    "region": "제주특별자치도",
    "district": "서귀포시",
    "lat": 33.4843,
    "lng": 126.5657,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 2721,
    "purchaseAmount": 2010500,
    "purchaseStage": "만족",
    "lastPurchaseDate": "2022-08-16",
    "consultCount": 26,
    "lastConsultDate": "2022-11-03"
  },
  {
    "id": 257,
    "name": "사천시보건소",
    "type": "보건소",
    "region": "경상남도",
    "district": "사천시",
    "lat": 35.6036,
    "lng": 128.2206,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 950,
    "purchaseAmount": 1995000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2022-08-10",
    "consultCount": 35,
    "lastConsultDate": "2025-09-10"
  },
  {
    "id": 258,
    "name": "국군고양병원",
    "type": "군/경/소방",
    "region": "경기도",
    "district": "파주시",
    "lat": 37.3487,
    "lng": 127.3985,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 200,
    "purchaseAmount": 600000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2022-07-29",
    "consultCount": 4,
    "lastConsultDate": "2024-05-01"
  },
  {
    "id": 259,
    "name": "시흥시보건소",
    "type": "보건소",
    "region": "경기도",
    "district": "시흥시",
    "lat": 37.322,
    "lng": 127.4365,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 800,
    "purchaseAmount": 1256000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2022-07-28",
    "consultCount": 43,
    "lastConsultDate": "2023-07-21"
  },
  {
    "id": 260,
    "name": "군산시중독관리통합지원센터",
    "type": "전문기관",
    "region": "전북특별자치도",
    "district": "군산시",
    "lat": 36.4038,
    "lng": 127.3542,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 1002,
    "purchaseAmount": 880000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2022-07-27",
    "consultCount": 1,
    "lastConsultDate": "2018-11-19"
  },
  {
    "id": 261,
    "name": "옹진군정신건강복지센터",
    "type": "전문기관",
    "region": "인천광역시",
    "district": "옹진군",
    "lat": 37.4665,
    "lng": 126.6375,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 500,
    "purchaseAmount": 1050000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2022-06-08",
    "consultCount": 2,
    "lastConsultDate": "2024-04-25"
  },
  {
    "id": 262,
    "name": "대구동부중독관리통합지원센터",
    "type": "전문기관",
    "region": "대구광역시",
    "district": "동구",
    "lat": 36.0137,
    "lng": 128.6174,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 100,
    "purchaseAmount": 300000,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2022-05-27",
    "consultCount": 1,
    "lastConsultDate": "2021-11-19"
  },
  {
    "id": 263,
    "name": "완주군정신건강복지센터",
    "type": "전문기관",
    "region": "전북특별자치도",
    "district": "완주군",
    "lat": 35.9308,
    "lng": 127.1062,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "단건",
    "purchaseVolume": 810,
    "purchaseAmount": 1247400,
    "purchaseStage": "구매",
    "lastPurchaseDate": "2022-05-03",
    "consultCount": 6,
    "lastConsultDate": "2017-02-24"
  },
  {
    "id": 264,
    "name": "강릉시보건소",
    "type": "보건소",
    "region": "강원특별자치도",
    "district": "강릉시",
    "lat": 37.712,
    "lng": 128.823,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 29,
    "lastConsultDate": "2023-01-10"
  },
  {
    "id": 265,
    "name": "고성군보건소",
    "type": "보건소",
    "region": "강원특별자치도",
    "district": "고성군",
    "lat": 38.3701,
    "lng": 128.397,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 17,
    "lastConsultDate": "2018-08-08"
  },
  {
    "id": 266,
    "name": "동해시보건소",
    "type": "보건소",
    "region": "강원특별자치도",
    "district": "동해시",
    "lat": 37.5117,
    "lng": 129.0593,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 2,
    "lastConsultDate": "2019-03-06"
  },
  {
    "id": 267,
    "name": "삼척시보건소",
    "type": "보건소",
    "region": "강원특별자치도",
    "district": "삼척시",
    "lat": 37.2853,
    "lng": 129.1138,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 11,
    "lastConsultDate": "2023-10-27"
  },
  {
    "id": 268,
    "name": "속초시보건소",
    "type": "보건소",
    "region": "강원특별자치도",
    "district": "속초시",
    "lat": 38.1745,
    "lng": 128.5102,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "관심",
    "lastPurchaseDate": "-",
    "consultCount": 10,
    "lastConsultDate": "2015-03-11"
  },
  {
    "id": 269,
    "name": "양구군보건소",
    "type": "보건소",
    "region": "강원특별자치도",
    "district": "양구군",
    "lat": 38.1721,
    "lng": 128.0012,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 2,
    "lastConsultDate": "2019-09-11"
  },
  {
    "id": 270,
    "name": "양양군보건소",
    "type": "보건소",
    "region": "강원특별자치도",
    "district": "양양군",
    "lat": 37.9951,
    "lng": 128.5894,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 5,
    "lastConsultDate": "2020-01-09"
  },
  {
    "id": 271,
    "name": "영월군보건소",
    "type": "보건소",
    "region": "강원특별자치도",
    "district": "영월군",
    "lat": 37.207,
    "lng": 128.5011,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 63,
    "lastConsultDate": "2024-05-20"
  },
  {
    "id": 272,
    "name": "인제군보건소",
    "type": "보건소",
    "region": "강원특별자치도",
    "district": "인제군",
    "lat": 38.0622,
    "lng": 128.2655,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 5,
    "lastConsultDate": "2020-04-03"
  },
  {
    "id": 273,
    "name": "철원군보건소",
    "type": "보건소",
    "region": "강원특별자치도",
    "district": "철원군",
    "lat": 38.247,
    "lng": 127.4005,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 32,
    "lastConsultDate": "2023-03-29"
  },
  {
    "id": 274,
    "name": "평창군보건소",
    "type": "보건소",
    "region": "강원특별자치도",
    "district": "평창군",
    "lat": 37.5631,
    "lng": 128.4868,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 39,
    "lastConsultDate": "2018-10-31"
  },
  {
    "id": 275,
    "name": "홍천군보건소",
    "type": "보건소",
    "region": "강원특별자치도",
    "district": "홍천군",
    "lat": 37.7416,
    "lng": 128.0675,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 59,
    "lastConsultDate": "2023-02-16"
  },
  {
    "id": 276,
    "name": "가평군보건소",
    "type": "보건소",
    "region": "경기도",
    "district": "가평군",
    "lat": 37.8277,
    "lng": 127.4469,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 14,
    "lastConsultDate": "2024-09-25"
  },
  {
    "id": 277,
    "name": "과천시보건소",
    "type": "보건소",
    "region": "경기도",
    "district": "과천시",
    "lat": 37.4258,
    "lng": 126.9946,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 16,
    "lastConsultDate": "2025-11-06"
  },
  {
    "id": 278,
    "name": "광명시보건소",
    "type": "보건소",
    "region": "경기도",
    "district": "광명시",
    "lat": 37.4522,
    "lng": 126.8669,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 62,
    "lastConsultDate": "2019-09-10"
  },
  {
    "id": 279,
    "name": "구리시보건소",
    "type": "보건소",
    "region": "경기도",
    "district": "구리시",
    "lat": 37.6051,
    "lng": 127.1359,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 9,
    "lastConsultDate": "2020-12-23"
  },
  {
    "id": 280,
    "name": "동두천시보건소",
    "type": "보건소",
    "region": "경기도",
    "district": "동두천시",
    "lat": 37.9173,
    "lng": 127.0874,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 7,
    "lastConsultDate": "2023-04-24"
  },
  {
    "id": 281,
    "name": "부천시보건소",
    "type": "보건소",
    "region": "경기도",
    "district": "부천시",
    "lat": 37.5018,
    "lng": 126.7898,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 8,
    "lastConsultDate": "2023-07-24"
  },
  {
    "id": 282,
    "name": "성남시보건소",
    "type": "보건소",
    "region": "경기도",
    "district": "성남시",
    "lat": 37.414,
    "lng": 127.1187,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "관심",
    "lastPurchaseDate": "-",
    "consultCount": 1,
    "lastConsultDate": "2018-02-09"
  },
  {
    "id": 283,
    "name": "수원시보건소",
    "type": "보건소",
    "region": "경기도",
    "district": "수원시",
    "lat": 37.2876,
    "lng": 127.0092,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 11,
    "lastConsultDate": "2022-04-12"
  },
  {
    "id": 284,
    "name": "안산시보건소",
    "type": "보건소",
    "region": "경기도",
    "district": "안산시",
    "lat": 37.2951,
    "lng": 126.7384,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 6,
    "lastConsultDate": "2024-03-22"
  },
  {
    "id": 285,
    "name": "안성시보건소",
    "type": "보건소",
    "region": "경기도",
    "district": "안성시",
    "lat": 37.0296,
    "lng": 127.2987,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 55,
    "lastConsultDate": "2024-04-25"
  },
  {
    "id": 286,
    "name": "안양시보건소",
    "type": "보건소",
    "region": "경기도",
    "district": "안양시",
    "lat": 37.3943,
    "lng": 126.9226,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 4,
    "lastConsultDate": "2015-06-17"
  },
  {
    "id": 287,
    "name": "양주시보건소",
    "type": "보건소",
    "region": "경기도",
    "district": "양주시",
    "lat": 37.8006,
    "lng": 126.9968,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 9,
    "lastConsultDate": "2022-12-14"
  },
  {
    "id": 288,
    "name": "여주시보건소",
    "type": "보건소",
    "region": "경기도",
    "district": "여주시",
    "lat": 37.3052,
    "lng": 127.6131,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 78,
    "lastConsultDate": "2025-05-26"
  },
  {
    "id": 289,
    "name": "연천군보건소",
    "type": "보건소",
    "region": "경기도",
    "district": "연천군",
    "lat": 38.0936,
    "lng": 127.0247,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 2,
    "lastConsultDate": "2015-12-17"
  },
  {
    "id": 290,
    "name": "의왕시보건소",
    "type": "보건소",
    "region": "경기도",
    "district": "의왕시",
    "lat": 37.3578,
    "lng": 126.9984,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 66,
    "lastConsultDate": "2019-03-14"
  },
  {
    "id": 291,
    "name": "의정부시보건소",
    "type": "보건소",
    "region": "경기도",
    "district": "의정부시",
    "lat": 37.7392,
    "lng": 127.0705,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 7,
    "lastConsultDate": "2024-11-04"
  },
  {
    "id": 292,
    "name": "파주시보건소",
    "type": "보건소",
    "region": "경기도",
    "district": "파주시",
    "lat": 37.845,
    "lng": 126.8197,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 13,
    "lastConsultDate": "2022-09-21"
  },
  {
    "id": 293,
    "name": "평택시보건소",
    "type": "보건소",
    "region": "경기도",
    "district": "평택시",
    "lat": 37.0088,
    "lng": 126.9909,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 15,
    "lastConsultDate": "2022-09-20"
  },
  {
    "id": 294,
    "name": "포천시보건소",
    "type": "보건소",
    "region": "경기도",
    "district": "포천시",
    "lat": 37.9797,
    "lng": 127.2532,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 7,
    "lastConsultDate": "2019-03-25"
  },
  {
    "id": 295,
    "name": "하남시보건소",
    "type": "보건소",
    "region": "경기도",
    "district": "하남시",
    "lat": 37.524,
    "lng": 127.2097,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 8,
    "lastConsultDate": "2023-07-27"
  },
  {
    "id": 296,
    "name": "화성시보건소",
    "type": "보건소",
    "region": "경기도",
    "district": "화성시",
    "lat": 37.1745,
    "lng": 126.8743,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 79,
    "lastConsultDate": "2024-08-21"
  },
  {
    "id": 297,
    "name": "거제시보건소",
    "type": "보건소",
    "region": "경상남도",
    "district": "거제시",
    "lat": 34.8648,
    "lng": 128.614,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 22,
    "lastConsultDate": "2021-11-23"
  },
  {
    "id": 298,
    "name": "거창군보건소",
    "type": "보건소",
    "region": "경상남도",
    "district": "거창군",
    "lat": 35.7289,
    "lng": 127.8995,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 34,
    "lastConsultDate": "2019-10-28"
  },
  {
    "id": 299,
    "name": "고성군보건소",
    "type": "보건소",
    "region": "경상남도",
    "district": "고성군",
    "lat": 35.0102,
    "lng": 128.2993,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 17,
    "lastConsultDate": "2018-08-08"
  },
  {
    "id": 300,
    "name": "밀양시보건소",
    "type": "보건소",
    "region": "경상남도",
    "district": "밀양시",
    "lat": 35.5061,
    "lng": 128.7859,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 18,
    "lastConsultDate": "2019-10-04"
  },
  {
    "id": 301,
    "name": "산청군보건소",
    "type": "보건소",
    "region": "경상남도",
    "district": "산청군",
    "lat": 35.3717,
    "lng": 127.8822,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 302,
    "name": "양산시보건소",
    "type": "보건소",
    "region": "경상남도",
    "district": "양산시",
    "lat": 35.4101,
    "lng": 129.0402,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 31,
    "lastConsultDate": "2020-02-19"
  },
  {
    "id": 303,
    "name": "의령군보건소",
    "type": "보건소",
    "region": "경상남도",
    "district": "의령군",
    "lat": 35.3877,
    "lng": 128.2721,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 25,
    "lastConsultDate": "2020-04-27"
  },
  {
    "id": 304,
    "name": "창녕군보건소",
    "type": "보건소",
    "region": "경상남도",
    "district": "창녕군",
    "lat": 35.5096,
    "lng": 128.4883,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 27,
    "lastConsultDate": "2023-01-31"
  },
  {
    "id": 305,
    "name": "창원시보건소",
    "type": "보건소",
    "region": "경상남도",
    "district": "창원시",
    "lat": 35.2034,
    "lng": 128.608,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 3,
    "lastConsultDate": "2019-05-30"
  },
  {
    "id": 306,
    "name": "하동군보건소",
    "type": "보건소",
    "region": "경상남도",
    "district": "하동군",
    "lat": 35.1353,
    "lng": 127.7735,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "관심",
    "lastPurchaseDate": "-",
    "consultCount": 8,
    "lastConsultDate": "2014-06-26"
  },
  {
    "id": 307,
    "name": "함안군보건소",
    "type": "보건소",
    "region": "경상남도",
    "district": "함안군",
    "lat": 35.301,
    "lng": 128.4311,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 4,
    "lastConsultDate": "2021-10-20"
  },
  {
    "id": 308,
    "name": "합천군보건소",
    "type": "보건소",
    "region": "경상남도",
    "district": "합천군",
    "lat": 35.5685,
    "lng": 128.1325,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 8,
    "lastConsultDate": "2020-07-20"
  },
  {
    "id": 309,
    "name": "경산시보건소",
    "type": "보건소",
    "region": "경상북도",
    "district": "경산시",
    "lat": 35.8262,
    "lng": 128.8116,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 8,
    "lastConsultDate": "2024-07-31"
  },
  {
    "id": 310,
    "name": "고령군보건소",
    "type": "보건소",
    "region": "경상북도",
    "district": "고령군",
    "lat": 35.7431,
    "lng": 128.3053,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 4,
    "lastConsultDate": "2020-01-06"
  },
  {
    "id": 311,
    "name": "군위군보건소",
    "type": "보건소",
    "region": "경상북도",
    "district": "군위군",
    "lat": 36.1615,
    "lng": 128.6455,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "관심",
    "lastPurchaseDate": "-",
    "consultCount": 6,
    "lastConsultDate": "2012-03-15"
  },
  {
    "id": 312,
    "name": "김천시보건소",
    "type": "보건소",
    "region": "경상북도",
    "district": "김천시",
    "lat": 36.0704,
    "lng": 128.0784,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 9,
    "lastConsultDate": "2023-09-12"
  },
  {
    "id": 313,
    "name": "문경시보건소",
    "type": "보건소",
    "region": "경상북도",
    "district": "문경시",
    "lat": 36.7001,
    "lng": 128.156,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 39,
    "lastConsultDate": "2019-03-04"
  },
  {
    "id": 314,
    "name": "봉화군보건소",
    "type": "보건소",
    "region": "경상북도",
    "district": "봉화군",
    "lat": 36.9244,
    "lng": 128.9173,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 8,
    "lastConsultDate": "2014-12-17"
  },
  {
    "id": 315,
    "name": "상주시보건소",
    "type": "보건소",
    "region": "경상북도",
    "district": "상주시",
    "lat": 36.4332,
    "lng": 128.0676,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 7,
    "lastConsultDate": "2021-08-19"
  },
  {
    "id": 316,
    "name": "영덕군보건소",
    "type": "보건소",
    "region": "경상북도",
    "district": "영덕군",
    "lat": 36.4778,
    "lng": 129.3204,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 8,
    "lastConsultDate": "2019-06-03"
  },
  {
    "id": 317,
    "name": "영양군보건소",
    "type": "보건소",
    "region": "경상북도",
    "district": "영양군",
    "lat": 36.6887,
    "lng": 129.1437,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 20,
    "lastConsultDate": "2023-04-20"
  },
  {
    "id": 318,
    "name": "영천시보건소",
    "type": "보건소",
    "region": "경상북도",
    "district": "영천시",
    "lat": 36.015,
    "lng": 128.9516,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 18,
    "lastConsultDate": "2019-04-04"
  },
  {
    "id": 319,
    "name": "예천군보건소",
    "type": "보건소",
    "region": "경상북도",
    "district": "예천군",
    "lat": 36.6615,
    "lng": 128.4178,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 19,
    "lastConsultDate": "2019-05-31"
  },
  {
    "id": 320,
    "name": "울진군보건소",
    "type": "보건소",
    "region": "경상북도",
    "district": "울진군",
    "lat": 36.9041,
    "lng": 129.3061,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 56,
    "lastConsultDate": "2021-03-05"
  },
  {
    "id": 321,
    "name": "의성군보건소",
    "type": "보건소",
    "region": "경상북도",
    "district": "의성군",
    "lat": 36.3703,
    "lng": 128.6225,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 6,
    "lastConsultDate": "2016-05-26"
  },
  {
    "id": 322,
    "name": "청도군보건소",
    "type": "보건소",
    "region": "경상북도",
    "district": "청도군",
    "lat": 35.6689,
    "lng": 128.7893,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 24,
    "lastConsultDate": "2019-06-11"
  },
  {
    "id": 323,
    "name": "청송군보건소",
    "type": "보건소",
    "region": "경상북도",
    "district": "청송군",
    "lat": 36.3593,
    "lng": 129.0505,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 62,
    "lastConsultDate": "2021-11-08"
  },
  {
    "id": 324,
    "name": "칠곡군보건소",
    "type": "보건소",
    "region": "경상북도",
    "district": "칠곡군",
    "lat": 36.0207,
    "lng": 128.4634,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 19,
    "lastConsultDate": "2022-11-03"
  },
  {
    "id": 325,
    "name": "동구보건소",
    "type": "보건소",
    "region": "광주광역시",
    "district": "동구",
    "lat": 35.1226,
    "lng": 126.9501,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 9,
    "lastConsultDate": "2018-04-23"
  },
  {
    "id": 326,
    "name": "동구보건소",
    "type": "보건소",
    "region": "대구광역시",
    "district": "동구",
    "lat": 35.9245,
    "lng": 128.6822,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 9,
    "lastConsultDate": "2018-04-23"
  },
  {
    "id": 327,
    "name": "서구보건소",
    "type": "보건소",
    "region": "대구광역시",
    "district": "서구",
    "lat": 35.8654,
    "lng": 128.5582,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 9,
    "lastConsultDate": "2021-11-08"
  },
  {
    "id": 328,
    "name": "대덕구보건소",
    "type": "보건소",
    "region": "대전광역시",
    "district": "대덕구",
    "lat": 36.4199,
    "lng": 127.4467,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 7,
    "lastConsultDate": "2017-05-24"
  },
  {
    "id": 329,
    "name": "동구보건소",
    "type": "보건소",
    "region": "대전광역시",
    "district": "동구",
    "lat": 36.3203,
    "lng": 127.4663,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 9,
    "lastConsultDate": "2018-04-23"
  },
  {
    "id": 330,
    "name": "서구보건소",
    "type": "보건소",
    "region": "대전광역시",
    "district": "서구",
    "lat": 36.288,
    "lng": 127.3541,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 9,
    "lastConsultDate": "2021-11-08"
  },
  {
    "id": 331,
    "name": "유성구보건소",
    "type": "보건소",
    "region": "대전광역시",
    "district": "유성구",
    "lat": 36.3686,
    "lng": 127.333,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 1,
    "lastConsultDate": "2020-10-27"
  },
  {
    "id": 332,
    "name": "강서구보건소",
    "type": "보건소",
    "region": "부산광역시",
    "district": "강서구",
    "lat": 35.1283,
    "lng": 128.8967,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 10,
    "lastConsultDate": "2022-08-17"
  },
  {
    "id": 333,
    "name": "금정구보건소",
    "type": "보건소",
    "region": "부산광역시",
    "district": "금정구",
    "lat": 35.2642,
    "lng": 129.0842,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 6,
    "lastConsultDate": "2021-11-23"
  },
  {
    "id": 334,
    "name": "남구보건소",
    "type": "보건소",
    "region": "부산광역시",
    "district": "남구",
    "lat": 35.1249,
    "lng": 129.0954,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 10,
    "lastConsultDate": "2015-11-19"
  },
  {
    "id": 335,
    "name": "동구보건소",
    "type": "보건소",
    "region": "부산광역시",
    "district": "동구",
    "lat": 35.1237,
    "lng": 129.0519,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 9,
    "lastConsultDate": "2018-04-23"
  },
  {
    "id": 336,
    "name": "동래구보건소",
    "type": "보건소",
    "region": "부산광역시",
    "district": "동래구",
    "lat": 35.2047,
    "lng": 129.0733,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 1,
    "lastConsultDate": "2021-10-08"
  },
  {
    "id": 337,
    "name": "부산진구보건소",
    "type": "보건소",
    "region": "부산광역시",
    "district": "부산진구",
    "lat": 35.1663,
    "lng": 129.0491,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 8,
    "lastConsultDate": "2020-09-17"
  },
  {
    "id": 338,
    "name": "북구보건소",
    "type": "보건소",
    "region": "부산광역시",
    "district": "북구",
    "lat": 35.2232,
    "lng": 129.0195,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 13,
    "lastConsultDate": "2024-08-27"
  },
  {
    "id": 339,
    "name": "사상구보건소",
    "type": "보건소",
    "region": "부산광역시",
    "district": "사상구",
    "lat": 35.1678,
    "lng": 128.9896,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 5,
    "lastConsultDate": "2019-08-28"
  },
  {
    "id": 340,
    "name": "사하구보건소",
    "type": "보건소",
    "region": "부산광역시",
    "district": "사하구",
    "lat": 35.0849,
    "lng": 128.971,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 4,
    "lastConsultDate": "2022-12-07"
  },
  {
    "id": 341,
    "name": "서구보건소",
    "type": "보건소",
    "region": "부산광역시",
    "district": "서구",
    "lat": 35.095,
    "lng": 129.0094,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 9,
    "lastConsultDate": "2021-11-08"
  },
  {
    "id": 342,
    "name": "수영구보건소",
    "type": "보건소",
    "region": "부산광역시",
    "district": "수영구",
    "lat": 35.158,
    "lng": 129.1128,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 7,
    "lastConsultDate": "2025-09-12"
  },
  {
    "id": 343,
    "name": "연제구보건소",
    "type": "보건소",
    "region": "부산광역시",
    "district": "연제구",
    "lat": 35.178,
    "lng": 129.0778,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "관심",
    "lastPurchaseDate": "-",
    "consultCount": 1,
    "lastConsultDate": "2011-08-18"
  },
  {
    "id": 344,
    "name": "영도구보건소",
    "type": "보건소",
    "region": "부산광역시",
    "district": "영도구",
    "lat": 35.07,
    "lng": 129.0674,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 6,
    "lastConsultDate": "2020-09-25"
  },
  {
    "id": 345,
    "name": "중구보건소",
    "type": "보건소",
    "region": "부산광역시",
    "district": "중구",
    "lat": 35.1001,
    "lng": 129.0402,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 31,
    "lastConsultDate": "2025-11-18"
  },
  {
    "id": 346,
    "name": "해운대구보건소",
    "type": "보건소",
    "region": "부산광역시",
    "district": "해운대구",
    "lat": 35.2008,
    "lng": 129.1451,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 15,
    "lastConsultDate": "2025-10-23"
  },
  {
    "id": 347,
    "name": "강서구보건소",
    "type": "보건소",
    "region": "서울특별시",
    "district": "강서구",
    "lat": 37.5559,
    "lng": 126.8262,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 10,
    "lastConsultDate": "2022-08-17"
  },
  {
    "id": 348,
    "name": "관악구보건소",
    "type": "보건소",
    "region": "서울특별시",
    "district": "관악구",
    "lat": 37.4616,
    "lng": 126.9379,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 48,
    "lastConsultDate": "2026-02-11"
  },
  {
    "id": 349,
    "name": "구로구보건소",
    "type": "보건소",
    "region": "서울특별시",
    "district": "구로구",
    "lat": 37.5031,
    "lng": 126.8579,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 15,
    "lastConsultDate": "2023-08-03"
  },
  {
    "id": 350,
    "name": "금천구보건소",
    "type": "보건소",
    "region": "서울특별시",
    "district": "금천구",
    "lat": 37.4598,
    "lng": 126.9068,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 13,
    "lastConsultDate": "2021-04-06"
  },
  {
    "id": 351,
    "name": "노원구보건소",
    "type": "보건소",
    "region": "서울특별시",
    "district": "노원구",
    "lat": 37.6586,
    "lng": 127.0689,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 8,
    "lastConsultDate": "2024-05-08"
  },
  {
    "id": 352,
    "name": "도봉구보건소",
    "type": "보건소",
    "region": "서울특별시",
    "district": "도봉구",
    "lat": 37.6612,
    "lng": 127.0311,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 64,
    "lastConsultDate": "2024-05-02"
  },
  {
    "id": 353,
    "name": "동작구보건소",
    "type": "보건소",
    "region": "서울특별시",
    "district": "동작구",
    "lat": 37.4973,
    "lng": 126.9511,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 17,
    "lastConsultDate": "2019-12-18"
  },
  {
    "id": 354,
    "name": "성북구보건소",
    "type": "보건소",
    "region": "서울특별시",
    "district": "성북구",
    "lat": 37.6103,
    "lng": 127.0208,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 42,
    "lastConsultDate": "2024-03-29"
  },
  {
    "id": 355,
    "name": "은평구보건소",
    "type": "보건소",
    "region": "서울특별시",
    "district": "은평구",
    "lat": 37.6287,
    "lng": 126.9191,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 13,
    "lastConsultDate": "2022-09-22"
  },
  {
    "id": 356,
    "name": "중랑구보건소",
    "type": "보건소",
    "region": "서울특별시",
    "district": "중랑구",
    "lat": 37.5958,
    "lng": 127.0897,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 8,
    "lastConsultDate": "2022-08-04"
  },
  {
    "id": 357,
    "name": "세종시보건소",
    "type": "보건소",
    "region": "세종특별자치시",
    "district": "세종시",
    "lat": 36.5679,
    "lng": 127.2537,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 9,
    "lastConsultDate": "2024-02-14"
  },
  {
    "id": 358,
    "name": "동구보건소",
    "type": "보건소",
    "region": "울산광역시",
    "district": "동구",
    "lat": 35.5192,
    "lng": 129.4252,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 9,
    "lastConsultDate": "2018-04-23"
  },
  {
    "id": 359,
    "name": "북구보건소",
    "type": "보건소",
    "region": "울산광역시",
    "district": "북구",
    "lat": 35.6085,
    "lng": 129.3756,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 13,
    "lastConsultDate": "2024-08-27"
  },
  {
    "id": 360,
    "name": "중구보건소",
    "type": "보건소",
    "region": "울산광역시",
    "district": "중구",
    "lat": 35.5661,
    "lng": 129.3167,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 31,
    "lastConsultDate": "2025-11-18"
  },
  {
    "id": 361,
    "name": "강화군보건소",
    "type": "보건소",
    "region": "인천광역시",
    "district": "강화군",
    "lat": 37.7115,
    "lng": 126.4096,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 49,
    "lastConsultDate": "2021-06-11"
  },
  {
    "id": 362,
    "name": "계양구보건소",
    "type": "보건소",
    "region": "인천광역시",
    "district": "계양구",
    "lat": 37.5583,
    "lng": 126.7257,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 3,
    "lastConsultDate": "2020-07-22"
  },
  {
    "id": 363,
    "name": "남동구보건소",
    "type": "보건소",
    "region": "인천광역시",
    "district": "남동구",
    "lat": 37.4409,
    "lng": 126.7332,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 19,
    "lastConsultDate": "2021-10-28"
  },
  {
    "id": 364,
    "name": "동구보건소",
    "type": "보건소",
    "region": "인천광역시",
    "district": "동구",
    "lat": 37.4926,
    "lng": 126.6478,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 9,
    "lastConsultDate": "2018-04-23"
  },
  {
    "id": 365,
    "name": "미추홀구보건소",
    "type": "보건소",
    "region": "인천광역시",
    "district": "미추홀구",
    "lat": 37.4596,
    "lng": 126.658,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 366,
    "name": "부평구보건소",
    "type": "보건소",
    "region": "인천광역시",
    "district": "부평구",
    "lat": 37.4963,
    "lng": 126.7154,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 8,
    "lastConsultDate": "2022-11-18"
  },
  {
    "id": 367,
    "name": "서구보건소",
    "type": "보건소",
    "region": "인천광역시",
    "district": "서구",
    "lat": 37.5576,
    "lng": 126.643,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 9,
    "lastConsultDate": "2021-11-08"
  },
  {
    "id": 368,
    "name": "연수구보건소",
    "type": "보건소",
    "region": "인천광역시",
    "district": "연수구",
    "lat": 37.392,
    "lng": 126.6579,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 7,
    "lastConsultDate": "2015-11-16"
  },
  {
    "id": 369,
    "name": "고흥군보건소",
    "type": "보건소",
    "region": "전라남도",
    "district": "고흥군",
    "lat": 34.5935,
    "lng": 127.3205,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 7,
    "lastConsultDate": "2021-03-08"
  },
  {
    "id": 370,
    "name": "곡성군보건소",
    "type": "보건소",
    "region": "전라남도",
    "district": "곡성군",
    "lat": 35.2157,
    "lng": 127.2621,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 6,
    "lastConsultDate": "2019-01-22"
  },
  {
    "id": 371,
    "name": "광양시보건소",
    "type": "보건소",
    "region": "전라남도",
    "district": "광양시",
    "lat": 35.0291,
    "lng": 127.6651,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 3,
    "lastConsultDate": "2024-04-03"
  },
  {
    "id": 372,
    "name": "구례군보건소",
    "type": "보건소",
    "region": "전라남도",
    "district": "구례군",
    "lat": 35.2379,
    "lng": 127.5075,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "관심",
    "lastPurchaseDate": "-",
    "consultCount": 7,
    "lastConsultDate": "2014-03-28"
  },
  {
    "id": 373,
    "name": "나주시보건소",
    "type": "보건소",
    "region": "전라남도",
    "district": "나주시",
    "lat": 34.9817,
    "lng": 126.7163,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 4,
    "lastConsultDate": "2021-05-27"
  },
  {
    "id": 374,
    "name": "담양군보건소",
    "type": "보건소",
    "region": "전라남도",
    "district": "담양군",
    "lat": 35.3009,
    "lng": 126.9968,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 4,
    "lastConsultDate": "2017-12-19"
  },
  {
    "id": 375,
    "name": "목포시보건소",
    "type": "보건소",
    "region": "전라남도",
    "district": "목포시",
    "lat": 34.8038,
    "lng": 126.3956,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "관심",
    "lastPurchaseDate": "-",
    "consultCount": 5,
    "lastConsultDate": "2025-04-08"
  },
  {
    "id": 376,
    "name": "보성군보건소",
    "type": "보건소",
    "region": "전라남도",
    "district": "보성군",
    "lat": 34.8054,
    "lng": 127.1641,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 3,
    "lastConsultDate": "2024-03-19"
  },
  {
    "id": 377,
    "name": "순천시보건소",
    "type": "보건소",
    "region": "전라남도",
    "district": "순천시",
    "lat": 34.9947,
    "lng": 127.3965,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 7,
    "lastConsultDate": "2020-11-11"
  },
  {
    "id": 378,
    "name": "신안군보건소",
    "type": "보건소",
    "region": "전라남도",
    "district": "신안군",
    "lat": 34.8033,
    "lng": 126.0519,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "관심",
    "lastPurchaseDate": "-",
    "consultCount": 2,
    "lastConsultDate": "2013-02-13"
  },
  {
    "id": 379,
    "name": "영광군보건소",
    "type": "보건소",
    "region": "전라남도",
    "district": "영광군",
    "lat": 35.2707,
    "lng": 126.4444,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 7,
    "lastConsultDate": "2017-10-26"
  },
  {
    "id": 380,
    "name": "완도군보건소",
    "type": "보건소",
    "region": "전라남도",
    "district": "완도군",
    "lat": 34.2965,
    "lng": 126.7811,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 13,
    "lastConsultDate": "2022-05-31"
  },
  {
    "id": 381,
    "name": "장성군보건소",
    "type": "보건소",
    "region": "전라남도",
    "district": "장성군",
    "lat": 35.3243,
    "lng": 126.7609,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "관심",
    "lastPurchaseDate": "-",
    "consultCount": 2,
    "lastConsultDate": "2016-02-12"
  },
  {
    "id": 382,
    "name": "장흥군보건소",
    "type": "보건소",
    "region": "전라남도",
    "district": "장흥군",
    "lat": 34.6832,
    "lng": 126.9169,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 383,
    "name": "진도군보건소",
    "type": "보건소",
    "region": "전라남도",
    "district": "진도군",
    "lat": 34.439,
    "lng": 126.2141,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 18,
    "lastConsultDate": "2023-10-25"
  },
  {
    "id": 384,
    "name": "해남군보건소",
    "type": "보건소",
    "region": "전라남도",
    "district": "해남군",
    "lat": 34.5569,
    "lng": 126.5131,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "관심",
    "lastPurchaseDate": "-",
    "consultCount": 8,
    "lastConsultDate": "2015-06-26"
  },
  {
    "id": 385,
    "name": "화순군보건소",
    "type": "보건소",
    "region": "전라남도",
    "district": "화순군",
    "lat": 35.0087,
    "lng": 127.0422,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "관심",
    "lastPurchaseDate": "-",
    "consultCount": 2,
    "lastConsultDate": "2009-05-12"
  },
  {
    "id": 386,
    "name": "고창군보건소",
    "type": "보건소",
    "region": "전북특별자치도",
    "district": "고창군",
    "lat": 35.4432,
    "lng": 126.6201,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 11,
    "lastConsultDate": "2019-07-31"
  },
  {
    "id": 387,
    "name": "남원시보건소",
    "type": "보건소",
    "region": "전북특별자치도",
    "district": "남원시",
    "lat": 35.4173,
    "lng": 127.4398,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 3,
    "lastConsultDate": "2022-12-26"
  },
  {
    "id": 388,
    "name": "순창군보건소",
    "type": "보건소",
    "region": "전북특별자치도",
    "district": "순창군",
    "lat": 35.437,
    "lng": 127.0861,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 389,
    "name": "완주군보건소",
    "type": "보건소",
    "region": "전북특별자치도",
    "district": "완주군",
    "lat": 35.9151,
    "lng": 127.2202,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 15,
    "lastConsultDate": "2025-04-04"
  },
  {
    "id": 390,
    "name": "임실군보건소",
    "type": "보건소",
    "region": "전북특별자치도",
    "district": "임실군",
    "lat": 35.5898,
    "lng": 127.2359,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 23,
    "lastConsultDate": "2019-11-14"
  },
  {
    "id": 391,
    "name": "장수군보건소",
    "type": "보건소",
    "region": "전북특별자치도",
    "district": "장수군",
    "lat": 35.6675,
    "lng": 127.5542,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 3,
    "lastConsultDate": "2018-11-26"
  },
  {
    "id": 392,
    "name": "전주시보건소",
    "type": "보건소",
    "region": "전북특별자치도",
    "district": "전주시",
    "lat": 35.8198,
    "lng": 127.1101,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 6,
    "lastConsultDate": "2024-01-09"
  },
  {
    "id": 393,
    "name": "정읍시보건소",
    "type": "보건소",
    "region": "전북특별자치도",
    "district": "정읍시",
    "lat": 35.5979,
    "lng": 126.9147,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 11,
    "lastConsultDate": "2021-07-05"
  },
  {
    "id": 394,
    "name": "진안군보건소",
    "type": "보건소",
    "region": "전북특별자치도",
    "district": "진안군",
    "lat": 35.8366,
    "lng": 127.4377,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 15,
    "lastConsultDate": "2020-04-06"
  },
  {
    "id": 395,
    "name": "계룡시보건소",
    "type": "보건소",
    "region": "충청남도",
    "district": "계룡시",
    "lat": 36.289,
    "lng": 127.2278,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 2,
    "lastConsultDate": "2024-02-23"
  },
  {
    "id": 396,
    "name": "공주시보건소",
    "type": "보건소",
    "region": "충청남도",
    "district": "공주시",
    "lat": 36.4866,
    "lng": 127.0791,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 3,
    "lastConsultDate": "2020-02-03"
  },
  {
    "id": 397,
    "name": "논산시보건소",
    "type": "보건소",
    "region": "충청남도",
    "district": "논산시",
    "lat": 36.1931,
    "lng": 127.1674,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 6,
    "lastConsultDate": "2020-11-09"
  },
  {
    "id": 398,
    "name": "당진시보건소",
    "type": "보건소",
    "region": "충청남도",
    "district": "당진시",
    "lat": 36.9076,
    "lng": 126.6424,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 10,
    "lastConsultDate": "2020-11-04"
  },
  {
    "id": 399,
    "name": "부여군보건소",
    "type": "보건소",
    "region": "충청남도",
    "district": "부여군",
    "lat": 36.2527,
    "lng": 126.853,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "관심",
    "lastPurchaseDate": "-",
    "consultCount": 4,
    "lastConsultDate": "2018-06-15"
  },
  {
    "id": 400,
    "name": "서천군보건소",
    "type": "보건소",
    "region": "충청남도",
    "district": "서천군",
    "lat": 36.1102,
    "lng": 126.7126,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 15,
    "lastConsultDate": "2016-03-31"
  },
  {
    "id": 401,
    "name": "천안시보건소",
    "type": "보건소",
    "region": "충청남도",
    "district": "천안시",
    "lat": 36.7968,
    "lng": 127.1948,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 6,
    "lastConsultDate": "2021-07-21"
  },
  {
    "id": 402,
    "name": "청양군보건소",
    "type": "보건소",
    "region": "충청남도",
    "district": "청양군",
    "lat": 36.4226,
    "lng": 126.8541,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 403,
    "name": "태안군보건소",
    "type": "보건소",
    "region": "충청남도",
    "district": "태안군",
    "lat": 36.703,
    "lng": 126.2817,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 404,
    "name": "단양군보건소",
    "type": "보건소",
    "region": "충청북도",
    "district": "단양군",
    "lat": 36.9989,
    "lng": 128.382,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 16,
    "lastConsultDate": "2022-08-23"
  },
  {
    "id": 405,
    "name": "보은군보건소",
    "type": "보건소",
    "region": "충청북도",
    "district": "보은군",
    "lat": 36.4927,
    "lng": 127.7247,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "관심",
    "lastPurchaseDate": "-",
    "consultCount": 4,
    "lastConsultDate": "2014-03-27"
  },
  {
    "id": 406,
    "name": "옥천군보건소",
    "type": "보건소",
    "region": "충청북도",
    "district": "옥천군",
    "lat": 36.3202,
    "lng": 127.6647,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 7,
    "lastConsultDate": "2024-04-26"
  },
  {
    "id": 407,
    "name": "음성군보건소",
    "type": "보건소",
    "region": "충청북도",
    "district": "음성군",
    "lat": 36.9832,
    "lng": 127.606,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 35,
    "lastConsultDate": "2023-05-08"
  },
  {
    "id": 408,
    "name": "제천시보건소",
    "type": "보건소",
    "region": "충청북도",
    "district": "제천시",
    "lat": 37.0586,
    "lng": 128.1364,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 21,
    "lastConsultDate": "2020-09-29"
  },
  {
    "id": 409,
    "name": "진천군보건소",
    "type": "보건소",
    "region": "충청북도",
    "district": "진천군",
    "lat": 36.8611,
    "lng": 127.4459,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "관심",
    "lastPurchaseDate": "-",
    "consultCount": 4,
    "lastConsultDate": "2017-05-11"
  },
  {
    "id": 410,
    "name": "강릉시정신건강복지센터",
    "type": "전문기관",
    "region": "강원특별자치도",
    "district": "강릉시",
    "lat": 37.7119,
    "lng": 128.8277,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 411,
    "name": "고성군정신건강복지센터",
    "type": "전문기관",
    "region": "강원특별자치도",
    "district": "고성군",
    "lat": 38.3794,
    "lng": 128.4035,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 412,
    "name": "속초시정신건강복지센터",
    "type": "전문기관",
    "region": "강원특별자치도",
    "district": "속초시",
    "lat": 38.1747,
    "lng": 128.5098,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 413,
    "name": "양구군정신건강복지센터",
    "type": "전문기관",
    "region": "강원특별자치도",
    "district": "양구군",
    "lat": 38.1692,
    "lng": 128.0088,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 414,
    "name": "양양군정신건강복지센터",
    "type": "전문기관",
    "region": "강원특별자치도",
    "district": "양양군",
    "lat": 38.0127,
    "lng": 128.5963,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 415,
    "name": "영월군정신건강복지센터",
    "type": "전문기관",
    "region": "강원특별자치도",
    "district": "영월군",
    "lat": 37.2107,
    "lng": 128.5019,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 416,
    "name": "원주시정신건강복지센터",
    "type": "전문기관",
    "region": "강원특별자치도",
    "district": "원주시",
    "lat": 37.3013,
    "lng": 127.922,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 417,
    "name": "인제군정신건강복지센터",
    "type": "전문기관",
    "region": "강원특별자치도",
    "district": "인제군",
    "lat": 38.064,
    "lng": 128.2717,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 418,
    "name": "정선군정신건강복지센터",
    "type": "전문기관",
    "region": "강원특별자치도",
    "district": "정선군",
    "lat": 37.3847,
    "lng": 128.7462,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 419,
    "name": "철원군정신건강복지센터",
    "type": "전문기관",
    "region": "강원특별자치도",
    "district": "철원군",
    "lat": 38.2488,
    "lng": 127.4046,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 420,
    "name": "춘천시정신건강복지센터",
    "type": "전문기관",
    "region": "강원특별자치도",
    "district": "춘천시",
    "lat": 37.8849,
    "lng": 127.732,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 421,
    "name": "태백시정신건강복지센터",
    "type": "전문기관",
    "region": "강원특별자치도",
    "district": "태백시",
    "lat": 37.1781,
    "lng": 128.9878,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 422,
    "name": "평창군정신건강복지센터",
    "type": "전문기관",
    "region": "강원특별자치도",
    "district": "평창군",
    "lat": 37.5551,
    "lng": 128.4852,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 423,
    "name": "홍천군정신건강복지센터",
    "type": "전문기관",
    "region": "강원특별자치도",
    "district": "홍천군",
    "lat": 37.7379,
    "lng": 128.083,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 424,
    "name": "화천군정신건강복지센터",
    "type": "전문기관",
    "region": "강원특별자치도",
    "district": "화천군",
    "lat": 38.1457,
    "lng": 127.6946,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 425,
    "name": "횡성군정신건강복지센터",
    "type": "전문기관",
    "region": "강원특별자치도",
    "district": "횡성군",
    "lat": 37.5152,
    "lng": 128.0847,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "관심",
    "lastPurchaseDate": "-",
    "consultCount": 1,
    "lastConsultDate": "2018-10-02"
  },
  {
    "id": 426,
    "name": "가평군정신건강복지센터",
    "type": "전문기관",
    "region": "경기도",
    "district": "가평군",
    "lat": 37.8091,
    "lng": 127.4549,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 427,
    "name": "고양시정신건강복지센터",
    "type": "전문기관",
    "region": "경기도",
    "district": "고양시",
    "lat": 37.6615,
    "lng": 126.8456,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "관심",
    "lastPurchaseDate": "-",
    "consultCount": 6,
    "lastConsultDate": "2022-01-14"
  },
  {
    "id": 428,
    "name": "과천시정신건강복지센터",
    "type": "전문기관",
    "region": "경기도",
    "district": "과천시",
    "lat": 37.4399,
    "lng": 127.01,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 3,
    "lastConsultDate": "2019-05-27"
  },
  {
    "id": 429,
    "name": "광명시정신건강복지센터",
    "type": "전문기관",
    "region": "경기도",
    "district": "광명시",
    "lat": 37.4515,
    "lng": 126.8601,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 430,
    "name": "광주시정신건강복지센터",
    "type": "전문기관",
    "region": "경기도",
    "district": "광주시",
    "lat": 37.4088,
    "lng": 127.2934,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 431,
    "name": "구리시정신건강복지센터",
    "type": "전문기관",
    "region": "경기도",
    "district": "구리시",
    "lat": 37.6064,
    "lng": 127.1385,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 432,
    "name": "남양주시정신건강복지센터",
    "type": "전문기관",
    "region": "경기도",
    "district": "남양주시",
    "lat": 37.6569,
    "lng": 127.2499,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "관심",
    "lastPurchaseDate": "-",
    "consultCount": 1,
    "lastConsultDate": "2020-09-03"
  },
  {
    "id": 433,
    "name": "부천시정신건강복지센터",
    "type": "전문기관",
    "region": "경기도",
    "district": "부천시",
    "lat": 37.5034,
    "lng": 126.7849,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 2,
    "lastConsultDate": "2022-03-16"
  },
  {
    "id": 434,
    "name": "성남시정신건강복지센터",
    "type": "전문기관",
    "region": "경기도",
    "district": "성남시",
    "lat": 37.4133,
    "lng": 127.1109,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 435,
    "name": "수원시정신건강복지센터",
    "type": "전문기관",
    "region": "경기도",
    "district": "수원시",
    "lat": 37.2709,
    "lng": 127.0016,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 436,
    "name": "시흥시정신건강복지센터",
    "type": "전문기관",
    "region": "경기도",
    "district": "시흥시",
    "lat": 37.3827,
    "lng": 126.7908,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 1,
    "lastConsultDate": "2019-11-18"
  },
  {
    "id": 437,
    "name": "안산시정신건강복지센터",
    "type": "전문기관",
    "region": "경기도",
    "district": "안산시",
    "lat": 37.3003,
    "lng": 126.7431,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 1,
    "lastConsultDate": "2020-01-15"
  },
  {
    "id": 438,
    "name": "안양시정신건강복지센터",
    "type": "전문기관",
    "region": "경기도",
    "district": "안양시",
    "lat": 37.4055,
    "lng": 126.9259,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 439,
    "name": "양주시정신건강복지센터",
    "type": "전문기관",
    "region": "경기도",
    "district": "양주시",
    "lat": 37.8182,
    "lng": 127.0019,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 1,
    "lastConsultDate": "2020-12-21"
  },
  {
    "id": 440,
    "name": "양평군정신건강복지센터",
    "type": "전문기관",
    "region": "경기도",
    "district": "양평군",
    "lat": 37.5268,
    "lng": 127.5713,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 441,
    "name": "여주시정신건강복지센터",
    "type": "전문기관",
    "region": "경기도",
    "district": "여주시",
    "lat": 37.3119,
    "lng": 127.6094,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 442,
    "name": "연천군정신건강복지센터",
    "type": "전문기관",
    "region": "경기도",
    "district": "연천군",
    "lat": 38.1055,
    "lng": 127.0258,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 443,
    "name": "오산시정신건강복지센터",
    "type": "전문기관",
    "region": "경기도",
    "district": "오산시",
    "lat": 37.1556,
    "lng": 127.0499,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "관심",
    "lastPurchaseDate": "-",
    "consultCount": 1,
    "lastConsultDate": "2019-06-13"
  },
  {
    "id": 444,
    "name": "용인시정신건강복지센터",
    "type": "전문기관",
    "region": "경기도",
    "district": "용인시",
    "lat": 37.2261,
    "lng": 127.2179,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "관심",
    "lastPurchaseDate": "-",
    "consultCount": 1,
    "lastConsultDate": "2016-12-08"
  },
  {
    "id": 445,
    "name": "의왕시정신건강복지센터",
    "type": "전문기관",
    "region": "경기도",
    "district": "의왕시",
    "lat": 37.3646,
    "lng": 126.9899,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 446,
    "name": "의정부시정신건강복지센터",
    "type": "전문기관",
    "region": "경기도",
    "district": "의정부시",
    "lat": 37.7339,
    "lng": 127.0698,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 447,
    "name": "이천시정신건강복지센터",
    "type": "전문기관",
    "region": "경기도",
    "district": "이천시",
    "lat": 37.205,
    "lng": 127.4851,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 6,
    "lastConsultDate": "2023-04-24"
  },
  {
    "id": 448,
    "name": "파주시정신건강복지센터",
    "type": "전문기관",
    "region": "경기도",
    "district": "파주시",
    "lat": 37.8416,
    "lng": 126.8236,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 449,
    "name": "포천시정신건강복지센터",
    "type": "전문기관",
    "region": "경기도",
    "district": "포천시",
    "lat": 37.9707,
    "lng": 127.2548,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 450,
    "name": "하남시정신건강복지센터",
    "type": "전문기관",
    "region": "경기도",
    "district": "하남시",
    "lat": 37.5277,
    "lng": 127.2094,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 451,
    "name": "화성시정신건강복지센터",
    "type": "전문기관",
    "region": "경기도",
    "district": "화성시",
    "lat": 37.1649,
    "lng": 126.8602,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 452,
    "name": "거제시정신건강복지센터",
    "type": "전문기관",
    "region": "경상남도",
    "district": "거제시",
    "lat": 34.8735,
    "lng": 128.62,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 453,
    "name": "거창군정신건강복지센터",
    "type": "전문기관",
    "region": "경상남도",
    "district": "거창군",
    "lat": 35.7289,
    "lng": 127.9111,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 454,
    "name": "고성군정신건강복지센터",
    "type": "전문기관",
    "region": "경상남도",
    "district": "고성군",
    "lat": 35.0204,
    "lng": 128.2864,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 455,
    "name": "김해시정신건강복지센터",
    "type": "전문기관",
    "region": "경상남도",
    "district": "김해시",
    "lat": 35.2683,
    "lng": 128.8434,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 456,
    "name": "남해군정신건강복지센터",
    "type": "전문기관",
    "region": "경상남도",
    "district": "남해군",
    "lat": 34.816,
    "lng": 127.9374,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 457,
    "name": "밀양시정신건강복지센터",
    "type": "전문기관",
    "region": "경상남도",
    "district": "밀양시",
    "lat": 35.4911,
    "lng": 128.788,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 458,
    "name": "사천시정신건강복지센터",
    "type": "전문기관",
    "region": "경상남도",
    "district": "사천시",
    "lat": 35.0583,
    "lng": 128.0407,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 459,
    "name": "산청군정신건강복지센터",
    "type": "전문기관",
    "region": "경상남도",
    "district": "산청군",
    "lat": 35.3767,
    "lng": 127.8866,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 460,
    "name": "양산시정신건강복지센터",
    "type": "전문기관",
    "region": "경상남도",
    "district": "양산시",
    "lat": 35.3978,
    "lng": 129.042,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 461,
    "name": "의령군정신건강복지센터",
    "type": "전문기관",
    "region": "경상남도",
    "district": "의령군",
    "lat": 35.3824,
    "lng": 128.2729,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 462,
    "name": "진주시정신건강복지센터",
    "type": "전문기관",
    "region": "경상남도",
    "district": "진주시",
    "lat": 35.2038,
    "lng": 128.1314,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 463,
    "name": "창녕군정신건강복지센터",
    "type": "전문기관",
    "region": "경상남도",
    "district": "창녕군",
    "lat": 35.5115,
    "lng": 128.4923,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 464,
    "name": "통영시정신건강복지센터",
    "type": "전문기관",
    "region": "경상남도",
    "district": "통영시",
    "lat": 34.8246,
    "lng": 128.3683,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 465,
    "name": "하동군정신건강복지센터",
    "type": "전문기관",
    "region": "경상남도",
    "district": "하동군",
    "lat": 35.1368,
    "lng": 127.7871,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 466,
    "name": "함안군정신건강복지센터",
    "type": "전문기관",
    "region": "경상남도",
    "district": "함안군",
    "lat": 35.2969,
    "lng": 128.4243,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 467,
    "name": "함양군정신건강복지센터",
    "type": "전문기관",
    "region": "경상남도",
    "district": "함양군",
    "lat": 35.5434,
    "lng": 127.7223,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 468,
    "name": "합천군정신건강복지센터",
    "type": "전문기관",
    "region": "경상남도",
    "district": "합천군",
    "lat": 35.5794,
    "lng": 128.1383,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 469,
    "name": "경산시정신건강복지센터",
    "type": "전문기관",
    "region": "경상북도",
    "district": "경산시",
    "lat": 35.8404,
    "lng": 128.8141,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 470,
    "name": "경주시정신건강복지센터",
    "type": "전문기관",
    "region": "경상북도",
    "district": "경주시",
    "lat": 35.8302,
    "lng": 129.2305,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 471,
    "name": "고령군정신건강복지센터",
    "type": "전문기관",
    "region": "경상북도",
    "district": "고령군",
    "lat": 35.7313,
    "lng": 128.2974,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 472,
    "name": "구미시정신건강복지센터",
    "type": "전문기관",
    "region": "경상북도",
    "district": "구미시",
    "lat": 36.2023,
    "lng": 128.3549,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 473,
    "name": "군위군정신건강복지센터",
    "type": "전문기관",
    "region": "경상북도",
    "district": "군위군",
    "lat": 36.1772,
    "lng": 128.6394,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 474,
    "name": "김천시정신건강복지센터",
    "type": "전문기관",
    "region": "경상북도",
    "district": "김천시",
    "lat": 36.0588,
    "lng": 128.0804,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 475,
    "name": "문경시정신건강복지센터",
    "type": "전문기관",
    "region": "경상북도",
    "district": "문경시",
    "lat": 36.6846,
    "lng": 128.1527,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 476,
    "name": "상주시정신건강복지센터",
    "type": "전문기관",
    "region": "경상북도",
    "district": "상주시",
    "lat": 36.4295,
    "lng": 128.0618,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 477,
    "name": "성주군정신건강복지센터",
    "type": "전문기관",
    "region": "경상북도",
    "district": "성주군",
    "lat": 35.9104,
    "lng": 128.2235,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 478,
    "name": "안동시정신건강복지센터",
    "type": "전문기관",
    "region": "경상북도",
    "district": "안동시",
    "lat": 36.5853,
    "lng": 128.7854,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 9,
    "lastConsultDate": "2018-12-03"
  },
  {
    "id": 479,
    "name": "영덕군정신건강복지센터",
    "type": "전문기관",
    "region": "경상북도",
    "district": "영덕군",
    "lat": 36.4746,
    "lng": 129.3161,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 480,
    "name": "영양군정신건강복지센터",
    "type": "전문기관",
    "region": "경상북도",
    "district": "영양군",
    "lat": 36.69,
    "lng": 129.1542,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 481,
    "name": "영주시정신건강복지센터",
    "type": "전문기관",
    "region": "경상북도",
    "district": "영주시",
    "lat": 36.871,
    "lng": 128.5886,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 482,
    "name": "영천시정신건강복지센터",
    "type": "전문기관",
    "region": "경상북도",
    "district": "영천시",
    "lat": 36.0109,
    "lng": 128.9495,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 483,
    "name": "예천군정신건강복지센터",
    "type": "전문기관",
    "region": "경상북도",
    "district": "예천군",
    "lat": 36.6531,
    "lng": 128.4285,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 484,
    "name": "울릉군정신건강복지센터",
    "type": "전문기관",
    "region": "경상북도",
    "district": "울릉군",
    "lat": 37.5054,
    "lng": 130.873,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 485,
    "name": "울진군정신건강복지센터",
    "type": "전문기관",
    "region": "경상북도",
    "district": "울진군",
    "lat": 36.906,
    "lng": 129.3215,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 486,
    "name": "의성군정신건강복지센터",
    "type": "전문기관",
    "region": "경상북도",
    "district": "의성군",
    "lat": 36.3698,
    "lng": 128.6174,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 487,
    "name": "청도군정신건강복지센터",
    "type": "전문기관",
    "region": "경상북도",
    "district": "청도군",
    "lat": 35.6773,
    "lng": 128.7866,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 488,
    "name": "청송군정신건강복지센터",
    "type": "전문기관",
    "region": "경상북도",
    "district": "청송군",
    "lat": 36.3637,
    "lng": 129.0584,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 489,
    "name": "칠곡군정신건강복지센터",
    "type": "전문기관",
    "region": "경상북도",
    "district": "칠곡군",
    "lat": 36.0233,
    "lng": 128.4675,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 490,
    "name": "포항시정신건강복지센터",
    "type": "전문기관",
    "region": "경상북도",
    "district": "포항시",
    "lat": 36.0923,
    "lng": 129.3007,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 4,
    "lastConsultDate": "2023-04-25"
  },
  {
    "id": 491,
    "name": "광산구정신건강복지센터",
    "type": "전문기관",
    "region": "광주광역시",
    "district": "광산구",
    "lat": 35.16,
    "lng": 126.7556,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 8,
    "lastConsultDate": "2019-05-31"
  },
  {
    "id": 492,
    "name": "남구정신건강복지센터",
    "type": "전문기관",
    "region": "광주광역시",
    "district": "남구",
    "lat": 35.0992,
    "lng": 126.857,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 493,
    "name": "동구정신건강복지센터",
    "type": "전문기관",
    "region": "광주광역시",
    "district": "동구",
    "lat": 35.1195,
    "lng": 126.945,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 494,
    "name": "북구정신건강복지센터",
    "type": "전문기관",
    "region": "광주광역시",
    "district": "북구",
    "lat": 35.1845,
    "lng": 126.9212,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 495,
    "name": "서구정신건강복지센터",
    "type": "전문기관",
    "region": "광주광역시",
    "district": "서구",
    "lat": 35.1309,
    "lng": 126.8469,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 496,
    "name": "남구정신건강복지센터",
    "type": "전문기관",
    "region": "대구광역시",
    "district": "남구",
    "lat": 35.8358,
    "lng": 128.578,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 497,
    "name": "달서구정신건강복지센터",
    "type": "전문기관",
    "region": "대구광역시",
    "district": "달서구",
    "lat": 35.8223,
    "lng": 128.5327,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 1,
    "lastConsultDate": "2018-12-07"
  },
  {
    "id": 498,
    "name": "달성군정신건강복지센터",
    "type": "전문기관",
    "region": "대구광역시",
    "district": "달성군",
    "lat": 35.7637,
    "lng": 128.4897,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 499,
    "name": "북구정신건강복지센터",
    "type": "전문기관",
    "region": "대구광역시",
    "district": "북구",
    "lat": 35.927,
    "lng": 128.5782,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 500,
    "name": "서구정신건강복지센터",
    "type": "전문기관",
    "region": "대구광역시",
    "district": "서구",
    "lat": 35.8733,
    "lng": 128.5437,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 501,
    "name": "수성구정신건강복지센터",
    "type": "전문기관",
    "region": "대구광역시",
    "district": "수성구",
    "lat": 35.8321,
    "lng": 128.6693,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 502,
    "name": "중구정신건강복지센터",
    "type": "전문기관",
    "region": "대구광역시",
    "district": "중구",
    "lat": 35.8681,
    "lng": 128.5975,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 503,
    "name": "대덕구정신건강복지센터",
    "type": "전문기관",
    "region": "대전광역시",
    "district": "대덕구",
    "lat": 36.4194,
    "lng": 127.4454,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 504,
    "name": "동구정신건강복지센터",
    "type": "전문기관",
    "region": "대전광역시",
    "district": "동구",
    "lat": 36.3217,
    "lng": 127.4652,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 505,
    "name": "서구정신건강복지센터",
    "type": "전문기관",
    "region": "대전광역시",
    "district": "서구",
    "lat": 36.2774,
    "lng": 127.3503,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 506,
    "name": "유성구정신건강복지센터",
    "type": "전문기관",
    "region": "대전광역시",
    "district": "유성구",
    "lat": 36.384,
    "lng": 127.3424,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 507,
    "name": "강서구정신건강복지센터",
    "type": "전문기관",
    "region": "부산광역시",
    "district": "강서구",
    "lat": 35.1353,
    "lng": 128.8965,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 8,
    "lastConsultDate": "2024-04-25"
  },
  {
    "id": 508,
    "name": "금정구정신건강복지센터",
    "type": "전문기관",
    "region": "부산광역시",
    "district": "금정구",
    "lat": 35.2598,
    "lng": 129.0937,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 509,
    "name": "기장군정신건강복지센터",
    "type": "전문기관",
    "region": "부산광역시",
    "district": "기장군",
    "lat": 35.2923,
    "lng": 129.1954,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 510,
    "name": "남구정신건강복지센터",
    "type": "전문기관",
    "region": "부산광역시",
    "district": "남구",
    "lat": 35.1241,
    "lng": 129.085,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 511,
    "name": "동구정신건강복지센터",
    "type": "전문기관",
    "region": "부산광역시",
    "district": "동구",
    "lat": 35.1251,
    "lng": 129.0481,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 512,
    "name": "동래구정신건강복지센터",
    "type": "전문기관",
    "region": "부산광역시",
    "district": "동래구",
    "lat": 35.2043,
    "lng": 129.0724,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 513,
    "name": "부산진구정신건강복지센터",
    "type": "전문기관",
    "region": "부산광역시",
    "district": "부산진구",
    "lat": 35.1648,
    "lng": 129.0371,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 514,
    "name": "북구정신건강복지센터",
    "type": "전문기관",
    "region": "부산광역시",
    "district": "북구",
    "lat": 35.2316,
    "lng": 129.0138,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 515,
    "name": "사상구정신건강복지센터",
    "type": "전문기관",
    "region": "부산광역시",
    "district": "사상구",
    "lat": 35.1558,
    "lng": 128.9879,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 516,
    "name": "사하구정신건강복지센터",
    "type": "전문기관",
    "region": "부산광역시",
    "district": "사하구",
    "lat": 35.0766,
    "lng": 128.9735,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 517,
    "name": "서구정신건강복지센터",
    "type": "전문기관",
    "region": "부산광역시",
    "district": "서구",
    "lat": 35.0953,
    "lng": 129.0141,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 518,
    "name": "수영구정신건강복지센터",
    "type": "전문기관",
    "region": "부산광역시",
    "district": "수영구",
    "lat": 35.1522,
    "lng": 129.1086,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 519,
    "name": "연제구정신건강복지센터",
    "type": "전문기관",
    "region": "부산광역시",
    "district": "연제구",
    "lat": 35.1776,
    "lng": 129.0799,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 1,
    "lastConsultDate": "2017-12-27"
  },
  {
    "id": 520,
    "name": "영도구정신건강복지센터",
    "type": "전문기관",
    "region": "부산광역시",
    "district": "영도구",
    "lat": 35.0838,
    "lng": 129.0624,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 521,
    "name": "중구정신건강복지센터",
    "type": "전문기관",
    "region": "부산광역시",
    "district": "중구",
    "lat": 35.1105,
    "lng": 129.0387,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 522,
    "name": "해운대구정신건강복지센터",
    "type": "전문기관",
    "region": "부산광역시",
    "district": "해운대구",
    "lat": 35.1886,
    "lng": 129.1453,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 523,
    "name": "강남구정신건강복지센터",
    "type": "전문기관",
    "region": "서울특별시",
    "district": "강남구",
    "lat": 37.4871,
    "lng": 127.0638,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 524,
    "name": "강동구정신건강복지센터",
    "type": "전문기관",
    "region": "서울특별시",
    "district": "강동구",
    "lat": 37.5604,
    "lng": 127.1439,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 525,
    "name": "강북구정신건강복지센터",
    "type": "전문기관",
    "region": "서울특별시",
    "district": "강북구",
    "lat": 37.6465,
    "lng": 127.0168,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 526,
    "name": "관악구정신건강복지센터",
    "type": "전문기관",
    "region": "서울특별시",
    "district": "관악구",
    "lat": 37.4703,
    "lng": 126.9504,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 527,
    "name": "구로구정신건강복지센터",
    "type": "전문기관",
    "region": "서울특별시",
    "district": "구로구",
    "lat": 37.5034,
    "lng": 126.8505,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 528,
    "name": "금천구정신건강복지센터",
    "type": "전문기관",
    "region": "서울특별시",
    "district": "금천구",
    "lat": 37.4507,
    "lng": 126.8941,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 529,
    "name": "노원구정신건강복지센터",
    "type": "전문기관",
    "region": "서울특별시",
    "district": "노원구",
    "lat": 37.645,
    "lng": 127.0785,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 530,
    "name": "도봉구정신건강복지센터",
    "type": "전문기관",
    "region": "서울특별시",
    "district": "도봉구",
    "lat": 37.6706,
    "lng": 127.0269,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 531,
    "name": "서대문구정신건강복지센터",
    "type": "전문기관",
    "region": "서울특별시",
    "district": "서대문구",
    "lat": 37.5818,
    "lng": 126.9445,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 532,
    "name": "서초구정신건강복지센터",
    "type": "전문기관",
    "region": "서울특별시",
    "district": "서초구",
    "lat": 37.4666,
    "lng": 127.0336,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 533,
    "name": "성동구정신건강복지센터",
    "type": "전문기관",
    "region": "서울특별시",
    "district": "성동구",
    "lat": 37.5558,
    "lng": 127.0332,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 534,
    "name": "성북구정신건강복지센터",
    "type": "전문기관",
    "region": "서울특별시",
    "district": "성북구",
    "lat": 37.6121,
    "lng": 127.0266,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 535,
    "name": "양천구정신건강복지센터",
    "type": "전문기관",
    "region": "서울특별시",
    "district": "양천구",
    "lat": 37.5171,
    "lng": 126.846,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 536,
    "name": "영등포구정신건강복지센터",
    "type": "전문기관",
    "region": "서울특별시",
    "district": "영등포구",
    "lat": 37.5187,
    "lng": 126.9135,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 537,
    "name": "용산구정신건강복지센터",
    "type": "전문기관",
    "region": "서울특별시",
    "district": "용산구",
    "lat": 37.5405,
    "lng": 126.9776,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "관심",
    "lastPurchaseDate": "-",
    "consultCount": 1,
    "lastConsultDate": "2024-09-12"
  },
  {
    "id": 538,
    "name": "은평구정신건강복지센터",
    "type": "전문기관",
    "region": "서울특별시",
    "district": "은평구",
    "lat": 37.6233,
    "lng": 126.9186,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 539,
    "name": "중구정신건강복지센터",
    "type": "전문기관",
    "region": "서울특별시",
    "district": "중구",
    "lat": 37.5638,
    "lng": 126.9982,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 540,
    "name": "중랑구정신건강복지센터",
    "type": "전문기관",
    "region": "서울특별시",
    "district": "중랑구",
    "lat": 37.5897,
    "lng": 127.0983,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 541,
    "name": "세종시정신건강복지센터",
    "type": "전문기관",
    "region": "세종특별자치시",
    "district": "세종시",
    "lat": 36.5677,
    "lng": 127.2607,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 542,
    "name": "남구정신건강복지센터",
    "type": "전문기관",
    "region": "울산광역시",
    "district": "남구",
    "lat": 35.5079,
    "lng": 129.3391,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 543,
    "name": "북구정신건강복지센터",
    "type": "전문기관",
    "region": "울산광역시",
    "district": "북구",
    "lat": 35.6158,
    "lng": 129.3769,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 544,
    "name": "울주군정신건강복지센터",
    "type": "전문기관",
    "region": "울산광역시",
    "district": "울주군",
    "lat": 35.5448,
    "lng": 129.1849,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 545,
    "name": "중구정신건강복지센터",
    "type": "전문기관",
    "region": "울산광역시",
    "district": "중구",
    "lat": 35.5712,
    "lng": 129.305,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 546,
    "name": "강화군정신건강복지센터",
    "type": "전문기관",
    "region": "인천광역시",
    "district": "강화군",
    "lat": 37.7196,
    "lng": 126.4088,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 547,
    "name": "계양구정신건강복지센터",
    "type": "전문기관",
    "region": "인천광역시",
    "district": "계양구",
    "lat": 37.5494,
    "lng": 126.7439,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 548,
    "name": "남동구정신건강복지센터",
    "type": "전문기관",
    "region": "인천광역시",
    "district": "남동구",
    "lat": 37.4336,
    "lng": 126.7331,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 549,
    "name": "동구정신건강복지센터",
    "type": "전문기관",
    "region": "인천광역시",
    "district": "동구",
    "lat": 37.4873,
    "lng": 126.638,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 550,
    "name": "미추홀구정신건강복지센터",
    "type": "전문기관",
    "region": "인천광역시",
    "district": "미추홀구",
    "lat": 37.4573,
    "lng": 126.674,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 2,
    "lastConsultDate": "2022-12-08"
  },
  {
    "id": 551,
    "name": "부평구정신건강복지센터",
    "type": "전문기관",
    "region": "인천광역시",
    "district": "부평구",
    "lat": 37.492,
    "lng": 126.7273,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 552,
    "name": "서구정신건강복지센터",
    "type": "전문기관",
    "region": "인천광역시",
    "district": "서구",
    "lat": 37.5604,
    "lng": 126.6515,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 553,
    "name": "연수구정신건강복지센터",
    "type": "전문기관",
    "region": "인천광역시",
    "district": "연수구",
    "lat": 37.3931,
    "lng": 126.6528,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 554,
    "name": "중구정신건강복지센터",
    "type": "전문기관",
    "region": "인천광역시",
    "district": "중구",
    "lat": 37.4639,
    "lng": 126.4892,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 555,
    "name": "강진군정신건강복지센터",
    "type": "전문기관",
    "region": "전라남도",
    "district": "강진군",
    "lat": 34.627,
    "lng": 126.7638,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 556,
    "name": "고흥군정신건강복지센터",
    "type": "전문기관",
    "region": "전라남도",
    "district": "고흥군",
    "lat": 34.6058,
    "lng": 127.3097,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 557,
    "name": "곡성군정신건강복지센터",
    "type": "전문기관",
    "region": "전라남도",
    "district": "곡성군",
    "lat": 35.2159,
    "lng": 127.2658,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 558,
    "name": "광양시정신건강복지센터",
    "type": "전문기관",
    "region": "전라남도",
    "district": "광양시",
    "lat": 35.0176,
    "lng": 127.6458,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 559,
    "name": "구례군정신건강복지센터",
    "type": "전문기관",
    "region": "전라남도",
    "district": "구례군",
    "lat": 35.2438,
    "lng": 127.4967,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 560,
    "name": "나주시정신건강복지센터",
    "type": "전문기관",
    "region": "전라남도",
    "district": "나주시",
    "lat": 34.9828,
    "lng": 126.7264,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 561,
    "name": "담양군정신건강복지센터",
    "type": "전문기관",
    "region": "전라남도",
    "district": "담양군",
    "lat": 35.2883,
    "lng": 127.0028,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 562,
    "name": "목포시정신건강복지센터",
    "type": "전문기관",
    "region": "전라남도",
    "district": "목포시",
    "lat": 34.807,
    "lng": 126.3861,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 563,
    "name": "무안군정신건강복지센터",
    "type": "전문기관",
    "region": "전라남도",
    "district": "무안군",
    "lat": 34.9442,
    "lng": 126.4341,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 564,
    "name": "보성군정신건강복지센터",
    "type": "전문기관",
    "region": "전라남도",
    "district": "보성군",
    "lat": 34.806,
    "lng": 127.1668,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 565,
    "name": "순천시정신건강복지센터",
    "type": "전문기관",
    "region": "전라남도",
    "district": "순천시",
    "lat": 34.9944,
    "lng": 127.3946,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 1,
    "lastConsultDate": "2022-05-17"
  },
  {
    "id": 566,
    "name": "신안군정신건강복지센터",
    "type": "전문기관",
    "region": "전라남도",
    "district": "신안군",
    "lat": 34.814,
    "lng": 126.0456,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 567,
    "name": "여수시정신건강복지센터",
    "type": "전문기관",
    "region": "전라남도",
    "district": "여수시",
    "lat": 34.6954,
    "lng": 127.6588,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 568,
    "name": "영광군정신건강복지센터",
    "type": "전문기관",
    "region": "전라남도",
    "district": "영광군",
    "lat": 35.271,
    "lng": 126.4451,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 569,
    "name": "영암군정신건강복지센터",
    "type": "전문기관",
    "region": "전라남도",
    "district": "영암군",
    "lat": 34.8008,
    "lng": 126.6223,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 570,
    "name": "완도군정신건강복지센터",
    "type": "전문기관",
    "region": "전라남도",
    "district": "완도군",
    "lat": 34.2962,
    "lng": 126.7771,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 571,
    "name": "장성군정신건강복지센터",
    "type": "전문기관",
    "region": "전라남도",
    "district": "장성군",
    "lat": 35.3302,
    "lng": 126.767,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 572,
    "name": "진도군정신건강복지센터",
    "type": "전문기관",
    "region": "전라남도",
    "district": "진도군",
    "lat": 34.442,
    "lng": 126.2083,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 573,
    "name": "함평군정신건강복지센터",
    "type": "전문기관",
    "region": "전라남도",
    "district": "함평군",
    "lat": 35.1168,
    "lng": 126.5309,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 574,
    "name": "해남군정신건강복지센터",
    "type": "전문기관",
    "region": "전라남도",
    "district": "해남군",
    "lat": 34.5535,
    "lng": 126.5038,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 575,
    "name": "화순군정신건강복지센터",
    "type": "전문기관",
    "region": "전라남도",
    "district": "화순군",
    "lat": 35.0021,
    "lng": 127.0259,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 576,
    "name": "고창군정신건강복지센터",
    "type": "전문기관",
    "region": "전북특별자치도",
    "district": "고창군",
    "lat": 35.4498,
    "lng": 126.621,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 577,
    "name": "군산시정신건강복지센터",
    "type": "전문기관",
    "region": "전북특별자치도",
    "district": "군산시",
    "lat": 35.9427,
    "lng": 126.7135,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 578,
    "name": "김제시정신건강복지센터",
    "type": "전문기관",
    "region": "전북특별자치도",
    "district": "김제시",
    "lat": 35.8066,
    "lng": 126.9004,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 579,
    "name": "남원시정신건강복지센터",
    "type": "전문기관",
    "region": "전북특별자치도",
    "district": "남원시",
    "lat": 35.432,
    "lng": 127.4424,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 580,
    "name": "무주군정신건강복지센터",
    "type": "전문기관",
    "region": "전북특별자치도",
    "district": "무주군",
    "lat": 35.9351,
    "lng": 127.7049,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 581,
    "name": "부안군정신건강복지센터",
    "type": "전문기관",
    "region": "전북특별자치도",
    "district": "부안군",
    "lat": 35.6715,
    "lng": 126.637,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 6,
    "lastConsultDate": "2017-10-16"
  },
  {
    "id": 582,
    "name": "순창군정신건강복지센터",
    "type": "전문기관",
    "region": "전북특별자치도",
    "district": "순창군",
    "lat": 35.4272,
    "lng": 127.0804,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 583,
    "name": "익산시정신건강복지센터",
    "type": "전문기관",
    "region": "전북특별자치도",
    "district": "익산시",
    "lat": 36.0239,
    "lng": 126.985,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 3,
    "lastConsultDate": "2021-05-13"
  },
  {
    "id": 584,
    "name": "임실군정신건강복지센터",
    "type": "전문기관",
    "region": "전북특별자치도",
    "district": "임실군",
    "lat": 35.6078,
    "lng": 127.2378,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 585,
    "name": "장수군정신건강복지센터",
    "type": "전문기관",
    "region": "전북특별자치도",
    "district": "장수군",
    "lat": 35.6614,
    "lng": 127.5368,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 586,
    "name": "정읍시정신건강복지센터",
    "type": "전문기관",
    "region": "전북특별자치도",
    "district": "정읍시",
    "lat": 35.61,
    "lng": 126.9058,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 587,
    "name": "진안군정신건강복지센터",
    "type": "전문기관",
    "region": "전북특별자치도",
    "district": "진안군",
    "lat": 35.8365,
    "lng": 127.4316,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 588,
    "name": "서귀포시정신건강복지센터",
    "type": "전문기관",
    "region": "제주특별자치도",
    "district": "서귀포시",
    "lat": 33.3238,
    "lng": 126.58,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 589,
    "name": "계룡시정신건강복지센터",
    "type": "전문기관",
    "region": "충청남도",
    "district": "계룡시",
    "lat": 36.2853,
    "lng": 127.2256,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 590,
    "name": "공주시정신건강복지센터",
    "type": "전문기관",
    "region": "충청남도",
    "district": "공주시",
    "lat": 36.4887,
    "lng": 127.0746,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 591,
    "name": "금산군정신건강복지센터",
    "type": "전문기관",
    "region": "충청남도",
    "district": "금산군",
    "lat": 36.1254,
    "lng": 127.4763,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 592,
    "name": "논산시정신건강복지센터",
    "type": "전문기관",
    "region": "충청남도",
    "district": "논산시",
    "lat": 36.1824,
    "lng": 127.1603,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 593,
    "name": "당진시정신건강복지센터",
    "type": "전문기관",
    "region": "충청남도",
    "district": "당진시",
    "lat": 36.8956,
    "lng": 126.6452,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 594,
    "name": "보령시정신건강복지센터",
    "type": "전문기관",
    "region": "충청남도",
    "district": "보령시",
    "lat": 36.3412,
    "lng": 126.5871,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 595,
    "name": "부여군정신건강복지센터",
    "type": "전문기관",
    "region": "충청남도",
    "district": "부여군",
    "lat": 36.2563,
    "lng": 126.8494,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 596,
    "name": "서산시정신건강복지센터",
    "type": "전문기관",
    "region": "충청남도",
    "district": "서산시",
    "lat": 36.7901,
    "lng": 126.4654,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 597,
    "name": "서천군정신건강복지센터",
    "type": "전문기관",
    "region": "충청남도",
    "district": "서천군",
    "lat": 36.1127,
    "lng": 126.6983,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 598,
    "name": "아산시정신건강복지센터",
    "type": "전문기관",
    "region": "충청남도",
    "district": "아산시",
    "lat": 36.8079,
    "lng": 126.9791,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 599,
    "name": "예산군정신건강복지센터",
    "type": "전문기관",
    "region": "충청남도",
    "district": "예산군",
    "lat": 36.6695,
    "lng": 126.7914,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 600,
    "name": "천안시정신건강복지센터",
    "type": "전문기관",
    "region": "충청남도",
    "district": "천안시",
    "lat": 36.8139,
    "lng": 127.1986,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 601,
    "name": "청양군정신건강복지센터",
    "type": "전문기관",
    "region": "충청남도",
    "district": "청양군",
    "lat": 36.4329,
    "lng": 126.8552,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 602,
    "name": "태안군정신건강복지센터",
    "type": "전문기관",
    "region": "충청남도",
    "district": "태안군",
    "lat": 36.7124,
    "lng": 126.2886,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 603,
    "name": "홍성군정신건강복지센터",
    "type": "전문기관",
    "region": "충청남도",
    "district": "홍성군",
    "lat": 36.5643,
    "lng": 126.62,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 604,
    "name": "괴산군정신건강복지센터",
    "type": "전문기관",
    "region": "충청북도",
    "district": "괴산군",
    "lat": 36.7729,
    "lng": 127.8227,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 605,
    "name": "단양군정신건강복지센터",
    "type": "전문기관",
    "region": "충청북도",
    "district": "단양군",
    "lat": 36.988,
    "lng": 128.3794,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 606,
    "name": "보은군정신건강복지센터",
    "type": "전문기관",
    "region": "충청북도",
    "district": "보은군",
    "lat": 36.4801,
    "lng": 127.7284,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "관심",
    "lastPurchaseDate": "-",
    "consultCount": 1,
    "lastConsultDate": "2017-09-25"
  },
  {
    "id": 607,
    "name": "영동군정신건강복지센터",
    "type": "전문기관",
    "region": "충청북도",
    "district": "영동군",
    "lat": 36.1615,
    "lng": 127.81,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 608,
    "name": "옥천군정신건강복지센터",
    "type": "전문기관",
    "region": "충청북도",
    "district": "옥천군",
    "lat": 36.315,
    "lng": 127.6607,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 609,
    "name": "음성군정신건강복지센터",
    "type": "전문기관",
    "region": "충청북도",
    "district": "음성군",
    "lat": 36.9804,
    "lng": 127.6133,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 610,
    "name": "제천시정신건강복지센터",
    "type": "전문기관",
    "region": "충청북도",
    "district": "제천시",
    "lat": 37.0638,
    "lng": 128.1494,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 2,
    "lastConsultDate": "2020-10-20"
  },
  {
    "id": 611,
    "name": "증평군정신건강복지센터",
    "type": "전문기관",
    "region": "충청북도",
    "district": "증평군",
    "lat": 36.7922,
    "lng": 127.6072,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 612,
    "name": "진천군정신건강복지센터",
    "type": "전문기관",
    "region": "충청북도",
    "district": "진천군",
    "lat": 36.8742,
    "lng": 127.4492,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 613,
    "name": "충주시정신건강복지센터",
    "type": "전문기관",
    "region": "충청북도",
    "district": "충주시",
    "lat": 37.0137,
    "lng": 127.8964,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 614,
    "name": "강릉시중독관리통합지원센터",
    "type": "전문기관",
    "region": "강원특별자치도",
    "district": "강릉시",
    "lat": 37.7122,
    "lng": 128.8407,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 615,
    "name": "원주시중독관리통합지원센터",
    "type": "전문기관",
    "region": "강원특별자치도",
    "district": "원주시",
    "lat": 37.3148,
    "lng": 127.9209,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 616,
    "name": "춘천시중독관리통합지원센터",
    "type": "전문기관",
    "region": "강원특별자치도",
    "district": "춘천시",
    "lat": 37.8832,
    "lng": 127.7361,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "관심",
    "lastPurchaseDate": "-",
    "consultCount": 3,
    "lastConsultDate": "2023-06-07"
  },
  {
    "id": 617,
    "name": "고양시중독관리통합지원센터",
    "type": "전문기관",
    "region": "경기도",
    "district": "고양시",
    "lat": 37.6699,
    "lng": 126.8384,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 618,
    "name": "안산시중독관리통합지원센터",
    "type": "전문기관",
    "region": "경기도",
    "district": "안산시",
    "lat": 37.2868,
    "lng": 126.74,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 619,
    "name": "안양시중독관리통합지원센터",
    "type": "전문기관",
    "region": "경기도",
    "district": "안양시",
    "lat": 37.4065,
    "lng": 126.9319,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 620,
    "name": "용인시중독관리통합지원센터",
    "type": "전문기관",
    "region": "경기도",
    "district": "용인시",
    "lat": 37.2304,
    "lng": 127.2216,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 621,
    "name": "평택시중독관리통합지원센터",
    "type": "전문기관",
    "region": "경기도",
    "district": "평택시",
    "lat": 37.0154,
    "lng": 126.9849,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 622,
    "name": "화성시중독관리통합지원센터",
    "type": "전문기관",
    "region": "경기도",
    "district": "화성시",
    "lat": 37.1584,
    "lng": 126.8674,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 2,
    "lastConsultDate": "2016-09-26"
  },
  {
    "id": 623,
    "name": "양산시중독관리통합지원센터",
    "type": "전문기관",
    "region": "경상남도",
    "district": "양산시",
    "lat": 35.3982,
    "lng": 129.036,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "관심",
    "lastPurchaseDate": "-",
    "consultCount": 1,
    "lastConsultDate": "2022-09-22"
  },
  {
    "id": 624,
    "name": "경산시중독관리통합지원센터",
    "type": "전문기관",
    "region": "경상북도",
    "district": "경산시",
    "lat": 35.8258,
    "lng": 128.8183,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 625,
    "name": "포항시중독관리통합지원센터",
    "type": "전문기관",
    "region": "경상북도",
    "district": "포항시",
    "lat": 36.0995,
    "lng": 129.307,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 626,
    "name": "광산구중독관리통합지원센터",
    "type": "전문기관",
    "region": "광주광역시",
    "district": "광산구",
    "lat": 35.1741,
    "lng": 126.7628,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 627,
    "name": "서구중독관리통합지원센터",
    "type": "전문기관",
    "region": "광주광역시",
    "district": "서구",
    "lat": 35.1389,
    "lng": 126.8459,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 628,
    "name": "북구중독관리통합지원센터",
    "type": "전문기관",
    "region": "대구광역시",
    "district": "북구",
    "lat": 35.9196,
    "lng": 128.5824,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 629,
    "name": "수성구중독관리통합지원센터",
    "type": "전문기관",
    "region": "대구광역시",
    "district": "수성구",
    "lat": 35.8331,
    "lng": 128.6642,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 630,
    "name": "중구중독관리통합지원센터",
    "type": "전문기관",
    "region": "대전광역시",
    "district": "중구",
    "lat": 36.2891,
    "lng": 127.4047,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 631,
    "name": "동래구중독관리통합지원센터",
    "type": "전문기관",
    "region": "부산광역시",
    "district": "동래구",
    "lat": 35.2079,
    "lng": 129.0818,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 632,
    "name": "부산진구중독관리통합지원센터",
    "type": "전문기관",
    "region": "부산광역시",
    "district": "부산진구",
    "lat": 35.1653,
    "lng": 129.0363,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 633,
    "name": "사하구중독관리통합지원센터",
    "type": "전문기관",
    "region": "부산광역시",
    "district": "사하구",
    "lat": 35.0831,
    "lng": 128.9673,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 634,
    "name": "해운대구중독관리통합지원센터",
    "type": "전문기관",
    "region": "부산광역시",
    "district": "해운대구",
    "lat": 35.197,
    "lng": 129.1609,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 635,
    "name": "강남구중독관리통합지원센터",
    "type": "전문기관",
    "region": "서울특별시",
    "district": "강남구",
    "lat": 37.4933,
    "lng": 127.0669,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 636,
    "name": "강서구중독관리통합지원센터",
    "type": "전문기관",
    "region": "서울특별시",
    "district": "강서구",
    "lat": 37.5569,
    "lng": 126.8317,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 637,
    "name": "관악구중독관리통합지원센터",
    "type": "전문기관",
    "region": "서울특별시",
    "district": "관악구",
    "lat": 37.4736,
    "lng": 126.9463,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 638,
    "name": "노원구중독관리통합지원센터",
    "type": "전문기관",
    "region": "서울특별시",
    "district": "노원구",
    "lat": 37.6516,
    "lng": 127.0714,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 639,
    "name": "마포구중독관리통합지원센터",
    "type": "전문기관",
    "region": "서울특별시",
    "district": "마포구",
    "lat": 37.5558,
    "lng": 126.9177,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 640,
    "name": "성북구중독관리통합지원센터",
    "type": "전문기관",
    "region": "서울특별시",
    "district": "성북구",
    "lat": 37.6038,
    "lng": 127.0176,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 641,
    "name": "송파구중독관리통합지원센터",
    "type": "전문기관",
    "region": "서울특별시",
    "district": "송파구",
    "lat": 37.5156,
    "lng": 127.1183,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 642,
    "name": "영등포구중독관리통합지원센터",
    "type": "전문기관",
    "region": "서울특별시",
    "district": "영등포구",
    "lat": 37.5234,
    "lng": 126.9083,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 643,
    "name": "종로구중독관리통합지원센터",
    "type": "전문기관",
    "region": "서울특별시",
    "district": "종로구",
    "lat": 37.5886,
    "lng": 126.9746,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 644,
    "name": "세종시중독관리통합지원센터",
    "type": "전문기관",
    "region": "세종특별자치시",
    "district": "세종시",
    "lat": 36.5658,
    "lng": 127.2612,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 645,
    "name": "남구중독관리통합지원센터",
    "type": "전문기관",
    "region": "울산광역시",
    "district": "남구",
    "lat": 35.5207,
    "lng": 129.3235,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 646,
    "name": "남동구중독관리통합지원센터",
    "type": "전문기관",
    "region": "인천광역시",
    "district": "남동구",
    "lat": 37.4319,
    "lng": 126.7351,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 3,
    "lastConsultDate": "2018-11-07"
  },
  {
    "id": 647,
    "name": "부평구중독관리통합지원센터",
    "type": "전문기관",
    "region": "인천광역시",
    "district": "부평구",
    "lat": 37.4954,
    "lng": 126.7251,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 648,
    "name": "서구중독관리통합지원센터",
    "type": "전문기관",
    "region": "인천광역시",
    "district": "서구",
    "lat": 37.552,
    "lng": 126.6613,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 649,
    "name": "목포시중독관리통합지원센터",
    "type": "전문기관",
    "region": "전라남도",
    "district": "목포시",
    "lat": 34.8052,
    "lng": 126.3854,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 650,
    "name": "순천시중독관리통합지원센터",
    "type": "전문기관",
    "region": "전라남도",
    "district": "순천시",
    "lat": 34.9878,
    "lng": 127.3904,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 651,
    "name": "여수시중독관리통합지원센터",
    "type": "전문기관",
    "region": "전라남도",
    "district": "여수시",
    "lat": 34.6966,
    "lng": 127.6448,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 1,
    "lastConsultDate": "2019-04-01"
  },
  {
    "id": 652,
    "name": "익산시중독관리통합지원센터",
    "type": "전문기관",
    "region": "전북특별자치도",
    "district": "익산시",
    "lat": 36.033,
    "lng": 126.9978,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 653,
    "name": "서귀포시중독관리통합지원센터",
    "type": "전문기관",
    "region": "제주특별자치도",
    "district": "서귀포시",
    "lat": 33.3236,
    "lng": 126.5735,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 654,
    "name": "서산시중독관리통합지원센터",
    "type": "전문기관",
    "region": "충청남도",
    "district": "서산시",
    "lat": 36.7914,
    "lng": 126.4633,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 655,
    "name": "천안시중독관리통합지원센터",
    "type": "전문기관",
    "region": "충청남도",
    "district": "천안시",
    "lat": 36.8084,
    "lng": 127.2027,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 656,
    "name": "청주시중독관리통합지원센터",
    "type": "전문기관",
    "region": "충청북도",
    "district": "청주시",
    "lat": 36.6228,
    "lng": 127.5054,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 657,
    "name": "충주시중독관리통합지원센터",
    "type": "전문기관",
    "region": "충청북도",
    "district": "충주시",
    "lat": 37.0248,
    "lng": 127.8904,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 658,
    "name": "가야대학교 간호학과",
    "type": "전공교육",
    "region": "경상남도",
    "district": "김해시",
    "lat": 35.2735,
    "lng": 128.8405,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 659,
    "name": "가천대학교 간호/의과/보건/약학학과",
    "type": "전공교육",
    "region": "인천광역시",
    "district": "연수구",
    "lat": 37.3922,
    "lng": 126.6454,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 660,
    "name": "가톨릭관동대학교 간호학과",
    "type": "전공교육",
    "region": "강원특별자치도",
    "district": "강릉시",
    "lat": 37.7116,
    "lng": 128.8343,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "관심",
    "lastPurchaseDate": "-",
    "consultCount": 2,
    "lastConsultDate": "2023-09-14"
  },
  {
    "id": 661,
    "name": "가톨릭꽃동네대학교 간호학과",
    "type": "전공교육",
    "region": "충청북도",
    "district": "청주시",
    "lat": 36.6312,
    "lng": 127.4946,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 662,
    "name": "가톨릭대학교 의과/약학학과",
    "type": "전공교육",
    "region": "서울특별시",
    "district": "서초구",
    "lat": 37.4724,
    "lng": 127.0268,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 663,
    "name": "가톨릭대학교 간호대학 간호학과",
    "type": "전공교육",
    "region": "서울특별시",
    "district": "서초구",
    "lat": 37.4704,
    "lng": 127.0316,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 1,
    "lastConsultDate": "2020-10-27"
  },
  {
    "id": 664,
    "name": "가톨릭상지대학교 간호학과",
    "type": "전공교육",
    "region": "경상북도",
    "district": "안동시",
    "lat": 36.5756,
    "lng": 128.777,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 665,
    "name": "강동대학교 간호학과",
    "type": "전공교육",
    "region": "충청북도",
    "district": "음성군",
    "lat": 36.9778,
    "lng": 127.6146,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 666,
    "name": "강릉영동대학교 간호학과",
    "type": "전공교육",
    "region": "강원특별자치도",
    "district": "강릉시",
    "lat": 37.7064,
    "lng": 128.8334,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 667,
    "name": "강릉원주대학교 간호학과",
    "type": "전공교육",
    "region": "강원특별자치도",
    "district": "원주시",
    "lat": 37.3114,
    "lng": 127.9246,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 668,
    "name": "강서대학교 간호학과",
    "type": "전공교육",
    "region": "서울특별시",
    "district": "강서구",
    "lat": 37.5642,
    "lng": 126.8248,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 669,
    "name": "강원대학교 의과/보건/약학학과",
    "type": "전공교육",
    "region": "강원특별자치도",
    "district": "춘천시",
    "lat": 37.8883,
    "lng": 127.7365,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 670,
    "name": "강원대학교 도계캠퍼스 간호학과",
    "type": "전공교육",
    "region": "강원특별자치도",
    "district": "삼척시",
    "lat": 37.2821,
    "lng": 129.1205,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "관심",
    "lastPurchaseDate": "-",
    "consultCount": 1,
    "lastConsultDate": "2015-09-14"
  },
  {
    "id": 671,
    "name": "강원대학교(춘천) 간호학과",
    "type": "전공교육",
    "region": "강원특별자치도",
    "district": "춘천시",
    "lat": 37.8858,
    "lng": 127.7359,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 672,
    "name": "건국대학교 간호/의과학과",
    "type": "전공교육",
    "region": "충청북도",
    "district": "충주시",
    "lat": 37.0187,
    "lng": 127.8965,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 673,
    "name": "건양대학교 의과/보건학과",
    "type": "전공교육",
    "region": "대전광역시",
    "district": "서구",
    "lat": 36.2835,
    "lng": 127.3475,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 674,
    "name": "건양대학교(메디컬) 간호학과",
    "type": "전공교육",
    "region": "대전광역시",
    "district": "서구",
    "lat": 36.2808,
    "lng": 127.3499,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "관심",
    "lastPurchaseDate": "-",
    "consultCount": 2,
    "lastConsultDate": "2023-06-08"
  },
  {
    "id": 675,
    "name": "경남대학교 간호학과",
    "type": "전공교육",
    "region": "경상남도",
    "district": "창원시",
    "lat": 35.2005,
    "lng": 128.6005,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 676,
    "name": "경남정보대학교 간호학과",
    "type": "전공교육",
    "region": "부산광역시",
    "district": "사상구",
    "lat": 35.1612,
    "lng": 128.9878,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 677,
    "name": "경동대학교 간호학과",
    "type": "전공교육",
    "region": "강원특별자치도",
    "district": "원주시",
    "lat": 37.3119,
    "lng": 127.9303,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 678,
    "name": "경민대학교 간호학과",
    "type": "전공교육",
    "region": "경기도",
    "district": "의정부시",
    "lat": 37.7382,
    "lng": 127.0638,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 679,
    "name": "경복대학교(남양주) 간호학과",
    "type": "전공교육",
    "region": "경기도",
    "district": "남양주시",
    "lat": 37.6598,
    "lng": 127.2415,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 680,
    "name": "경북과학대학교 간호학과",
    "type": "전공교육",
    "region": "경상북도",
    "district": "칠곡군",
    "lat": 36.0112,
    "lng": 128.4599,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 681,
    "name": "경북대학교 간호/의과/보건/약학학과",
    "type": "전공교육",
    "region": "대구광역시",
    "district": "북구",
    "lat": 35.9248,
    "lng": 128.5751,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 682,
    "name": "경북보건대학교 간호학과",
    "type": "전공교육",
    "region": "경상북도",
    "district": "김천시",
    "lat": 36.0619,
    "lng": 128.0764,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 683,
    "name": "경북전문대학교 간호학과",
    "type": "전공교육",
    "region": "경상북도",
    "district": "영주시",
    "lat": 36.8693,
    "lng": 128.5947,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "관심",
    "lastPurchaseDate": "-",
    "consultCount": 1,
    "lastConsultDate": "2021-06-30"
  },
  {
    "id": 684,
    "name": "경성대학교 간호/약학학과",
    "type": "전공교육",
    "region": "부산광역시",
    "district": "남구",
    "lat": 35.1231,
    "lng": 129.0988,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 685,
    "name": "경운대학교 간호학과",
    "type": "전공교육",
    "region": "경상북도",
    "district": "구미시",
    "lat": 36.2089,
    "lng": 128.3565,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 686,
    "name": "경인여자대학교 간호학과",
    "type": "전공교육",
    "region": "인천광역시",
    "district": "계양구",
    "lat": 37.554,
    "lng": 126.737,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 687,
    "name": "경일대학교 간호학과",
    "type": "전공교육",
    "region": "경상북도",
    "district": "경산시",
    "lat": 35.8306,
    "lng": 128.8079,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 688,
    "name": "경희대학교 의과/약학학과",
    "type": "전공교육",
    "region": "서울특별시",
    "district": "동대문구",
    "lat": 37.5868,
    "lng": 127.0562,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "관심",
    "lastPurchaseDate": "-",
    "consultCount": 1,
    "lastConsultDate": "2019-09-16"
  },
  {
    "id": 689,
    "name": "경희대학교 서울캠퍼스 간호학과",
    "type": "전공교육",
    "region": "서울특별시",
    "district": "동대문구",
    "lat": 37.5825,
    "lng": 127.0566,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 690,
    "name": "계명문화대학교 간호학과",
    "type": "전공교육",
    "region": "대구광역시",
    "district": "달서구",
    "lat": 35.8311,
    "lng": 128.5316,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 691,
    "name": "고려대학교 간호/의과/보건학과",
    "type": "전공교육",
    "region": "서울특별시",
    "district": "성북구",
    "lat": 37.603,
    "lng": 127.0126,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 3,
    "lastConsultDate": "2020-12-11"
  },
  {
    "id": 692,
    "name": "고신대학교 간호/의과학과",
    "type": "전공교육",
    "region": "부산광역시",
    "district": "서구",
    "lat": 35.1008,
    "lng": 129.0126,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 693,
    "name": "공주대학교 간호/보건학과",
    "type": "전공교육",
    "region": "충청남도",
    "district": "공주시",
    "lat": 36.477,
    "lng": 127.0794,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 694,
    "name": "광주대학교 간호학과",
    "type": "전공교육",
    "region": "광주광역시",
    "district": "남구",
    "lat": 35.0977,
    "lng": 126.8547,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 695,
    "name": "광주보건대학교 간호학과",
    "type": "전공교육",
    "region": "광주광역시",
    "district": "광산구",
    "lat": 35.1667,
    "lng": 126.7518,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "관심",
    "lastPurchaseDate": "-",
    "consultCount": 1,
    "lastConsultDate": "2022-11-02"
  },
  {
    "id": 696,
    "name": "광주여자대학교 간호학과",
    "type": "전공교육",
    "region": "광주광역시",
    "district": "광산구",
    "lat": 35.1692,
    "lng": 126.7524,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 697,
    "name": "구미대학교 간호학과",
    "type": "전공교육",
    "region": "경상북도",
    "district": "구미시",
    "lat": 36.205,
    "lng": 128.3529,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 698,
    "name": "국군간호사관학교 간호학과",
    "type": "전공교육",
    "region": "대전광역시",
    "district": "유성구",
    "lat": 36.3775,
    "lng": 127.3309,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 8,
    "lastConsultDate": "2025-06-04"
  },
  {
    "id": 699,
    "name": "국립군산대학교 간호학과",
    "type": "전공교육",
    "region": "전북특별자치도",
    "district": "군산시",
    "lat": 35.9498,
    "lng": 126.7232,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 700,
    "name": "국립목포대학교 간호학과",
    "type": "전공교육",
    "region": "전라남도",
    "district": "무안군",
    "lat": 34.953,
    "lng": 126.4223,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 701,
    "name": "국립순천대학교 간호학과",
    "type": "전공교육",
    "region": "전라남도",
    "district": "순천시",
    "lat": 34.9996,
    "lng": 127.3895,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 702,
    "name": "국제대학교 간호학과",
    "type": "전공교육",
    "region": "경기도",
    "district": "평택시",
    "lat": 37.0114,
    "lng": 126.9888,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 703,
    "name": "극동대학교 간호학과",
    "type": "전공교육",
    "region": "충청북도",
    "district": "음성군",
    "lat": 36.9724,
    "lng": 127.6155,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 704,
    "name": "기독간호대학교 간호학과",
    "type": "전공교육",
    "region": "광주광역시",
    "district": "남구",
    "lat": 35.0968,
    "lng": 126.8558,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 705,
    "name": "김천대학교 간호학과",
    "type": "전공교육",
    "region": "경상북도",
    "district": "경상북",
    "lat": 36.4875,
    "lng": 128.8877,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 706,
    "name": "나사렛대학교 간호학과",
    "type": "전공교육",
    "region": "충청남도",
    "district": "천안시",
    "lat": 36.8091,
    "lng": 127.2028,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 707,
    "name": "남부대학교 간호학과",
    "type": "전공교육",
    "region": "광주광역시",
    "district": "광산구",
    "lat": 35.1698,
    "lng": 126.7564,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 708,
    "name": "남서울대학교 간호학과",
    "type": "전공교육",
    "region": "충청남도",
    "district": "천안시",
    "lat": 36.7992,
    "lng": 127.2047,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 2,
    "lastConsultDate": "2020-05-13"
  },
  {
    "id": 709,
    "name": "단국대학교 의과/보건/약학학과",
    "type": "전공교육",
    "region": "충청남도",
    "district": "천안시",
    "lat": 36.8059,
    "lng": 127.2029,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 710,
    "name": "단국대학교 천안캠퍼스 간호학과",
    "type": "전공교육",
    "region": "충청남도",
    "district": "천안시",
    "lat": 36.8018,
    "lng": 127.2039,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 711,
    "name": "대경대학교(경산) 간호학과",
    "type": "전공교육",
    "region": "경상북도",
    "district": "경산시",
    "lat": 35.8301,
    "lng": 128.8084,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 712,
    "name": "대구가톨릭대학교 간호/약학학과",
    "type": "전공교육",
    "region": "대구광역시",
    "district": "남구",
    "lat": 35.8345,
    "lng": 128.5897,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 713,
    "name": "대구과학대학교 간호학과",
    "type": "전공교육",
    "region": "대구광역시",
    "district": "북구",
    "lat": 35.9326,
    "lng": 128.5749,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 714,
    "name": "대구대학교 간호학과",
    "type": "전공교육",
    "region": "대구광역시",
    "district": "남구",
    "lat": 35.835,
    "lng": 128.582,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "관심",
    "lastPurchaseDate": "-",
    "consultCount": 1,
    "lastConsultDate": "2023-04-07"
  },
  {
    "id": 715,
    "name": "대구보건대학교 간호학과",
    "type": "전공교육",
    "region": "대구광역시",
    "district": "북구",
    "lat": 35.9329,
    "lng": 128.581,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 716,
    "name": "대동대학교 간호학과",
    "type": "전공교육",
    "region": "부산광역시",
    "district": "금정구",
    "lat": 35.2569,
    "lng": 129.093,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "관심",
    "lastPurchaseDate": "-",
    "consultCount": 1,
    "lastConsultDate": "2011-11-09"
  },
  {
    "id": 717,
    "name": "대원대학교 간호학과",
    "type": "전공교육",
    "region": "충청북도",
    "district": "제천시",
    "lat": 37.0612,
    "lng": 128.1374,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 718,
    "name": "대전과학기술대학교 간호학과",
    "type": "전공교육",
    "region": "대전광역시",
    "district": "서구",
    "lat": 36.283,
    "lng": 127.3456,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 719,
    "name": "대전대학교 간호학과",
    "type": "전공교육",
    "region": "대전광역시",
    "district": "동구",
    "lat": 36.3269,
    "lng": 127.4754,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 720,
    "name": "대전보건대학교 간호학과",
    "type": "전공교육",
    "region": "대전광역시",
    "district": "동구",
    "lat": 36.3191,
    "lng": 127.4733,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 721,
    "name": "대진대학교 간호학과",
    "type": "전공교육",
    "region": "경기도",
    "district": "포천시",
    "lat": 37.9651,
    "lng": 127.2547,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 722,
    "name": "덕성여자대학교 약학학과",
    "type": "전공교육",
    "region": "서울특별시",
    "district": "도봉구",
    "lat": 37.6731,
    "lng": 127.0358,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 723,
    "name": "동강대학교 간호학과",
    "type": "전공교육",
    "region": "광주광역시",
    "district": "북구",
    "lat": 35.1911,
    "lng": 126.9211,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 724,
    "name": "동남보건대학교 간호학과",
    "type": "전공교육",
    "region": "경기도",
    "district": "수원시",
    "lat": 37.2842,
    "lng": 127.0122,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 2,
    "lastConsultDate": "2018-04-20"
  },
  {
    "id": 725,
    "name": "동덕여자대학교 약학학과",
    "type": "전공교육",
    "region": "서울특별시",
    "district": "성북구",
    "lat": 37.6016,
    "lng": 127.0172,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 726,
    "name": "동명대학교 간호학과",
    "type": "전공교육",
    "region": "부산광역시",
    "district": "남구",
    "lat": 35.1211,
    "lng": 129.097,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 727,
    "name": "동서대학교 간호학과",
    "type": "전공교육",
    "region": "부산광역시",
    "district": "사상구",
    "lat": 35.1606,
    "lng": 128.9829,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 728,
    "name": "동신대학교 간호학과",
    "type": "전공교육",
    "region": "전라남도",
    "district": "나주시",
    "lat": 34.9884,
    "lng": 126.7209,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 729,
    "name": "동아대학교 간호/의과학과",
    "type": "전공교육",
    "region": "부산광역시",
    "district": "서구",
    "lat": 35.1003,
    "lng": 129.0186,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 1,
    "lastConsultDate": "2021-06-24"
  },
  {
    "id": 730,
    "name": "동양대학교(영주) 간호학과",
    "type": "전공교육",
    "region": "경상북도",
    "district": "영주시",
    "lat": 36.8698,
    "lng": 128.5947,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 731,
    "name": "동의과학대학교 간호학과",
    "type": "전공교육",
    "region": "부산광역시",
    "district": "부산진구",
    "lat": 35.1659,
    "lng": 129.0468,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 732,
    "name": "동의대학교 간호학과",
    "type": "전공교육",
    "region": "부산광역시",
    "district": "부산진구",
    "lat": 35.1625,
    "lng": 129.0426,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 733,
    "name": "두원공과대학교(안성) 간호학과",
    "type": "전공교육",
    "region": "경기도",
    "district": "안성시",
    "lat": 37.04,
    "lng": 127.3044,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 734,
    "name": "두원공과대학교(파주) 간호학과",
    "type": "전공교육",
    "region": "경기도",
    "district": "파주시",
    "lat": 37.851,
    "lng": 126.8153,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 735,
    "name": "목포가톨릭대학교 간호학과",
    "type": "전공교육",
    "region": "전라남도",
    "district": "목포시",
    "lat": 34.7992,
    "lng": 126.3878,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 736,
    "name": "문경대학교 간호학과",
    "type": "전공교육",
    "region": "경상북도",
    "district": "문경시",
    "lat": 36.6891,
    "lng": 128.1497,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 737,
    "name": "배재대학교 간호학과",
    "type": "전공교육",
    "region": "대전광역시",
    "district": "서구",
    "lat": 36.2777,
    "lng": 127.3424,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 1,
    "lastConsultDate": "2021-08-18"
  },
  {
    "id": 738,
    "name": "백석대학교 간호학과",
    "type": "전공교육",
    "region": "충청남도",
    "district": "천안시",
    "lat": 36.7998,
    "lng": 127.2038,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 739,
    "name": "백석문화대학교 간호학과",
    "type": "전공교육",
    "region": "충청남도",
    "district": "천안시",
    "lat": 36.8014,
    "lng": 127.2066,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 740,
    "name": "부경대학교 간호학과",
    "type": "전공교육",
    "region": "부산광역시",
    "district": "남구",
    "lat": 35.129,
    "lng": 129.0901,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 741,
    "name": "부산가톨릭대학교 간호학과",
    "type": "전공교육",
    "region": "부산광역시",
    "district": "금정구",
    "lat": 35.2563,
    "lng": 129.0933,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 742,
    "name": "부산과학기술대학교 간호학과",
    "type": "전공교육",
    "region": "부산광역시",
    "district": "북구",
    "lat": 35.2263,
    "lng": 129.0196,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 743,
    "name": "부산대학교 간호/의과/보건/약학학과",
    "type": "전공교육",
    "region": "경상남도",
    "district": "양산시",
    "lat": 35.4062,
    "lng": 129.0417,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 744,
    "name": "부산보건대학교 간호학과",
    "type": "전공교육",
    "region": "부산광역시",
    "district": "사하구",
    "lat": 35.0858,
    "lng": 128.9734,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 745,
    "name": "부산여자대학교 간호학과",
    "type": "전공교육",
    "region": "부산광역시",
    "district": "부산진구",
    "lat": 35.1686,
    "lng": 129.0414,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 746,
    "name": "부천대학교(소사) 간호학과",
    "type": "전공교육",
    "region": "경기도",
    "district": "부천시",
    "lat": 37.5002,
    "lng": 126.7881,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 747,
    "name": "삼육대학교 간호/보건/약학학과",
    "type": "전공교육",
    "region": "서울특별시",
    "district": "노원구",
    "lat": 37.6517,
    "lng": 127.0748,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "관심",
    "lastPurchaseDate": "-",
    "consultCount": 1,
    "lastConsultDate": "2021-06-15"
  },
  {
    "id": 748,
    "name": "삼육보건대학교 간호학과",
    "type": "전공교육",
    "region": "서울특별시",
    "district": "동대문구",
    "lat": 37.5842,
    "lng": 127.0565,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 1,
    "lastConsultDate": "2019-11-29"
  },
  {
    "id": 749,
    "name": "상명대학교 간호학과",
    "type": "전공교육",
    "region": "충청남도",
    "district": "천안시",
    "lat": 36.8089,
    "lng": 127.1985,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 750,
    "name": "상지대학교 간호학과",
    "type": "전공교육",
    "region": "강원특별자치도",
    "district": "원주시",
    "lat": 37.3073,
    "lng": 127.9279,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 751,
    "name": "서영대학교(광주) 간호학과",
    "type": "전공교육",
    "region": "광주광역시",
    "district": "북구",
    "lat": 35.1966,
    "lng": 126.923,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 752,
    "name": "서영대학교(파주) 간호학과",
    "type": "전공교육",
    "region": "경기도",
    "district": "파주시",
    "lat": 37.8485,
    "lng": 126.8146,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 753,
    "name": "서울대학교 간호/의과/보건/약학학과",
    "type": "전공교육",
    "region": "서울특별시",
    "district": "종로구",
    "lat": 37.594,
    "lng": 126.9752,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 754,
    "name": "서울여자간호대학교 간호학과",
    "type": "전공교육",
    "region": "서울특별시",
    "district": "서대문구",
    "lat": 37.5753,
    "lng": 126.9434,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 755,
    "name": "서일대학교 간호학과",
    "type": "전공교육",
    "region": "서울특별시",
    "district": "중랑구",
    "lat": 37.5971,
    "lng": 127.0965,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 756,
    "name": "서정대학교 간호학과",
    "type": "전공교육",
    "region": "경기도",
    "district": "양주시",
    "lat": 37.8091,
    "lng": 126.9967,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 757,
    "name": "선린대학교 간호학과",
    "type": "전공교육",
    "region": "경상북도",
    "district": "포항시",
    "lat": 36.0978,
    "lng": 129.3089,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 758,
    "name": "선문대학교 간호학과",
    "type": "전공교육",
    "region": "충청남도",
    "district": "아산시",
    "lat": 36.8121,
    "lng": 126.9844,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 759,
    "name": "성균관대학교 의과/약학학과",
    "type": "전공교육",
    "region": "경기도",
    "district": "수원시",
    "lat": 37.2839,
    "lng": 127.0044,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 1,
    "lastConsultDate": "2015-11-05"
  },
  {
    "id": 760,
    "name": "성신여자대학교 간호학과",
    "type": "전공교육",
    "region": "서울특별시",
    "district": "성북구",
    "lat": 37.6056,
    "lng": 127.0144,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 761,
    "name": "세경대학교 간호학과",
    "type": "전공교육",
    "region": "강원특별자치도",
    "district": "영월군",
    "lat": 37.203,
    "lng": 128.4958,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 762,
    "name": "세명대학교 간호학과",
    "type": "전공교육",
    "region": "충청북도",
    "district": "제천시",
    "lat": 37.0589,
    "lng": 128.1458,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 763,
    "name": "세한대학교 영암캠퍼스 간호학과",
    "type": "전공교육",
    "region": "전라남도",
    "district": "영암군",
    "lat": 34.7947,
    "lng": 126.629,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 764,
    "name": "송곡대학교 간호학과",
    "type": "전공교육",
    "region": "강원특별자치도",
    "district": "춘천시",
    "lat": 37.8895,
    "lng": 127.7391,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 765,
    "name": "송원대학교 간호학과",
    "type": "전공교육",
    "region": "광주광역시",
    "district": "남구",
    "lat": 35.0985,
    "lng": 126.8616,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 766,
    "name": "송호대학교 간호학과",
    "type": "전공교육",
    "region": "강원특별자치도",
    "district": "횡성군",
    "lat": 37.5096,
    "lng": 128.0793,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 767,
    "name": "수성대학교 간호학과",
    "type": "전공교육",
    "region": "대구광역시",
    "district": "수성구",
    "lat": 35.8302,
    "lng": 128.6592,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 768,
    "name": "수원과학대학교 간호학과",
    "type": "전공교육",
    "region": "경기도",
    "district": "화성시",
    "lat": 37.1723,
    "lng": 126.8696,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 769,
    "name": "수원대학교 간호학과",
    "type": "전공교육",
    "region": "경기도",
    "district": "화성시",
    "lat": 37.168,
    "lng": 126.8713,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 770,
    "name": "수원여자대학교 간호학과",
    "type": "전공교육",
    "region": "경기도",
    "district": "화성시",
    "lat": 37.1632,
    "lng": 126.8696,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 771,
    "name": "숙명여자대학교 약학학과",
    "type": "전공교육",
    "region": "서울특별시",
    "district": "용산구",
    "lat": 37.5313,
    "lng": 126.9832,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 772,
    "name": "순천대학교 약학학과",
    "type": "전공교육",
    "region": "전라남도",
    "district": "순천시",
    "lat": 34.9912,
    "lng": 127.394,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 773,
    "name": "신라대학교 간호/보건학과",
    "type": "전공교육",
    "region": "부산광역시",
    "district": "사상구",
    "lat": 35.1537,
    "lng": 128.9835,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 774,
    "name": "신성대학교 간호학과",
    "type": "전공교육",
    "region": "충청남도",
    "district": "당진시",
    "lat": 36.9055,
    "lng": 126.654,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 775,
    "name": "신한대학교(동두천) 간호학과",
    "type": "전공교육",
    "region": "경기도",
    "district": "동두천시",
    "lat": 37.914,
    "lng": 127.0741,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 776,
    "name": "아주대학교 간호/의과/보건/약학학과",
    "type": "전공교육",
    "region": "경기도",
    "district": "수원시",
    "lat": 37.2843,
    "lng": 127.0052,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 777,
    "name": "안동대학교 간호학과",
    "type": "전공교육",
    "region": "경상북도",
    "district": "안동시",
    "lat": 36.5812,
    "lng": 128.7812,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 778,
    "name": "안산대학교 간호학과",
    "type": "전공교육",
    "region": "경기도",
    "district": "안산시",
    "lat": 37.2902,
    "lng": 126.7483,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 779,
    "name": "여주대학교 간호학과",
    "type": "전공교육",
    "region": "경기도",
    "district": "여주시",
    "lat": 37.3027,
    "lng": 127.6201,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 780,
    "name": "연성대학교 간호학과",
    "type": "전공교육",
    "region": "경기도",
    "district": "안양시",
    "lat": 37.3997,
    "lng": 126.9301,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 781,
    "name": "연세대학교 의과/보건/약학학과",
    "type": "전공교육",
    "region": "서울특별시",
    "district": "서대문구",
    "lat": 37.5752,
    "lng": 126.9382,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 1,
    "lastConsultDate": "2021-06-08"
  },
  {
    "id": 782,
    "name": "연세대학교 미래캠퍼스 간호학과",
    "type": "전공교육",
    "region": "강원특별자치도",
    "district": "원주시",
    "lat": 37.31,
    "lng": 127.9275,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 783,
    "name": "연세대학교(신촌) 간호학과",
    "type": "전공교육",
    "region": "서울특별시",
    "district": "서대문구",
    "lat": 37.576,
    "lng": 126.9417,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 784,
    "name": "연세대학교(원주) 의과/보건학과",
    "type": "전공교육",
    "region": "강원특별자치도",
    "district": "원주시",
    "lat": 37.304,
    "lng": 127.9291,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 785,
    "name": "영남대학교 의과/약학학과",
    "type": "전공교육",
    "region": "대구광역시",
    "district": "남구",
    "lat": 35.84,
    "lng": 128.5902,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 786,
    "name": "영남이공대학교 간호학과",
    "type": "전공교육",
    "region": "대구광역시",
    "district": "남구",
    "lat": 35.8307,
    "lng": 128.5823,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 787,
    "name": "영산대학교 간호학과",
    "type": "전공교육",
    "region": "경상남도",
    "district": "양산시",
    "lat": 35.3995,
    "lng": 129.0453,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 788,
    "name": "영진전문대학교(복현) 간호학과",
    "type": "전공교육",
    "region": "대구광역시",
    "district": "북구",
    "lat": 35.9326,
    "lng": 128.5811,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "관심",
    "lastPurchaseDate": "-",
    "consultCount": 1,
    "lastConsultDate": "2024-11-20"
  },
  {
    "id": 789,
    "name": "예수대학교 간호학과",
    "type": "전공교육",
    "region": "전북특별자치도",
    "district": "전주시",
    "lat": 35.827,
    "lng": 127.1124,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 790,
    "name": "용인예술과학대학교 간호학과",
    "type": "전공교육",
    "region": "경기도",
    "district": "용인시",
    "lat": 37.2248,
    "lng": 127.2236,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 791,
    "name": "우석대학교 간호학과",
    "type": "전공교육",
    "region": "전북특별자치도",
    "district": "완주군",
    "lat": 35.9199,
    "lng": 127.2201,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 792,
    "name": "우송대학교 간호학과",
    "type": "전공교육",
    "region": "대전광역시",
    "district": "동구",
    "lat": 36.3256,
    "lng": 127.4702,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 793,
    "name": "우송정보대학 간호학과",
    "type": "전공교육",
    "region": "대전광역시",
    "district": "동구",
    "lat": 36.3273,
    "lng": 127.4731,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 794,
    "name": "울산과학대학교 간호학과",
    "type": "전공교육",
    "region": "울산광역시",
    "district": "동구",
    "lat": 35.527,
    "lng": 129.4306,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 795,
    "name": "울산대학교 간호학과",
    "type": "전공교육",
    "region": "울산광역시",
    "district": "남구",
    "lat": 35.5118,
    "lng": 129.3256,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 796,
    "name": "울산대학교(서울아산병원) 의과학과",
    "type": "전공교육",
    "region": "서울특별시",
    "district": "송파구",
    "lat": 37.5019,
    "lng": 127.1156,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 797,
    "name": "원광대학교 간호/의과/보건/약학학과",
    "type": "전공교육",
    "region": "전북특별자치도",
    "district": "익산시",
    "lat": 36.0209,
    "lng": 126.9905,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 798,
    "name": "위덕대학교 간호학과",
    "type": "전공교육",
    "region": "경상북도",
    "district": "경주시",
    "lat": 35.8289,
    "lng": 129.233,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 799,
    "name": "유원대학교 간호학과",
    "type": "전공교육",
    "region": "충청북도",
    "district": "영동군",
    "lat": 36.1609,
    "lng": 127.8118,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 800,
    "name": "을지대학교 보건학과",
    "type": "전공교육",
    "region": "경기도",
    "district": "성남시",
    "lat": 37.4073,
    "lng": 127.1204,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 801,
    "name": "을지대학교 성남캠퍼스 간호학과",
    "type": "전공교육",
    "region": "경기도",
    "district": "성남시",
    "lat": 37.4109,
    "lng": 127.1122,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 802,
    "name": "을지대학교 의정부캠퍼스 간호학과",
    "type": "전공교육",
    "region": "경기도",
    "district": "의정부시",
    "lat": 37.7354,
    "lng": 127.0661,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 803,
    "name": "인제대학교 간호/의과/보건/약학학과",
    "type": "전공교육",
    "region": "부산광역시",
    "district": "부산진구",
    "lat": 35.1605,
    "lng": 129.0472,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "관심",
    "lastPurchaseDate": "-",
    "consultCount": 1,
    "lastConsultDate": "2012-10-04"
  },
  {
    "id": 804,
    "name": "인천가톨릭대학교 간호학과",
    "type": "전공교육",
    "region": "인천광역시",
    "district": "연수구",
    "lat": 37.3958,
    "lng": 126.6458,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 805,
    "name": "인하대학교 간호/의과학과",
    "type": "전공교육",
    "region": "인천광역시",
    "district": "미추홀구",
    "lat": 37.455,
    "lng": 126.6652,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "관심",
    "lastPurchaseDate": "-",
    "consultCount": 1,
    "lastConsultDate": "2024-04-25"
  },
  {
    "id": 806,
    "name": "재능대학교 간호학과",
    "type": "전공교육",
    "region": "인천광역시",
    "district": "동구",
    "lat": 37.4825,
    "lng": 126.6344,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 807,
    "name": "전남대학교 간호/의과/보건/약학학과",
    "type": "전공교육",
    "region": "광주광역시",
    "district": "동구",
    "lat": 35.1128,
    "lng": 126.9533,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 808,
    "name": "제주대학교 간호/의과/보건/약학학과",
    "type": "전공교육",
    "region": "제주특별자치도",
    "district": "제주시",
    "lat": 33.4468,
    "lng": 126.5301,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 1,
    "lastConsultDate": "2022-03-10"
  },
  {
    "id": 809,
    "name": "조선간호대학교 간호학과",
    "type": "전공교육",
    "region": "광주광역시",
    "district": "동구",
    "lat": 35.1203,
    "lng": 126.9503,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 810,
    "name": "조선대학교 간호/의과/약학학과",
    "type": "전공교육",
    "region": "광주광역시",
    "district": "동구",
    "lat": 35.1135,
    "lng": 126.9458,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 1,
    "lastConsultDate": "2019-03-26"
  },
  {
    "id": 811,
    "name": "중부대학교 간호학과",
    "type": "전공교육",
    "region": "충청남도",
    "district": "금산군",
    "lat": 36.1171,
    "lng": 127.4823,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 812,
    "name": "중앙대학교 의과/약학학과",
    "type": "전공교육",
    "region": "서울특별시",
    "district": "동작구",
    "lat": 37.5018,
    "lng": 126.9554,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "관심",
    "lastPurchaseDate": "-",
    "consultCount": 2,
    "lastConsultDate": "2023-12-08"
  },
  {
    "id": 813,
    "name": "중앙대학교 적십자간호대학 간호학과",
    "type": "전공교육",
    "region": "서울특별시",
    "district": "동작구",
    "lat": 37.5028,
    "lng": 126.9489,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 814,
    "name": "중원대학교(괴산) 간호학과",
    "type": "전공교육",
    "region": "충청북도",
    "district": "괴산군",
    "lat": 36.7672,
    "lng": 127.8256,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 815,
    "name": "차의과학대학교 간호/의과/약학학과",
    "type": "전공교육",
    "region": "경기도",
    "district": "포천시",
    "lat": 37.9727,
    "lng": 127.2542,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 816,
    "name": "창신대학교 간호학과",
    "type": "전공교육",
    "region": "경상남도",
    "district": "창원시",
    "lat": 35.2008,
    "lng": 128.6012,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 817,
    "name": "창원대학교 간호학과",
    "type": "전공교육",
    "region": "경상남도",
    "district": "창원시",
    "lat": 35.1982,
    "lng": 128.6043,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 818,
    "name": "청운대학교 홍성캠퍼스 간호학과",
    "type": "전공교육",
    "region": "충청남도",
    "district": "홍성군",
    "lat": 36.5737,
    "lng": 126.6306,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "관심",
    "lastPurchaseDate": "-",
    "consultCount": 1,
    "lastConsultDate": "2019-09-24"
  },
  {
    "id": 819,
    "name": "청주대학교 간호학과",
    "type": "전공교육",
    "region": "충청북도",
    "district": "청주시",
    "lat": 36.6304,
    "lng": 127.5025,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 820,
    "name": "초당대학교 간호학과",
    "type": "전공교육",
    "region": "전라남도",
    "district": "무안군",
    "lat": 34.9492,
    "lng": 126.4275,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 821,
    "name": "춘해보건대학교 간호학과",
    "type": "전공교육",
    "region": "울산광역시",
    "district": "울주군",
    "lat": 35.5445,
    "lng": 129.1918,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 822,
    "name": "충남대학교 간호/의과/보건/약학학과",
    "type": "전공교육",
    "region": "대전광역시",
    "district": "중구",
    "lat": 36.2838,
    "lng": 127.4147,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 2,
    "lastConsultDate": "2020-05-08"
  },
  {
    "id": 823,
    "name": "충북대학교 간호/의과/약학학과",
    "type": "전공교육",
    "region": "충청북도",
    "district": "청주시",
    "lat": 36.6304,
    "lng": 127.4964,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 824,
    "name": "충북보건과학대학교 간호학과",
    "type": "전공교육",
    "region": "충청북도",
    "district": "청주시",
    "lat": 36.6302,
    "lng": 127.4948,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 1,
    "lastConsultDate": "2019-06-28"
  },
  {
    "id": 825,
    "name": "충청대학교 간호학과",
    "type": "전공교육",
    "region": "충청북도",
    "district": "청주시",
    "lat": 36.631,
    "lng": 127.5023,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 826,
    "name": "한국교통대학교 증평캠퍼스 간호학과",
    "type": "전공교육",
    "region": "충청북도",
    "district": "증평군",
    "lat": 36.7836,
    "lng": 127.6079,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 827,
    "name": "한국성서대학교 간호학과",
    "type": "전공교육",
    "region": "서울특별시",
    "district": "노원구",
    "lat": 37.6521,
    "lng": 127.0732,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 828,
    "name": "한남대학교 간호학과",
    "type": "전공교육",
    "region": "대전광역시",
    "district": "대덕구",
    "lat": 36.4153,
    "lng": 127.4374,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 829,
    "name": "한림대학교 간호/의과학과",
    "type": "전공교육",
    "region": "강원특별자치도",
    "district": "춘천시",
    "lat": 37.8851,
    "lng": 127.7368,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "고려",
    "lastPurchaseDate": "-",
    "consultCount": 1,
    "lastConsultDate": "2018-05-28"
  },
  {
    "id": 830,
    "name": "한림성심대학교 간호학과",
    "type": "전공교육",
    "region": "강원특별자치도",
    "district": "춘천시",
    "lat": 37.8882,
    "lng": 127.7435,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 831,
    "name": "한서대학교 간호학과",
    "type": "전공교육",
    "region": "충청남도",
    "district": "서산시",
    "lat": 36.7895,
    "lng": 126.4611,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 832,
    "name": "한세대학교 간호학과",
    "type": "전공교육",
    "region": "경기도",
    "district": "군포시",
    "lat": 37.3449,
    "lng": 126.9202,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 833,
    "name": "한일장신대학교 간호학과",
    "type": "전공교육",
    "region": "전북특별자치도",
    "district": "완주군",
    "lat": 35.9236,
    "lng": 127.2156,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 834,
    "name": "혜전대학교 간호학과",
    "type": "전공교육",
    "region": "충청남도",
    "district": "홍성군",
    "lat": 36.5745,
    "lng": 126.622,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 835,
    "name": "호남대학교 간호학과",
    "type": "전공교육",
    "region": "광주광역시",
    "district": "광산구",
    "lat": 35.1698,
    "lng": 126.7496,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 836,
    "name": "호서대학교 간호학과",
    "type": "전공교육",
    "region": "충청남도",
    "district": "아산시",
    "lat": 36.812,
    "lng": 126.9778,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 837,
    "name": "호원대학교 간호학과",
    "type": "전공교육",
    "region": "전북특별자치도",
    "district": "군산시",
    "lat": 35.9451,
    "lng": 126.7185,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  },
  {
    "id": 838,
    "name": "화성의과학대학교 간호학과",
    "type": "전공교육",
    "region": "경기도",
    "district": "화성시",
    "lat": 37.1699,
    "lng": 126.8669,
    "products": [
      "알쓰패치"
    ],
    "purchaseCycle": "-",
    "purchaseVolume": 0,
    "purchaseAmount": 0,
    "purchaseStage": "인지",
    "lastPurchaseDate": "-",
    "consultCount": 0,
    "lastConsultDate": ""
  }
];
