'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface ProfitChartData {
  date: string
  dailyProfit: number
  monthlyProfit: number
  yearlyProfit: number
}

interface ProfitChartProps {
  data: ProfitChartData[]
}

export function ProfitChart({ data }: ProfitChartProps) {
  const [period, setPeriod] = useState('1m')

  // 기간별 데이터 필터링
  const filteredData = data.filter((item) => {
    const itemDate = new Date(item.date)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24))

    switch (period) {
      case '1m':
        return diffDays <= 30
      case '3m':
        return diffDays <= 90
      case '6m':
        return diffDays <= 180
      case '1y':
        return diffDays <= 365
      default:
        return true
    }
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>수익 추이</CardTitle>
          <Tabs value={period} onValueChange={setPeriod}>
            <TabsList>
              <TabsTrigger value="1m">1개월</TabsTrigger>
              <TabsTrigger value="3m">3개월</TabsTrigger>
              <TabsTrigger value="6m">6개월</TabsTrigger>
              <TabsTrigger value="1y">1년</TabsTrigger>
              <TabsTrigger value="all">전체</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {filteredData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return `${date.getMonth() + 1}/${date.getDate()}`
                }}
              />
              <YAxis
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
                  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
                  return value.toString()
                }}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString('ko-KR')
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="dailyProfit"
                stroke="#ef4444"
                name="일일 수익"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="monthlyProfit"
                stroke="#3b82f6"
                name="월 누적"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="yearlyProfit"
                stroke="#10b981"
                name="연 누적"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            데이터가 없습니다
          </div>
        )}
      </CardContent>
    </Card>
  )
}

