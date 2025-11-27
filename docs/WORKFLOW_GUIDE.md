# 🔄 GitHub Issues 워크플로우 가이드

> Claude Code Agent를 활용한 이슈 기반 개발 프로세스

---

## 📋 워크플로우 개요

모든 작업은 GitHub Issues로 시작하고, Claude Code Agent가 다음 8단계를 순차적으로 진행합니다:

```
1. 이슈 불러오기
   ↓
2. 브랜치 세팅하기
   ↓
3. 코드베이스 분석하기
   ↓
4. 이슈 해결 계획 세우기
   ↓
5. 이슈 해결하기
   ↓
6. 테스트 작성하기
   ↓
7. 검증하기
   ↓
8. 풀리퀘스트 작성하기
```

---

## 🚀 단계별 가이드

### 1단계: 이슈 불러오기

**목표**: GitHub에서 할당된 이슈를 확인하고 요구사항을 파악

```bash
# 이슈 목록 조회
gh issue list

# 특정 이슈 상세 보기
gh issue view <issue-number>

# 내게 할당된 이슈만 보기
gh issue list --assignee @me
```

**Claude Code 프롬프트 예시**:
```
#<issue-number> 이슈를 확인하고 요구사항을 분석해줘
```

---

### 2단계: 브랜치 세팅하기

**목표**: 이슈 번호 기반으로 feature 브랜치 생성

```bash
# 이슈 기반 브랜치 생성 및 체크아웃
gh issue develop <issue-number> --checkout

# 또는 수동 생성
git checkout -b feature/#<issue-number>-<short-description>
```

**브랜치 네이밍**:
- Feature: `feature/#12-implement-dashboard`
- Bugfix: `bugfix/#5-fix-login-error`
- Hotfix: `hotfix/#10-critical-security-patch`

**Claude Code 프롬프트 예시**:
```
#<issue-number> 이슈를 위한 feature 브랜치를 생성해줘
```

---

### 3단계: 코드베이스 분석하기

**목표**: 이슈 해결에 필요한 파일, 함수, 의존성 파악

**분석 항목**:
- 관련 파일 및 컴포넌트 찾기
- 기존 코드 패턴 파악
- 의존성 확인
- 영향 받는 다른 기능 확인

**Claude Code 프롬프트 예시**:
```
대시보드 관련 컴포넌트들을 찾아서 분석해줘.
현재 어떤 파일들이 있고, 어떤 구조로 되어 있는지 파악해줘.
```

---

### 4단계: 이슈 해결 계획 세우기

**목표**: 구현 방향 및 단계별 작업 계획 수립

**계획 포함 사항**:
- 구현 방법 (어떻게 해결할 것인가)
- 작업 단계 (순서대로)
- 필요한 파일 변경 목록
- 잠재적 리스크 및 고려사항

**Claude Code 프롬프트 예시**:
```
#<issue-number> 이슈를 해결하기 위한 구현 계획을 세워줘.
어떤 파일을 수정해야 하고, 어떤 순서로 작업하면 좋을지 정리해줘.
```

---

### 5단계: 이슈 해결하기

**목표**: 실제 코드 작성 및 구현

**작업 원칙**:
- 기존 코드 스타일 유지
- 타입 안전성 보장
- 주석 및 문서화
- 작은 단위로 커밋

**커밋 메시지 형식**:
```bash
<type>(#<issue-number>): <subject>

<body>

Closes #<issue-number>
```

**예시**:
```bash
git commit -m "feat(#12): 대시보드 히어로 카드 구현

- HeroAssetCard 컴포넌트 추가
- 총 자산 및 수익률 표시 로직 구현
- Glass Morphism 디자인 적용

Closes #12"
```

**Claude Code 프롬프트 예시**:
```
계획한대로 #<issue-number> 이슈를 구현해줘.
한 단계씩 진행하면서 커밋해줘.
```

---

### 6단계: 테스트 작성하기

**목표**: 기능 검증 및 테스트 코드 작성

**테스트 종류**:
- 단위 테스트 (함수/컴포넌트)
- 통합 테스트 (기능 흐름)
- E2E 테스트 (사용자 시나리오)

