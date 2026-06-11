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

## 매물 목록 — ★헤드(headed) 모드 권장 (헤드리스는 막힘)
헤드리스에서는 카드가 가상스크롤 + 차량코드 비노출이라 막힌다. **보이는 크롬(headed)**
에서는 아래가 동작한다(검증됨):

1) **내부 list API 응답 후킹**: 결과는 `POST https://api.kcar.com/bc/search/list/drct`로
   오며 응답 `data.rows[]`에 **모델·트림(grdDtlNm)·연식(mfgDt)·주행(milg)·가격(prc)·
   색상(extrColorNm)·연료(fuelNm)·변속기(trnsmsnNm)·용도(useNm=영업용/렌트)·
   사고(acdtHistCnts)·carCd**가 모두 있다 → 상세 없이 색상·렌트까지 판정 가능.
   `scripts/hook-list.js` 설치 후 필터를 바꾸면 list API가 자동 발화 → `window.__cap`에 적재.
2) **좌측 필터 클릭은 `mousedown→mouseup→click` 풀 시퀀스를 좌표와 함께 디스패치**
   (`scripts/click-filter.js`). 예) 기아 2,857 → +스포티지 235 → +흰색 31 로 좁힘.
3) 좁힌 뒤 `__cap` rows를 모아 **PII(cno/seler*)는 버리고**(PRIVACY.md) modelNm·색상·
   가격으로 NQ5·흰색·가격대 클라이언트 필터링.

### ★전수(페이지네이션) 돌파 — `scripts/paginate.js`
요청 본문이 **암호화(`{"enc":"..."}`)** 라 API 재호출로는 페이지를 못 넘긴다. 대신:
- **페이지번호/"다음"은 DOM 합성 click이 안 먹지만, `snapshot -i`가 잡는
  cursor-interactive(@c) ref를 "네이티브 클릭"하면 발화한다**(체크박스/번호 LI는 숨김이라 실패).
- **누적 후킹**(carCd dedup)으로 페이지를 넘길 때마다 `window.__rows`에 쌓는다.
- 루프: 하단 스크롤 → snapshot -i → "다음" @c/@e ref → **native click** → 2~3초 대기 →
  `__rows` 증가 확인 → 안 늘면 종료. (모델+색상으로 좁히면 6~7페이지로 전수 가능)
- 모델 전환은 새 세션이 안정적(in-place 전환은 모델목록이 "더보기"에 접혀 불안정).

검증: 기아 스포티지 흰색 30대(2p)·현대 싼타페 흰색 142대(6p) 전수 수집됨. (현대 투싼은
모델목록 "더보기" 접힘으로 선택 불안정 → 키워드/직접 코드 보강 권장)

## 한계 / 주의
- **반드시 headed 모드.** 합성 클릭/페이지네이션은 사이트 변경에 취약 → 필터로 좁히기.
- 디젤 2.2 = 8단 DCT(저속 울컥). 가솔린 sportage는 모니터링(SVM) 누락 개체 많음 → detail optList 확인.
- 약관·robots.txt 준수, 저빈도 조회. **차량번호·딜러 연락처 등 개인정보 저장·출력 금지([PRIVACY.md](../../PRIVACY.md)).**
