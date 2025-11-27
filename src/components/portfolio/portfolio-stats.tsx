'use client'

import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, Package, DollarSign, Wallet, BarChart3 } from 'lucide-react'
import { motion } from 'framer-motion'

interface PortfolioStatsProps {
  totalStocks: number
  averageReturn: number
  totalInvestment: number
  totalValue: number
  totalProfit: number
  profitRate: number
}

export function PortfolioStats({
  totalStocks,
  averageReturn,
  totalInvestment,
  totalValue,
  totalProfit,
  profitRate,
}: PortfolioStatsProps) {
  const stats = [
    {
      title: '총 종목',
      value: `${totalStocks}개`,
      icon: Package,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: '평균 수익률',
      value: `${averageReturn >= 0 ? '+' : ''}${averageReturn.toFixed(2)}%`,
      icon: averageReturn >= 0 ? TrendingUp : TrendingDown,
      color: averageReturn >= 0 ? 'text-profit' : 'text-loss',
      bgColor: averageReturn >= 0 ? 'bg-profit/10' : 'bg-loss/10',
    },
    {
      title: '총 투자금액',
      value: formatCurrency(totalInvestment),
      icon: DollarSign,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: '총 평가액',
      value: formatCurrency(totalValue),
      icon: Wallet,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: '총 수익금',
      value: formatCurrency(totalProfit),
      icon: BarChart3,
      color: totalProfit >= 0 ? 'text-profit' : 'text-loss',
      bgColor: totalProfit >= 0 ? 'bg-profit/10' : 'bg-loss/10',
    },
    {
      title: '수익률',
      value: `${profitRate >= 0 ? '+' : ''}${profitRate.toFixed(2)}%`,
      icon: profitRate >= 0 ? TrendingUp : TrendingDown,
      color: profitRate >= 0 ? 'text-profit' : 'text-loss',
      bgColor: profitRate >= 0 ? 'bg-profit/10' : 'bg-loss/10',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
