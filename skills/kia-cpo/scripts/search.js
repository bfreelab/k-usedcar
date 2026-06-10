// 기아 CPO 모델 필터 + 옵션 조회. cpo.kia.com 페이지에서 평가.
// MODEL(모델코드명), MAXPRICE(원) 를 바꿔 사용.
(function () {
  var MODEL = '스포티지';
  var MAXPRICE = 27000000;
  function get(u){try{var x=new XMLHttpRequest();x.open('GET',u,false);x.send(null);return x.status<400?x.responseText:'';}catch(e){return '';}}
  var seen = {}, cands = [];
  for (var p = 0; p < 10 && cands.length < 40; p++) {
    var t = get('https://cpo.kia.com/api/search/?size=100&page=' + p + '&sort=PRICE_ASC&displayChannel=GENERAL');
    if (!t) break;
    var j; try { j = JSON.parse(t); } catch (e) { break; }
    var c = j.content || []; if (!c.length) break;
    c.forEach(function (x) {
      if (x.modelCodeName !== MODEL) return;
      if (x.price > MAXPRICE) return;
      if (seen[x.id]) return; seen[x.id] = 1;
      cands.push(x);
    });
  }
  var out = cands.map(function (x) {
    var op = get('https://cpo.kia.com/api/product/options/' + x.id + '/'); var O = {}; try { O = JSON.parse(op); } catch (e) {}
    var groups = [].concat(O.safety||[],O.exterior||[],O.interior||[],O.seat||[],O.comport||[],O.multimedia||[]);
    var sel = (O.selectable||[]).map(function (s){ return s.name; });
    var all = groups.join(',') + ',' + sel.join(',');
    function H(re){ return re.test(all) ? 'O' : 'X'; }
    var d = get('https://cpo.kia.com/api/product/insurance-history/' + x.id + '/'); var D = {}; try { D = JSON.parse(d); } catch (e) {}
    var s = (D.summary || {});
    return JSON.stringify({
      id: x.id, model: x.modelName, trim: x.modelTrim, year: x.modelYear,
      km: x.drivingDistance, price: x.price, color: x.exteriorColorCodeName,
      후방카메라: H(/후방.?카메라|후방 모니터/), 내비: H(/내비게이션/), ADAS: H(/드라이브 ?와이즈|스마트 ?크루즈|충돌방지|차로/),
      통풍시트: H(/통풍/), 서라운드뷰: H(/서라운드|어라운드|모니터링|360/), 선루프: H(/선루프/),
      내차피해: s.myCarDamage, 타차피해: s.opponentCarDamage, 소유자변경: s.ownerChange, 용도변경: s.usageChange
    });
  });
  return 'count=' + cands.length + '\n' + out.join('\n');
})();
