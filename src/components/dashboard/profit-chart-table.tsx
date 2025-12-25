'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface MonthlyData {
  month: string        // YYYY-MM
  investment: number   // 누적투자
  value: number        // 평가금액
  monthlyProfit: number // 월별손익
  totalProfit: number  // 누적손익
  profitRate: number   // 수익률
}

interface ProfitChartTableProps {
  data: MonthlyData[]
  market?: 'KRX' | 'US'
}

export function ProfitChartTable({ data, market = 'KRX' }: ProfitChartTableProps) {
  // 월 라벨 포맷팅 (10월, 11월, ...)
  const formatMonth = (month: string) => {
    const [_, m] = month.split('-')
    return `${parseInt(m)}월`
  }

  // Y축 포맷팅
  const formatYAxis = (value: number) => {
    const abs = Math.abs(value)
    if (abs >= 100000000) return `${(value / 100000000).toFixed(1)}억`
    if (abs >= 10000000) return `${(value / 10000000).toFixed(0)}천만`
    if (abs >= 1000000) return `${(value / 1000000).toFixed(0)}백만`
    if (abs >= 10000) return `${(value / 10000).toFixed(0)}만`
    if (abs >= 1000) return `${(value / 1000).toFixed(0)}천`
    return value.toString()
  }

  // 테이블용 포맷팅 (간결하게)
  const formatTableNumber = (value: number) => {
    const abs = Math.abs(value)
    if (abs >= 10000) return Math.round(value / 10000)
    if (abs >= 1000) return (value / 1000).toFixed(1)
    return value.toString()
  }

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null
    const data = payload[0].payload

    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 space-y-1">
        <p className="text-sm font-semibold text-gray-900">{formatMonth(data.month)}</p>
        <div className="space-y-0.5 pt-1 border-t text-xs">
          <div className="flex justify-between gap-3">
            <span className="text-gray-600">평가금액:</span>
            <span className="font-semibold">{formatCurrency(data.value, market)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-gray-600">누적투자:</span>
            <span className="font-semibold">{formatCurrency(data.investment, market)}</span>
          </div>
          <div className="flex justify-between gap-3 pt-0.5 border-t">
            <span className="text-gray-600">수익률:</span>
            <span className={`font-bold ${data.profitRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.profitRate >= 0 ? '+' : ''}{data.profitRate.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>
    )
  }

  // 최신 데이터 (수익률 강조용)
  const latestData = data[data.length - 1]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>시간별 수익 추이</CardTitle>
          {latestData && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">현재 수익률:</span>
              <span className={`text-lg font-bold ${latestData.profitRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {latestData.profitRate >= 0 ? '+' : ''}{latestData.profitRate.toFixed(2)}%
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 테이블 */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="px-2 py-2 text-center font-semibold text-gray-700"></th>
                {data.map((item) => (
                  <th key={item.month} className="px-2 py-2 text-center font-semibold text-gray-700 min-w-[60px]">
                    {formatMonth(item.month)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-xs">
              {/* 누적투자 */}
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-2 py-1.5 font-medium text-gray-700">누적투자</td>
                {data.map((item) => (
                  <td key={item.month} className="px-2 py-1.5 text-center">
                    {formatTableNumber(item.investment)}
                  </td>
                ))}
              </tr>
              {/* 평가금액 */}
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-2 py-1.5 font-medium text-gray-700">평가금액</td>
                {data.map((item) => (
                  <td key={item.month} className="px-2 py-1.5 text-center font-semibold">
                    {formatTableNumber(item.value)}
                  </td>
                ))}
              </tr>
              {/* 월별손익 */}
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-2 py-1.5 font-medium text-gray-700">월별손익</td>
                {data.map((item) => (
                  <td
                    key={item.month}
                    className={`px-2 py-1.5 text-center font-semibold ${
                      item.monthlyProfit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {item.monthlyProfit >= 0 ? '+' : ''}{formatTableNumber(item.monthlyProfit)}
                  </td>
                ))}
              </tr>
              {/* 누적손익 */}
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-2 py-1.5 font-medium text-gray-700">누적손익</td>
                {data.map((item) => (
                  <td
                    key={item.month}
                    className={`px-2 py-1.5 text-center font-semibold ${
                      item.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {item.totalProfit >= 0 ? '+' : ''}{formatTableNumber(item.totalProfit)}
                  </td>
                ))}
              </tr>
              {/* 수익률 */}
              <tr className="hover:bg-gray-50">
                <td className="px-2 py-1.5 font-medium text-gray-700">수익률</td>
                {data.map((item) => (
                  <td
                    key={item.month}
                    className={`px-2 py-1.5 text-center font-bold ${
                      item.profitRate >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {item.profitRate >= 0 ? '+' : ''}{item.profitRate.toFixed(2)}%
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* 차트 */}
        <div className="pt-4">
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                {/* 그린 그라데이션 (평가금액 > 투자금일 때) */}
                <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

              <XAxis
                dataKey="month"
                tickFormatter={formatMonth}
                tick={{ fontSize: 11 }}
                stroke="#6b7280"
              />

              <YAxis
                tickFormatter={formatYAxis}
                tick={{ fontSize: 11 }}
                stroke="#6b7280"
                width={60}
              />

              <Tooltip content={<CustomTooltip />} />

              <Legend
                wrapperStyle={{ paddingTop: '10px', fontSize: '13px' }}
                iconType="line"
              />

              {/* 평가금액 (그린 영역) */}
              <Area
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#profitGradient)"
                name="평가금액"
              />

              {/* 월별손익 (블루 라인) */}
              <Area
                type="monotone"
                dataKey="monthlyProfit"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="transparent"
                name="월별손익"
              />

              {/* 누적투자 (레드 라인) */}
              <Area
                type="monotone"
                dataKey="investment"
                stroke="#ef4444"
                strokeWidth={2}
                fill="transparent"
                name="누적투자"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
