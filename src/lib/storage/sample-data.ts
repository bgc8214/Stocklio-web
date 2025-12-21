/**
 * 샘플 포트폴리오 데이터
 * 개발 모드에서 초기 데이터로 사용
 */

import { Portfolio } from '@/types/portfolio'

export const samplePortfolios: Omit<Portfolio, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    quantity: 10,
    averageCost: 150.0,
    currentPrice: 175.0,
    market: 'US',
    categoryId: 1, // 나스닥100
  },
  {
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    quantity: 5,
    averageCost: 300.0,
    currentPrice: 380.0,
    market: 'US',
    categoryId: 1, // 나스닥100
  },
  {
    ticker: 'GOOGL',
    name: 'Alphabet Inc.',
    quantity: 8,
    averageCost: 120.0,
    currentPrice: 140.0,
    market: 'US',
    categoryId: 2, // S&P 500
  },
  {
    ticker: 'JNJ',
    name: 'Johnson & Johnson',
    quantity: 15,
    averageCost: 160.0,
    currentPrice: 165.0,
    market: 'US',
    categoryId: 3, // 배당주
  },
  {
    ticker: 'KO',
    name: 'The Coca-Cola Company',
    quantity: 20,
    averageCost: 55.0,
    currentPrice: 58.0,
    market: 'US',
    categoryId: 3, // 배당주
  },
]

export function initializeSampleData() {
  if (typeof window === 'undefined') return

  const existing = localStorage.getItem('myfolio_portfolios')
  if (existing) {
    // 이미 데이터가 있으면 초기화하지 않음
    return
  }

  // 샘플 데이터 저장
  const portfolios = samplePortfolios.map((p, index) => ({
    ...p,
    id: `sample_${Date.now()}_${index}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  }))

  localStorage.setItem('myfolio_portfolios', JSON.stringify(portfolios))
}




