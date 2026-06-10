// 헤이딜러 상세 추출. https://www.heydealer.com/market/cars/<hash> 로 이동 후 평가.
// "기아/현대 출고 정보"(실제 추가옵션)로 옵션을 판정한다("주요 옵션"은 트림 템플릿이라 신뢰 불가).
(function () {
  var t = '\n' + document.body.innerText.replace(/ /g, ' ') + '\n';
  function bt(a, b) { var i = t.indexOf(a); if (i < 0) return ''; i += a.length; var j = t.indexOf(b, i); if (j < 0) j = i + 200; return t.slice(i, j).replace(/\n+/g, ' ').trim(); }
  function rx(re) { var m = document.body.innerText.match(re); return m ? m[1] : ''; }
  var fac = bt('출고 정보', '*신차 추가옵션') || bt('출고 정보', '추천하는');
  function H(re) { return re.test(fac) ? 'O' : 'X'; }
  return JSON.stringify({
    year: rx(/연식\s*([0-9]{4}년형[^\n]*|\d{2,4}[^\n]*)/),
    km: rx(/주행거리\s*([0-9,]+km)/),
    사고: rx(/사고\s*(완전무사고|단순교환 무사고|[가-힣 ]*무사고)/),
    자차보험: rx(/자차 보험처리\s*([0-9]+건[^\n]*)/),
    외부패널: bt('\n외부패널\n', '\n프레임'),
    내비: H(/내비/), 통풍시트: H(/통풍/), ADAS: H(/스마트 크루즈|충돌방지|차로|주행 ?보조|스마트 ?센스/),
    서라운드뷰: H(/서라운드|어라운드|SVM|모니터링/), 선루프: H(/선루프/), HUD: H(/HUD|헤드업/),
    출고추가옵션: fac.slice(0, 160)
  });
})();
