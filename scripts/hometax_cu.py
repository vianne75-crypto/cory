#!/usr/bin/env python3
"""
홈택스 전자세금계산서 자동 발행 — Claude Computer Use
-------------------------------------------------
사용법:
  python3 scripts/hometax_cu.py

설치 (최초 1회):
  pip3 install anthropic pyautogui pyperclip pillow

흐름:
  1. 홈택스 Chrome 자동 오픈
  2. 사용자 공동인증서 로그인 (수동)
  3. Claude가 화면 보면서 건별발급 자동 입력
  4. 발급 버튼 직전 사용자 확인 요청
"""

import anthropic
import pyautogui
import pyperclip
import subprocess
import base64
import time
import io
import os
from PIL import Image

# ── 발행 정보 (여기만 수정) ─────────────────────────────────────
INVOICE = {
    "date":     "2026-03-24",
    "receiver": {
        "type":   "non-business",      # 'business' | 'non-business'
        "reg_no": "505-83-00264",      # 고유번호 / 사업자번호
        "name":   "경주시보건소",
        "ceo":    "진병철",
        "addr":   "경상북도 경주시 양정로 300(동천동)",
    },
    "items": [
        {
            "name":       "APS알쓰패치",
            "qty":        500,
            "unit_price": 1909,
            "supply_amt": 954545,
            "tax_amt":    95455,
        }
    ],
    "billing_type": "청구",            # '영수' | '청구'
    "memo":         "주문번호 137565",
}
# ──────────────────────────────────────────────────────────────

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
MODEL = "claude-opus-4-6"

# macOS Retina 대응
DISPLAY_SCALE = 2 if pyautogui.size()[0] < 2560 else 1
MAX_TURNS = 50  # 무한루프 방지

pyautogui.FAILSAFE = True  # 마우스를 화면 모서리로 이동 시 중단


