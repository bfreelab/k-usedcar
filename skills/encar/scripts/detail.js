// 엔카 매물 상세 추출. https://fem.encar.com/cars/detail/<id> 로 이동 후 평가.
// 옵션 충족(필수 5종)·사고/보험피해·렌트(용도변경)·보험 미가입기간·성능기록부 비고·진단/믿고 등급을 반환.
(function () {
  function get(u){try{var x=new XMLHttpRequest();x.open('GET',u,false);x.send(null);return x.status<400?x.responseText:'';}catch(e){return '';}}
  function J(u){try{return JSON.parse(get(u));}catch(e){return null;}}
  var og = document.querySelector('meta[property="og:image"]');
  var vid = (og && og.content.match(/pic\d+\/(\d+)_/)) ? og.content.match(/pic\d+\/(\d+)_/)[1] : null;
  if (!vid) return 'NO_VID';
  var b = 'https://api.encar.com/v1/readside/';
  var veh = J(b + 'vehicle/' + vid + '?include=CATEGORY,SPEC,OPTIONS,ADVERTISEMENT');
  if (!veh) return 'NO_VEH';
  var master = J(b + 'vehicles/car/options/standard');
  var choiceAll = J(b + 'vehicles/car/' + vid + '/options/choice') || [];
  var rec = J(b + 'record/vehicle/' + vid + '/open?vehicleNo=' + encodeURIComponent(veh.vehicleNo || ''));
  var insp = J(b + 'inspection/vehicle/' + vid);
  var adv = veh.advertisement || {};
  var applied = {}; (veh.options.standard || []).forEach(function (c) { applied[c] = 1; });
  var names = [];
  if (master) master.options.forEach(function (o) {
    var h = applied[o.optionCd];
    if (o.subOptions) o.subOptions.forEach(function (s) { if (applied[s.optionCd]) h = 1; });
    if (h) names.push(o.optionName);
  });
  var ch = {}; (veh.options.choice || []).forEach(function (c) { ch[c] = 1; });
  var chN = choiceAll.filter(function (o) { return ch[o.optionCd]; }).map(function (o) { return o.optionName; });
  var all = names.concat(chN).join(',');
  function H(re){ return re.test(all) ? 'O' : 'X'; }
  var nj = [rec&&rec.notJoinDate1,rec&&rec.notJoinDate2,rec&&rec.notJoinDate3,rec&&rec.notJoinDate4,rec&&rec.notJoinDate5].filter(Boolean);
  var rent = (rec && ((rec.carInfoUse1s||[]).join('').indexOf('3') > -1 || rec.business > 0)) ? '렌트' : '없음';
  return JSON.stringify({
    id: vid, no: veh.vehicleNo, trim: veh.category.gradeDetailName || veh.category.gradeName,
    fuel: veh.spec.fuelName, color: veh.spec.colorName, price: adv.price,
    year: veh.category.yearMonth, km: veh.spec.mileage,
    grade: adv.diagnosisCar ? '엔카진단' : (adv.meetGo ? '엔카믿고' : '일반'),
    후방카메라: H(/후방.?카메라/), 내비: H(/내비게이션/), ADAS: H(/드라이브 와이즈|차선이탈|후측방|스마트 ?센스/),
    통풍시트: H(/통풍시트/), 서라운드뷰: H(/어라운드|서라운드|360/), 선루프: H(/선루프/),
    사고: insp && insp.master ? (insp.master.accdient ? '사고' : '무사고') : '?',
    내차피해: rec ? rec.myAccidentCost : '?', 타차피해: rec ? rec.otherAccidentCost : '?',
    소유자변경: rec ? rec.ownerChangeCnt : '?', 렌트: rent,
    보험: nj.length ? ('미가입:' + nj.join(',')) : '전기간가입',
    성능기록부비고: (insp && insp.master && insp.master.detail ? (insp.master.detail.comments || '') : '').replace(/\s+/g, ' ').slice(0, 200)
  });
})();
