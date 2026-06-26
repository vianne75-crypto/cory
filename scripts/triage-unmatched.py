#!/usr/bin/env python3
"""
미매칭 사용처명 트리아지 — Order.xls 백필에서 기관 매칭 안 된 사용처명을 4분류.
출력: 미매칭_트리아지_워크시트_FLUX.md (대표 ✅ 체크용)

분류:
  A 신규 B2B 사업장  = 회사 토큰 보유 + 기존 기관 교차검증 후 없음 → type=사업장 신규등록 후보
  B 별칭 등록         = 기존 기관 오타/표기차 → metadata.aliases 등록 후보
  D 수동 확인         = 메모성·괄호 내 기관
  C B2C/개인 제외     = 개인·체험단·자가사용 (기관 아님)

사용: python3 scripts/triage-unmatched.py   (data/Order.xls + Supabase 조회)
백필 매칭 로직은 scripts/p02-backfill-purchase-data.py 와 동일 기준 유지.
"""
import re, html, json, urllib.request
from collections import defaultdict
BASE='https://rvqkoiqjjhlrgqitnxwt.supabase.co/rest/v1'
KEY='sb_publishable_LhUYFVbX3M_8zbiBzaLgZQ_MSOfc1TU'

def get(p):
    r=urllib.request.Request(BASE+p, headers={'apikey':KEY,'Authorization':f'Bearer {KEY}'})
    with urllib.request.urlopen(r) as x: return json.loads(x.read())

COMPANY=('(주)','㈜','주식회사','(유)','전자','공사','공단','재단','인더스트리','기업','산업','신소재','모터','코퍼레이션','에너지','타이어','녹십자','철도','조폐','중공업','화학','건설','이앤씨','이앤에이','아이앤씨','단석','브러더스','넥센','코오롱','엠티에스','관광공사','맥슨','오렌지팜')
INST_SUF=('보건소','보건지소','보건의료원','대학교','대학','병원','보건진료소','교육청','고등학교','중학교','초등학교')
B2C_KW=('개인','집','가정','본인','지인','클라우드','체험단','자택','가족','테스트','샘플','자가검사')
NOTE_KW=('납품','강의','발주','캠페인','용품','교구','활용','추가','수령','배포','상담','임직원','사내')
PERSON=re.compile(r'^[가-힣]{2,4}(\s*\(.*\))?$')

def load_unmatched():
    insts=[]; off=0
    while True:
        p=get(f'/institutions?select=id,name,metadata&limit=1000&offset={off}'); insts+=p
        if len(p)<1000: break
        off+=1000
    entries=[]
    for i in insts:
        al=(i.get('metadata') or {}).get('aliases') or []
        for nm in [i['name']]+al:
            if nm and len(nm.replace(' ',''))>=4: entries.append((nm.replace(' ',''), i['id']))
    entries.sort(key=lambda e:-len(e[0]))
    rows=re.findall(r'<tr[^>]*>(.*?)</tr>', open('data/Order.xls',encoding='utf-8',errors='replace').read(), re.S|re.I)
    cells=lambda r:[html.unescape(re.sub(r'<[^>]+>','',c)).strip() for c in re.findall(r'<t[dh][^>]*>(.*?)</t[dh]>', r, re.S|re.I)]
    DT=re.compile(r'\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}')
    um=defaultdict(int)
    for r in rows[1:]:
        c=cells(r)
        if len(c)<33 or any(k in c[1] for k in ('취소','반품')) or not DT.search(' '.join(c)): continue
        m=re.search(r'사용처명[^:：]*[:：]\s*([^\n\r/]+)', ' '.join(c))
        if not m: continue
        us=m.group(1).strip(); un=re.sub(r'\(.*?\)','',us).replace(' ','')
        if un and not any(nm in un or (len(un)>=4 and un in nm) for nm,_ in entries): um[us]+=1
    return um

def classify(um):
    A=[];B=[];C=[];D=[]
    for us,cnt in sorted(um.items(), key=lambda x:-x[1]):
        s=us.strip()
        pin=re.search(r'\(([가-힣]+(?:병원|보건소|대학교|센터))\)', s)
        if pin: D.append((us,cnt,f'→ {pin.group(1)} 매칭검토')); continue
        if s in ('기업','보건소'): D.append((us,cnt,'모호-수동')); continue
        if any(k in s for k in COMPANY): A.append((us,cnt)); continue
        if s.endswith(INST_SUF): B.append((us,cnt)); continue
        if any(k in s for k in B2C_KW) or PERSON.match(s): C.append((us,cnt)); continue
        if any(k in s for k in NOTE_KW): D.append((us,cnt,'메모성')); continue
        C.append((us,cnt))
    return A,B,C,D

if __name__=='__main__':
    A,B,C,D=classify(load_unmatched())
    print(f'A 신규 {len(A)} / B 별칭 {len(B)} / D 수동 {len(D)} / C 제외 {len(C)}')
    print('워크시트는 미매칭_트리아지_워크시트_FLUX.md 참조 (수동 교차검증 반영본)')
