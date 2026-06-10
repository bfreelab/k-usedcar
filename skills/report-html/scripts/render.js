#!/usr/bin/env node
// 중고차 후보 JSON -> 정적 index.html 비교/추천 리포트. 무의존(Node 표준만).
// 사용: node render.js data.json > index.html
// data.json = SKILL.md의 입력 스키마 배열. ★PII 필드는 들어오면 무시한다.
'use strict';
const fs = require('fs');

const PII = /(cno|carNo|plate|번호판|차량번호|seler|selr|phone|tel|mpno|tno|sellerName|딜러|연락처)/i;
function clean(o) { const r = {}; for (const k in o) if (!PII.test(k)) r[k] = o[k]; return r; }
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}

const data = JSON.parse(fs.readFileSync(process.argv[2] || '/dev/stdin', 'utf8')).map(clean);

// 점수: 흰색+무사고+무렌트+필수옵션+무DCT 가점
function score(c){
  let s=0; const o=c.options||{};
  if(/흰색|화이트|스노우/.test(c.color||''))s+=30;
  if(/무사고/.test(c.accident||''))s+=15;
  if((c.rental||'')==='없음')s+=15;
  const must=['후방카메라','내비','ADAS','통풍시트','서라운드뷰'];
  if(must.every(k=>o[k]))s+=25;
  if((c.dct||'')==='무DCT')s+=10; else if((c.dct||'')==='습식8')s+=5;
  if(/전기간/.test(c.insurance||''))s+=8;
  if(o.선루프)s+=4;
  s-=Math.max(0,(c.price_manwon||0)-2500)/100; // 비쌀수록 약간 감점
  return s;
}
data.forEach(c=>c._s=score(c));
const ranked=[...data].sort((a,b)=>b._s-a._s);
const top=ranked.slice(0,3);

function must5(o){o=o||{};return ['후방카메라','내비','ADAS','통풍시트','서라운드뷰'].every(k=>o[k]);}
function dctTag(c){const m={'건식7':'<span class="no">7DCT건식</span>','습식8':'<span class="wn">8DCT습식</span>','무DCT':'<span class="ok">무DCT</span>'};return m[c.dct]||esc(c.transmission||'');}
function colorCell(c){return /흰색|화이트|스노우/.test(c.color||'')?`<span class="cw">${esc(c.color)}</span>`:`<span class="cg">${esc(c.color||'?')}</span>`;}

const rowsHtml = ranked.map((c,i)=>`<tr>
<td>${i+1}</td><td class="m">${esc(c.model)}</td><td>${colorCell(c)}</td><td>${esc(c.site)}</td>
<td><b>${esc(c.price_manwon)}만</b></td><td>${esc(c.year)}·${Math.round((c.km||0)/1000)}천km</td>
<td>${esc(c.fuel)}</td><td>${dctTag(c)}</td><td>${must5(c.options)?'<span class="ok">✓5종</span>':'<span class="no">미달</span>'}</td>
<td>${esc(c.accident)}</td><td>${/없음/.test(c.rental)?'<span class="ok">없음</span>':'<span class="no">'+esc(c.rental)+'</span>'}</td>
<td>${c.url?`<a href="${esc(c.url)}" target="_blank">▸</a>`:''}</td></tr>`).join('\n');

const topHtml = top.map((c,i)=>`<div class="pick${i===0?' one':''}">
<div class="rank">${i+1}순위</div><div class="pname">${esc(c.model)}</div>
<div class="psub">${esc(c.fuel)} · ${esc(c.year)} · ${Math.round((c.km||0)/1000)}천km · ${esc(c.site)}</div>
<div class="price">${esc(c.price_manwon)}<small> 만원</small></div>
<div class="tags"><span class="tag wht">${esc(c.color)}</span><span class="tag">${dctTag(c)}</span>
<span class="tag">${esc(c.accident)}</span><span class="tag">렌트:${esc(c.rental)}</span></div>
${c.url?`<a class="btn" href="${esc(c.url)}" target="_blank">매물 보기 →</a>`:''}</div>`).join('\n');

