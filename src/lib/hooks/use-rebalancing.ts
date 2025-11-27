'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './use-auth'
import { isFirebaseConfigured } from '@/lib/firebase/config'
import {
  getRebalancingTarget,
  saveRebalancingTarget,
} from '@/lib/firebase/rebalancing'

interface RebalancingTargets {
  nasdaq100: number
  sp500: number
  dividend: number
}

const DEFAULT_TARGETS: RebalancingTargets = {
  nasdaq100: 50,
  sp500: 30,
  dividend: 20,
}

/**
 * 로컬 스토리지에서 목표 비율 조회
 */
function getLocalTargets(): RebalancingTargets {
  if (typeof window === 'undefined') return DEFAULT_TARGETS

  try {
    const stored = localStorage.getItem('rebalancing-targets')
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('로컬 목표 조회 실패:', error)
  }

  return DEFAULT_TARGETS
}

/**
 * 로컬 스토리지에 목표 비율 저장
 */
function saveLocalTargets(targets: RebalancingTargets): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem('rebalancing-targets', JSON.stringify(targets))
  } catch (error) {
    console.error('로컬 목표 저장 실패:', error)
  }
}

/**
 * 리밸런싱 목표 비율 조회 Hook
 */
export function useRebalancingTargets() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['rebalancingTargets', user?.uid || 'local'],
    queryFn: async () => {
      // Firebase가 설정되어 있고 사용자가 있으면 Firestore 사용
      if (isFirebaseConfigured && user?.uid) {
        const target = await getRebalancingTarget(user.uid)
        if (target) {
          return {
            nasdaq100: target.nasdaq100,
            sp500: target.sp500,
            dividend: target.dividend,
          }
        }
      }

      // 개발 모드 또는 데이터가 없으면 로컬 스토리지 사용
      return getLocalTargets()
    },
    initialData: DEFAULT_TARGETS,
  })
}

/**
 * 리밸런싱 목표 비율 저장 Hook
 */
export function useSaveRebalancingTargets() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (targets: RebalancingTargets) => {
      // Firebase가 설정되어 있고 사용자가 있으면 Firestore 사용
      if (isFirebaseConfigured && user?.uid) {
        await saveRebalancingTarget(user.uid, targets)
      } else {
        // 개발 모드: 로컬 스토리지 사용
        saveLocalTargets(targets)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['rebalancingTargets', user?.uid || 'local'],
      })
    },
  })
}

// 프리셋
export const REBALANCING_PRESETS = {
  conservative: {
    name: '보수형',
    description: '안정적인 배당주 중심',
    nasdaq100: 30,
    sp500: 30,
    dividend: 40,
  },
  balanced: {
    name: '균형형',
    description: '균형잡힌 포트폴리오',
    nasdaq100: 40,
    sp500: 40,
    dividend: 20,
  },
  aggressive: {
    name: '공격형',
    description: '성장주 중심의 적극적 투자',
    nasdaq100: 60,
    sp500: 30,
    dividend: 10,
  },
  growth: {
    name: '초성장형',
    description: '나스닥100 집중 투자',
    nasdaq100: 70,
    sp500: 20,
    dividend: 10,
  },
} as const

export type PresetKey = keyof typeof REBALANCING_PRESETS
