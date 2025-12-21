# Firebase Cloud Functions 설정 가이드

매일 자동으로 모든 사용자의 포트폴리오 스냅샷을 생성하는 Firebase Cloud Function입니다.

## 작동 방식

```
Firebase Cloud Scheduler (매일 한국 시간 자정)
  ↓
Cloud Function: createDailySnapshots
  ↓
Firestore에서 모든 사용자 조회
  ↓
각 사용자별 포트폴리오 데이터 계산
  ↓
환율 적용 (US 주식 → 원화)
  ↓
Firestore에 스냅샷 저장
```

---

## 설정 방법

### 1. Firebase CLI 설치

```bash
npm install -g firebase-tools
```

### 2. Firebase 로그인

```bash
firebase login
```

### 3. Functions 패키지 설치

```bash
cd functions
npm install
```

### 4. TypeScript 빌드

```bash
npm run build
```

### 5. Firebase Functions 배포

```bash
firebase deploy --only functions
```

배포 후 Firebase 콘솔에서 확인:
- **Firebase Console** → **Functions** 탭
- `createDailySnapshots` 함수가 배포되었는지 확인

---

## 스케줄 설정

### 기본 설정
- **실행 시간**: 매일 한국 시간 자정 (00:00 KST)
- **리전**: asia-northeast3 (서울)
- **스케줄**: `0 0 * * *` (Cron 표현식)

### 스케줄 변경

`functions/src/index.ts` 파일에서 수정:

```typescript
export const createDailySnapshots = functions
  .region('asia-northeast3')
  .pubsub
  .schedule('0 0 * * *')  // 현재: 매일 자정
  // .schedule('0 9 * * *')   // 매일 오전 9시
  // .schedule('0 18 * * *')  // 매일 오후 6시
  .timeZone('Asia/Seoul')
  .onRun(async (context) => {
    // ...
  })
```

변경 후 재배포:
```bash
cd functions
npm run build
firebase deploy --only functions
```

---

## 로그 확인

### Firebase 콘솔에서 확인
1. **Firebase Console** → **Functions** 탭
2. `createDailySnapshots` 클릭
3. **Logs** 탭 확인

### CLI로 확인
```bash
# 실시간 로그
firebase functions:log

# 특정 함수 로그
firebase functions:log --only createDailySnapshots
```

---

## 수동 실행 (테스트)

Firebase 콘솔에서 수동 실행:

1. **Firebase Console** → **Functions** 탭
2. `createDailySnapshots` 선택
3. **Testing** 탭
4. **Run** 버튼 클릭

---

## 비용

### Firebase Spark Plan (무료)
- **Cloud Functions 호출**: 월 200만 호출 무료
  - 하루 1회 × 30일 = 30회 (0.0015% 사용)
- **Cloud Scheduler**: 월 3개 작업 무료
  - 1개 작업 사용 중
- **Firestore 쓰기**: 일 20,000회 무료
  - 사용자 10명 × 1일 1회 = 10회

**예상 비용**: **완전 무료** (현재 사용량 기준)

### Firebase Blaze Plan (종량제)
무료 한도 초과 시:
- Functions: $0.40 / 백만 호출
- Firestore 쓰기: $0.18 / 10만 문서

---

## 문제 해결

### 함수 배포 실패

```bash
# Firebase 프로젝트 확인
firebase use

# 프로젝트 재설정
firebase use myfolio-web-a9c1f
```

### 스케줄러 작동 안 함

1. Firebase Blaze Plan (종량제) 필요
   - Spark Plan(무료)에서는 Cloud Scheduler 사용 불가
   - **Firebase Console** → **Upgrade** → **Blaze Plan**으로 전환
   - 무료 한도 내에서는 요금 없음

2. Cloud Scheduler API 활성화
   - [Google Cloud Console](https://console.cloud.google.com/) 접속
   - **APIs & Services** → **Enable APIs and Services**
   - "Cloud Scheduler API" 검색 및 활성화

### 로그에 에러 표시

```bash
# 상세 로그 확인
firebase functions:log --only createDailySnapshots --limit 100

# Firestore 권한 확인
# Firebase Console → Firestore → Rules 탭
```

### 스냅샷이 생성되지 않음

1. Firestore에서 데이터 확인:
   ```
   portfolios → {userId} → snapshots → {YYYY-MM-DD}
   ```

2. Functions 로그 확인:
   - "Starting daily snapshot creation..." 메시지 확인
   - "Snapshot created for user..." 메시지 확인

3. Firestore 권한 확인:
   - Admin SDK는 모든 권한 보유
   - Security Rules 무관

---

## 개발 환경 테스트

로컬에서 Functions 테스트:

```bash
# 1. Functions Emulator 실행
cd functions
npm run serve

# 2. 다른 터미널에서 함수 호출
firebase functions:shell
> createDailySnapshots()
```

---

## 환경 변수 설정 (선택사항)

Firebase Functions에서 환경 변수 사용:

```bash
# 환경 변수 설정
firebase functions:config:set exchange.rate="1300"

# 재배포
firebase deploy --only functions
```

코드에서 사용:
```typescript
const exchangeRate = functions.config().exchange?.rate || 1300
```

---

## 다음 단계

- [x] Firebase Functions 배포
- [ ] Blaze Plan으로 업그레이드 (Cloud Scheduler 사용)
- [ ] Cloud Scheduler API 활성화
- [ ] 첫 실행 확인 (다음날 자정)
- [ ] Firestore에서 스냅샷 데이터 확인

---

## 명령어 요약

```bash
# 설치
cd functions && npm install

# 빌드
npm run build

# 배포
firebase deploy --only functions

# 로그 확인
firebase functions:log

# 로컬 테스트
npm run serve
```
