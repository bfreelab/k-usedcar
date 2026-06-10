// window.__cap(후킹된 list 응답)에서 매물 행을 추출한다.
// ★ PII 제외: cno(차량번호)·seler*(판매자 연락처/이름)는 절대 담지 않는다(PRIVACY.md).
// window.__filter = {model:'스포티지', maxPrice:2700} 로 좁힐 수 있다(선택).
(function () {
  var f = window.__filter || {};
  var c = window.__cap || [];
  var rows = [];
  c.forEach(function (x) { try { rows = rows.concat(JSON.parse(x.resp).data.rows || []); } catch (e) {} });
  var seen = {}, out = [];
  rows.forEach(function (r) {
    if (seen[r.carCd]) return; seen[r.carCd] = 1;
    if (f.model && ('' + (r.modelGrpNm || '')).indexOf(f.model) < 0) return;
    if (f.maxPrice && r.prc > f.maxPrice) return;
    out.push({
      carCd: r.carCd,                 // 공개 상세 URL 식별용 (PII 아님)
      model: r.modelNm, group: r.modelGrpNm, trim: r.grdDtlNm || r.grdNm,
      year: r.mfgDt, km: r.milg, price: r.prc, color: r.extrColorNm,
      fuel: r.fuelNm, trans: r.trnsmsnNm,
      use: r.useNm || '',             // '영업용' 이면 렌트 이력
      accident: r.acdtHistCnts || ''
      // cno / selerMpno / selerNm 등 개인정보는 의도적으로 제외
    });
  });
  return JSON.stringify(out);
})();
