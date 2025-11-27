'use client'

import { useMemo, useState, useEffect } from 'react'
import { HeroAssetCard } from '@/components/dashboard/hero-asset-card'
import { ProfitChart } from '@/components/dashboard/profit-chart'
import { CategoryAllocation } from '@/components/dashboard/category-allocation'
import { PortfolioTable } from '@/components/dashboard/portfolio-table'
import { AddStockDialog } from '@/components/portfolio/add-stock-dialog'
import { usePortfoliosWithProfit, useDeletePortfolio } from '@/lib/hooks/use-portfolio'
import { Portfolio } from '@/types/portfolio'
import { useToast } from '@/hooks/use-toast'
import { initializeSampleData } from '@/lib/storage/sample-data'
import { generateSampleSnapshots } from '@/lib/storage/generate-sample-snapshots'
import { useSnapshots } from '@/lib/hooks/use-snapshots'
import { useCreateSnapshot } from '@/lib/hooks/use-snapshots'
import { Button } from '@/components/ui/button'
import { RefreshCw, Trash2 } from 'lucide-react'
import { clearLocalSnapshots } from '@/lib/storage/snapshots'

// 카테고리 정보
const CATEGORIES = {
  1: { id: 'nasdaq100' as const, name: '나스닥100', icon: '📈' },
  2: { id: 'sp500' as const, name: 'S&P 500', icon: '📊' },
  3: { id: 'dividend' as const, name: '배당주', icon: '💰' },
}

