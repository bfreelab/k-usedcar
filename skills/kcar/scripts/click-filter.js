// 케이카 좌측 필터 클릭 (headed). window.__clickTarget 에 라벨 텍스트(예: '기아','스포티지','흰색')를 넣고 평가.
// 합성 click이 안 먹는 사이트라 mousedown→mouseup→click 풀 시퀀스를 좌표와 함께 디스패치한다.
(function () {
  var TARGET = window.__clickTarget;
  if (!TARGET) return 'set window.__clickTarget first';
  var rows = [].slice.call(document.querySelectorAll('label,li,a,span,div'));
  var cands = rows.filter(function (e) {
    var t = (e.textContent || '').replace(/\s+/g, '');
    return new RegExp('^' + TARGET + '[\\d,]*대?$').test(t) || t === TARGET;
  });
  cands.sort(function (a, b) { return a.textContent.length - b.textContent.length; });
  var el = cands[0];
  if (!el) return 'notfound:' + TARGET;
  var tgt = el.closest('label') || el.closest('li') || el;
  tgt.scrollIntoView({ block: 'center' });
  var r = tgt.getBoundingClientRect();
  var cx = r.left + 12, cy = r.top + r.height / 2;
  var hit = document.elementFromPoint(cx, cy) || tgt;
  ['mousedown', 'mouseup', 'click'].forEach(function (ty) {
    hit.dispatchEvent(new MouseEvent(ty, { bubbles: true, cancelable: true, view: window, clientX: cx, clientY: cy }));
  });
  return 'clicked:' + TARGET;
})();
