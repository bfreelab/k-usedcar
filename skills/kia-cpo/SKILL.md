---
name: kia-cpo-usedcar
description: 기아 인증중고차(cpo.kia.com)에서 기아 차량(스포티지/쏘렌토 등) 매물을 검색·필터하고 옵션·사고·보증·상품화 내역을 조회한다. "기아 인증중고차 확인" 요청에 사용.
---

# 기아 인증중고차(CPO) 조회 스킬

CPO는 깨끗한 GET JSON API를 제공한다(같은 출처 XHR 가능).

## 목록 검색
```
https://cpo.kia.com/api/search/?size=100&page=<n>&sort=PRICE_ASC&displayChannel=GENERAL
```
- 응답 `content[]`: `id, modelName, modelCodeName, modelTrim, modelYear,
  drivingDistance, price, plateNumber, exteriorColorCodeName, ...`
- 모델 필터는 응답에서 `modelCodeName`(예: '스포티지')로 클라이언트 필터링.
  (서버측 모델 파라미터가 잘 안 먹어 페이지네이션 후 거르는 방식 권장)
- 모델 코드 목록: `https://cpo.kia.com/api/search/models/?size=200&sort=DISPLAYED_AT_DESC&displayChannel=GENERAL`

## 상세
- `https://cpo.kia.com/api/product/detail/<id>/` — car(가격·색상·트림)·performanceRecord(판금/교환)·insuranceRecord
- `https://cpo.kia.com/api/product/options/<id>/` — safety/exterior/interior/seat/comport/multimedia + selectable[]
- `https://cpo.kia.com/api/product/insurance-history/<id>/` — summary(내차/타차 피해, 소유자변경, **용도변경(usageChange)**)
`scripts/search.js` 참고.

## 참고
- CPO는 기아 공식 보증/정비가 강점이나 재고 회전이 빠르고, 상위트림·모니터링 장착
  매물이 적을 수 있음. 옵션(서라운드뷰) 유무는 options API로 확인.
- 약관·robots.txt 준수, 저빈도 조회. 개인정보 저장 금지.
