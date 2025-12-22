'use client'

import { useState, useMemo } from 'react'
import { PortfolioStats } from '@/components/portfolio/portfolio-stats'
import { PortfolioFilters } from '@/components/portfolio/portfolio-filters'
import { AdvancedPortfolioTable } from '@/components/portfolio/advanced-portfolio-table'
import { AddStockDialog } from '@/components/portfolio/add-stock-dialog'
import { usePortfoliosWithProfit, useDeletePortfolio } from '@/lib/hooks/use-portfolio'
import { Portfolio } from '@/types/portfolio'
import { useToast } from '@/hooks/use-toast'
import { exportToCSV } from '@/lib/utils/export'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

// 카테고리 정보
const CATEGORIES = {
  1: { id: 'nasdaq100' as const, name: '나스닥100', icon: '📈' },
  2: { id: 'sp500' as const, name: 'S&P 500', icon: '📊' },
  3: { id: 'dividend' as const, name: '배당주', icon: '💰' },
}

export default function PortfolioPage() {
  const {
    data: portfolios,
    isLoading,
    isUpdatingPrices,
    lastUpdated,
    refetchPrices,
  } = usePortfoliosWithProfit()
  const deleteMutation = useDeletePortfolio()
  const { toast } = useToast()

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | undefined>()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [marketFilter, setMarketFilter] = useState('all')

  // 카테고리 정보 추가
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

  // 필터링 & 검색
  const filteredPortfolios = useMemo(() => {
    return portfoliosWithCategory.filter((p) => {
      // 검색
      const matchesSearch =
        search === '' ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.ticker.toLowerCase().includes(search.toLowerCase())

      // 카테고리 필터
      const matchesCategory =
        categoryFilter === 'all' ||
        (categoryFilter === 'none' && !p.categoryId) ||
        p.categoryId?.toString() === categoryFilter

      // 시장 필터
      const matchesMarket = marketFilter === 'all' || p.market === marketFilter

      return matchesSearch && matchesCategory && matchesMarket
    })
  }, [portfoliosWithCategory, search, categoryFilter, marketFilter])

  // 통계 계산
  const stats = useMemo(() => {
    const totalStocks = filteredPortfolios.length
    const totalInvestment = filteredPortfolios.reduce((sum, p) => sum + p.investment, 0)
    const totalValue = filteredPortfolios.reduce((sum, p) => sum + p.marketValue, 0)
    const totalProfit = totalValue - totalInvestment
    const profitRate = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0
    const averageReturn =
      totalStocks > 0
        ? filteredPortfolios.reduce((sum, p) => sum + p.profitRate, 0) / totalStocks
        : 0

    return {
      totalStocks,
      averageReturn,
      totalInvestment,
      totalValue,
      totalProfit,
      profitRate,
    }
  }, [filteredPortfolios])

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

  const handleBulkDelete = async (portfolios: Portfolio[]) => {
    try {
      await Promise.all(portfolios.map((p) => deleteMutation.mutateAsync(p.id)))
      toast({
        title: '삭제 완료',
        description: `${portfolios.length}개 종목이 삭제되었습니다.`,
      })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '삭제 실패',
        description: error.message || '오류가 발생했습니다.',
      })
    }
  }

  const handleRefreshPrices = async () => {
    try {
      await refetchPrices()
      toast({
        title: '주가 업데이트 완료',
        description: '모든 종목의 현재가가 업데이트되었습니다.',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '업데이트 실패',
        description: '주가 업데이트 중 오류가 발생했습니다.',
      })
    }
  }

  const handleExport = () => {
    exportToCSV(filteredPortfolios, `portfolio_${new Date().toISOString().split('T')[0]}.csv`)
    toast({
      title: '내보내기 완료',
      description: 'CSV 파일이 다운로드되었습니다.',
    })
  }

  const formatLastUpdated = (date: Date | null) => {
    if (!date) return '업데이트 안됨'

    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) return '방금 전'
    if (minutes < 60) return `${minutes}분 전`

    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}시간 전`

    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

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

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">포트폴리오</h2>
          <p className="text-muted-foreground">
            보유 종목을 관리하고 수익을 확인하세요
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <p className="text-sm text-muted-foreground">
              마지막 업데이트: {formatLastUpdated(lastUpdated)}
            </p>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshPrices}
            disabled={isUpdatingPrices}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isUpdatingPrices ? 'animate-spin' : ''}`} />
            {isUpdatingPrices ? '업데이트 중...' : '주가 새로고침'}
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      <PortfolioStats {...stats} />

      {/* 필터 & 검색 */}
      <PortfolioFilters
        search={search}
        onSearchChange={setSearch}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        marketFilter={marketFilter}
        onMarketFilterChange={setMarketFilter}
        onAdd={() => {
          setEditingPortfolio(undefined)
          setIsAddDialogOpen(true)
        }}
        onExport={filteredPortfolios.length > 0 ? handleExport : undefined}
      />

      {/* 테이블 */}
      <AdvancedPortfolioTable
        portfolios={filteredPortfolios}
        onEdit={(portfolio) => {
          setEditingPortfolio(portfolio)
          setIsAddDialogOpen(true)
        }}
        onDelete={handleDelete}
        onBulkDelete={handleBulkDelete}
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


<<<<<<< Updated upstream
=======



>>>>>>> Stashed changes
