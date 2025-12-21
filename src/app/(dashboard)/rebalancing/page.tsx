'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { usePortfoliosWithProfit } from '@/lib/hooks/use-portfolio'
import { formatCurrency } from '@/lib/utils'

const CATEGORIES = {
  1: { id: 'nasdaq100' as const, name: '나스닥100', icon: '📈' },
  2: { id: 'sp500' as const, name: 'S&P 500', icon: '📊' },
  3: { id: 'dividend' as const, name: '배당주', icon: '💰' },
}

export default function RebalancingPage() {
  const { data: portfolios } = usePortfoliosWithProfit()
  const [targets, setTargets] = useState({
    nasdaq100: 50,
    sp500: 30,
    dividend: 20,
  })

  const totalAsset = useMemo(() => {
    return portfolios.reduce((sum, p) => sum + p.marketValue, 0)
  }, [portfolios])

  const currentAllocation = useMemo(() => {
    const allocation: Record<string, number> = {}
    
    portfolios.forEach((portfolio) => {
      const categoryId = portfolio.categoryId
        ? CATEGORIES[portfolio.categoryId as keyof typeof CATEGORIES]?.id
        : 'other'
      
      if (!allocation[categoryId]) {
        allocation[categoryId] = 0
      }
      allocation[categoryId] += portfolio.marketValue
    })

    return Object.entries(allocation).map(([id, value]) => ({
      id: id as 'nasdaq100' | 'sp500' | 'dividend',
      value,
      percentage: totalAsset !== 0 ? (value / totalAsset) * 100 : 0,
    }))
  }, [portfolios, totalAsset])

  const total = Object.values(targets).reduce((a, b) => a + b, 0)
  const isValid = total === 100

  const rebalancingSuggestions = useMemo(() => {
    return Object.entries(targets).map(([key, targetPercent]) => {
      const current = currentAllocation.find((c) => c.id === key)
      const currentValue = current?.value || 0
      const targetValue = totalAsset * (targetPercent / 100)
      const diff = targetValue - currentValue

      return {
        id: key as 'nasdaq100' | 'sp500' | 'dividend',
        name: CATEGORIES[Number(key === 'nasdaq100' ? 1 : key === 'sp500' ? 2 : 3) as keyof typeof CATEGORIES]?.name || key,
        icon: CATEGORIES[Number(key === 'nasdaq100' ? 1 : key === 'sp500' ? 2 : 3) as keyof typeof CATEGORIES]?.icon || '📦',
        currentValue,
        targetValue,
        diff,
        currentPercent: current?.percentage || 0,
        targetPercent,
      }
    })
  }, [targets, totalAsset, currentAllocation])

  const handleExportCSV = () => {
    const csv = [
      ['카테고리', '현재 비중', '목표 비중', '현재 자산', '목표 자산', '조정 필요 금액'].join(','),
      ...rebalancingSuggestions.map((s) =>
        [
          s.name,
          `${s.currentPercent.toFixed(1)}%`,
          `${s.targetPercent}%`,
          formatCurrency(s.currentValue),
          formatCurrency(s.targetValue),
          formatCurrency(s.diff),
        ].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `rebalancing_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">리밸런싱</h2>
        <p className="text-muted-foreground">
          목표 비중을 설정하고 리밸런싱 제안을 확인하세요
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>목표 비중 설정</CardTitle>
          <CardDescription>
            각 카테고리의 목표 비중을 설정하세요 (합계 100%)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(targets).map(([key, value]) => {
            const category = CATEGORIES[
              Number(key === 'nasdaq100' ? 1 : key === 'sp500' ? 2 : 3) as keyof typeof CATEGORIES
            ]
            
            return (
              <div key={key} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium flex items-center gap-2">
                    <span>{category?.icon}</span>
                    <span>{category?.name}</span>
                  </span>
                  <span className="font-bold text-lg">{value}%</span>
                </div>
                <Slider
                  value={[value]}
                  onValueChange={(vals) =>
                    setTargets({ ...targets, [key]: vals[0] })
                  }
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            )
          })}

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="font-semibold">합계</span>
              <span
                className={`text-xl font-bold ${
                  isValid ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {total}% {isValid ? '✅' : '❌'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>리밸런싱 제안</CardTitle>
          <CardDescription>
            목표 비중에 맞추기 위한 매수/매도 제안
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rebalancingSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="flex justify-between items-center p-4 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{suggestion.icon}</span>
                  <div>
                    <div className="font-medium">{suggestion.name}</div>
                    <div className="text-sm text-muted-foreground">
                      현재: {suggestion.currentPercent.toFixed(1)}% → 목표:{' '}
                      {suggestion.targetPercent}%
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`font-bold text-lg ${
                      suggestion.diff >= 0 ? 'text-profit' : 'text-loss'
                    }`}
                  >
                    {suggestion.diff >= 0 ? '+' : ''}
                    {formatCurrency(suggestion.diff)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {suggestion.diff >= 0 ? '매수 필요' : '매도 필요'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button
            className="w-full mt-6"
            disabled={!isValid}
            onClick={handleExportCSV}
          >
            <Download className="h-4 w-4 mr-2" />
            리밸런싱 플랜 다운로드 (CSV)
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}




