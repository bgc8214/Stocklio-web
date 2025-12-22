'use client'

import { useState, useMemo } from 'react'
import { startOfMonth, endOfMonth, format, subMonths } from 'date-fns'
import { MonthSelector } from '@/components/reports/month-selector'
import { MonthlySummary } from '@/components/reports/monthly-summary'
import { CategoryPerformance } from '@/components/reports/category-performance'
import { StockRankings } from '@/components/reports/stock-rankings'
import { MonthlyChart } from '@/components/reports/monthly-chart'
import { useSnapshots } from '@/lib/hooks/use-snapshots'
import { usePortfoliosWithProfit } from '@/lib/hooks/use-portfolio'
import { getSnapshotsByDateRange, SnapshotData } from '@/lib/storage/snapshots'
import { Portfolio } from '@/types/portfolio'

// 카테고리 정보
const CATEGORIES = {
  1: { id: 'nasdaq100' as const, name: '나스닥100', icon: '📈' },
  2: { id: 'sp500' as const, name: 'S&P 500', icon: '📊' },
  3: { id: 'dividend' as const, name: '배당주', icon: '💰' },
}

export default function ReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const { data: snapshots, isLoading: isLoadingSnapshots } = useSnapshots()
  const { data: portfolios, isLoading: isLoadingPortfolios } = usePortfoliosWithProfit()

  // 월간 데이터 계산
  const monthlyData = useMemo(() => {
    if (!snapshots || snapshots.length === 0) {
      return {
        startValue: 0,
        endValue: 0,
        monthlyProfit: 0,
        monthlyProfitRate: 0,
        previousMonthRate: 0,
        ytdRate: 0,
        chartData: [],
      }
    }

    const monthStart = startOfMonth(selectedMonth)
    const monthEnd = endOfMonth(selectedMonth)

    // 해당 월의 스냅샷 가져오기
    const monthSnapshots = getSnapshotsByDateRange(
      format(monthStart, 'yyyy-MM-dd'),
      format(monthEnd, 'yyyy-MM-dd')
    )

    if (monthSnapshots.length === 0) {
      return {
        startValue: 0,
        endValue: 0,
        monthlyProfit: 0,
        monthlyProfitRate: 0,
        previousMonthRate: 0,
        ytdRate: 0,
        chartData: [],
      }
    }

    // 월초/월말 값
    const startValue = monthSnapshots[0]?.totalValue || 0
    const endValue = monthSnapshots[monthSnapshots.length - 1]?.totalValue || 0
    const monthlyProfit = endValue - startValue
    const monthlyProfitRate = startValue > 0 ? (monthlyProfit / startValue) * 100 : 0

    // 전월 수익률 계산
    const prevMonth = subMonths(selectedMonth, 1)
    const prevMonthStart = startOfMonth(prevMonth)
    const prevMonthEnd = endOfMonth(prevMonth)
    const prevMonthSnapshots = getSnapshotsByDateRange(
      format(prevMonthStart, 'yyyy-MM-dd'),
      format(prevMonthEnd, 'yyyy-MM-dd')
    )
    const prevMonthStartValue = prevMonthSnapshots[0]?.totalValue || 0
    const prevMonthEndValue = prevMonthSnapshots[prevMonthSnapshots.length - 1]?.totalValue || 0
    const previousMonthRate =
      prevMonthStartValue > 0
        ? ((prevMonthEndValue - prevMonthStartValue) / prevMonthStartValue) * 100
        : 0

    // 연초 대비 수익률 (YTD)
    const yearStart = new Date(selectedMonth.getFullYear(), 0, 1)
    const yearSnapshots = getSnapshotsByDateRange(
      format(yearStart, 'yyyy-MM-dd'),
      format(monthEnd, 'yyyy-MM-dd')
    )
    const yearStartValue = yearSnapshots[0]?.totalValue || 0
    const ytdRate = yearStartValue > 0 ? ((endValue - yearStartValue) / yearStartValue) * 100 : 0

    // 차트 데이터
    const chartData = monthSnapshots.map((snapshot) => ({
      date: snapshot.date,
      value: snapshot.totalValue,
    }))

    return {
      startValue,
      endValue,
      monthlyProfit,
      monthlyProfitRate,
      previousMonthRate,
      ytdRate,
      chartData,
    }
  }, [selectedMonth, snapshots])

  // 카테고리별 성과 계산
  const categoryData = useMemo(() => {
    if (!portfolios || portfolios.length === 0) {
      return []
    }

    const categoryCounts: Record<number, number> = {}
    const categoryValues: Record<number, number> = {}
    const categoryCosts: Record<number, number> = {}

    portfolios.forEach((portfolio: Portfolio) => {
      if (!portfolio.categoryId) return

      const categoryId = portfolio.categoryId
      categoryCounts[categoryId] = (categoryCounts[categoryId] || 0) + 1
      categoryValues[categoryId] =
        (categoryValues[categoryId] || 0) + portfolio.currentPrice * portfolio.quantity
      categoryCosts[categoryId] =
        (categoryCosts[categoryId] || 0) + portfolio.averageCost * portfolio.quantity
    })

    return Object.entries(CATEGORIES).map(([id, category]) => {
      const categoryId = Number(id)
      const value = categoryValues[categoryId] || 0
      const cost = categoryCosts[categoryId] || 0
      const profitRate = cost > 0 ? ((value - cost) / cost) * 100 : 0

      return {
        id: category.id,
        name: category.name,
        icon: category.icon,
        stockCount: categoryCounts[categoryId] || 0,
        value,
        profitRate,
      }
    })
  }, [portfolios])

  // 베스트/워스트 종목
  const stockRankings = useMemo(() => {
    if (!portfolios || portfolios.length === 0) {
      return { topGainers: [], topLosers: [] }
    }

    const rankedStocks = portfolios
      .map((portfolio: Portfolio) => {
        const profit = portfolio.currentPrice * portfolio.quantity - portfolio.averageCost * portfolio.quantity
        const profitRate =
          portfolio.averageCost > 0
            ? ((portfolio.currentPrice - portfolio.averageCost) / portfolio.averageCost) * 100
            : 0

        return {
          ticker: portfolio.ticker,
          name: portfolio.name,
          profitRate,
          profit,
        }
      })
      .sort((a: any, b: any) => b.profitRate - a.profitRate)

    const topGainers = rankedStocks.slice(0, 5)
    const topLosers = rankedStocks.slice(-5).reverse()

    return { topGainers, topLosers }
  }, [portfolios])

  if (isLoadingSnapshots || isLoadingPortfolios) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">월간 리포트</h2>
        <p className="text-muted-foreground">월별 포트폴리오 성과를 확인하세요</p>
      </div>

      {/* 월 선택 */}
      <MonthSelector selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />

      {/* 월간 요약 */}
      <MonthlySummary
        startValue={monthlyData.startValue}
        endValue={monthlyData.endValue}
        monthlyProfit={monthlyData.monthlyProfit}
        monthlyProfitRate={monthlyData.monthlyProfitRate}
        previousMonthRate={monthlyData.previousMonthRate}
        ytdRate={monthlyData.ytdRate}
      />

      {/* 차트 */}
      <MonthlyChart
        data={monthlyData.chartData}
        title="월간 자산 추이"
        description="이번 달 포트폴리오 가치 변화"
      />

      {/* 카테고리별 성과 */}
      <CategoryPerformance categories={categoryData} />

      {/* 베스트/워스트 종목 */}
      <StockRankings topGainers={stockRankings.topGainers} topLosers={stockRankings.topLosers} />
    </div>
  )
}
<<<<<<< Updated upstream
=======





>>>>>>> Stashed changes
