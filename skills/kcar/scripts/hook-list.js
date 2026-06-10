// 케이카 검색 list API 응답 후킹 (headed 모드, 검색 결과 페이지에서 평가).
// 설치 후 좌측 필터를 바꾸면 list API가 자동 발화하고 window.__cap 에 응답이 쌓인다.
// rows 추출 시 PII(cno=차량번호, seler*=판매자 연락처/이름)는 반드시 제외한다(PRIVACY.md).
(function () {
  window.__cap = [];
  var ox = XMLHttpRequest.prototype.send, oo = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (m, u) { this.__u = u; return oo.apply(this, arguments); };
  XMLHttpRequest.prototype.send = function (b) {
    var s = this;
    if (/search\/list/.test('' + this.__u)) {
      this.addEventListener('load', function () { try { window.__cap.push({ u: s.__u, body: b, resp: s.responseText }); } catch (e) {} });
    }
    return ox.apply(this, arguments);
  };
  var of = window.fetch;
  window.fetch = function (u, o) {
    var p = of.apply(this, arguments);
    if (/search\/list/.test('' + u)) { p.then(function (r) { r.clone().text().then(function (tx) { window.__cap.push({ u: '' + u, body: o && o.body, resp: tx }); }); }); }
    return p;
  };
  return 'hooked';
})();
