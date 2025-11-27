import { PortfolioWithProfit } from '@/types/portfolio'

export interface CategoryAllocation {
  id: 'nasdaq100' | 'sp500' | 'dividend' | 'other'
  name: string
  icon: string
  value: number
  percentage: number
}

export interface RebalancingSuggestion {
  id: 'nasdaq100' | 'sp500' | 'dividend'
  name: string
  icon: string
  currentValue: number
  targetValue: number
  diff: number
  currentPercent: number
  targetPercent: number
}

export interface StockSuggestion {
  ticker: string
  name: string
  action: 'buy' | 'sell'
  amount: number
  quantity: number
  currentPrice: number
}

const CATEGORIES = {
  1: { id: 'nasdaq100' as const, name: '나스닥100', icon: '📈' },
  2: { id: 'sp500' as const, name: 'S&P 500', icon: '📊' },
  3: { id: 'dividend' as const, name: '배당주', icon: '💰' },
}

/**
 * 현재 카테고리별 자산 배분 계산
 */
export function calculateCurrentAllocation(
  portfolios: PortfolioWithProfit[]
): CategoryAllocation[] {
  const totalAsset = portfolios.reduce((sum, p) => sum + p.marketValue, 0)
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

  return Object.entries(allocation).map(([id, value]) => {
    const category = Object.values(CATEGORIES).find((c) => c.id === id)
    return {
      id: id as CategoryAllocation['id'],
      name: category?.name || '미분류',
      icon: category?.icon || '📦',
      value,
      percentage: totalAsset !== 0 ? (value / totalAsset) * 100 : 0,
    }
  })
}

/**
 * 리밸런싱 제안 계산
 */
export function calculateRebalancingSuggestions(
  portfolios: PortfolioWithProfit[],
  targets: {
    nasdaq100: number
    sp500: number
    dividend: number
  }
): RebalancingSuggestion[] {
  const totalAsset = portfolios.reduce((sum, p) => sum + p.marketValue, 0)
  const currentAllocation = calculateCurrentAllocation(portfolios)

  return Object.entries(targets).map(([key, targetPercent]) => {
    const categoryKey = Number(
      key === 'nasdaq100' ? 1 : key === 'sp500' ? 2 : 3
    ) as keyof typeof CATEGORIES
    const category = CATEGORIES[categoryKey]

    const current = currentAllocation.find((c) => c.id === key)
    const currentValue = current?.value || 0
    const targetValue = totalAsset * (targetPercent / 100)
    const diff = targetValue - currentValue

    return {
      id: key as RebalancingSuggestion['id'],
      name: category?.name || key,
      icon: category?.icon || '📦',
      currentValue,
      targetValue,
      diff,
      currentPercent: current?.percentage || 0,
      targetPercent,
    }
  })
}

/**
 * 종목별 매수/매도 제안 계산
 */
export function calculateStockSuggestions(
  portfolios: PortfolioWithProfit[],
  categoryDiff: Record<string, number>
): StockSuggestion[] {
  const suggestions: StockSuggestion[] = []

  // 카테고리별로 종목 그룹화
  const categorizedStocks: Record<string, PortfolioWithProfit[]> = {}
  portfolios.forEach((portfolio) => {
    const categoryId = portfolio.categoryId
      ? CATEGORIES[portfolio.categoryId as keyof typeof CATEGORIES]?.id
      : 'other'

    if (!categorizedStocks[categoryId]) {
      categorizedStocks[categoryId] = []
    }
    categorizedStocks[categoryId].push(portfolio)
  })

  // 각 카테고리에 대한 제안 생성
  Object.entries(categoryDiff).forEach(([categoryId, diff]) => {
    const stocks = categorizedStocks[categoryId] || []
    if (stocks.length === 0) return

    if (diff > 0) {
      // 매수 필요 - 가장 수익률이 높은 종목에 집중
      const bestStock = stocks.reduce((best, current) =>
        current.profitRate > best.profitRate ? current : best
      )

      const quantity = Math.floor(diff / bestStock.currentPrice)
      if (quantity > 0) {
        suggestions.push({
          ticker: bestStock.ticker,
          name: bestStock.name,
          action: 'buy',
          amount: diff,
          quantity,
          currentPrice: bestStock.currentPrice,
        })
      }
    } else if (diff < 0) {
      // 매도 필요 - 가장 수익률이 낮은 종목부터 매도
      const worstStock = stocks.reduce((worst, current) =>
        current.profitRate < worst.profitRate ? current : worst
      )

      const sellAmount = Math.abs(diff)
      const quantity = Math.min(
        Math.floor(sellAmount / worstStock.currentPrice),
        worstStock.quantity
      )

      if (quantity > 0) {
        suggestions.push({
          ticker: worstStock.ticker,
          name: worstStock.name,
          action: 'sell',
          amount: sellAmount,
          quantity,
          currentPrice: worstStock.currentPrice,
        })
      }
    }
  })

  return suggestions
}

/**
 * 거래 비용 계산 (한국 주식 기준)
 * - 매수 수수료: 0.015%
 * - 매도 수수료: 0.015% + 증권거래세 0.23%
 */
export function calculateTradingCost(
  amount: number,
  action: 'buy' | 'sell'
): number {
  const commissionRate = 0.00015 // 0.015%
  const taxRate = action === 'sell' ? 0.0023 : 0 // 매도 시에만 증권거래세

  return amount * (commissionRate + taxRate)
}

/**
 * 리밸런싱 시뮬레이션
 */
export function simulateRebalancing(
  portfolios: PortfolioWithProfit[],
  targets: {
    nasdaq100: number
    sp500: number
    dividend: number
  }
): {
  totalTradingCost: number
  afterRebalancing: {
    totalValue: number
    allocations: CategoryAllocation[]
  }
} {
  const suggestions = calculateRebalancingSuggestions(portfolios, targets)

  // 총 거래 비용 계산
  let totalTradingCost = 0
  suggestions.forEach((suggestion) => {
    const action = suggestion.diff >= 0 ? 'buy' : 'sell'
    const amount = Math.abs(suggestion.diff)
    totalTradingCost += calculateTradingCost(amount, action)
  })

  // 리밸런싱 후 총 자산 (거래 비용 차감)
  const currentTotalValue = portfolios.reduce(
    (sum, p) => sum + p.marketValue,
    0
  )
  const afterTotalValue = currentTotalValue - totalTradingCost

  // 리밸런싱 후 배분
  const allocations: CategoryAllocation[] = Object.entries(targets).map(
    ([key, targetPercent]) => {
      const categoryKey = Number(
        key === 'nasdaq100' ? 1 : key === 'sp500' ? 2 : 3
      ) as keyof typeof CATEGORIES
      const category = CATEGORIES[categoryKey]

      return {
        id: key as CategoryAllocation['id'],
        name: category?.name || key,
        icon: category?.icon || '📦',
        value: afterTotalValue * (targetPercent / 100),
        percentage: targetPercent,
      }
    }
  )

  return {
    totalTradingCost,
    afterRebalancing: {
      totalValue: afterTotalValue,
      allocations,
    },
  }
}
