#!/bin/bash
# 엔카 조건후보 전수 개별검증 — 재개 가능한 배치 루프 (수천 대 규모에서 검증된 패턴)
#
# 입력:
#   QUEUE  : "id:model" 한 줄씩 (검색 목록 1)에서 추출한 후보 ID 큐)
#   OUT    : 결과 jsonl (한 줄당 매물 1대, scripts/detail.js 출력). 이어쓰기/재개됨.
#   MISS   : 판매완료·소멸·ID불일치로 빠진 ID (영구 스킵). 큐 - OUT - MISS = 잔여.
# 전제:
#   - BROWSE: 페이지이동(goto)+JS평가(eval)가 되는 브라우저 제어 CLI(예: gstack browse)
#   - DETAIL: scripts/detail.js (og:image→vehicleId→readside API. 첫 키가 {"id":"..."} 여야 함)
#   - 개인정보(차량번호·딜러 연락처/이름 등)는 detail.js 단계에서 이미 제외할 것(PRIVACY.md)
#
# 핵심 노하우:
#   1) 이미 OUT에 있는 ID는 스킵 → 중단/재시작 안전.
#   2) ID 일치 가드: 로딩 전 og:image가 직전/추천 매물을 가리켜 "다른 차" 데이터가
#      섞일 수 있다. 추출 JSON의 id가 요청 ID와 같을 때만 기록. 불일치면 잠깐 더 대기 후
#      1회 재시도, 그래도 불일치면 MISS로 영구 스킵.
#   3) 콘솔에 한글 print 금지(cp949 깨짐) → jsonl에 raw JSON append(utf-8), 콘솔은 카운트만.
#
# 사용: BROWSE=... QUEUE=... OUT=... MISS=... DETAIL=... ./verify-batch.sh [개수]

set -u
BROWSE="${BROWSE:?BROWSE(브라우저 제어 CLI) 경로 지정}"
QUEUE="${QUEUE:?QUEUE 파일 지정}"
OUT="${OUT:?OUT(jsonl) 파일 지정}"
MISS="${MISS:-${OUT%.jsonl}.miss.txt}"
DETAIL="${DETAIL:?DETAIL(detail.js) 경로 지정}"
N="${1:-50}"
touch "$OUT" "$MISS"

# 검증/미스 제외한 다음 N개
grep -oE '"id":"[0-9]+"' "$OUT" 2>/dev/null | grep -oE '[0-9]+' | sort -u > /tmp/.vdone
sort -u "$MISS" >> /tmp/.vdone
todo=$(cut -d: -f1 "$QUEUE" | grep -vxF -f /tmp/.vdone | head -"$N")

ok=0; miss=0
for ID in $todo; do
  "$BROWSE" goto "https://fem.encar.com/cars/detail/$ID" >/dev/null 2>&1; sleep 2.0
  J=$("$BROWSE" eval "$DETAIL" 2>&1 | grep -E '^\{')
  if ! echo "$J" | grep -q "\"id\":\"$ID\""; then
    sleep 1.3
    J=$("$BROWSE" eval "$DETAIL" 2>&1 | grep -E '^\{')
  fi
  if echo "$J" | grep -q "\"id\":\"$ID\""; then
    printf '%s\n' "$J" >> "$OUT"; ok=$((ok+1))
  else
    echo "$ID" >> "$MISS"; miss=$((miss+1))
  fi
done
echo "DONE: ok=$ok miss=$miss total=$(grep -oE '"id":"[0-9]+"' "$OUT"|sort -u|wc -l)"
