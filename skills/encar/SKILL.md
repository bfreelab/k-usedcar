---
name: encar-usedcar
description: 엔카(encar.com)에서 조건별 중고차 매물 목록을 조회하고, 매물 상세의 옵션·사고/보험이력·렌트(용도변경)·변속기 정보를 추출한다. "엔카 매물 찾아줘/비교해줘" 같은 요청에 사용.
---

# 엔카 중고차 조회 스킬

브라우저로 엔카가 사용하는 조회 엔드포인트를 호출한다. 검색 결과 API는 CORS로
XHR이 막히므로 **URL 직접 이동(navigation)으로 JSON을 수신**하고, 상세 데이터는
모바일(`fem.encar.com`) 도메인에서 `api.encar.com/v1/readside/*`를 호출한다.

## 1) 매물 목록 검색 (전수 열거)
검색 쿼리 문법(`q`)에 제조사/모델/연료/연식/가격/색상/옵션 필터를 조합한다.

```
https://api.encar.com/search/car/list/general?count=true&q=<ENC>&sr=%7CModifiedDate%7C<offset>%7C<limit>
```
- `q` 예: `(And.Hidden.N._.(C.CarType.Y._.(C.Manufacturer.기아._.(C.ModelGroup.스포티지._.Model.스포티지 5세대.)))_.Color.흰색._.Price.range(..2700).)`
- 범위: `Year.range(202101..202412)`, `Mileage.range(30000..100000)`, `Price.range(1800..2400)`
- 엔카진단/믿고만: `_.(Or.ServiceMark.EncarDiagnosisP0._.ServiceMark.EncarDiagnosisP1._.ServiceMark.EncarDiagnosisP2._.ServiceMark.EncarMeetgo.)`
- 정렬 `sr`: `|ModifiedDate|0|100`(최신), `|PriceAsc|0|100`(저가), `|Mileage|0|100`(저주행)
- 페이지네이션: offset을 0,100,200...로 증가시켜 전수 열거

응답 `SearchResults[]` 주요 필드: `Id, Manufacturer, Model, Badge, BadgeDetail,
FuelType, Year, Mileage, Price, OfficeCityState, ServiceMark[]`.
`scripts/search.js`는 한 페이지를 받아 CSV 행으로 변환한다.

## 2) 매물 상세 + 옵션/이력 추출
상세 페이지 `https://fem.encar.com/cars/detail/<매물ID>` 로 이동 후 `scripts/detail.js`
평가. og:image에서 내부 vehicleId를 얻어 readside API들을 호출한다.
- `vehicle/{id}?include=CATEGORY,SPEC,OPTIONS,ADVERTISEMENT` — 트림·연료·색상·가격·진단(diagnosisCar)·믿고(meetGo)
- `vehicles/car/options/standard` + 차량 옵션코드 → 옵션명(통풍/서라운드뷰/선루프 등)
- `record/vehicle/{id}/open` — 사고(내차/타차 피해액)·소유자변경·**보험 미가입기간(notJoinDate)**·영업용(business)
- `inspection/vehicle/{id}` — 성능기록부 비고(comments)

판정 키: 필수옵션(후방카메라·대화면내비·ADAS·통풍시트·서라운드뷰), `carInfoUse`에
'3' 포함 시 렌트 이력, `notJoinDate*` 존재 시 보험 미가입 구간.

## 한계 / 주의
- 검색 API는 CORS로 페이지 컨텍스트 XHR이 막힘 → URL 이동 방식 사용.
- 가솔린 1.6T=건식 7DCT, 디젤 2.0/2.2=습식 8DCT(저속 울컥 차이), 가솔린 2.0/2.5·
  하이브리드=토크컨버터 자동(무DCT). 변속기 판정에 참고.
- 약관·robots.txt 준수, 저빈도 조회. 개인정보(딜러 연락처 등) 저장 금지.
