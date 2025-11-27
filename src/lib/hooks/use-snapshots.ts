'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getLocalSnapshots,
  saveLocalSnapshot,
  createTodaySnapshot,
  SnapshotData,
} from '@/lib/storage/snapshots'

/**
 * 스냅샷 목록 조회 훅
 */
export function useSnapshots() {
  return useQuery({
    queryKey: ['snapshots'],
    queryFn: async () => {
      return getLocalSnapshots()
    },
  })
}

/**
 * 스냅샷 저장 훅
 */
export function useSaveSnapshot() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (snapshot: SnapshotData) => {
      saveLocalSnapshot(snapshot)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['snapshots'] })
    },
  })
}

/**
 * 오늘 스냅샷 생성 및 저장 훅
 */
export function useCreateSnapshot() {
  const { data: snapshots } = useSnapshots()
  const saveMutation = useSaveSnapshot()

  const createAndSave = (
    totalValue: number,
    totalCost: number
  ) => {
    const today = new Date().toISOString().split('T')[0]
    const previousSnapshot = snapshots
      ?.filter((s) => s.date < today)
      .sort((a, b) => b.date.localeCompare(a.date))[0]

    const snapshot = createTodaySnapshot(
      totalValue,
      totalCost,
      previousSnapshot
    )

    saveMutation.mutate(snapshot)
  }

  return { createAndSave, isSaving: saveMutation.isPending }
}