def screenshot_b64() -> str:
    img = pyautogui.screenshot()
    w, h = img.size
    if DISPLAY_SCALE == 2:
        img = img.resize((w // 2, h // 2), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.standard_b64encode(buf.getvalue()).decode()


def click(x: int, y: int):
    pyautogui.click(x * DISPLAY_SCALE, y * DISPLAY_SCALE)
    time.sleep(0.5)


def double_click(x: int, y: int):
    pyautogui.doubleClick(x * DISPLAY_SCALE, y * DISPLAY_SCALE)
    time.sleep(0.5)


def type_text(text: str):
    """한글 포함 텍스트: 클립보드 경유 붙여넣기"""
    pyperclip.copy(text)
    time.sleep(0.1)
    pyautogui.hotkey("command", "v")
    time.sleep(0.4)


def press_key(key: str):
    keys = key.replace("+", " ").split()
    if len(keys) == 1:
        pyautogui.press(keys[0])
    else:
        pyautogui.hotkey(*keys)
    time.sleep(0.35)


def scroll(x: int, y: int, direction: str, amount: int = 3):
    pyautogui.moveTo(x * DISPLAY_SCALE, y * DISPLAY_SCALE)
    pyautogui.scroll(-amount if direction == "down" else amount)
    time.sleep(0.4)


def execute_action(action: dict) -> str:
    """Claude 요청 액션 실행 → 최신 스크린샷 반환"""
    a = action.get("action")
    coord = action.get("coordinate", [0, 0])

    if a == "screenshot":
        return screenshot_b64()
    elif a == "left_click":
        click(*coord)
    elif a == "double_click":
        double_click(*coord)
    elif a == "right_click":
        pyautogui.rightClick(coord[0] * DISPLAY_SCALE, coord[1] * DISPLAY_SCALE)
        time.sleep(0.4)
    elif a == "type":
        type_text(action.get("text", ""))
    elif a == "key":
        press_key(action.get("text", action.get("key", "")))
    elif a == "scroll":
        scroll(*coord, action.get("direction", "down"), action.get("amount", 3))
    elif a == "mouse_move":
        pyautogui.moveTo(coord[0] * DISPLAY_SCALE, coord[1] * DISPLAY_SCALE)
        time.sleep(0.25)

    # 액션 후 화면 안정화 대기 + 캡처
    time.sleep(0.7)
    return screenshot_b64()


def build_system_prompt() -> str:
    inv = INVOICE
    item = inv["items"][0]
    return f"""당신은 홈택스 전자세금계산서 건별발급을 수행하는 자동화 에이전트입니다.
현재 macOS Chrome에서 홈택스가 열려 있고, 로그인이 완료된 상태입니다.

━━━ 발행 정보 ━━━
작성일자:   {inv['date']}
공급받는자: {inv['receiver']['name']}
등록번호:   {inv['receiver']['reg_no']}  (고유번호 — 비사업자 탭 사용)
대표자:     {inv['receiver']['ceo']}
소재지:     {inv['receiver']['addr']}
품목:       {item['name']}
수량:       {item['qty']}개
단가:       {item['unit_price']:,}원
공급가액:   {item['supply_amt']:,}원
세액:       {item['tax_amt']:,}원
합계:       {item['supply_amt'] + item['tax_amt']:,}원
영수/청구:  {inv['billing_type']}
비고:       {inv['memo']}

━━━ 수행 순서 ━━━
1. 상단 메뉴 "조회/발급" 클릭
2. 드롭다운에서 "전자세금계산서" 클릭
3. "발급" → "건별발급" 클릭
4. 작성일자 입력: {inv['date'].replace('-', '')} (YYYYMMDD 형식)
5. 공급받는자 구분: "사업자 외" 또는 "비사업자" 탭 선택
6. 등록번호 {inv['receiver']['reg_no']} 입력 → 확인/조회 클릭
7. 대표자 "{inv['receiver']['ceo']}" 확인 — 다르면 수정
8. 품목 행: 월({inv['date'][5:7]}), 일({inv['date'][8:10]}), 품목명, 수량, 단가, 공급가액, 세액 입력
9. 영수/청구에서 "{inv['billing_type']}" 선택
10. 비고에 "{inv['memo']}" 입력
11. ⚠️ 발급 버튼 직전 반드시 멈추고:
    "모든 입력이 완료되었습니다. 화면을 확인하신 후 발급 버튼을 눌러주세요." 출력
    절대 발급 버튼을 직접 클릭하지 마세요.

━━━ WebSquare UI 주의사항 ━━━
- 홈택스는 비표준 WebSquare 프레임워크 사용 — 일반 HTML 규칙 비적용
- 각 클릭 후 반드시 페이지 로딩 완료 확인 (스크린샷으로 검증)
- 입력 필드: 클릭 → 전체선택(Ctrl+A) → 입력
- 팝업/모달 발생 시: 내용 확인 → 확인/닫기 클릭 → 계속 진행
- 버튼을 찾지 못하면 스크롤하여 탐색
- 같은 액션 2회 이상 반복 실패 시 다른 방법 시도
"""


def main():
    if not ANTHROPIC_API_KEY:
        print("❌ ANTHROPIC_API_KEY 환경변수를 설정해주세요.")
        print("   export ANTHROPIC_API_KEY='sk-ant-...'")
        return

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    screen_w, screen_h = pyautogui.size()
    logical_w = screen_w // DISPLAY_SCALE
    logical_h = screen_h // DISPLAY_SCALE
    print(f"[디스플레이] {screen_w}×{screen_h} → 논리 {logical_w}×{logical_h}")

    # 홈택스 오픈
    print("\n[홈택스 세금계산서 자동 발행 — Claude Computer Use]")
    subprocess.run(["open", "-a", "Google Chrome", "https://www.hometax.go.kr"])
    time.sleep(3)

    input("\n공동인증서로 로그인 완료 후 Enter를 누르세요...")
    print("\nClaude가 화면을 분석하고 자동 입력을 시작합니다.\n")

    init_ss = screenshot_b64()

    messages = [
        {
            "role": "user",
            "content": [
                {"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": init_ss}},
                {"type": "text", "text": "홈택스 로그인 완료. 세금계산서 건별발급을 시작해주세요."},
            ],
        }
    ]

    # ── 에이전트 루프 ──────────────────────────────────────────
    turn = 0
    while turn < MAX_TURNS:
        turn += 1
        print(f"\n[턴 {turn}/{MAX_TURNS}]", end=" ", flush=True)

        try:
            response = client.beta.messages.create(
                model=MODEL,
                max_tokens=4096,
                system=build_system_prompt(),
                tools=[{
                    "type": "computer_20241022",
                    "name": "computer",
                    "display_width_px":  logical_w,
                    "display_height_px": logical_h,
                    "display_number": 1,
                }],
                messages=messages,
                betas=["computer-use-2024-10-22"],
            )
        except Exception as e:
            print(f"\n❌ API 오류: {e}")
            retry = input("재시도하시겠습니까? (y/n): ").strip().lower()
            if retry != "y":
                return
            time.sleep(2)
            continue

        assistant_blocks = []
        tool_used = False

        for block in response.content:
            if block.type == "text":
                print(f"\nClaude: {block.text}")
                assistant_blocks.append({"type": "text", "text": block.text})

                # 완료 감지 → 사용자 확인
                if any(k in block.text for k in ["완료되었습니다", "발급 버튼", "확인하신", "눌러주세요"]):
                    print("\n─────────────────────────────────────")
                    confirm = input("발급 버튼을 눌러 발행하시겠습니까? (y/n): ").strip().lower()
                    if confirm != "y":
                        print("발행을 취소합니다.")
                        return
                    print("홈택스에서 발급 버튼을 눌러주세요.")
                    input("발행 완료 후 Enter를 누르세요...")
                    print("\n✅ 세금계산서 발행 완료!")
                    print(f"   기관: {INVOICE['receiver']['name']}")
                    print(f"   금액: {INVOICE['items'][0]['supply_amt'] + INVOICE['items'][0]['tax_amt']:,}원")
                    print(f"   비고: {INVOICE['memo']}")
                    return

            elif block.type == "tool_use" and block.name == "computer":
                action = block.input
                action_name = action.get("action", "?")
                coord = action.get("coordinate", "")
                text_preview = action.get("text", "")[:20] if action.get("text") else ""
                print(f"  → {action_name} {coord} {text_preview}", end=" ", flush=True)

                assistant_blocks.append({
                    "type": "tool_use",
                    "id": block.id,
                    "name": "computer",
                    "input": action,
                })

                result_ss = execute_action(action)
                print("✓")

                messages.append({"role": "assistant", "content": assistant_blocks})
                messages.append({"role": "user", "content": [{
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": [{
                        "type": "image",
                        "source": {"type": "base64", "media_type": "image/png", "data": result_ss},
                    }],
                }]})
                assistant_blocks = []
                tool_used = True
                break

        if not tool_used:
            if assistant_blocks:
                messages.append({"role": "assistant", "content": assistant_blocks})
            if response.stop_reason == "end_turn":
                print("\n자동 입력 종료.")
                break

    if turn >= MAX_TURNS:
        print(f"\n⚠️ 최대 턴({MAX_TURNS}) 도달. 수동으로 발급을 완료해주세요.")


if __name__ == "__main__":
    main()
