'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Download,
  Save,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Sparkles,
} from 'lucide-react'
import { usePortfoliosWithProfit } from '@/lib/hooks/use-portfolio'
import {
  useRebalancingTargets,
  useSaveRebalancingTargets,
  REBALANCING_PRESETS,
  PresetKey,
} from '@/lib/hooks/use-rebalancing'
import {
  calculateRebalancingSuggestions,
  calculateStockSuggestions,
  simulateRebalancing,
} from '@/lib/utils/rebalancing'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

const CATEGORIES = {
  1: { id: 'nasdaq100' as const, name: '나스닥100', icon: '📈' },
  2: { id: 'sp500' as const, name: 'S&P 500', icon: '📊' },
  3: { id: 'dividend' as const, name: '배당주', icon: '💰' },
}

export default function RebalancingPage() {
  const { toast } = useToast()
  const { data: portfolios, isLoading: isLoadingPortfolios } =
    usePortfoliosWithProfit()
  const { data: savedTargets, isLoading: isLoadingTargets } =
    useRebalancingTargets()
  const saveMutation = useSaveRebalancingTargets()

  const [targets, setTargets] = useState({
    nasdaq100: 50,
    sp500: 30,
    dividend: 20,
  })

  // 저장된 목표 불러오기
  useEffect(() => {
    if (savedTargets) {
      setTargets(savedTargets)
    }
  }, [savedTargets])

  const total = Object.values(targets).reduce((a, b) => a + b, 0)
  const isValid = total === 100

  const totalAsset = useMemo(() => {
    return portfolios.reduce((sum, p) => sum + p.marketValue, 0)
  }, [portfolios])

  const rebalancingSuggestions = useMemo(() => {
    return calculateRebalancingSuggestions(portfolios, targets)
  }, [portfolios, targets])

  const stockSuggestions = useMemo(() => {
    const categoryDiff: Record<string, number> = {}
    rebalancingSuggestions.forEach((suggestion) => {
      categoryDiff[suggestion.id] = suggestion.diff
    })
    return calculateStockSuggestions(portfolios, categoryDiff)
  }, [portfolios, rebalancingSuggestions])

  const simulation = useMemo(() => {
    return simulateRebalancing(portfolios, targets)
  }, [portfolios, targets])

  const handleSaveTargets = async () => {
    if (!isValid) {
      toast({
        variant: 'destructive',
        title: '저장 실패',
        description: '목표 비중의 합계가 100%가 되어야 합니다.',
      })
      return
    }

    try {
      await saveMutation.mutateAsync(targets)
      toast({
        title: '저장 완료',
        description: '목표 비중이 저장되었습니다.',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '저장 실패',
        description: '목표 비중 저장 중 오류가 발생했습니다.',
      })
    }
  }

  const handleApplyPreset = (presetKey: PresetKey) => {
    const preset = REBALANCING_PRESETS[presetKey]
    setTargets({
      nasdaq100: preset.nasdaq100,
      sp500: preset.sp500,
      dividend: preset.dividend,
    })
    toast({
      title: `${preset.name} 프리셋 적용`,
      description: preset.description,
    })
  }

  const handleExportCSV = () => {
    const csv = [
      [
        '카테고리',
        '현재 비중',
        '목표 비중',
        '현재 자산',
        '목표 자산',
        '조정 필요 금액',
      ].join(','),
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

  if (isLoadingPortfolios || isLoadingTargets) {
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
        <h2 className="text-3xl font-bold tracking-tight">리밸런싱</h2>
        <p className="text-muted-foreground">
          목표 비중을 설정하고 리밸런싱 제안을 확인하세요
        </p>
      </div>

      {/* 프리셋 선택 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <CardTitle>빠른 설정</CardTitle>
          </div>
          <CardDescription>
            미리 설정된 포트폴리오 비율을 선택하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(Object.keys(REBALANCING_PRESETS) as PresetKey[]).map(
              (presetKey) => {
                const preset = REBALANCING_PRESETS[presetKey]
                return (
                  <Button
                    key={presetKey}
                    variant="outline"
                    className="h-auto flex-col items-start p-4"
                    onClick={() => handleApplyPreset(presetKey)}
                  >
                    <div className="font-semibold">{preset.name}</div>
                    <div className="text-xs text-muted-foreground text-left mt-1">
                      {preset.description}
                    </div>
                    <div className="text-xs mt-2 text-left w-full">
                      <div>📈 {preset.nasdaq100}%</div>
                      <div>📊 {preset.sp500}%</div>
                      <div>💰 {preset.dividend}%</div>
                    </div>
                  </Button>
                )
              }
            )}
          </div>
        </CardContent>
      </Card>

      {/* 목표 비중 설정 */}
      <Card>
        <CardHeader>
          <CardTitle>목표 비중 설정</CardTitle>
          <CardDescription>
            각 카테고리의 목표 비중을 설정하세요 (합계 100%)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(targets).map(([key, value]) => {
            const category =
              CATEGORIES[
                Number(
                  key === 'nasdaq100' ? 1 : key === 'sp500' ? 2 : 3
                ) as keyof typeof CATEGORIES
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

          <div className="pt-4 border-t flex justify-between items-center">
            <div className="flex justify-between items-center flex-1">
              <span className="font-semibold">합계</span>
              <span
                className={`text-xl font-bold ${
                  isValid ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {total}% {isValid ? '✅' : '❌'}
              </span>
            </div>
            <Button
              className="ml-4"
              onClick={handleSaveTargets}
              disabled={!isValid || saveMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              저장
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="summary">
            <BarChart3 className="h-4 w-4 mr-2" />
            요약
          </TabsTrigger>
          <TabsTrigger value="stocks">
            <TrendingUp className="h-4 w-4 mr-2" />
            종목별 제안
          </TabsTrigger>
          <TabsTrigger value="simulation">
            <Sparkles className="h-4 w-4 mr-2" />
            시뮬레이션
          </TabsTrigger>
        </TabsList>

        {/* 요약 탭 */}
        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>카테고리별 리밸런싱 제안</CardTitle>
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
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        {suggestion.diff >= 0 ? (
                          <>
                            <TrendingUp className="h-3 w-3" />
                            매수 필요
                          </>
                        ) : (
                          <>
                            <TrendingDown className="h-3 w-3" />
                            매도 필요
                          </>
                        )}
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
        </TabsContent>

        {/* 종목별 제안 탭 */}
        <TabsContent value="stocks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>종목별 매수/매도 제안</CardTitle>
              <CardDescription>
                리밸런싱을 위한 구체적인 종목별 거래 제안
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stockSuggestions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  리밸런싱이 필요하지 않습니다.
                </div>
              ) : (
                <div className="space-y-3">
                  {stockSuggestions.map((stock, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-4 rounded-lg border"
                    >
                      <div>
                        <div className="font-semibold">{stock.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {stock.ticker}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            stock.action === 'buy' ? 'default' : 'destructive'
                          }
                          className="mb-1"
                        >
                          {stock.action === 'buy' ? '매수' : '매도'}
                        </Badge>
                        <div className="text-sm font-medium">
                          {stock.quantity}주
                        </div>
                        <div className="text-xs text-muted-foreground">
                          @ {formatCurrency(stock.currentPrice)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 시뮬레이션 탭 */}
        <TabsContent value="simulation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>리밸런싱 시뮬레이션</CardTitle>
              <CardDescription>
                리밸런싱 후 예상되는 포트폴리오 상태
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 거래 비용 */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">예상 거래 비용</span>
                  <span className="text-lg font-bold text-destructive">
                    -{formatCurrency(simulation.totalTradingCost)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  수수료 및 세금 포함
                </p>
              </div>

              {/* 리밸런싱 후 총 자산 */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    리밸런싱 후 총 자산
                  </span>
                  <span className="text-lg font-bold">
                    {formatCurrency(simulation.afterRebalancing.totalValue)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  거래 비용 차감 후
                </p>
              </div>

              {/* 리밸런싱 후 배분 */}
              <div>
                <h4 className="font-semibold mb-3">리밸런싱 후 카테고리 배분</h4>
                <div className="space-y-3">
                  {simulation.afterRebalancing.allocations.map((allocation) => (
                    <div
                      key={allocation.id}
                      className="flex justify-between items-center p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{allocation.icon}</span>
                        <span className="font-medium">{allocation.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">
                          {allocation.percentage.toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(allocation.value)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
<<<<<<< Updated upstream
=======





>>>>>>> Stashed changes
