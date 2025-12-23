'use client'

import { useState, useMemo } from 'react'
import { CategoryHero } from '@/components/categories/category-hero'
import { CategoryStockTable } from '@/components/categories/category-stock-table'
import { GoalSettingDialog } from '@/components/categories/goal-setting-dialog'
import { AddStockDialog } from '@/components/portfolio/add-stock-dialog'
import { usePortfoliosWithProfit, useDeletePortfolio } from '@/lib/hooks/use-portfolio'
import { useCategoryGoal } from '@/lib/hooks/use-category-goals'
import { useAuth } from '@/lib/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Portfolio } from '@/types/portfolio'
import { toKrw } from '@/lib/utils'

const CATEGORY = {
  id: 2,
  name: 'S&P 500',
  icon: '📊',
  description: '미국 대형주 지수 추종 포트폴리오',
}

export default function SP500Page() {
  const { user } = useAuth()
  const { data: portfolios, isLoading } = usePortfoliosWithProfit()
  const { data: goal } = useCategoryGoal(user?.uid || '', CATEGORY.id)
  const deleteMutation = useDeletePortfolio()
  const { toast } = useToast()

  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | undefined>()

  // 카테고리별 포트폴리오 필터링
  const categoryPortfolios = useMemo(() => {
    return portfolios.filter((p) => p.categoryId === CATEGORY.id)
  }, [portfolios])

  // 현재 카테고리 총액
  const currentAmount = useMemo(() => {
    return categoryPortfolios.reduce(
      (sum, p) => sum + toKrw(p.marketValue, p.market, 1300),
      0
    )
  }, [categoryPortfolios])

  // 평균 수익률 계산
  const averageReturn = useMemo(() => {
    if (categoryPortfolios.length === 0) return 0
    const totalReturn = categoryPortfolios.reduce((sum, p) => sum + p.profitRate, 0)
    return totalReturn / categoryPortfolios.length
  }, [categoryPortfolios])

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
      {/* 히어로 섹션 */}
      <CategoryHero
        categoryName={CATEGORY.name}
        categoryIcon={CATEGORY.icon}
        categoryDescription={CATEGORY.description}
        currentAmount={currentAmount}
        targetAmount={goal?.targetAmount}
        portfolioCount={categoryPortfolios.length}
        averageReturn={averageReturn}
        onSetGoal={() => setIsGoalDialogOpen(true)}
      />

      {/* 종목 테이블 */}
      <CategoryStockTable
        portfolios={categoryPortfolios}
        categoryName={CATEGORY.name}
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

      {/* 목표 설정 다이얼로그 */}
      <GoalSettingDialog
        open={isGoalDialogOpen}
        onOpenChange={setIsGoalDialogOpen}
        userId={user?.uid || ''}
        categoryId={CATEGORY.id}
        categoryName={CATEGORY.name}
        categoryIcon={CATEGORY.icon}
        currentGoal={goal?.targetAmount}
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
        defaultCategoryId={CATEGORY.id}
      />
    </div>
  )
}
