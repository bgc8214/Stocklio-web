/**
 * 로컬 스토리지 기반 포트폴리오 데이터 관리
 * Firebase 설정이 없을 때 사용하는 개발 모드 스토리지
 */

import { Portfolio } from '@/types/portfolio'

const STORAGE_KEY = 'myfolio_portfolios'

export function getLocalPortfolios(): Portfolio[] {
  if (typeof window === 'undefined') return []

  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return []

    const portfolios = JSON.parse(data)
    return portfolios.map((p: any) => ({
      ...p,
      createdAt: new Date(p.createdAt),
      updatedAt: new Date(p.updatedAt),
    }))
  } catch (error) {
    console.error('Failed to load portfolios from localStorage:', error)
    return []
  }
}

export function saveLocalPortfolio(portfolio: Omit<Portfolio, 'id' | 'createdAt' | 'updatedAt'>): string {
  const portfolios = getLocalPortfolios()
  const newPortfolio: Portfolio = {
    ...portfolio,
    id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  portfolios.push(newPortfolio)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolios))
  return newPortfolio.id
}

export function updateLocalPortfolio(id: string, data: Partial<Portfolio>): void {
  const portfolios = getLocalPortfolios()
  const index = portfolios.findIndex((p) => p.id === id)

  if (index === -1) {
    throw new Error(`Portfolio with id ${id} not found`)
  }

  portfolios[index] = {
    ...portfolios[index],
    ...data,
    updatedAt: new Date(),
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolios))
}

export function deleteLocalPortfolio(id: string): void {
  const portfolios = getLocalPortfolios()
  const filtered = portfolios.filter((p) => p.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
}

export function clearLocalPortfolios(): void {
  localStorage.removeItem(STORAGE_KEY)
}


<<<<<<< Updated upstream
=======



>>>>>>> Stashed changes
