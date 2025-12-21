'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { motion } from 'framer-motion'

interface StockRanking {
  ticker: string
  name: string
  profitRate: number
  profit: number
}

interface StockRankingsProps {
  topGainers: StockRanking[]
  topLosers: StockRanking[]
}

export function StockRankings({ topGainers, topLosers }: StockRankingsProps) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* 베스트 종목 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-profit" />
            베스트 종목 TOP 5
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topGainers.length > 0 ? (
              topGainers.map((stock, index) => (
                <motion.div
                  key={stock.ticker}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-profit/5 border border-profit/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-profit/20 text-profit font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{stock.ticker}</div>
                      <div className="text-sm text-muted-foreground">{stock.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-profit">+{formatPercent(stock.profitRate)}</div>
                    <div className="text-sm text-muted-foreground">
                      +{formatCurrency(stock.profit, 'KRX')}
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">데이터가 없습니다</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 워스트 종목 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-loss" />
            워스트 종목 TOP 5
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topLosers.length > 0 ? (
              topLosers.map((stock, index) => (
                <motion.div
                  key={stock.ticker}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-loss/5 border border-loss/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-loss/20 text-loss font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{stock.ticker}</div>
                      <div className="text-sm text-muted-foreground">{stock.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-loss">{formatPercent(stock.profitRate)}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(stock.profit, 'KRX')}
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">데이터가 없습니다</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
