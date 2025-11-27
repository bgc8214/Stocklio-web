'use client'

import { PortfolioTable } from '@/components/dashboard/portfolio-table'
import { AddStockDialog } from '@/components/portfolio/add-stock-dialog'
import { usePortfoliosWithProfit, useDeletePortfolio } from '@/lib/hooks/use-portfolio'
import { Portfolio } from '@/types/portfolio'
import { useToast } from '@/hooks/use-toast'
import { useState, useMemo } from 'react'

// 카테고리 정보
const CATEGORIES = {
  1: { id: 'nasdaq100' as const, name: '나스닥100', icon: '📈' },
  2: { id: 'sp500' as const, name: 'S&P 500', icon: '📊' },
  3: { id: 'dividend' as const, name: '배당주', icon: '💰' },
}

export default function PortfolioPage() {
  const { data: portfolios, isLoading } = usePortfoliosWithProfit()
  const deleteMutation = useDeletePortfolio()
  const { toast } = useToast()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | undefined>()

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
        <h2 className="text-3xl font-bold tracking-tight">포트폴리오</h2>
        <p className="text-muted-foreground">
          보유 종목을 관리하고 수익을 확인하세요
        </p>
      </div>

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


