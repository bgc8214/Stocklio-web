'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Portfolio } from '@/types/portfolio'
import { getStockPrices } from '@/lib/api/yahoo-finance'
import { isFirebaseConfigured } from '@/lib/firebase/config'
import { useAuth } from './use-auth'
import {
  getPortfolios,
  addPortfolio,
  updatePortfolio,
  deletePortfolio,
} from '@/lib/firebase/firestore'
import {
  getLocalPortfolios,
  saveLocalPortfolio,
  updateLocalPortfolio,
  deleteLocalPortfolio,
} from '@/lib/storage/local-storage'
import { toKrw } from '@/lib/utils'

interface PortfolioWithProfit extends Portfolio {
  marketValue: number
  investment: number
  profit: number
  profitRate: number
  categoryName?: string
  categoryIcon?: string
}

/**
 * 포트폴리오 목록 조회 훅
 */
export function usePortfolios() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['portfolios', user?.uid || 'local'],
    queryFn: async () => {
      // Firebase가 설정되어 있고 사용자가 있으면 Firestore 사용
      if (isFirebaseConfigured && user?.uid) {
        return await getPortfolios(user.uid)
      }

      // 개발 모드: 로컬 스토리지 사용
      return getLocalPortfolios()
    },
    enabled: true, // 항상 활성화 (로컬 모드 지원)
  })
}

/**
 * 포트폴리오 추가 훅
 */
export function useAddPortfolio() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (portfolio: Omit<Portfolio, 'id' | 'createdAt' | 'updatedAt'>) => {
      // Firebase가 설정되어 있고 사용자가 있으면 Firestore 사용
      if (isFirebaseConfigured && user?.uid) {
        await addPortfolio(user.uid, {
          ...portfolio,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        return
      }

      // 개발 모드: 로컬 스토리지 사용
      saveLocalPortfolio(portfolio)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios', user?.uid || 'local'] })
    },
  })
}

/**
 * 포트폴리오 수정 훅
 */
export function useUpdatePortfolio() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: Partial<Portfolio>
    }) => {
      // Firebase가 설정되어 있고 사용자가 있으면 Firestore 사용
      if (isFirebaseConfigured && user?.uid) {
        await updatePortfolio(user.uid, id, data)
        return
      }

      // 개발 모드: 로컬 스토리지 사용
      updateLocalPortfolio(id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios', user?.uid || 'local'] })
    },
  })
}

/**
 * 포트폴리오 삭제 훅
 */
export function useDeletePortfolio() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      // Firebase가 설정되어 있고 사용자가 있으면 Firestore 사용
      if (isFirebaseConfigured && user?.uid) {
        await deletePortfolio(user.uid, id)
        return
      }

      // 개발 모드: 로컬 스토리지 사용
      deleteLocalPortfolio(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios', user?.uid || 'local'] })
    },
  })
}

/**
 * 포트폴리오 + 수익 정보 조회 훅
 */
export function usePortfoliosWithProfit() {
  const { data: portfolios, isLoading } = usePortfolios()
  const [portfoliosWithProfit, setPortfoliosWithProfit] = useState<
    PortfolioWithProfit[]
  >([])
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false)

  useEffect(() => {
    if (!portfolios || portfolios.length === 0) {
      setPortfoliosWithProfit([])
      return
    }

    const updatePrices = async () => {
      setIsUpdatingPrices(true)
      try {
        // 고유한 티커만 추출
        const uniqueTickers = Array.from(
          new Set(portfolios.map((p) => p.ticker))
        )

        // 주가 조회
        const prices = await getStockPrices(uniqueTickers)
        const priceMap = new Map(
          prices.map((p) => [p.ticker, p.currentPrice])
        )

        // 포트폴리오에 수익 정보 추가
        const updated = portfolios.map((portfolio) => {
          const currentPrice = priceMap.get(portfolio.ticker) || portfolio.currentPrice
          const marketValue = currentPrice * portfolio.quantity
          const investment = portfolio.averageCost * portfolio.quantity
          const profit = marketValue - investment
          const profitRate = investment !== 0 ? (profit / investment) * 100 : 0

          return {
            ...portfolio,
            currentPrice,
            marketValue,
            investment,
            profit,
            profitRate,
          }
        })

        setPortfoliosWithProfit(updated)
      } catch (error) {
        console.error('Error updating prices:', error)
        // 에러 발생 시 기본값 사용
        const fallback = portfolios.map((portfolio) => {
          const marketValue = portfolio.currentPrice * portfolio.quantity
          const investment = portfolio.averageCost * portfolio.quantity
          const profit = marketValue - investment
          const profitRate = investment !== 0 ? (profit / investment) * 100 : 0

          return {
            ...portfolio,
            marketValue,
            investment,
            profit,
            profitRate,
          }
        })
        setPortfoliosWithProfit(fallback)
      } finally {
        setIsUpdatingPrices(false)
      }
    }

    updatePrices()
  }, [portfolios])

  // 환율 적용한 총 자산과 총 비용 계산 (모두 원화로 통일)
  const EXCHANGE_RATE = 1300 // USD/KRW 환율
  const totalValue = portfoliosWithProfit.reduce((sum, p) => {
    return sum + toKrw(p.marketValue, p.market, EXCHANGE_RATE)
  }, 0)
  const totalCost = portfoliosWithProfit.reduce((sum, p) => {
    return sum + toKrw(p.investment, p.market, EXCHANGE_RATE)
  }, 0)

  return {
    data: portfoliosWithProfit,
    isLoading: isLoading || isUpdatingPrices,
    totalValue,
    totalCost,
    refetchPrices: async () => {
      // 수동 주가 업데이트 트리거
      if (portfolios && portfolios.length > 0) {
        setIsUpdatingPrices(true)
        try {
          const uniqueTickers = Array.from(new Set(portfolios.map((p) => p.ticker)))
          const prices = await getStockPrices(uniqueTickers)
          const priceMap = new Map(prices.map((p) => [p.ticker, p.currentPrice]))

          const updated = portfolios.map((portfolio) => {
            const currentPrice = priceMap.get(portfolio.ticker) || portfolio.currentPrice
            const marketValue = currentPrice * portfolio.quantity
            const investment = portfolio.averageCost * portfolio.quantity
            const profit = marketValue - investment
            const profitRate = investment !== 0 ? (profit / investment) * 100 : 0

            return {
              ...portfolio,
              currentPrice,
              marketValue,
              investment,
              profit,
              profitRate,
            }
          })

          setPortfoliosWithProfit(updated)
        } catch (error) {
          console.error('Error refreshing prices:', error)
          throw error
        } finally {
          setIsUpdatingPrices(false)
        }
      }
    },
    isUpdatingPrices,
    lastUpdated: new Date(),
  }
}
