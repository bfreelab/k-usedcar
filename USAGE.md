# 사용 예시 (End-to-End)

브라우저 제어 도구(예: gstack `browse`)로 "페이지 이동 → JS 평가"를 수행하는 흐름.
모든 단계는 **개인 비상업·저빈도** 사용을 전제로 한다(DISCLAIMER/PRIVACY).

## 0. 공통
- 일부 사이트(케이카·헤이딜러·현대인증)는 **반드시 헤드(headed) 모드**에서 동작.
  (`browse connect` 등으로 보이는 크롬 띄우기)
- 추출 결과에서 **차량번호·연락처·딜러명 등 PII는 즉시 버린다**(PRIVACY.md).

## 1. 엔카 — 조건검색 → 상세
```
# 1) 검색 목록(전수 열거 가능). 페이지네이션은 sr 오프셋 0,100,200...
goto  https://api.encar.com/search/car/list/general?count=true&q=<쿼리>&sr=|ModifiedDate|0|100
eval  skills/encar/scripts/search.js     # → CSV 행
# 2) 상세(옵션/사고/보험/렌트/성능기록부 비고)
goto  https://fem.encar.com/cars/detail/<매물ID>
eval  skills/encar/scripts/detail.js
```
쿼리 예(흰색·엔카진단·가격≤2700):
`(And.Hidden.N._.(C.CarType.Y._.(C.Manufacturer.현대._.(C.ModelGroup.투싼._.Model.투싼 (NX4).)))_.Color.흰색._.Price.range(..2700)._.(Or.ServiceMark.EncarDiagnosisP0._.ServiceMark.EncarDiagnosisP1._.ServiceMark.EncarDiagnosisP2._.ServiceMark.EncarMeetgo.))`

## 2. 케이카 — 헤드모드 필터 + list API 후킹
```
connect                                   # 헤드 크롬
goto    https://www.kcar.com/bc/search
eval    skills/kcar/scripts/hook-list.js  # list 응답 후킹 설치
# 좌측 필터를 풀-이벤트로 클릭(제조사→모델→색상)
js  window.__clickTarget='현대';  eval skills/kcar/scripts/click-filter.js
js  window.__clickTarget='투싼';  eval skills/kcar/scripts/click-filter.js
js  window.__clickTarget='흰색';  eval skills/kcar/scripts/click-filter.js   # 색상 섹션 펼친 뒤
# 결과 행 추출(PII 제외)
js  window.__filter={model:'투싼', maxPrice:2700};  eval skills/kcar/scripts/rows-from-cap.js
# 특정 매물 옵션(모니터링 SVM 등) 확인
goto  https://www.kcar.com/bc/detail/carInfoDtl?i_sCarCd=<EC코드>
eval  skills/kcar/scripts/detail.js
```
페이지네이션이 불안정하면 색상+가격으로 1페이지(≤27)까지 좁힌다.

## 3. 기아 CPO
```
goto  https://cpo.kia.com/products
eval  skills/kia-cpo/scripts/search.js     # MODEL/MAXPRICE 상단 상수 조정
```

## 4. 헤이딜러 — 헤드모드 홈 SPA 필터
```
connect
goto  https://www.heydealer.com/?brand=<브랜드코드>&model-group=<모델코드>&max-price=2700
# 스크롤로 카드 로딩 후
eval  skills/heydealer/scripts/list.js      # 해시ID + 카드텍스트
goto  https://www.heydealer.com/market/cars/<해시>
eval  skills/heydealer/scripts/detail.js    # 출고정보(실옵션)/사고/자차보험
```

## 5. 종합 비교·추천 HTML
```
# 위에서 모은 후보들을 공통 스키마(JSON 배열)로 정리 → data.json (PII 미포함)
node skills/report-html/scripts/render.js data.json > index.html
# 배포(선택): vercel deploy --prod   ※ data.json은 커밋하지 않음(.gitignore)
```

## 주의
- 사이트 구조는 수시로 바뀐다. 셀렉터/필드명이 바뀌면 스크립트의 키를 갱신.
- 약관·robots.txt 준수, 저빈도. 수집 데이터·PII는 저장소에 올리지 않는다.
