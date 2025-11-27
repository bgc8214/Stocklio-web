#!/bin/bash

# Git Worktree Helper Script
# MyFolio 프로젝트용 워크트리 관리 스크립트

set -e

WORKTREE_DIR="../worktrees"
MAIN_REPO_DIR="$(pwd)"

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 도움말
show_help() {
    echo -e "${BLUE}=== Git Worktree Helper ===${NC}"
    echo ""
    echo "Usage: ./.worktree-helper.sh [command] [options]"
    echo ""
    echo "Commands:"
    echo "  create <issue-number>     워크트리 생성 (예: create 7)"
    echo "  list                      워크트리 목록 확인"
    echo "  remove <issue-number>     워크트리 삭제 (예: remove 7)"
    echo "  open <issue-number>       VS Code로 워크트리 열기"
    echo "  clean                     불필요한 워크트리 정리"
    echo "  setup                     초기 설정 (워크트리 디렉토리 생성)"
    echo "  help                      도움말 표시"
    echo ""
    echo "Examples:"
    echo "  ./.worktree-helper.sh create 7"
    echo "  ./.worktree-helper.sh open 7"
    echo "  ./.worktree-helper.sh remove 7"
}

# 워크트리 디렉토리 설정
setup_worktree_dir() {
    if [ ! -d "$WORKTREE_DIR" ]; then
        mkdir -p "$WORKTREE_DIR"
        echo -e "${GREEN}✅ Worktree 디렉토리 생성: $WORKTREE_DIR${NC}"
    else
        echo -e "${YELLOW}⚠️  Worktree 디렉토리가 이미 존재합니다: $WORKTREE_DIR${NC}"
    fi
}

# 워크트리 생성
create_worktree() {
    local issue_number=$1

    if [ -z "$issue_number" ]; then
        echo -e "${RED}❌ 에러: 이슈 번호를 입력하세요${NC}"
        echo "Usage: ./.worktree-helper.sh create <issue-number>"
        exit 1
    fi

    local worktree_path="$WORKTREE_DIR/issue-$issue_number"

    # 워크트리 디렉토리가 없으면 생성
    setup_worktree_dir

    # GitHub 이슈 정보 가져오기 (gh CLI 사용)
    if command -v gh &> /dev/null; then
        echo -e "${BLUE}📋 GitHub 이슈 #$issue_number 정보를 가져오는 중...${NC}"
        local issue_title=$(gh issue view $issue_number --json title -q .title 2>/dev/null || echo "")

        if [ -n "$issue_title" ]; then
            echo -e "${GREEN}이슈 제목: $issue_title${NC}"
            # 제목에서 브랜치 이름 생성 (소문자 변환, 공백을 - 로 변환)
            local branch_suffix=$(echo "$issue_title" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//' | sed 's/-$//' | cut -c1-50)
            local branch_name="feature/#$issue_number-$branch_suffix"
        else
            local branch_name="feature/#$issue_number"
        fi
    else
        local branch_name="feature/#$issue_number"
    fi

    echo -e "${BLUE}🌿 워크트리 생성 중...${NC}"
    echo "브랜치: $branch_name"
    echo "경로: $worktree_path"

    git worktree add "$worktree_path" -b "$branch_name"

    echo -e "${GREEN}✅ 워크트리 생성 완료!${NC}"
    echo ""
    echo "다음 명령어로 작업을 시작하세요:"
    echo -e "${YELLOW}  cd $worktree_path${NC}"
    echo -e "${YELLOW}  npm install${NC}"
    echo -e "${YELLOW}  npm run dev -- -p 3000${NC}"
}

# 워크트리 목록
list_worktrees() {
    echo -e "${BLUE}📋 워크트리 목록:${NC}"
    git worktree list
}

# 워크트리 삭제
remove_worktree() {
    local issue_number=$1

    if [ -z "$issue_number" ]; then
        echo -e "${RED}❌ 에러: 이슈 번호를 입력하세요${NC}"
        echo "Usage: ./.worktree-helper.sh remove <issue-number>"
        exit 1
    fi

    local worktree_path="$WORKTREE_DIR/issue-$issue_number"

    if [ ! -d "$worktree_path" ]; then
        echo -e "${RED}❌ 에러: 워크트리가 존재하지 않습니다: $worktree_path${NC}"
        exit 1
    fi

    echo -e "${BLUE}🗑️  워크트리 삭제 중...${NC}"
    git worktree remove "$worktree_path"
    echo -e "${GREEN}✅ 워크트리 삭제 완료: $worktree_path${NC}"
}

# VS Code로 워크트리 열기
open_worktree() {
    local issue_number=$1

    if [ -z "$issue_number" ]; then
        echo -e "${RED}❌ 에러: 이슈 번호를 입력하세요${NC}"
        echo "Usage: ./.worktree-helper.sh open <issue-number>"
        exit 1
    fi

    local worktree_path="$WORKTREE_DIR/issue-$issue_number"

    if [ ! -d "$worktree_path" ]; then
        echo -e "${RED}❌ 에러: 워크트리가 존재하지 않습니다: $worktree_path${NC}"
        exit 1
    fi

    echo -e "${BLUE}📂 VS Code로 워크트리 열기...${NC}"
    code "$worktree_path"
    echo -e "${GREEN}✅ VS Code 실행 완료${NC}"
}

# 워크트리 정리
clean_worktrees() {
    echo -e "${BLUE}🧹 불필요한 워크트리 정리 중...${NC}"
    git worktree prune
    echo -e "${GREEN}✅ 워크트리 정리 완료${NC}"
}

# 메인 로직
case "${1:-help}" in
    create)
        create_worktree "$2"
        ;;
    list)
        list_worktrees
        ;;
    remove)
        remove_worktree "$2"
        ;;
    open)
        open_worktree "$2"
        ;;
    clean)
        clean_worktrees
        ;;
    setup)
        setup_worktree_dir
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}❌ 알 수 없는 명령어: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac
