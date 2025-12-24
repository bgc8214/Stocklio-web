# Firebase Firestore 설정 가이드

## 🔴 발견된 문제들

### 1. Firestore 복합 인덱스 누락
- **문제**: `where('userId', '==', userId)` + `orderBy('createdAt', 'desc')` 복합 쿼리에 인덱스가 없음
- **증상**: 포트폴리오 데이터 로딩 무한 대기, 데이터 조회 실패
- **해결**: 복합 인덱스 생성 필요

### 2. Snapshot 컬렉션 경로 오류
- **문제**: `portfolios/{userId}/snapshots` 경로를 사용 (잘못됨)
- **수정**: `users/{userId}/snapshots` 경로로 변경
- **이유**: `portfolios`는 포트폴리오 문서들을 저장하는 컬렉션이므로 서브컬렉션으로 사용 불가

### 3. 보안 규칙 미설정
- **문제**: Firestore 보안 규칙이 설정되지 않음
- **증상**: 읽기/쓰기 권한 오류 발생 가능
- **해결**: 보안 규칙 생성 및 배포 필요

---

## ✅ 수정 완료 사항

### 1. Firestore 쿼리 에러 핸들링 추가
[src/lib/firebase/firestore.ts](src/lib/firebase/firestore.ts)에 인덱스 오류 대비 폴백 로직 추가:

```typescript
// 인덱스가 없을 때 orderBy 없이 조회하고 클라이언트에서 정렬
try {
  const q = query(
    collection(firestore, 'portfolios').withConverter(portfolioConverter),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => doc.data())
} catch (error: any) {
  if (error.code === 'failed-precondition' || error.message?.includes('index')) {
    // orderBy 없이 재시도
    const q = query(
      collection(firestore, 'portfolios').withConverter(portfolioConverter),
      where('userId', '==', userId)
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => doc.data()).sort((a, b) =>
      b.createdAt.getTime() - a.createdAt.getTime()
    )
  }
  throw error
}
```

### 2. Snapshot 경로 수정
- 변경 전: `collection(firestore, 'portfolios', userId, 'snapshots')`
- 변경 후: `collection(firestore, 'users', userId, 'snapshots')`

### 3. 보안 규칙 파일 생성
생성된 파일:
- [firestore.rules](firestore.rules) - Firestore 보안 규칙
- [firebase.json](firebase.json) - Firebase 설정
- [firestore.indexes.json](firestore.indexes.json) - Firestore 인덱스 정의

---

## 🚀 Firebase Console에서 수동 설정 방법

Firebase CLI 로그인 없이 Firebase Console에서 직접 설정할 수 있습니다.

### 1단계: Firestore 보안 규칙 설정

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 선택: `myfolio-web-a9c1f`
3. 좌측 메뉴에서 **Firestore Database** 클릭
4. 상단 탭에서 **규칙(Rules)** 클릭
5. 아래 규칙을 복사하여 붙여넣기:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자 문서
    match /users/{userId} {
      // 본인만 읽기/쓰기 가능
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // 사용자별 스냅샷 서브컬렉션
      match /snapshots/{snapshotId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }

    // 포트폴리오 문서
    match /portfolios/{portfolioId} {
      // 본인의 포트폴리오만 읽기/쓰기 가능
      allow read: if request.auth != null &&
                     resource.data.userId == request.auth.uid;
      allow create: if request.auth != null &&
                       request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null &&
                               resource.data.userId == request.auth.uid;
    }
  }
}
```

6. **게시(Publish)** 버튼 클릭

### 2단계: Firestore 복합 인덱스 생성

1. Firestore Database 화면에서 상단 탭의 **색인(Indexes)** 클릭
2. **복합(Composite)** 탭 선택
3. **색인 추가** 버튼 클릭
4. 아래와 같이 설정:
   - **컬렉션 ID**: `portfolios`
   - **필드 추가**:
     - 필드 경로: `userId`, 쿼리 범위: `Ascending`
     - 필드 경로: `createdAt`, 쿼리 범위: `Descending`
   - **쿼리 범위**: `Collection`
5. **만들기** 버튼 클릭
6. 인덱스 생성 완료까지 대기 (수 분 소요)

### 3단계: 기존 데이터 확인 및 정리

1. Firestore Database 화면에서 **데이터(Data)** 탭 클릭
2. 컬렉션 구조 확인:
   - ✅ `portfolios` 컬렉션: 각 문서에 `userId` 필드가 있는지 확인
   - ✅ `users/{userId}/snapshots` 서브컬렉션: 스냅샷 데이터 확인
3. 잘못된 경로의 데이터가 있다면 삭제:
   - ❌ `portfolios/{userId}/snapshots` (잘못된 경로)

---

## 🔧 Firebase CLI로 배포하는 방법 (선택사항)

Firebase CLI가 설치되어 있고 로그인이 되어 있다면:

```bash
# 1. Firebase 로그인
firebase login

# 2. 프로젝트 선택
firebase use myfolio-web-a9c1f

# 3. 보안 규칙 배포
firebase deploy --only firestore:rules

# 4. 인덱스 배포
firebase deploy --only firestore:indexes
```

---

## 📊 데이터 구조

### 포트폴리오 컬렉션
```
portfolios/
  {portfolioId}/
    - userId: string
    - ticker: string
    - name: string
    - quantity: number
    - averageCost: number
    - currentPrice: number
    - market: 'KRX' | 'US'
    - categoryId?: number
    - createdAt: Timestamp
    - updatedAt: Timestamp
```

### 사용자 및 스냅샷 컬렉션
```
users/
  {userId}/
    - uid: string
    - email: string
    - displayName?: string
    - photoURL?: string
    - emailVerified: boolean
    - createdAt: Timestamp
    - lastLoginAt: Timestamp

    snapshots/
      {YYYY-MM-DD}/
        - totalValue: number
        - totalCost: number
        - totalProfit: number
        - profitRate: number
        - dailyProfit: number
        - monthlyProfit: number
        - yearlyProfit: number
```

---

## 🧪 테스트 방법

1. 개발 서버 실행:
```bash
npm run dev
```

2. 로그인 후 포트폴리오 추가 시도
3. 브라우저 개발자 도구(F12) 콘솔에서 에러 확인:
   - ✅ 에러 없음: 정상 작동
   - ❌ `failed-precondition`: 인덱스 생성 필요 (2단계 진행)
   - ❌ `permission-denied`: 보안 규칙 설정 필요 (1단계 진행)

---

## 💡 추가 팁

### 인덱스 생성 시간
- 보통 5~10분 소요
- Firebase Console에서 진행 상황 확인 가능

### 콘솔에서 자동 인덱스 링크
- 앱에서 쿼리 실행 시 인덱스가 없으면 콘솔에 에러 로그와 함께 **인덱스 생성 링크**가 표시됨
- 해당 링크를 클릭하면 자동으로 필요한 인덱스 설정 화면으로 이동

### 로컬 에뮬레이터 사용 (개발 전용)
```bash
# Firestore 에뮬레이터 실행
firebase emulators:start --only firestore

# .env.local에 에뮬레이터 설정 추가
NEXT_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_HOST=localhost:8080
```

---

**작성일**: 2025-12-25
**버전**: 1.0.0
