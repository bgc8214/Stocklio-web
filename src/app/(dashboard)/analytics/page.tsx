'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts'
import { useSnapshots } from '@/lib/hooks/use-snapshots'
import { usePortfoliosWithProfit } from '@/lib/hooks/use-portfolio'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, DollarSign, Percent, Calendar } from 'lucide-react'

export default function AnalyticsPage() {
  const { data: snapshots, isLoading: snapshotsLoading } = useSnapshots()
  const { data: portfolios } = usePortfoliosWithProfit()
  const [period, setPeriod] = useState<'1m' | '3m' | '6m' | '1y' | 'all'>('all')
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('area')

  // 기간별 데이터 필터링
  const filteredSnapshots = useMemo(() => {
    if (!snapshots || snapshots.length === 0) return []

    const now = new Date()
    const filtered = snapshots.filter((snapshot) => {
      const snapshotDate = new Date(snapshot.date)
      const diffDays = Math.floor((now.getTime() - snapshotDate.getTime()) / (1000 * 60 * 60 * 24))

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

    return filtered.sort((a, b) => a.date.localeCompare(b.date))
  }, [snapshots, period])

  // 통계 계산
  const stats = useMemo(() => {
    if (filteredSnapshots.length === 0) {
      return {
        totalReturn: 0,
        totalReturnPercent: 0,
        bestDay: { date: '', profit: 0 },
        worstDay: { date: '', profit: 0 },
        avgDailyReturn: 0,
        winDays: 0,
        lossDays: 0,
        totalDays: 0,
      }
    }

    const first = filteredSnapshots[0]
    const last = filteredSnapshots[filteredSnapshots.length - 1]
    const totalReturn = last.totalProfit - first.totalProfit
    const totalReturnPercent = first.totalCost !== 0
      ? ((last.totalValue - first.totalValue) / first.totalValue) * 100
      : 0

    const bestDay = filteredSnapshots.reduce(
      (best, current) =>
        current.dailyProfit > best.profit
          ? { date: current.date, profit: current.dailyProfit }
          : best,
      { date: '', profit: -Infinity }
    )

    const worstDay = filteredSnapshots.reduce(
      (worst, current) =>
        current.dailyProfit < worst.profit
          ? { date: current.date, profit: current.dailyProfit }
          : worst,
      { date: '', profit: Infinity }
    )

    const totalDailyProfit = filteredSnapshots.reduce(
      (sum, s) => sum + s.dailyProfit,
      0
    )
    const avgDailyReturn = filteredSnapshots.length > 0
      ? totalDailyProfit / filteredSnapshots.length
      : 0

    const winDays = filteredSnapshots.filter((s) => s.dailyProfit > 0).length
    const lossDays = filteredSnapshots.filter((s) => s.dailyProfit < 0).length

    return {
      totalReturn,
      totalReturnPercent,
      bestDay,
      worstDay,
      avgDailyReturn,
      winDays,
      lossDays,
      totalDays: filteredSnapshots.length,
    }
  }, [filteredSnapshots])

  // 차트 데이터 포맷팅
  const chartData = useMemo(() => {
    return filteredSnapshots.map((snapshot) => ({
      date: snapshot.date,
      dateLabel: new Date(snapshot.date).toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
      }),
      totalValue: snapshot.totalValue,
      totalProfit: snapshot.totalProfit,
      dailyProfit: snapshot.dailyProfit,
      profitRate: snapshot.profitRate,
      monthlyProfit: snapshot.monthlyProfit,
      yearlyProfit: snapshot.yearlyProfit,
    }))
  }, [filteredSnapshots])

  if (snapshotsLoading) {
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
      <div>
        <h2 className="text-3xl font-bold tracking-tight">수익 추이 분석</h2>
        <p className="text-muted-foreground">
          포트폴리오의 수익 추이를 상세하게 분석하세요
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 수익</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalReturn)}
            </div>
            <p
              className={`text-xs mt-1 ${
                stats.totalReturnPercent >= 0 ? 'text-profit' : 'text-loss'
              }`}
            >
              {stats.totalReturnPercent >= 0 ? '+' : ''}
              {stats.totalReturnPercent.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 일일 수익</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.avgDailyReturn)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalDays}일 기준
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">최고 수익일</CardTitle>
            <TrendingUp className="h-4 w-4 text-profit" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-profit">
              {formatCurrency(stats.bestDay.profit)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.bestDay.date
                ? new Date(stats.bestDay.date).toLocaleDateString('ko-KR')
                : '-'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">최저 수익일</CardTitle>
            <TrendingDown className="h-4 w-4 text-loss" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-loss">
              {formatCurrency(stats.worstDay.profit)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.worstDay.date
                ? new Date(stats.worstDay.date).toLocaleDateString('ko-KR')
                : '-'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 승률 카드 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">승률</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.totalDays > 0
                ? ((stats.winDays / stats.totalDays) * 100).toFixed(1)
                : 0}
              %
            </div>
            <div className="flex gap-4 mt-2 text-sm">
              <div className="text-profit">
                승: {stats.winDays}일
              </div>
              <div className="text-loss">
                패: {stats.lossDays}일
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">총 거래일</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalDays}일</div>
            <p className="text-xs text-muted-foreground mt-1">
              데이터가 있는 기간
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">현재 수익률</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-3xl font-bold ${
                filteredSnapshots.length > 0 &&
                filteredSnapshots[filteredSnapshots.length - 1].profitRate >= 0
                  ? 'text-profit'
                  : 'text-loss'
              }`}
            >
              {filteredSnapshots.length > 0
                ? `${filteredSnapshots[filteredSnapshots.length - 1].profitRate >= 0 ? '+' : ''}${filteredSnapshots[filteredSnapshots.length - 1].profitRate.toFixed(2)}%`
                : '0%'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              최종 수익률
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 메인 차트 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>수익 추이</CardTitle>
              <CardDescription>
                선택한 기간 동안의 포트폴리오 수익 변화
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
                <TabsList>
                  <TabsTrigger value="1m">1개월</TabsTrigger>
                  <TabsTrigger value="3m">3개월</TabsTrigger>
                  <TabsTrigger value="6m">6개월</TabsTrigger>
                  <TabsTrigger value="1y">1년</TabsTrigger>
                  <TabsTrigger value="all">전체</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={chartType} onValueChange={(v) => setChartType(v as any)}>
            <TabsList className="mb-4">
              <TabsTrigger value="line">선 그래프</TabsTrigger>
              <TabsTrigger value="area">영역 그래프</TabsTrigger>
              <TabsTrigger value="bar">막대 그래프</TabsTrigger>
            </TabsList>

            {chartData.length > 0 ? (
              <>
                <TabsContent value="line" className="mt-0">
                  <ResponsiveContainer width="100%" height={500}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="dateLabel"
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
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
                        labelFormatter={(label) => {
                          const item = chartData.find((d) => d.dateLabel === label)
                          return item
                            ? new Date(item.date).toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })
                            : label
                        }}
                      />
                      <Legend />
                      <ReferenceLine y={0} stroke="#666" strokeDasharray="2 2" />
                      <Line
                        type="monotone"
                        dataKey="totalValue"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="총 자산"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="totalProfit"
                        stroke="#10b981"
                        strokeWidth={2}
                        name="총 수익"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </TabsContent>

                <TabsContent value="area" className="mt-0">
                  <ResponsiveContainer width="100%" height={500}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="dateLabel"
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
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
                        labelFormatter={(label) => {
                          const item = chartData.find((d) => d.dateLabel === label)
                          return item
                            ? new Date(item.date).toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })
                            : label
                        }}
                      />
                      <Legend />
                      <ReferenceLine y={0} stroke="#666" strokeDasharray="2 2" />
                      <Area
                        type="monotone"
                        dataKey="totalValue"
                        stroke="#3b82f6"
                        fillOpacity={1}
                        fill="url(#colorValue)"
                        name="총 자산"
                      />
                      <Area
                        type="monotone"
                        dataKey="totalProfit"
                        stroke="#10b981"
                        fillOpacity={1}
                        fill="url(#colorProfit)"
                        name="총 수익"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </TabsContent>

                <TabsContent value="bar" className="mt-0">
                  <ResponsiveContainer width="100%" height={500}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="dateLabel"
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
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
                        labelFormatter={(label) => {
                          const item = chartData.find((d) => d.dateLabel === label)
                          return item
                            ? new Date(item.date).toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })
                            : label
                        }}
                      />
                      <Legend />
                      <ReferenceLine y={0} stroke="#666" />
                      <Bar
                        dataKey="dailyProfit"
                        fill="#3b82f6"
                        name="일일 수익"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </TabsContent>
              </>
            ) : (
              <div className="flex items-center justify-center h-[500px] text-muted-foreground">
                데이터가 없습니다. 샘플 데이터를 생성해주세요.
              </div>
            )}
          </Tabs>
        </CardContent>
      </Card>

      {/* 일일 수익 추이 */}
      <Card>
        <CardHeader>
          <CardTitle>일일 수익 추이</CardTitle>
          <CardDescription>일별 수익 변화를 확인하세요</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
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
                  labelFormatter={(label) => {
                    const item = chartData.find((d) => d.dateLabel === label)
                    return item
                      ? new Date(item.date).toLocaleDateString('ko-KR')
                      : label
                  }}
                />
                <ReferenceLine y={0} stroke="#666" />
                <Bar
                  dataKey="dailyProfit"
                  name="일일 수익"
                  radius={[4, 4, 0, 0]}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.dailyProfit >= 0 ? '#10b981' : '#ef4444'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              데이터가 없습니다.
            </div>
          )}
        </CardContent>
      </Card>

      {/* 수익률 추이 */}
      <Card>
        <CardHeader>
          <CardTitle>수익률 추이</CardTitle>
          <CardDescription>시간에 따른 수익률 변화</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  tickFormatter={(value) => `${value.toFixed(1)}%`}
                />
                <Tooltip
                  formatter={(value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`}
                  labelFormatter={(label) => {
                    const item = chartData.find((d) => d.dateLabel === label)
                    return item
                      ? new Date(item.date).toLocaleDateString('ko-KR')
                      : label
                  }}
                />
                <ReferenceLine y={0} stroke="#666" strokeDasharray="2 2" />
                <Line
                  type="monotone"
                  dataKey="profitRate"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  name="수익률 (%)"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              데이터가 없습니다.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

