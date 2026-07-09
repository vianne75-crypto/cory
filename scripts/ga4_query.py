#!/usr/bin/env python3
# ============================================================
# GA4 Data API 조회 — KISS 랜딩 퍼널(방문·폼진입·신청·진단·플라이휠)
# 서비스 계정 방식(재로그인 불필요).
#
# 사전 셋팅(대표 1회):
#   1) Google Cloud Console → 프로젝트 → "Google Analytics Data API" 사용 설정
#   2) 서비스 계정 생성 → JSON 키 다운로드 → cory/_SECRET/ga4-service-account.json 로 저장
#   3) GA4 관리 → 속성 액세스 관리 → 서비스계정 이메일을 "뷰어"로 추가
#   4) GA4 관리 → 속성 설정 → "속성 ID"(숫자) 확인
#
# 실행:
#   GA4_PROPERTY_ID=123456789 python3 scripts/ga4_query.py [시작일 종료일]
#   예: GA4_PROPERTY_ID=xxxx python3 scripts/ga4_query.py 2026-07-06 2026-07-09
#   (날짜 생략 시 today 하루)
# ============================================================
import os, sys, json, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
KEY = os.environ.get('GA4_KEY', os.path.join(HERE, '..', '_SECRET', 'ga4-service-account.json'))
PROP = os.environ.get('GA4_PROPERTY_ID')

if not os.path.exists(KEY):
    sys.exit(f"❌ 서비스 계정 키 없음: {KEY}\n   → Google Cloud에서 JSON 키 받아 이 경로에 저장하세요.")
if not PROP:
    sys.exit("❌ GA4_PROPERTY_ID 환경변수 필요 (GA4 관리→속성설정의 숫자 ID).\n   예: GA4_PROPERTY_ID=123456789 python3 scripts/ga4_query.py")

# 날짜
args = sys.argv[1:]
if len(args) >= 2:
    start, end = args[0], args[1]
else:
    start = end = 'today'

# 서비스 계정 → 액세스 토큰
from google.oauth2 import service_account
import google.auth.transport.requests
creds = service_account.Credentials.from_service_account_file(
    KEY, scopes=['https://www.googleapis.com/auth/analytics.readonly'])
creds.refresh(google.auth.transport.requests.Request())
token = creds.token

# GA4 Data API runReport: 이벤트별 카운트
body = {
    "dateRanges": [{"startDate": start, "endDate": end}],
    "dimensions": [{"name": "eventName"}],
    "metrics": [{"name": "eventCount"}],
    "limit": 200,
}
req = urllib.request.Request(
    f"https://analyticsdata.googleapis.com/v1beta/properties/{PROP}:runReport",
    data=json.dumps(body).encode(),
    headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    method="POST",
)
resp = json.load(urllib.request.urlopen(req))

counts = {}
for row in resp.get("rows", []):
    name = row["dimensionValues"][0]["value"]
    cnt = int(row["metricValues"][0]["value"])
    counts[name] = cnt

def g(k): return counts.get(k, 0)

print(f"=== GA4 KISS 퍼널 ({start} ~ {end}) 속성 {PROP} ===\n")
pv = g("page_view")
funnel = [
    ("page_view",        "① QR 접속·방문"),
    ("kiss_apply_start", "② 폼 진입"),
    ("kiss_signup",      "③ 신청 완료 ⭐"),
    ("diag_open",        "  진단 열림"),
    ("kiss_diag_submit", "  진단 제출"),
    ("kiss_flywheel",    "  플라이휠 선택"),
]
for ev, label in funnel:
    c = g(ev)
    pct = f"({100*c/pv:.0f}% of 방문)" if pv and ev != "page_view" else ""
    print(f"  {label:<16} {ev:<18} {c:>6}  {pct}")

print()
if pv:
    ast = g("kiss_apply_start"); sg = g("kiss_signup")
    print(f"  폼 진입율  = {100*ast/pv:.1f}%  (방문→폼)")
    if ast:
        print(f"  폼 완료율  = {100*sg/ast:.1f}%  (폼진입→신청) ⭐")
    print(f"  전체 전환  = {100*sg/pv:.1f}%  (방문→신청)")
else:
    print("  page_view 0 — 기간 내 방문 없음(또는 이벤트 미수집).")

# 원본 전체 이벤트(참고)
print("\n[전체 이벤트]", {k: v for k, v in sorted(counts.items(), key=lambda x: -x[1])})
