// 케이카 상세 추출. 케이카 상세 페이지에서 평가하거나, 차량코드 배열을 넣어 일괄 조회.
// CARCDS 를 ['EC...','EC...'] 로 바꿔 사용하거나, 현재 페이지 URL의 i_sCarCd를 자동 사용.
(function () {
  function get(u){try{var x=new XMLHttpRequest();x.open('GET',u,false);x.send(null);return x.status<400?x.responseText:'';}catch(e){return '';}}
  var CARCDS = (function () {
    var m = (location.href.match(/i_sCarCd=([A-Z0-9]+)/) || [])[1];
    return m ? [m] : [];
  })();
  var out = [];
  CARCDS.forEach(function (cc) {
    var t = get('https://api.kcar.com/bc/car-info-detail-of-ng?i_sCarCd=' + cc + '&i_sPassYn=N&bltbdKnd=CM050');
    if (!t) { out.push(cc + '|FAIL'); return; }
    var d; try { d = JSON.parse(t).data; } catch (e) { out.push(cc + '|PARSE_ERR'); return; }
    var rvo = d.rvo || {};
    var opt = (d.optList || []).filter(function (o) { return o.gneptYn === 'Y'; }).map(function (o) { return o.optnNm; }).join(',');
    var ch = (d.carJatoOptList || []).map(function (o) { return o.optNm; }).join(',');
    var allOpt = opt + ',' + ch;
    function H(re){ return re.test(allOpt) ? 'O' : 'X'; }
    var useTxt = JSON.stringify(d).match(/대여|렌트|영업용/) ? '대여이력가능' : '확인필요';
    out.push(JSON.stringify({
      carCd: cc, model: rvo.modelNm, trim: rvo.grdDtlNm, year: rvo.mfgDt, km: rvo.milg, price: rvo.salprc,
      후방카메라: H(/카메라/), 내비: H(/내비게이션/), ADAS: H(/스마트 ?크루즈|충돌|차로|차선|주행 ?보조/),
      통풍시트: H(/통풍/), 서라운드뷰: H(/어라운드|서라운드|360/), 선루프: H(/선루프|썬루프/),
      용도이력: useTxt
    }));
  });
  return out.join('\n') || 'NO_CARCD (현재 페이지에 i_sCarCd 없음; CARCDS 배열에 코드 입력)';
})();