**수동 테스트 체크리스트**:
- [ ] 기능이 요구사항대로 작동하는가?
- [ ] 엣지 케이스가 처리되는가?
- [ ] 에러 핸들링이 적절한가?
- [ ] UI가 반응형으로 작동하는가?

**Claude Code 프롬프트 예시**:
```
구현한 기능에 대한 테스트를 작성해줘.
주요 기능과 엣지 케이스를 모두 커버해줘.
```

---

### 7단계: 검증하기

**목표**: 빌드, 린트, 타입 체크 통과 확인

**검증 명령어**:
```bash
# 타입 체크
npx tsc --noEmit

# 린트 검사
npm run lint

# 빌드
npm run build

# 개발 서버 실행
npm run dev
```

**체크리스트**:
- [ ] 타입 에러 없음
- [ ] 린트 에러 없음
- [ ] 빌드 성공
- [ ] 개발 서버 정상 작동
- [ ] 콘솔 에러 없음

**Claude Code 프롬프트 예시**:
```
타입 체크, 린트, 빌드를 모두 실행해서 검증해줘.
에러가 있으면 수정해줘.
```

---

### 8단계: 풀리퀘스트 작성하기

**목표**: PR 생성 및 리뷰 요청

**PR 작성 명령어**:
```bash
# PR 생성
gh pr create --title "feat(#12): 대시보드 구현" --body-file .github/pull_request_template.md

# 또는 인터랙티브 모드
gh pr create
```

**PR 제목 형식**:
```
<type>(#<issue-number>): <subject>
```

**PR 본문 필수 항목**:
- 관련 이슈 번호 (Closes #12)
- 작업 내용 체크리스트
- 테스트 체크리스트
- 스크린샷 (UI 변경 시)

**Claude Code 프롬프트 예시**:
```
#<issue-number> 이슈에 대한 PR을 작성해줘.
템플릿에 맞춰서 상세하게 작성해줘.
```

---

## 💡 Claude Code 활용 팁

### 전체 워크플로우 한번에 실행

```
#<issue-number> 이슈를 처음부터 끝까지 해결해줘.
다음 순서로 진행해줘:
1. 이슈 내용 확인
2. 브랜치 생성
3. 코드베이스 분석
4. 구현 계획 수립
5. 코드 구현
6. 테스트 작성
7. 검증 (타입체크, 린트, 빌드)
8. PR 작성
```

### 특정 단계만 실행

```
# 코드베이스 분석만
#<issue-number> 이슈와 관련된 파일들을 분석해줘

# 구현만
#<issue-number> 이슈를 구현해줘 (이미 계획은 세웠어)

# 검증만
현재 변경사항을 검증해줘 (타입체크, 린트, 빌드)
```

---

## 📚 참고 자료

### GitHub CLI 치트시트

```bash
# 이슈 관리
gh issue list                    # 이슈 목록
gh issue view <number>           # 이슈 보기
gh issue create                  # 이슈 생성
gh issue close <number>          # 이슈 닫기

# PR 관리
gh pr list                       # PR 목록
gh pr view <number>              # PR 보기
gh pr create                     # PR 생성
gh pr status                     # PR 상태
gh pr checkout <number>          # PR 체크아웃
gh pr review --approve           # PR 승인
gh pr merge                      # PR 머지

# 브랜치 관리
gh issue develop <number>        # 이슈 기반 브랜치 생성
git checkout -b feature/#12      # 브랜치 생성
git push -u origin feature/#12   # 원격에 푸시
```

---

## 🎯 베스트 프랙티스

### 1. 작은 단위로 작업하기
- 하나의 이슈는 하나의 기능/버그 수정에 집중
- PR은 300줄 이하로 유지 (리뷰 용이성)

### 2. 명확한 커밋 메시지
- 무엇을, 왜 변경했는지 명확히
- 이슈 번호 항상 포함

### 3. 충분한 테스트
- 모든 기능에 테스트 작성
- 엣지 케이스 고려

### 4. 코드 리뷰 적극 활용
- 리뷰어의 피드백 반영
- 질문에 명확히 답변

### 5. 문서화
- README 업데이트
- 주석 작성
- 변경사항 문서화

---

**작성일**: 2025-11-27
**버전**: 1.0.0