process.stdout.write(`<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>중고차 비교·추천</title><style>
:root{--bg:#0f1115;--card:#1a1e27;--line:#2a3140;--txt:#e8ecf4;--mut:#9aa6bd;--ok:#34d399;--no:#f87171;--wn:#fbbf24;--acc:#60a5fa;--gold:#f5c451;--white:#e9eef7}
*{box-sizing:border-box;margin:0;padding:0}body{background:#0c0e13;color:var(--txt);font-family:system-ui,'Pretendard',sans-serif;line-height:1.5;padding:0 0 60px}
.wrap{max-width:1240px;margin:0 auto;padding:0 16px}header{padding:40px 16px;text-align:center}h1{font-size:26px}
h2{font-size:19px;margin:34px 0 14px;border-left:5px solid var(--acc);padding-left:9px}
.top3{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}@media(max-width:800px){.top3{grid-template-columns:1fr}}
.pick{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px}.pick.one{border-color:var(--gold)}
.rank{font-size:12px;font-weight:800;color:var(--gold)}.pname{font-size:16px;font-weight:700;margin:5px 0}.psub{color:var(--mut);font-size:12px}
.price{font-size:24px;font-weight:800;margin:10px 0}.price small{font-size:12px;color:var(--mut)}
.tags{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}.tag{font-size:11px;padding:2px 8px;border:1px solid var(--line);border-radius:6px;color:var(--mut)}
.tag.wht{background:var(--white);color:#0c0e13;font-weight:700}a.btn{display:inline-block;margin-top:10px;font-size:12px;color:var(--acc);text-decoration:none;border:1px solid var(--line);border-radius:8px;padding:6px 10px}
table{width:100%;border-collapse:collapse;font-size:12px;background:var(--card);border:1px solid var(--line);border-radius:12px;overflow:hidden}
td,th{padding:8px;text-align:center;border-bottom:1px solid var(--line)}th{background:#161b24;color:var(--mut)}td.m{text-align:left;font-weight:600}
.ok{color:var(--ok);font-weight:700}.no{color:var(--no);font-weight:700}.wn{color:var(--wn);font-weight:700}
.cw{background:var(--white);color:#0c0e13;border-radius:4px;padding:1px 6px;font-size:11px;font-weight:700}.cg{color:var(--mut)}
a{color:var(--acc)}.note{background:var(--card);border:1px solid var(--line);border-left:3px solid var(--wn);border-radius:8px;padding:12px;font-size:12px;color:#cdd6e6;margin-top:12px}
</style></head><body><header><h1>🚗 중고차 비교·추천</h1><p style="color:var(--mut);font-size:13px">필수옵션 5종·DCT·사고/렌트·색상 종합 (개인 검토용 · 개인정보 미포함)</p></header>
<div class="wrap">
<h2>TOP 3 추천</h2><div class="top3">${topHtml}</div>
<div class="note"><b>★ DCT</b> — 건식7DCT(가솔린1.6T)=저속 울컥 심함+과열주의 / 습식8DCT(디젤)=완화 / 무DCT(가솔린2.0·2.5·하이브리드)=무관. 건식은 시승 필수.</div>
<h2>전체 비교 (추천순)</h2><div style="overflow-x:auto"><table>
<thead><tr><th>#</th><th style="text-align:left">모델·트림</th><th>색상</th><th>사이트</th><th>가격</th><th>연식·주행</th><th>연료</th><th>변속/DCT</th><th>필수옵션</th><th>사고</th><th>렌트</th><th>링크</th></tr></thead>
<tbody>${rowsHtml}</tbody></table></div>
<div class="note">※ 개인 구매검토용. 매물 데이터·차량번호·딜러 연락처 등 개인정보는 포함하지 않습니다. 가격·상태는 변동될 수 있어 실차·성능기록부 확인 필요.</div>
</div></body></html>`);
