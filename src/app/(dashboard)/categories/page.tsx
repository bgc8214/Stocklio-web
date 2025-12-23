'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CategoryAllocation } from '@/components/dashboard/category-allocation'
import { usePortfoliosWithProfit } from '@/lib/hooks/use-portfolio'
import { useMemo } from 'react'
import { formatCurrency, toKrw } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'

const CATEGORIES = {
  1: { id: 'nasdaq100' as const, name: '나스닥100', icon: '📈', description: '미국 대표 기술주' },
  2: { id: 'sp500' as const, name: 'S&P 500', icon: '📊', description: '미국 대형주 지수' },
  3: { id: 'dividend' as const, name: '배당주', icon: '💰', description: '안정적인 배당 수익' },
}

export default function CategoriesPage() {
  const { data: portfolios, isLoading } = usePortfoliosWithProfit()

  const totalAsset = useMemo(() => {
    return portfolios.reduce(
      (sum, p) => sum + toKrw(p.marketValue, p.market, 1300),
      0
    )
  }, [portfolios])

  const categoryData = useMemo(() => {
    const allocation: Record<string, { value: number; portfolios: typeof portfolios }> = {}

    portfolios.forEach((portfolio) => {
      const categoryId = portfolio.categoryId
        ? CATEGORIES[portfolio.categoryId as keyof typeof CATEGORIES]?.id
        : 'other'

      if (!allocation[categoryId]) {
        allocation[categoryId] = { value: 0, portfolios: [] }
      }
      // 모든 금액을 원화로 환산하여 합산
      allocation[categoryId].value += toKrw(portfolio.marketValue, portfolio.market, 1300)
      allocation[categoryId].portfolios.push(portfolio)
    })

    return Object.entries(allocation).map(([id, data]) => {
      const category = Object.values(CATEGORIES).find((c) => c.id === id)
      return {
        id: id as 'nasdaq100' | 'sp500' | 'dividend',
        name: category?.name || '기타',
        icon: category?.icon || '📦',
        description: category?.description || '',
        value: data.value,
        percentage: totalAsset !== 0 ? (data.value / totalAsset) * 100 : 0,
        portfolios: data.portfolios,
      }
    })
  }, [portfolios, totalAsset])

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
      <div>
        <h2 className="text-3xl font-bold tracking-tight">카테고리 관리</h2>
        <p className="text-muted-foreground">
          카테고리별 자산 배분을 확인하고 목표를 설정하세요
        </p>
      </div>

      {/* 카테고리별 자산 배분 차트 */}
      <CategoryAllocation
        categories={categoryData.map(({ portfolios, ...rest }) => rest)}
      />

      {/* 카테고리별 상세 정보 */}
      <div className="grid gap-4 md:grid-cols-3">
        {Object.values(CATEGORIES).map((category) => {
          const data = categoryData.find((c) => c.id === category.id)
          const categoryValue = data?.value || 0
          const categoryPercentage = data?.percentage || 0
          const portfolioCount = data?.portfolios.length || 0

          return (
            <Card key={category.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">{category.icon}</span>
                  <span>{category.name}</span>
                </CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">현재 자산</span>
                    <span className="font-bold">{formatCurrency(categoryValue)}</span>
                  </div>
                  <Progress value={categoryPercentage} className="h-2" />
                  <div className="text-xs text-muted-foreground mt-1">
                    {categoryPercentage.toFixed(1)}% / 전체
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <div className="text-sm text-muted-foreground">보유 종목</div>
                  <div className="text-2xl font-bold">{portfolioCount}개</div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}


