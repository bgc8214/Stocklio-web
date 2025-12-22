# 일일 스냅샷 자동화 설정 가이드

> GitHub Actions를 사용한 무료 일일 포트폴리오 스냅샷 자동화

---

## 📌 개요

이 시스템은 **GitHub Actions**를 사용하여 매일 자정(KST)에 자동으로 모든 사용자의 포트폴리오 스냅샷을 생성합니다.

### 장점
- ✅ **완전 무료** (GitHub Actions는 public 저장소에서 무료)
- ✅ **서버 불필요** (서버리스 아키텍처)
- ✅ **자동화** (사용자 방문 없이 매일 자동 실행)
- ✅ **신뢰성** (GitHub 인프라 사용)

---

## 🏗️ 아키텍처

```
GitHub Actions (Cron)
      ↓
매일 자정 KST (UTC 15:00)
      ↓
Next.js API Route (/api/cron/daily-snapshot)
      ↓
Firestore에서 모든 사용자 조회
      ↓
각 사용자별 포트폴리오 계산
      ↓
스냅샷 저장
```

---

## 📁 파일 구조

```
my-portfolio-web/
├── .github/
│   └── workflows/
│       └── daily-snapshot.yml          # GitHub Actions 워크플로우
├── src/
│   └── app/
│       └── api/
│           └── cron/
│               └── daily-snapshot/
│                   └── route.ts        # 스냅샷 생성 API
└── .env.local                          # CRON_SECRET 설정
```

---

## ⚙️ 설정 방법

### 1. CRON_SECRET 생성

먼저 안전한 시크릿 키를 생성합니다.

**방법 1: OpenSSL 사용**
```bash
openssl rand -base64 32
```

**방법 2: Node.js 사용**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**방법 3: 온라인 생성기**
- https://randomkeygen.com/
- "Fort Knox Passwords" 섹션에서 하나 복사

### 2. 로컬 환경 변수 설정

`.env.local` 파일에 추가:

```env
# Cron Job Secret
CRON_SECRET=your-generated-secret-key-here
```

⚠️ **주의**: 생성한 시크릿을 안전하게 보관하세요. GitHub Secrets에서도 동일한 값을 사용합니다.

### 3. GitHub Secrets 설정

1. GitHub 저장소로 이동
2. **Settings** > **Secrets and variables** > **Actions**
3. **New repository secret** 클릭
4. 다음 정보 입력:
   - Name: `CRON_SECRET`
   - Secret: (위에서 생성한 동일한 시크릿 키)
5. **Add secret** 클릭

### 4. Vercel 환경 변수 설정 (배포 후)

Vercel 대시보드에서:

1. 프로젝트 선택
2. **Settings** > **Environment Variables**
3. 추가:
   - Key: `CRON_SECRET`
   - Value: (위에서 생성한 동일한 시크릿 키)
   - Environment: Production, Preview, Development 모두 체크
4. **Save** 클릭

### 5. GitHub Actions 워크플로우 수정

`.github/workflows/daily-snapshot.yml` 파일에서 도메인 수정:

```yaml
- name: Trigger Daily Snapshot API
  run: |
    curl -X POST https://your-domain.vercel.app/api/cron/daily-snapshot \
      -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
      -H "Content-Type: application/json"
```

**`your-domain.vercel.app`를 실제 Vercel 도메인으로 변경하세요.**

예시:
```yaml
curl -X POST https://myfolio-web.vercel.app/api/cron/daily-snapshot \
```

---

## 🧪 테스트

### 로컬 테스트

```bash
curl -X POST http://localhost:3000/api/cron/daily-snapshot \
  -H "Authorization: Bearer your-cron-secret" \
  -H "Content-Type: application/json"
```

**성공 응답 예시:**
```json
{
  "success": true,
  "message": "Daily snapshot completed",
  "stats": {
    "totalUsers": 3,
    "successCount": 3,
    "errorCount": 0
  }
}
```

### 프로덕션 테스트

```bash
curl -X POST https://your-domain.vercel.app/api/cron/daily-snapshot \
  -H "Authorization: Bearer your-cron-secret" \
  -H "Content-Type: application/json"
```

### GitHub Actions 수동 실행

1. GitHub 저장소로 이동
2. **Actions** 탭 클릭
3. **Daily Portfolio Snapshot** 워크플로우 선택
4. **Run workflow** 버튼 클릭
5. **Run workflow** 확인

---

## 📅 실행 시간

- **한국 시간**: 매일 오전 00:00 (자정)
- **UTC 시간**: 매일 15:00
- **Cron 표현식**: `0 15 * * *`

