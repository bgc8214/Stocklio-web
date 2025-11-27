'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { formatCurrency } from '@/lib/utils'
import { Target, TrendingUp, Package } from 'lucide-react'
import { motion } from 'framer-motion'

interface CategoryHeroProps {
  categoryName: string
  categoryIcon: string
  categoryDescription: string
  currentAmount: number
  targetAmount?: number
  portfolioCount: number
  averageReturn: number
  onSetGoal: () => void
}

export function CategoryHero({
  categoryName,
  categoryIcon,
  categoryDescription,
  currentAmount,
  targetAmount,
  portfolioCount,
  averageReturn,
  onSetGoal,
}: CategoryHeroProps) {
  const progressPercentage = targetAmount
    ? Math.min((currentAmount / targetAmount) * 100, 100)
    : 0

  const remainingAmount = targetAmount ? targetAmount - currentAmount : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="relative overflow-hidden border-none bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-xl">
        <CardContent className="p-8">
          <div className="space-y-6">
            {/* 헤더 */}
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-5xl">{categoryIcon}</span>
                  <div>
                    <h1 className="text-3xl font-bold">{categoryName}</h1>
                    <p className="text-muted-foreground">{categoryDescription}</p>
                  </div>
                </div>
              </div>
              <Button onClick={onSetGoal} variant="outline" className="gap-2">
                <Target className="h-4 w-4" />
                {targetAmount ? '목표 수정' : '목표 설정'}
              </Button>
            </div>

            {/* 목표 & 진행률 */}
            {targetAmount ? (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">목표 금액</p>
                    <p className="text-2xl font-bold">{formatCurrency(targetAmount)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">현재 금액</p>
                    <p className="text-2xl font-bold">{formatCurrency(currentAmount)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">남은 금액</p>
                    <p
                      className={`text-2xl font-bold ${
                        remainingAmount > 0 ? 'text-muted-foreground' : 'text-profit'
                      }`}
                    >
                      {remainingAmount > 0
                        ? formatCurrency(remainingAmount)
                        : '목표 달성!'}
                    </p>
                  </div>
                </div>

                {/* 진행률 바 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">진행률</span>
                    <span className="font-semibold">{progressPercentage.toFixed(1)}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-3" />
                </div>

                {/* 목표 달성 메시지 */}
                {progressPercentage >= 100 && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="rounded-lg bg-profit/10 p-4 text-center"
                  >
                    <p className="text-lg font-semibold text-profit">
                      🎉 축하합니다! 목표를 달성했습니다!
                    </p>
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="rounded-lg border-2 border-dashed border-muted p-8 text-center">
                <Target className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
                <p className="mb-2 text-lg font-semibold">목표가 설정되지 않았습니다</p>
                <p className="mb-4 text-sm text-muted-foreground">
                  이 카테고리에 대한 목표 금액을 설정하고 진행률을 추적하세요.
                </p>
                <Button onClick={onSetGoal} className="gap-2">
                  <Target className="h-4 w-4" />
                  목표 설정하기
                </Button>
              </div>
            )}

            {/* 통계 정보 */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3 rounded-lg bg-background/50 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">보유 종목</p>
                  <p className="text-2xl font-bold">{portfolioCount}개</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg bg-background/50 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-profit/10">
                  <TrendingUp className="h-6 w-6 text-profit" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">평균 수익률</p>
                  <p
                    className={`text-2xl font-bold ${
                      averageReturn >= 0 ? 'text-profit' : 'text-loss'
                    }`}
                  >
                    {averageReturn >= 0 ? '+' : ''}
                    {averageReturn.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
