'use client'

import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface HeroAssetCardProps {
  totalAsset: number
  totalProfit: number
  profitRate: number
  todayProfit: number
  todayProfitRate: number
}

export function HeroAssetCard({
  totalAsset,
  totalProfit,
  profitRate,
  todayProfit,
  todayProfitRate,
}: HeroAssetCardProps) {
  const isProfit = profitRate >= 0
  const isTodayProfit = todayProfitRate >= 0

  return (
    <Card className="bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0">
      <CardContent className="p-6">
        <div className="text-sm opacity-90 mb-2">총 자산</div>
        <div className="text-4xl font-bold mb-6">
          {formatCurrency(totalAsset)}
        </div>

        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-2">
            {isProfit ? (
              <TrendingUp className="h-5 w-5" />
            ) : (
              <TrendingDown className="h-5 w-5" />
            )}
            <span className="text-2xl font-semibold">
              {isProfit ? '+' : ''}{profitRate.toFixed(2)}%
            </span>
          </div>
          <span className="text-lg opacity-90">
            ({isProfit ? '+' : ''}{formatCurrency(totalProfit)})
          </span>
        </div>

        <div className="text-sm opacity-75 pt-3 border-t border-white/20">
          오늘: {isTodayProfit ? '+' : ''}{todayProfitRate.toFixed(2)}%
          ({isTodayProfit ? '+' : ''}{formatCurrency(todayProfit)})
        </div>
      </CardContent>
    </Card>
  )
}




