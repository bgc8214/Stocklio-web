/**
 * 스냅샷 데이터 관리 (로컬 스토리지)
 * 일별 포트폴리오 스냅샷 저장 및 조회
 */

import { Snapshot } from '@/types/snapshot'

const STORAGE_KEY = 'myfolio_snapshots'

export interface SnapshotData {
  date: string // YYYY-MM-DD 형식
  totalValue: number
  totalCost: number
  totalProfit: number
  profitRate: number
  dailyProfit: number
  monthlyProfit: number
  yearlyProfit: number
}

export function getLocalSnapshots(): SnapshotData[] {
  if (typeof window === 'undefined') return []

  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return []

    return JSON.parse(data)
  } catch (error) {
    console.error('Failed to load snapshots from localStorage:', error)
    return []
  }
}

export function saveLocalSnapshot(snapshot: SnapshotData): void {
  const snapshots = getLocalSnapshots()
  const date = snapshot.date

  // 같은 날짜의 스냅샷이 있으면 업데이트, 없으면 추가
  const index = snapshots.findIndex((s) => s.date === date)
  
  if (index >= 0) {
    snapshots[index] = snapshot
  } else {
    snapshots.push(snapshot)
    // 날짜순 정렬
    snapshots.sort((a, b) => a.date.localeCompare(b.date))
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots))
}

export function getSnapshotByDate(date: string): SnapshotData | null {
  const snapshots = getLocalSnapshots()
  return snapshots.find((s) => s.date === date) || null
}

export function getSnapshotsByDateRange(startDate: string, endDate: string): SnapshotData[] {
  const snapshots = getLocalSnapshots()
  return snapshots.filter(
    (s) => s.date >= startDate && s.date <= endDate
  )
}

export function clearLocalSnapshots(): void {
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * 오늘 날짜의 스냅샷 생성
 */
export function createTodaySnapshot(
  totalValue: number,
  totalCost: number,
  previousSnapshot?: SnapshotData
): SnapshotData {
  const today = new Date().toISOString().split('T')[0]
  const totalProfit = totalValue - totalCost
  const profitRate = totalCost !== 0 ? (totalProfit / totalCost) * 100 : 0

  // 이전 스냅샷과 비교하여 일일 수익 계산
  const dailyProfit = previousSnapshot
    ? totalValue - previousSnapshot.totalValue
    : 0

  // 월간/연간 수익은 간단히 계산 (실제로는 더 복잡한 로직 필요)
  const monthlyProfit = previousSnapshot
    ? totalProfit - (previousSnapshot.totalProfit || 0)
    : totalProfit

  const yearlyProfit = totalProfit // 연간 수익은 전체 수익으로 간주

  return {
    date: today,
    totalValue,
    totalCost,
    totalProfit,
    profitRate,
    dailyProfit,
    monthlyProfit,
    yearlyProfit,
  }
}


<<<<<<< Updated upstream
=======



>>>>>>> Stashed changes
