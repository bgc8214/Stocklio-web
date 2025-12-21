'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { motion } from 'framer-motion'

interface CategoryData {
  id: string
  name: string
  icon: string
  stockCount: number
  value: number
  profitRate: number
}

interface CategoryPerformanceProps {
  categories: CategoryData[]
}

export function CategoryPerformance({ categories }: CategoryPerformanceProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>카테고리별 성과</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex justify-between items-center p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
            >
              <div>
                <div className="font-medium flex items-center gap-2">
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                </div>
                <div className="text-sm text-muted-foreground">{category.stockCount}개 종목</div>
              </div>
              <div className="text-right">
                <div
                  className={`font-bold ${category.profitRate >= 0 ? 'text-profit' : 'text-loss'}`}
                >
                  {category.profitRate >= 0 ? '+' : ''}
                  {formatPercent(category.profitRate)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatCurrency(category.value, 'KRX')}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
