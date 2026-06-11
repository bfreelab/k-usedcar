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

## 3) 조건후보 전수 개별검증 (재개형 배치)
"목록만 수집"이 아니라 **조건에 맞는 후보를 한 대씩 상세검증**해 사고/렌트/옵션까지
확정하려면, 목록 열거(1)로 후보 ID를 뽑아 **재개 가능한 배치 루프**로 상세(2)를 돈다.
`scripts/verify-batch.sh` 참고. 핵심 노하우(수천 대 규모에서 검증됨):

- **큐 파일**(`id:model` 한 줄씩) + **결과 jsonl 누적**. 이미 검증된 ID는 jsonl에서
  추출해 스킵 → 중단/재시작에 안전(전 세션에 1,345대 분할 처리).
- **ID 일치 가드**: 상세 페이지 로딩 전 og:image가 *직전/추천* 매물을 가리켜 **다른 차
  데이터가 섞이는** 사고가 있다. 추출 JSON의 `id`가 요청 ID와 **일치할 때만 기록**하고,
  불일치 시 1.3초 더 대기 후 1회 재추출, 그래도 불일치면 **miss로 기록(영구 스킵)**.
- **인코딩 안전**: 콘솔에 한글을 print하면 cp949 깨짐 → **jsonl에 raw JSON append**(utf-8
  파일쓰기)하고 콘솔에는 ascii 점/카운트만. 집계는 파일을 다시 읽어 처리.
- **판매완료/소멸** 매물은 상세가 안 떠 miss로 빠진다(자연 감소). 큐 - jsonl - miss = 잔여.
- 한 호출당 ~25~50대씩 백그라운드로 돌리고 누적 카운트로 진행 확인.

검증 결과를 **무사고·무렌트·통풍 등으로 필터 → 중복(같은 차 재등록) 제거 → 파워트레인
분류**까지 하면 추천 리스트가 된다. 중복은 `(모델,트림,연식,주행,가격,내차피해)` 동일키로 제거.

## 파워트레인 / DCT 분류 (저속 울컥 판정)
변속기 종류에 따라 **저속 출발 울컥**이 크게 다르다. 상세에 배기량이 없으면 모델·연료로 추정:

| 구분 | 해당 | 울컥 |
|---|---|---|
| 건식 7DCT | **가솔린 1.6T**(투싼 NX4·스포티지 NQ5) | **큼** (클러치 반결합 떨림) |
| 습식 8DCT | **디젤 2.0/2.2**(싼타페·투싼·스포티지) | 완화(오일냉각) |
| 토크컨버터 자동 | **가솔린 2.0/2.5**(싼타페 2.5=6AT·TM 2.0T=8AT) | 없음 |
| **하이브리드 6AT** | **모든 HEV**(현대 A6MF2H/TMED) | **없음** |

- **하이브리드는 DCT가 아니다.** 토크컨버터를 **엔진클러치+토션댐퍼**로 대체한 6단 유성기어
  자동(TMED). 듀얼클러치가 없어 건식 7DCT식 저속 울컥이 **원리상 없음**. EV↔엔진 전환 시
  엔진클러치 결합으로 미세 이질감은 가능(작동유 DOT3·2년/4만km, ECU로 개선) — 별개 현상.
- 추천 랭킹 시 **하이브리드/무DCT를 가점**으로 두면 "비슷한 가격이면 HEV" 선호를 반영할 수 있다.
- 투싼 NX4 가솔린은 전부 1.6T(7DCT), 스포티지 NQ5 가솔린은 1.6T(7DCT) 또는 2.0(무DCT)
  혼재 → 개체별 확인. 싼타페 더뉴 가솔린 주력은 2.5 GDi(6AT 무DCT).

## 한계 / 주의
- 검색 API는 CORS로 페이지 컨텍스트 XHR이 막힘 → URL 이동 방식 사용.
- 상세 og:image 지연으로 인한 ID 불일치는 **반드시 일치 가드로 차단**(위 3 참고).
- 약관·robots.txt 준수, 저빈도 조회. 개인정보(딜러 연락처·차량번호 등) 저장·출력·커밋 금지.
