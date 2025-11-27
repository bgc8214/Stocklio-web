/**
 * 샘플 스냅샷 데이터 생성
 * 과거 30일간의 가상 포트폴리오 데이터를 생성합니다
 */

import { saveLocalSnapshot, SnapshotData } from './snapshots'

export function generateSampleSnapshots() {
  if (typeof window === 'undefined') return

  // 이미 스냅샷이 있으면 생성하지 않음
  const existing = localStorage.getItem('myfolio_snapshots')
  if (existing) {
    try {
      const snapshots = JSON.parse(existing)
      if (snapshots.length > 0) {
        return // 이미 데이터가 있으면 생성하지 않음
      }
    } catch (error) {
      // 파싱 에러면 계속 진행
    }
  }

  const today = new Date()
  const snapshots: SnapshotData[] = []

  // 초기 자산 설정 (30일 전)
  let totalCost = 45000000 // 초기 투자금액
  let totalValue = 45000000 // 초기 자산

  // 월초/연초 자산 추적용
  const monthStartValues: Record<string, number> = {}
  const yearStartValues: Record<string, number> = {}

  // 과거 30일간의 데이터 생성
  for (let i = 30; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    // 월초/연초 체크 및 초기값 설정
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`
    const yearKey = `${date.getFullYear()}`

    if (!monthStartValues[monthKey]) {
      monthStartValues[monthKey] = totalValue
    }
    if (!yearStartValues[yearKey]) {
      yearStartValues[yearKey] = totalValue
    }

    // 랜덤한 수익률 시뮬레이션 (-2% ~ +3%)
    const dailyChangeRate = (Math.random() * 5 - 2) / 100 // -2% ~ +3%
    const dailyChange = totalValue * dailyChangeRate
    totalValue = Math.max(totalValue + dailyChange, totalCost * 0.8) // 최소 80% 이상 유지

    const totalProfit = totalValue - totalCost
    const profitRate = totalCost !== 0 ? (totalProfit / totalCost) * 100 : 0

    // 일일 수익 (전날 대비)
    const previousValue = i === 30 ? totalValue : snapshots[snapshots.length - 1]?.totalValue || totalValue
    const dailyProfit = totalValue - previousValue

    // 월간 수익 (이번 달 시작일부터)
    const monthStartValue = monthStartValues[monthKey] || totalValue
    const monthlyProfit = totalValue - monthStartValue

    // 연간 수익 (올해 시작일부터)
    const yearStartValue = yearStartValues[yearKey] || totalValue
    const yearlyProfit = totalValue - yearStartValue

    const snapshot: SnapshotData = {
      date: dateStr,
      totalValue: Math.round(totalValue),
      totalCost: Math.round(totalCost),
      totalProfit: Math.round(totalProfit),
      profitRate: Math.round(profitRate * 100) / 100,
      dailyProfit: Math.round(dailyProfit),
      monthlyProfit: Math.round(monthlyProfit),
      yearlyProfit: Math.round(yearlyProfit),
    }

    snapshots.push(snapshot)
  }

  // 모든 스냅샷 저장
  snapshots.forEach((snapshot) => {
    saveLocalSnapshot(snapshot)
  })

  console.log(`✅ ${snapshots.length}개의 샘플 스냅샷 데이터가 생성되었습니다.`)
}