### Cron 표현식 이해

```
0 15 * * *
│ │  │ │ │
│ │  │ │ └─ 요일 (0-6, 일요일=0)
│ │  │ └─── 월 (1-12)
│ │  └───── 일 (1-31)
│ └──────── 시 (0-23, UTC 기준)
└────────── 분 (0-59)
```

**실행 시간 변경 예시:**
```yaml
# 매일 오전 9시 (KST)
- cron: '0 0 * * *'

# 매일 오후 6시 (KST)
- cron: '0 9 * * *'

# 매주 월요일 오전 9시 (KST)
- cron: '0 0 * * 1'
```

---

## 🔍 모니터링

### GitHub Actions 로그 확인

1. GitHub 저장소 > **Actions** 탭
2. **Daily Portfolio Snapshot** 워크플로우 선택
3. 최근 실행 내역 확인
4. 실행 항목 클릭하여 상세 로그 확인

### API 로그 확인 (Vercel)

1. Vercel 대시보드
2. 프로젝트 선택
3. **Logs** 탭
4. `/api/cron/daily-snapshot` 필터링

**로그 예시:**
```
[Cron] Daily snapshot started
[Cron] Found 3 users
[Cron] Snapshot created for user abc123
[Cron] Snapshot created for user def456
[Cron] Snapshot created for user ghi789
[Cron] Daily snapshot completed. Success: 3, Error: 0
```

---

## 🐛 문제 해결

### 401 Unauthorized

**원인**: CRON_SECRET이 일치하지 않음

**해결**:
1. `.env.local` 확인
2. GitHub Secrets 확인
3. Vercel 환경 변수 확인
4. 모두 동일한 값인지 확인

### 워크플로우가 실행되지 않음

**원인**: GitHub Actions가 비활성화됨

**해결**:
1. GitHub 저장소 > **Settings** > **Actions**
2. **Actions permissions** 확인
3. "Allow all actions and reusable workflows" 선택

### 스냅샷이 생성되지 않음

**원인**: Firestore 권한 또는 데이터 문제

**해결**:
1. Firestore 규칙 확인
2. 포트폴리오 데이터 존재 확인
3. API 로그에서 에러 메시지 확인

---

## 💡 추가 기능

### 주간/월간 스냅샷

**주간 스냅샷 (매주 월요일 오전 9시)**
```yaml
on:
  schedule:
    - cron: '0 0 * * 1'  # 월요일 00:00 KST
```

**월간 스냅샷 (매월 1일 오전 9시)**
```yaml
on:
  schedule:
    - cron: '0 0 1 * *'  # 매월 1일 00:00 KST
```

### 실패 시 알림

GitHub Actions에 Slack/Discord 알림 추가:

```yaml
- name: Notify on failure
  if: failure()
  run: |
    curl -X POST ${{ secrets.SLACK_WEBHOOK_URL }} \
      -H 'Content-Type: application/json' \
      -d '{"text":"Daily snapshot failed!"}'
```

---

## 🔐 보안 고려사항

1. **CRON_SECRET은 절대 공개하지 마세요**
   - `.env.local`은 `.gitignore`에 포함됨
   - GitHub Secrets는 암호화되어 저장됨
   - Vercel 환경 변수도 안전하게 관리됨

2. **API 엔드포인트 보호**
   - Bearer 토큰 인증 사용
   - 요청 헤더 검증
   - 실패 시 상세 에러 노출 방지

3. **정기적인 시크릿 갱신**
   - 3-6개월마다 CRON_SECRET 변경 권장

---

## 📊 비용

- **GitHub Actions**: 무료 (public 저장소)
- **Vercel Serverless Functions**: 무료 (Hobby 플랜 내 제한)
- **Firebase Firestore**: 무료 (Spark 플랜 내 제한)

**예상 사용량** (사용자 100명 기준):
- GitHub Actions: 1분/일 (무료 한도 내)
- Vercel Functions: 100 invocations/일 (무료 한도 내)
- Firestore Reads: 200 reads/일 (무료 한도 내)

---

## 🎯 다음 단계

1. [x] GitHub Actions 설정
2. [x] CRON_SECRET 생성 및 등록
3. [x] 도메인 수정
4. [ ] 프로덕션 배포
5. [ ] 수동 테스트
6. [ ] 첫 자동 실행 확인 (다음날 자정)
7. [ ] 로그 모니터링 설정

---

**작성일**: 2025-11-27
**버전**: 1.0.0
