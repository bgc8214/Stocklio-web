# Git Worktree 사용 가이드

> 여러 이슈를 동시에 작업하기 위한 Git Worktree 완벽 가이드

---

## 📖 목차

1. [개요](#개요)
2. [설치 및 설정](#설치-및-설정)
3. [기본 사용법](#기본-사용법)
4. [헬퍼 스크립트](#헬퍼-스크립트)
5. [실전 예제](#실전-예제)
6. [주의사항](#주의사항)
7. [문제 해결](#문제-해결)

---

## 개요

### 왜 Git Worktree를 사용하나요?

**문제:**
- 이슈 5번 작업 중 긴급 이슈 7번이 발생
- 브랜치를 전환하면 작업 중인 코드가 섞임
- 여러 이슈를 동시에 테스트하기 어려움

**해결:**
- Git Worktree를 사용하면 **각 이슈마다 독립적인 작업 공간**을 생성
- 브랜치 전환 없이 **여러 이슈를 동시에 작업** 가능
- 각 워크트리에서 **독립적으로 서버 실행** 가능

### 디렉토리 구조

```
Desktop/cursor/
├── my-portfolio-web/          # 메인 저장소
│   ├── .git/                  # Git 저장소 (공유)
│   ├── src/
│   └── ...
│
└── worktrees/                 # 워크트리 전용 디렉토리
    ├── issue-5/               # 이슈 5번 작업 공간
    │   ├── src/
    │   ├── node_modules/      # 독립적인 패키지
    │   └── ...
    │
    ├── issue-6/               # 이슈 6번 작업 공간
    │   ├── src/
    │   ├── node_modules/
    │   └── ...
    │
    └── hotfix-7/              # 긴급 핫픽스
        ├── src/
        ├── node_modules/
        └── ...
```

---

## 설치 및 설정

### 1. 워크트리 디렉토리 생성

```bash
# 메인 저장소에서
cd ~/Desktop/cursor/my-portfolio-web

# 헬퍼 스크립트로 설정
./.worktree-helper.sh setup

# 또는 직접 생성
mkdir -p ../worktrees
```

### 2. Git 설정 확인

Git Worktree는 Git 2.5+ 버전에서 사용 가능합니다.

```bash
# Git 버전 확인
git --version
# git version 2.39.0 이상이면 OK
```

---

## 기본 사용법

### 워크트리 생성

```bash
# 방법 1: npm 스크립트 (빠른 방법)
npm run wt:create -- ../worktrees/issue-7 -b feature/#7-new-feature

# 방법 2: git 명령어 직접 사용
git worktree add ../worktrees/issue-7 -b feature/#7-new-feature

# 방법 3: 헬퍼 스크립트 (권장)
./.worktree-helper.sh create 7
```

### 워크트리 목록 확인

```bash
# npm 스크립트
npm run wt:list

# git 명령어
git worktree list

# 헬퍼 스크립트
./.worktree-helper.sh list
```

### 워크트리에서 작업하기

```bash
# 워크트리로 이동
cd ../worktrees/issue-7

# 패키지 설치 (각 워크트리마다 필요!)
npm install

# 개발 서버 실행
npm run dev

# 또는 다른 포트 사용
npm run dev -- -p 3001
```

### 워크트리 삭제

```bash
# 메인 저장소로 돌아가기
cd ~/Desktop/cursor/my-portfolio-web

# npm 스크립트
npm run wt:remove -- ../worktrees/issue-7

# git 명령어
git worktree remove ../worktrees/issue-7

# 헬퍼 스크립트
./.worktree-helper.sh remove 7
```

---

## 헬퍼 스크립트

`.worktree-helper.sh`는 워크트리 관리를 더 쉽게 해주는 스크립트입니다.

### 기본 명령어

```bash
# 도움말
./.worktree-helper.sh help

# 워크트리 생성 (GitHub 이슈 정보 자동 반영)
./.worktree-helper.sh create <issue-number>

# 워크트리 목록
./.worktree-helper.sh list

# VS Code로 워크트리 열기
./.worktree-helper.sh open <issue-number>

# 워크트리 삭제
./.worktree-helper.sh remove <issue-number>

# 불필요한 워크트리 정리
./.worktree-helper.sh clean
```

### 헬퍼 스크립트의 장점

1. **GitHub 이슈 정보 자동 반영**
   - 이슈 번호만 입력하면 제목을 가져와서 브랜치명 생성
   - 예: 이슈 #7 "실시간 업데이트 구현" → `feature/#7-realtime-updates`

2. **간편한 명령어**
   - 긴 경로를 입력할 필요 없음
   - 이슈 번호만으로 모든 작업 가능

3. **VS Code 통합**
   - `open` 명령어로 바로 VS Code 실행

---

## 실전 예제

### 시나리오 1: 새 이슈 작업 시작

```bash
# Step 1: 이슈 7번 확인
gh issue view 7

# Step 2: 워크트리 생성
./.worktree-helper.sh create 7

# Step 3: 워크트리로 이동
cd ../worktrees/issue-7

# Step 4: 패키지 설치
npm install

# Step 5: VS Code로 열기 (선택사항)
code .

# Step 6: 개발 서버 실행
npm run dev
```

### 시나리오 2: 여러 이슈 동시 작업

```bash
# 터미널 1: 이슈 5 작업
cd ~/Desktop/cursor/my-portfolio-web
./.worktree-helper.sh create 5
cd ../worktrees/issue-5
npm install
npm run dev -- -p 3000  # 포트 3000

# 터미널 2: 이슈 6 작업 (동시에!)
cd ~/Desktop/cursor/my-portfolio-web
./.worktree-helper.sh create 6
cd ../worktrees/issue-6
npm install
npm run dev -- -p 3001  # 포트 3001
```

### 시나리오 3: 긴급 핫픽스

```bash
# 이슈 5 작업 중 긴급 이슈 발생
# 현재: issue-5 워크트리에서 작업 중

# 새 터미널 열기
cd ~/Desktop/cursor/my-portfolio-web
./.worktree-helper.sh create 7  # 긴급 이슈
cd ../worktrees/issue-7
npm install
# 긴급 수정...
git add . && git commit -m "hotfix(#7): 긴급 수정"
git push

# 원래 작업으로 돌아가기
cd ../worktrees/issue-5
# 계속 작업...
```

### 시나리오 4: PR 리뷰 중 다른 작업

```bash
# PR 대기 중인 브랜치를 워크트리로 생성
git worktree add ../worktrees/review-5 feature/#5-category-pages

# 다음 작업 시작
./.worktree-helper.sh create 8

# 리뷰 피드백 반영 시
cd ../worktrees/review-5
# 수정...
git commit --amend
git push --force-with-lease
```

### 시나리오 5: 작업 완료 및 정리

```bash
# Step 1: 작업 완료 후 커밋 & PR
cd ../worktrees/issue-7
git add .
git commit -m "feat(#7): 실시간 업데이트 구현"
git push -u origin feature/#7-realtime-updates

# Step 2: PR 생성
gh pr create --title "feat(#7): 실시간 업데이트" --body "Closes #7"

# Step 3: 메인 저장소로 돌아가기
cd ~/Desktop/cursor/my-portfolio-web

# Step 4: 워크트리 삭제
./.worktree-helper.sh remove 7

# Step 5: 불필요한 워크트리 정리
./.worktree-helper.sh clean
```

---

## 주의사항

### 1. 각 워크트리마다 npm install 필요

```bash
# ❌ 잘못된 예
cd ../worktrees/issue-7
npm run dev  # 에러! node_modules 없음

# ✅ 올바른 예
cd ../worktrees/issue-7
npm install  # 먼저 설치
npm run dev  # 정상 실행
```

### 2. 포트 충돌 방지

```bash
# ❌ 잘못된 예 (같은 포트 사용)
# 터미널 1
cd ../worktrees/issue-5
npm run dev  # 포트 3000

# 터미널 2
cd ../worktrees/issue-6
npm run dev  # 에러! 포트 3000 이미 사용 중

# ✅ 올바른 예
# 터미널 1
npm run dev -- -p 3000

# 터미널 2
npm run dev -- -p 3001  # 다른 포트 사용
```

### 3. 같은 브랜치는 한 번만 체크아웃 가능

```bash
# ❌ 에러 발생
git worktree add ../wt1 feature/#5
git worktree add ../wt2 feature/#5  # 에러!

# ✅ 각 워크트리는 다른 브랜치 사용
git worktree add ../wt1 feature/#5
git worktree add ../wt2 feature/#6
```

### 4. 작업 완료 후 반드시 워크트리 삭제

```bash
# PR 머지 후
cd ~/Desktop/cursor/my-portfolio-web
./.worktree-helper.sh remove 7

# 또는 일괄 정리
./.worktree-helper.sh clean
```

---

## 문제 해결

### 문제 1: 워크트리 삭제 시 "contains modified or untracked files" 에러

```bash
# 원인: 워크트리에 커밋되지 않은 변경사항이 있음

# 해결 1: 변경사항 커밋
cd ../worktrees/issue-7
git add . && git commit -m "WIP: 작업 중"
cd ~/Desktop/cursor/my-portfolio-web
git worktree remove ../worktrees/issue-7

# 해결 2: 강제 삭제 (변경사항 버림)
git worktree remove --force ../worktrees/issue-7
```

### 문제 2: 워크트리 디렉토리를 직접 삭제했을 때

```bash
# 원인: 디렉토리만 삭제하고 Git이 아직 인식 중

# 해결: Git 정리 실행
git worktree prune

# 또는
./.worktree-helper.sh clean
```

### 문제 3: "fatal: 'xxx' is already checked out" 에러

```bash
# 원인: 같은 브랜치가 다른 워크트리에서 이미 사용 중

# 확인
git worktree list

# 해결: 기존 워크트리 삭제 후 재생성
git worktree remove ../worktrees/issue-7
git worktree add ../worktrees/issue-7 feature/#7
```

### 문제 4: VS Code에서 워크트리 인식 안 됨

```bash
# 해결: 워크트리를 새 창에서 열기
code ../worktrees/issue-7

# 또는 헬퍼 스크립트 사용
./.worktree-helper.sh open 7
```

---

## 참고 자료

- [Git Worktree 공식 문서](https://git-scm.com/docs/git-worktree)
- [CLAUDE.md - 워크플로우 가이드](../CLAUDE.md#-git-worktree-기반-개발)
- [README.md - 명령어 참고](../README.md#git-worktree-명령어)

---

**작성일**: 2025-11-28
**버전**: 1.0.0
