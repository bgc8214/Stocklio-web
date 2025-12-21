'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { formatCurrency } from '@/lib/utils'

const COLORS = {
  nasdaq100: '#3b82f6',
  sp500: '#10b981',
  dividend: '#f59e0b',
}

interface CategoryData {
  id: 'nasdaq100' | 'sp500' | 'dividend'
  name: string
  value: number
  percentage: number
}

interface CategoryAllocationProps {
  categories: CategoryData[]
}

export function CategoryAllocation({ categories }: CategoryAllocationProps) {
  const chartData = categories.map((cat) => ({
    name: cat.name,
    value: cat.value,
    percentage: cat.percentage,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>카테고리별 자산 배분</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry: any) => `${entry.percentage.toFixed(1)}%`}
                >
                  {chartData.map((entry, index) => {
                    const categoryId = categories[index]?.id
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[categoryId] || '#gray'}
                      />
                    )
                  })}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>

            <div className="mt-6 space-y-3">
              {categories.map((cat) => {
                const color = COLORS[cat.id] || '#gray'
                return (
                  <div
                    key={cat.id}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      {cat.name}
                    </span>
                    <span className="font-semibold">
                      {cat.percentage.toFixed(1)}% ({formatCurrency(cat.value)})
                    </span>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-[250px] text-muted-foreground">
            데이터가 없습니다
          </div>
        )}
      </CardContent>
    </Card>
  )
}




