#!/usr/bin/env python3
"""
P0-2 재구매 데이터 백필 — first/last_purchase_date + purchase_count
출처: SAGE P0-2 (cory/P02_재구매데이터_채우기_FLUX.md)
실행: 2026-06-25 (FLUX) — 119개 기관 백필, KR1 26.1% 측정 가동

데이터 소스:
  - data/Order.xls   : wcolive 원본 주문 export(HTML 테이블) ~2026-02까지 전체 이력
  - cory orders 테이블: 2026-03 이후 동기화분
매칭: 사용처명(Order.xls) → institutions.name + metadata.aliases
집계: 기관별 distinct 주문일 → first(min)·last(max)·count(len)  (같은날=1회, 스펙 §2-3)
"""
import re, html, json, urllib.request
BASE='https://rvqkoiqjjhlrgqitnxwt.supabase.co/rest/v1'
KEY='sb_publishable_LhUYFVbX3M_8zbiBzaLgZQ_MSOfc1TU'

def get(p):
    r=urllib.request.Request(BASE+p, headers={'apikey':KEY,'Authorization':f'Bearer {KEY}'})
    with urllib.request.urlopen(r) as x: return json.loads(x.read())

def patch(iid, body):
    r=urllib.request.Request(f'{BASE}/institutions?id=eq.{iid}', data=json.dumps(body).encode(),
        headers={'apikey':KEY,'Authorization':f'Bearer {KEY}','Content-Type':'application/json','Prefer':'return=minimal'}, method='PATCH')
    with urllib.request.urlopen(r) as x: return x.status

def load_institutions():
    out=[]; off=0
    while True:
        p=get(f'/institutions?select=id,name,metadata&limit=1000&offset={off}'); out+=p
        if len(p)<1000: break
        off+=1000
    return out

def build_matcher(insts):
    entries=[]
    for i in insts:
        al=(i.get('metadata') or {}).get('aliases') or []
        for nm in [i['name']]+al:
            if nm and len(nm.replace(' ',''))>=4: entries.append((nm.replace(' ',''), i['id']))
    entries.sort(key=lambda e:-len(e[0]))
    return entries

def match(un, entries):
    for nm,iid in entries:
        if nm in un or (len(un)>=4 and un in nm): return iid
    return None

def main(dry=False):
    insts=load_institutions(); entries=build_matcher(insts)
    from collections import defaultdict
    dbi=defaultdict(set)
    DT=re.compile(r'(\d{4}-\d{2}-\d{2}) \d{2}:\d{2}:\d{2}')  # 주문일(시간 포함, 입금일자와 구분)
    rows=re.findall(r'<tr[^>]*>(.*?)</tr>', open('data/Order.xls',encoding='utf-8',errors='replace').read(), re.S|re.I)
    def cells(r): return [html.unescape(re.sub(r'<[^>]+>','',c)).strip() for c in re.findall(r'<t[dh][^>]*>(.*?)</t[dh]>', r, re.S|re.I)]
    for r in rows[1:]:
        c=cells(r)
        if len(c)<33 or any(k in c[1] for k in ('취소','반품')): continue
        txt=' '.join(c); md=DT.search(txt)
        if not md: continue
        m=re.search(r'사용처명[^:：]*[:：]\s*([^\n\r/]+)', txt)
        if not m: continue
        un=re.sub(r'\(.*?\)','',m.group(1)).replace(' ','')
        iid=match(un, entries)
        if iid: dbi[iid].add(md.group(1))
    for o in get('/orders?select=institution_id,reg_time&limit=1000'):  # +페이지네이션 필요시 확장
        pass
    # cory orders (페이지네이션)
    off=0
    while True:
        p=get(f'/orders?select=institution_id,reg_time&limit=1000&offset={off}')
        for o in p:
            iid=o.get('institution_id'); rt=o.get('reg_time') or ''
            if iid and re.match(r'^\d{4}-\d{2}-\d{2}', rt): dbi[iid].add(rt[:10])
        if len(p)<1000: break
        off+=1000
    print(f'백필 대상 {len(dbi)}개')
    if dry: return
    ok=0
    for iid,ds in dbi.items():
        if patch(iid, {'first_purchase_date':min(ds),'last_purchase_date':max(ds),'purchase_count':len(ds)}) in (200,204): ok+=1
    print(f'백필 완료 {ok}/{len(dbi)}')

if __name__=='__main__':
    import sys
    main(dry='--dry' in sys.argv)
