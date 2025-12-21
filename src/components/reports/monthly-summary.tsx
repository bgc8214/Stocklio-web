'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'

interface MonthlySummaryProps {
  startValue: number
  endValue: number
  monthlyProfit: number
  monthlyProfitRate: number
  previousMonthRate: number
  ytdRate: number
}

export function MonthlySummary({
  startValue,
  endValue,
  monthlyProfit,
  monthlyProfitRate,
  previousMonthRate,
  ytdRate,
}: MonthlySummaryProps) {
  const stats = [
    {
      label: '월초 자산',
      value: formatCurrency(startValue, 'KRX'),
      icon: Calendar,
      color: 'text-blue-500',
    },
    {
      label: '월말 자산',
      value: formatCurrency(endValue, 'KRX'),
      icon: DollarSign,
      color: 'text-purple-500',
    },
    {
      label: '월간 수익',
      value: formatCurrency(monthlyProfit, 'KRX'),
      icon: monthlyProfit >= 0 ? TrendingUp : TrendingDown,
      color: monthlyProfit >= 0 ? 'text-profit' : 'text-loss',
    },
    {
      label: '월간 수익률',
      value: formatPercent(monthlyProfitRate),
      icon: monthlyProfitRate >= 0 ? TrendingUp : TrendingDown,
      color: monthlyProfitRate >= 0 ? 'text-profit' : 'text-loss',
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>월간 성과 요약</CardTitle>
        <CardDescription>이번 달 포트폴리오 성과</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 주요 지표 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="space-y-2"
              >
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                  {stat.label}
                </div>
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              </motion.div>
            )
          })}
        </div>

        {/* 비교 지표 */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">전월 대비</div>
            <div
              className={`text-lg font-semibold ${
                previousMonthRate >= 0 ? 'text-profit' : 'text-loss'
              }`}
            >
              {previousMonthRate >= 0 ? '+' : ''}
              {formatPercent(previousMonthRate)}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">연초 대비 (YTD)</div>
            <div className={`text-lg font-semibold ${ytdRate >= 0 ? 'text-profit' : 'text-loss'}`}>
              {ytdRate >= 0 ? '+' : ''}
              {formatPercent(ytdRate)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
