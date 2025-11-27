'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CategoryGoal } from '@/types/portfolio'
import {
  getCategoryGoals,
  getCategoryGoal,
  createCategoryGoal,
  updateCategoryGoal,
  deleteCategoryGoal,
} from '@/lib/firebase/category-goals'

// 카테고리 목표 목록 조회
export function useCategoryGoals(userId?: string) {
  return useQuery({
    queryKey: ['categoryGoals', userId],
    queryFn: () => getCategoryGoals(userId || ''),
    enabled: !!userId,
  })
}

// 특정 카테고리 목표 조회
export function useCategoryGoal(userId: string, categoryId: number) {
  return useQuery({
    queryKey: ['categoryGoal', userId, categoryId],
    queryFn: () => getCategoryGoal(userId, categoryId),
    enabled: !!userId && !!categoryId,
  })
}

// 카테고리 목표 생성
export function useCreateCategoryGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createCategoryGoal,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['categoryGoals', variables.userId] })
      queryClient.invalidateQueries({
        queryKey: ['categoryGoal', variables.userId, variables.categoryId],
      })
    },
  })
}

// 카테고리 목표 수정
export function useUpdateCategoryGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CategoryGoal> }) =>
      updateCategoryGoal(id, data),
    onSuccess: (goal) => {
      if (goal) {
        queryClient.invalidateQueries({ queryKey: ['categoryGoals', goal.userId] })
        queryClient.invalidateQueries({
          queryKey: ['categoryGoal', goal.userId, goal.categoryId],
        })
      }
    },
  })
}

// 카테고리 목표 삭제
export function useDeleteCategoryGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteCategoryGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categoryGoals'] })
      queryClient.invalidateQueries({ queryKey: ['categoryGoal'] })
    },
  })
}
