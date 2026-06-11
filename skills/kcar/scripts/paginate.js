// 케이카 페이지네이션 — 전수 수집 (headed). 요청 본문이 암호화돼 API 재호출은 불가.
// 핵심: 페이지 번호/"다음"은 일반 click·DOM click이 안 먹지만,
//   snapshot -i 가 잡아주는 cursor-interactive(@c) ref를 "네이티브 클릭"하면 발화한다.
// 절차(에이전트 측):
//   1) hook-list.js(누적형) 설치 → 필터 적용(click-filter.js)으로 모델+색상 좁히기.
//   2) 아래 루프:
//        - 페이지 하단으로 스크롤
//        - snapshot -i 로 "다음"의 @c 또는 @e ref 획득
//        - browse native click(@ref)  ← DOM 합성 click 아님, 실제 클릭
//        - 2~3초 대기 → window.__rows 누적 개수 확인
//        - 더 안 늘면 종료
//   3) rows-from-cap.js / 아래 dump 로 추출(PII 제외).
//
// 이 파일은 누적 후킹 + 추출 헬퍼. (클릭 루프는 브라우저 제어측에서 수행)
(function () {
  if (!window.__rows) window.__rows = {};
  if (!window.__hooked) {
    window.__hooked = true;
    function ingest(t){try{(JSON.parse(t).data.rows||[]).forEach(function(r){if(r.carCd)window.__rows[r.carCd]=r;});}catch(e){}}
    var ox = XMLHttpRequest.prototype.send, oo = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (m, u) { this.__u = u; return oo.apply(this, arguments); };
    XMLHttpRequest.prototype.send = function (b) { var s = this; if (/search\/list\/drct/.test('' + this.__u)) this.addEventListener('load', function () { ingest(s.responseText); }); return ox.apply(this, arguments); };
    var of = window.fetch; window.fetch = function (u, o) { var p = of.apply(this, arguments); if (/search\/list\/drct/.test('' + u)) p.then(function (r) { r.clone().text().then(ingest); }); return p; };
  }
  // 추출: window.__pick = {model:'싼타페', maxPrice:2700, color:'흰'} (PII 제외)
  var f = window.__pick || {};
  if (f.dump) {
    var R = window.__rows, out = [];
    Object.keys(R).forEach(function (k) {
      var r = R[k];
      if (f.model && ('' + (r.modelGrpNm || '')).indexOf(f.model) < 0) return;
      if (f.color && ('' + (r.extrColorNm || '')).indexOf(f.color) < 0) return;
      if (f.maxPrice && r.prc > f.maxPrice) return;
      out.push({ carCd: r.carCd, model: r.modelNm, trim: r.grdDtlNm, year: r.mfgDt, km: r.milg, price: r.prc, color: r.extrColorNm, fuel: r.fuelNm, trans: r.trnsmsnNm, use: r.useNm || '', accident: r.acdtHistCnts || '' });
    });
    return JSON.stringify({ count: out.length, cars: out });
  }
  return 'hooked(accumulate). 총 ' + Object.keys(window.__rows).length + '행';
})();
