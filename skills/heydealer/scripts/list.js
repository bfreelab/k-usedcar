// 헤이딜러 목록 카드 추출 (headed). 홈에서 브랜드→모델 필터(+&max-price=) 적용 후,
// 스크롤로 카드를 로딩한 다음 이 스크립트를 평가한다.
// window.__modelFilter (예: '(NX4)','(TM)','(MX5)') 로 세대를 좁힐 수 있다(선택).
// ★ 차량번호/연락처 등 PII는 카드 텍스트에 없지만, 혹시 있어도 담지 않는다(PRIVACY.md).
(function () {
  var mf = window.__modelFilter || '';
  var seen = {}, out = [];
  document.querySelectorAll('a[href*="/market/cars/"]').forEach(function (a) {
    var hash = (a.getAttribute('href') || '').split('/').pop();
    if (!hash || seen[hash]) return;
    var t = (a.innerText || '').replace(/\s+/g, ' ').trim();
    if (!/만원/.test(t) || !/km/.test(t)) return;
    if (mf && t.indexOf(mf) < 0) return;
    seen[hash] = 1;
    out.push({ hash: hash, text: t.slice(0, 120) }); // 모델/연식/주행/가격/사고배지 포함
  });
  return JSON.stringify({ count: out.length, cars: out });
})();
