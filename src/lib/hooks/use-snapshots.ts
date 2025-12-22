'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { isFirebaseConfigured } from '@/lib/firebase/config'
import { useAuth } from './use-auth'
import {
  getSnapshots,
  saveSnapshot,
  getSnapshotByDate,
} from '@/lib/firebase/firestore'
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
  const { user } = useAuth()

  return useQuery({
    queryKey: ['snapshots', user?.uid || 'local'],
    queryFn: async () => {
      // Firebase가 설정되어 있고 사용자가 있으면 Firestore 사용
      if (isFirebaseConfigured && user?.uid) {
        return await getSnapshots(user.uid)
      }

      // 개발 모드: 로컬 스토리지 사용
      return getLocalSnapshots()
    },
  })
}

/**
 * 스냅샷 저장 훅
 */
export function useSaveSnapshot() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (snapshot: SnapshotData) => {
      // Firebase가 설정되어 있고 사용자가 있으면 Firestore 사용
      if (isFirebaseConfigured && user?.uid) {
        await saveSnapshot(user.uid, snapshot)
        return
      }

      // 개발 모드: 로컬 스토리지 사용
      saveLocalSnapshot(snapshot)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['snapshots', user?.uid || 'local'] })
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
<<<<<<< Updated upstream
=======



>>>>>>> Stashed changes
