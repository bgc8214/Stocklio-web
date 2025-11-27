export interface Portfolio {
  id: string
  ticker: string
  name: string
  quantity: number
  averageCost: number // KRX는 원화, US는 달러
  currentPrice: number // KRX는 원화, US는 달러
  market: 'KRX' | 'US'
  categoryId?: number
  createdAt: Date
  updatedAt: Date
}

export interface PortfolioWithProfit extends Portfolio {
  marketValue: number // KRX는 원화, US는 달러
  investment: number // KRX는 원화, US는 달러
  profit: number // KRX는 원화, US는 달러
  profitRate: number // 수익률 (%)
}

export interface Category {
  id: number
  name: string
  targetWeight: number
  color: string
}

export interface DailySnapshot {
  id: string
  date: Date
  totalValue: number
  totalInvestment: number
  totalProfit: number
  dailyProfit: number
  createdAt: Date
}

export interface CategoryGoal {
  id: string
  userId: string
  categoryId: number
  targetAmount: number // 목표 금액 (원화)
  createdAt: Date
  updatedAt: Date
}
