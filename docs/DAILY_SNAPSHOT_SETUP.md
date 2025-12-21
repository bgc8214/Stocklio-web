# 매일 자동 스냅샷 설정 가이드

매일 자정에 자동으로 포트폴리오 스냅샷을 생성하는 기능입니다.

## 작동 방식

```
GitHub Actions (매일 한국 시간 자정)
  ↓
POST /api/cron/daily-snapshot
  ↓
Firebase에서 모든 사용자의 포트폴리오 조회
  ↓
주가 업데이트 (Yahoo Finance API)
  ↓
환율 적용하여 총 자산 계산
  ↓
Firestore에 스냅샷 저장
```

---

## 설정 방법

### 1. GitHub Secrets 설정

GitHub 저장소에서 다음 Secrets을 추가하세요:

1. **Settings** → **Secrets and variables** → **Actions** 이동
2. **New repository secret** 클릭
3. 다음 2개의 Secrets 추가:

#### `APP_URL`
- **Name**: `APP_URL`
- **Value**: 배포된 앱 URL (예: `https://your-app.vercel.app`)

#### `CRON_SECRET`
- **Name**: `CRON_SECRET`
- **Value**: 랜덤 문자열 (예: `my-super-secret-key-12345`)
  ```bash
  # Mac/Linux에서 랜덤 시크릿 생성
  openssl rand -hex 32
  ```

### 2. Vercel 환경 변수 설정

Vercel 대시보드에서 환경 변수 추가:

1. **Vercel Dashboard** → **프로젝트** → **Settings** → **Environment Variables**
2. 다음 변수 추가:

```
CRON_SECRET = (GitHub Secrets와 동일한 값)
```

### 3. 수동 테스트

GitHub Actions를 수동으로 실행하여 테스트:

1. **Actions** 탭 이동
2. **Daily Portfolio Snapshot** 워크플로우 선택
3. **Run workflow** 클릭
4. 결과 확인

---

## 스케줄

- **실행 시간**: 매일 한국 시간 자정 (00:00 KST)
- **UTC 시간**: 15:00 UTC (KST = UTC+9)
- **빈도**: 하루 1회

### 스케줄 변경

`.github/workflows/daily-snapshot.yml` 파일에서 cron 표현식 수정:

```yaml
schedule:
  - cron: '0 15 * * *'  # 현재: 한국 시간 자정
  # - cron: '0 9 * * *'   # 한국 시간 오후 6시
  # - cron: '0 0 * * *'   # 한국 시간 오전 9시
```

---

## API 엔드포인트

### POST /api/cron/daily-snapshot

모든 사용자의 스냅샷을 생성합니다.

**요청 헤더**:
```
Authorization: Bearer {CRON_SECRET}
Content-Type: application/json
```

**응답 예시**:
```json
{
  "message": "Daily snapshots created",
  "timestamp": "2024-01-15T00:00:00.000Z",
  "results": {
    "success": 10,
    "failed": 0,
    "errors": []
  }
}
```

### GET /api/cron/daily-snapshot

Cron Job 상태 확인 (헬스 체크)

**요청 헤더**:
```
Authorization: Bearer {CRON_SECRET}
```

**응답 예시**:
```json
{
  "status": "ready",
  "message": "Daily snapshot cron job is configured",
  "timestamp": "2024-01-15T00:00:00.000Z"
}
```

---

## 수동 실행

로컬 또는 서버에서 수동으로 스냅샷 생성:

```bash
curl -X POST https://your-app.vercel.app/api/cron/daily-snapshot \
  -H "Authorization: Bearer your-cron-secret" \
  -H "Content-Type: application/json"
```

---

## 문제 해결

### 401 Unauthorized

- `CRON_SECRET`이 GitHub Secrets와 Vercel 환경 변수에 정확히 동일한지 확인
- 환경 변수 변경 후 Vercel 재배포 필요

### 500 Internal Server Error

- Vercel 로그 확인: **Deployments** → **Functions** 탭
- Firebase 설정이 올바른지 확인
- Yahoo Finance API 호출 제한 확인

### GitHub Actions 실행 실패

- Actions 탭에서 로그 확인
- `APP_URL`이 올바른지 확인 (https:// 포함)
- 네트워크 연결 확인

### 스냅샷이 생성되지 않음

1. Firestore 콘솔에서 데이터 확인:
   ```
   portfolios → {userId} → snapshots → {YYYY-MM-DD}
   ```

2. GitHub Actions 로그 확인:
   - **Actions** 탭 → 최근 워크플로우 실행 → 로그 확인

3. API 응답 확인:
   - 수동으로 API 호출하여 응답 확인

---

## 비용

### GitHub Actions
- **무료**: Public 저장소는 완전 무료
- **Private 저장소**: 월 2,000분 무료 (1일 1회 실행 = 월 30분 사용)

### Firebase
- **Firestore 쓰기**: 사용자당 1일 1회
- **무료 한도**: 일 20,000회 (충분함)

### Vercel
- **Serverless Functions**: 호출당 무료 (월 100GB-hours 무료)

**총 비용**: **완전 무료** (현재 사용량 기준)

---

## 주의사항

1. **시크릿 보안**
   - `CRON_SECRET`을 절대 코드에 커밋하지 마세요
   - 주기적으로 시크릿 변경 권장

2. **Yahoo Finance API**
   - 무료 API이므로 호출 제한이 있을 수 있음
   - 많은 사용자가 있으면 배치 처리 고려

3. **실행 시간**
   - Vercel Serverless Functions는 최대 10초 제한
   - 사용자가 많으면 타임아웃 가능 (배치 처리 필요)

---

## 다음 단계

- [ ] GitHub Secrets 설정
- [ ] Vercel 환경 변수 설정
- [ ] 수동 테스트 실행
- [ ] 다음날 자동 실행 확인
- [ ] Firestore에서 스냅샷 데이터 확인
