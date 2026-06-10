// 엔카 검색 결과 1페이지 → CSV 행. 검색 API URL로 이동(navigation)한 뒤 평가한다.
// 사용: 브라우저를 https://api.encar.com/search/car/list/general?...&sr=|ModifiedDate|<off>|100 로 이동 후 이 스크립트 평가.
(function () {
  try {
    var j = JSON.parse(document.body.innerText);
    var r = j.SearchResults || [];
    return r.map(function (c) {
      return [
        c.Id,
        (c.BadgeDetail || c.Badge || '').replace(/,/g, ' '),
        c.Year, c.Mileage, c.Price,
        (c.OfficeCityState || ''),
        (c.ServiceMark || []).join('+')
      ].join(',');
    }).join('\n');
  } catch (e) { return 'PAGE_ERR'; }
})();