export default function DashboardPage() {
  const { data: portfolios, isLoading, totalValue, totalCost } = usePortfoliosWithProfit()
  const { data: snapshots } = useSnapshots()
  const { createAndSave } = useCreateSnapshot()
  const deleteMutation = useDeletePortfolio()
  const { toast } = useToast()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | undefined>()

  // 개발 모드: 샘플 데이터 초기화
  useEffect(() => {
    initializeSampleData()
    generateSampleSnapshots() // 샘플 스냅샷 데이터 생성
  }, [])

  // 포트폴리오 변경 시 스냅샷 자동 저장
  useEffect(() => {
    if (portfolios.length > 0 && totalValue > 0 && totalCost > 0) {
      const today = new Date().toISOString().split('T')[0]
      const todaySnapshot = snapshots?.find((s) => s.date === today)
      
      // 오늘 스냅샷이 없거나 값이 변경되었으면 업데이트
      if (!todaySnapshot || Math.abs(todaySnapshot.totalValue - totalValue) > 0.01) {
        createAndSave(totalValue, totalCost)
      }
    }
  }, [portfolios.length, totalValue, totalCost, snapshots, createAndSave])

  const handleDelete = async (portfolio: Portfolio) => {
    try {
      await deleteMutation.mutateAsync(portfolio.id)
      toast({
        title: '삭제 완료',
        description: '포트폴리오에서 종목이 삭제되었습니다.',
      })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '삭제 실패',
        description: error.message || '오류가 발생했습니다.',
      })
    }
  }

  // 포트폴리오에 카테고리 정보 추가
  const portfoliosWithCategory = useMemo(() => {
    return portfolios.map((portfolio) => {
      const category = portfolio.categoryId
        ? CATEGORIES[portfolio.categoryId as keyof typeof CATEGORIES]
        : null

      return {
        ...portfolio,
        categoryName: category?.name || '미분류',
        categoryIcon: category?.icon || '📦',
      }
    })
  }, [portfolios])

  // 총 자산 계산 (usePortfoliosWithProfit에서 제공하는 값 사용)
  const totalAsset = totalValue || 0
  const totalInvestment = totalCost || 0
  const totalProfit = totalAsset - totalInvestment
  const profitRate = totalInvestment !== 0 ? (totalProfit / totalInvestment) * 100 : 0

  // 오늘 수익 계산
  const todayProfit = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const todaySnapshot = snapshots?.find((s) => s.date === today)
    return todaySnapshot?.dailyProfit || 0
  }, [snapshots])

  // 오늘 수익률 계산
  const todayProfitRate = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const todaySnapshot = snapshots?.find((s) => s.date === today)
    const yesterdayValue = totalAsset - (todaySnapshot?.dailyProfit || 0)
    return yesterdayValue !== 0 && yesterdayValue > 0
      ? ((todaySnapshot?.dailyProfit || 0) / yesterdayValue) * 100
      : 0
  }, [snapshots, totalAsset])

  // 카테고리별 자산 배분 계산
  const categoryAllocation = useMemo(() => {
    const allocation: Record<string, number> = {}
    
    portfolios.forEach((portfolio) => {
      const categoryId = portfolio.categoryId
        ? CATEGORIES[portfolio.categoryId as keyof typeof CATEGORIES]?.id
        : 'other'
      
      if (!allocation[categoryId]) {
        allocation[categoryId] = 0
      }
      allocation[categoryId] += portfolio.marketValue
    })

    return Object.entries(allocation).map(([id, value]) => {
      const category = Object.values(CATEGORIES).find((c) => c.id === id)
      return {
        id: id as 'nasdaq100' | 'sp500' | 'dividend',
        name: category?.name || '기타',
        value,
        percentage: totalAsset !== 0 ? (value / totalAsset) * 100 : 0,
      }
    })
  }, [portfolios, totalAsset])

  // 실제 스냅샷 데이터 사용
  const profitChartData = useMemo(() => {
    if (!snapshots || snapshots.length === 0) {
      // 스냅샷이 없으면 현재 포트폴리오 데이터로 오늘 스냅샷 생성
      if (portfolios.length > 0) {
        const totalValue = portfolios.reduce((sum, p) => sum + p.marketValue, 0)
        const totalCost = portfolios.reduce((sum, p) => sum + p.investment, 0)
        const totalProfit = totalValue - totalCost
        
        return [
          {
            date: new Date().toISOString().split('T')[0],
            dailyProfit: 0,
            monthlyProfit: totalProfit,
            yearlyProfit: totalProfit,
          },
        ]
      }
      return []
    }

    return snapshots.map((snapshot) => ({
      date: snapshot.date,
      dailyProfit: snapshot.dailyProfit,
      monthlyProfit: snapshot.monthlyProfit,
      yearlyProfit: snapshot.yearlyProfit,
    }))
  }, [snapshots, portfolios])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  const handleGenerateSnapshots = () => {
    // 기존 스냅샷 삭제 후 재생성
    clearLocalSnapshots()
    generateSampleSnapshots()
    toast({
      title: '샘플 데이터 생성 완료',
      description: '과거 30일간의 샘플 스냅샷 데이터가 생성되었습니다.',
    })
    // 페이지 새로고침하여 데이터 반영
    window.location.reload()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">대시보드</h2>
          <p className="text-muted-foreground">
            포트폴리오 현황을 한눈에 확인하세요
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateSnapshots}
            className="text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-2" />
            샘플 데이터 생성
          </Button>
        </div>
      </div>

      {/* 히어로 카드 */}
      <HeroAssetCard
        totalAsset={totalAsset}
        totalProfit={totalProfit}
        profitRate={profitRate}
        todayProfit={todayProfit}
        todayProfitRate={todayProfitRate}
      />

      {/* 차트 섹션 */}
      <div className="grid gap-4 md:grid-cols-2">
        <ProfitChart data={profitChartData} />
        <CategoryAllocation categories={categoryAllocation} />
      </div>

      {/* 포트폴리오 테이블 */}
      <PortfolioTable
        portfolios={portfoliosWithCategory}
        onAdd={() => {
          setEditingPortfolio(undefined)
          setIsAddDialogOpen(true)
        }}
        onEdit={(portfolio) => {
          setEditingPortfolio(portfolio)
          setIsAddDialogOpen(true)
        }}
        onDelete={handleDelete}
      />

      {/* 종목 추가/수정 다이얼로그 */}
      <AddStockDialog
        open={isAddDialogOpen}
        onOpenChange={(open) => {
          setIsAddDialogOpen(open)
          if (!open) {
            setEditingPortfolio(undefined)
          }
        }}
        portfolio={editingPortfolio}
      />
    </div>
  )
}

