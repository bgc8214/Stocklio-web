'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface ProfitChartData {
  date: string
  totalValue: number      // 총 평가액
  totalInvestment: number // 총 투자금
  totalProfit: number     // 총 수익
  dailyProfit?: number    // 일일 수익 변동
}

interface ProfitChartProps {
  data: ProfitChartData[]
  market?: 'KRX' | 'US'
}

type PeriodType = '1w' | '1m' | '3m' | '6m' | '1y' | 'all'
type ChartType = 'line' | 'area'

export function ProfitChartImproved({ data, market = 'KRX' }: ProfitChartProps) {
  const [period, setPeriod] = useState<PeriodType>('1m')
  const [chartType, setChartType] = useState<ChartType>('area')

  // 기간별 데이터 필터링
  const filteredData = useMemo(() => {
    if (!data.length) return []

    const now = new Date()
    return data.filter((item) => {
      const itemDate = new Date(item.date)
      const diffDays = Math.floor((now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24))

      switch (period) {
        case '1w':
          return diffDays <= 7
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
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [data, period])

  // 통계 계산
  const stats = useMemo(() => {
    if (!filteredData.length) {
      return {
        currentProfit: 0,
        profitRate: 0,
        highestValue: 0,
        lowestValue: 0,
        avgDailyProfit: 0,
      }
    }

    const latest = filteredData[filteredData.length - 1]
    const currentProfit = latest.totalProfit
    const profitRate = latest.totalInvestment > 0
      ? (currentProfit / latest.totalInvestment) * 100
      : 0

    const values = filteredData.map(d => d.totalValue)
    const highestValue = Math.max(...values)
    const lowestValue = Math.min(...values)

    const dailyProfits = filteredData
      .filter(d => d.dailyProfit !== undefined)
      .map(d => d.dailyProfit!)
    const avgDailyProfit = dailyProfits.length > 0
      ? dailyProfits.reduce((a, b) => a + b, 0) / dailyProfits.length
      : 0

    return {
      currentProfit,
      profitRate,
      highestValue,
      lowestValue,
      avgDailyProfit,
    }
  }, [filteredData])

  // Y축 포맷팅 (큰 숫자 처리)
  const formatYAxis = (value: number) => {
    const abs = Math.abs(value)

    // 억 단위
    if (abs >= 100000000) {
      return `${(value / 100000000).toFixed(1)}억`
    }
    // 천만 단위
    if (abs >= 10000000) {
      return `${(value / 10000000).toFixed(1)}천만`
    }
    // 백만 단위
    if (abs >= 1000000) {
      return `${(value / 1000000).toFixed(1)}백만`
    }
    // 만 단위
    if (abs >= 10000) {
      return `${(value / 10000).toFixed(0)}만`
    }
    // 천 단위
    if (abs >= 1000) {
      return `${(value / 1000).toFixed(0)}천`
    }

    return value.toString()
  }

  // X축 포맷팅 (기간에 따라 다르게)
  const formatXAxis = (value: string) => {
    const date = new Date(value)

    switch (period) {
      case '1w':
        return `${date.getMonth() + 1}/${date.getDate()}`
      case '1m':
      case '3m':
        return `${date.getMonth() + 1}/${date.getDate()}`
      case '6m':
      case '1y':
        return `${date.getFullYear()}.${date.getMonth() + 1}`
      default:
        return `${date.getFullYear()}.${date.getMonth() + 1}`
    }
  }

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null

    const date = new Date(label)
    const data = payload[0].payload

    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 space-y-2">
        <p className="text-sm font-semibold text-gray-900">
          {date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
        <div className="space-y-1 pt-2 border-t">
          <div className="flex justify-between gap-4">
            <span className="text-sm text-gray-600">총 평가액:</span>
            <span className="text-sm font-semibold">
              {formatCurrency(data.totalValue, market)}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-sm text-gray-600">투자금:</span>
            <span className="text-sm font-semibold">
              {formatCurrency(data.totalInvestment, market)}
            </span>
          </div>
          <div className="flex justify-between gap-4 pt-1 border-t">
            <span className="text-sm text-gray-600">수익:</span>
            <span className={`text-sm font-bold ${data.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(data.totalProfit, market)}
            </span>
          </div>
          {data.dailyProfit !== undefined && (
            <div className="flex justify-between gap-4">
              <span className="text-sm text-gray-600">일일 변동:</span>
              <span className={`text-sm font-semibold ${data.dailyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(data.dailyProfit, market)}
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }

  const ChartComponent = chartType === 'area' ? AreaChart : LineChart

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle>수익 추이</CardTitle>
            {/* 차트 타입 토글 */}
            <div className="flex gap-2">
              <button
                onClick={() => setChartType('area')}
                className={`px-3 py-1 text-sm rounded ${
                  chartType === 'area'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                영역
              </button>
              <button
                onClick={() => setChartType('line')}
                className={`px-3 py-1 text-sm rounded ${
                  chartType === 'line'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                선형
              </button>
            </div>
          </div>

          {/* 통계 요약 */}
          {filteredData.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground mb-1">현재 수익</p>
                <p className={`text-lg font-bold ${stats.currentProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(stats.currentProfit, market)}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {stats.profitRate >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600" />
                  )}
                  {formatPercent(stats.profitRate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">최고 평가액</p>
                <p className="text-lg font-bold text-blue-600">
                  {formatCurrency(stats.highestValue, market)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">최저 평가액</p>
                <p className="text-lg font-bold text-orange-600">
                  {formatCurrency(stats.lowestValue, market)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">평균 일일변동</p>
                <p className={`text-lg font-bold ${stats.avgDailyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(stats.avgDailyProfit, market)}
                </p>
              </div>
            </div>
          )}

          {/* 기간 선택 */}
          <Tabs value={period} onValueChange={(v) => setPeriod(v as PeriodType)} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="1w">1주</TabsTrigger>
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
          <ResponsiveContainer width="100%" height={400}>
            <ChartComponent data={filteredData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

              <XAxis
                dataKey="date"
                tickFormatter={formatXAxis}
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />

              <YAxis
                tickFormatter={formatYAxis}
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
                width={70}
              />

              <Tooltip content={<CustomTooltip />} />

              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
              />

              {chartType === 'area' ? (
                <>
                  <Area
                    type="monotone"
                    dataKey="totalValue"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fill="url(#colorProfit)"
                    name="총 평가액"
                  />
                  <Area
                    type="monotone"
                    dataKey="totalInvestment"
                    stroke="#6b7280"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    fill="transparent"
                    name="투자금"
                  />
                </>
              ) : (
                <>
                  <Line
                    type="monotone"
                    dataKey="totalValue"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    dot={false}
                    name="총 평가액"
                  />
                  <Line
                    type="monotone"
                    dataKey="totalInvestment"
                    stroke="#6b7280"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="투자금"
                  />
                  <Line
                    type="monotone"
                    dataKey="totalProfit"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    name="수익금"
                  />
                </>
              )}
            </ChartComponent>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground space-y-2">
            <p className="text-lg font-semibold">데이터가 없습니다</p>
            <p className="text-sm">투자 기록이 쌓이면 차트가 표시됩니다</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
