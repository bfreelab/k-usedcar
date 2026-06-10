---
name: kcar-usedcar
description: 케이카(kcar.com) 직영 중고차 매물의 옵션·사고이력·용도(대여)이력·색상을 차량코드(EC...)로 조회한다. "케이카 매물 확인/비교" 요청에 사용.
---

# 케이카(KCar) 중고차 조회 스킬

케이카는 상세 데이터를 깨끗한 JSON으로 제공한다:
`https://api.kcar.com/bc/car-info-detail-of-ng?i_sCarCd=<EC코드>&i_sPassYn=N&bltbdKnd=CM050`
이 API는 같은 출처/일반 XHR로 호출 가능하다(상세 페이지에서 평가). `scripts/detail.js`
참고. 반환 `data` 구조:
- `rvo` — 모델명·트림·연식(mfgDt)·주행(milg)·가격(salprc)
- `optList[]` — 옵션 목록, `gneptYn==='Y'`면 장착(통풍/서라운드뷰/내비 등)
- `carJatoOptList[]` — 신차 선택옵션(패키지)
- `master` / `carHistUseList` — 성능·용도(대여) 이력
- 색상은 페이지 텍스트(상세)에서 보강

## 매물 목록
케이카 검색 결과 페이지(`/bc/search`)는 **가상 스크롤**이라 헤드리스에서 화면에
보이는 카드의 차량코드(`EC########`)만 DOM에서 잡힌다. 전수 자동 열거는 어렵다.
→ 실무: 사용자가 사이트에서 필터(제조사/모델/가격)를 적용해 목록을 띄우고, 화면에
렌더된 카드의 EC코드를 수집한 뒤 `detail.js`로 각 코드를 상세 조회.

## 한계 / 주의
- 검색 목록은 가상스크롤 + 차량코드 비노출 → **전수 자동화 불가**(화면 수집만).
- 디젤 2.2 = 8단 DCT(저속 울컥 점검). 약관·robots.txt 준수, 저빈도 조회.
- 딜러/판매자 개인정보는 저장·재배포 금지.
