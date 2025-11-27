'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Portfolio } from '@/types/portfolio'
import { getStockPrice, getStockPrices } from '@/lib/api/yahoo-finance'
import { firestore, isFirebaseConfigured } from '@/lib/firebase/config'
import { useAuth } from './use-auth'
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore'
import {
  getLocalPortfolios,
  saveLocalPortfolio,
  updateLocalPortfolio,
  deleteLocalPortfolio,
} from '@/lib/storage/local-storage'

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
      if (isFirebaseConfigured && firestore && user?.uid) {
        const portfoliosRef = collection(firestore, 'portfolios')
        const q = query(portfoliosRef, where('userId', '==', user.uid))
        const snapshot = await getDocs(q)

        const portfolios: Portfolio[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          portfolios.push({
            id: doc.id,
            ticker: data.ticker,
            name: data.name,
            quantity: data.quantity,
            averageCost: data.averageCost,
            currentPrice: data.currentPrice || 0,
            market: data.market,
            categoryId: data.categoryId,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          })
        })

        return portfolios
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
      if (isFirebaseConfigured && firestore && user?.uid) {
        const portfoliosRef = collection(firestore, 'portfolios')
        await addDoc(portfoliosRef, {
          ...portfolio,
          userId: user.uid,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
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
      if (isFirebaseConfigured && firestore && user?.uid) {
        const portfolioRef = doc(firestore, 'portfolios', id)
        await updateDoc(portfolioRef, {
          ...data,
          updatedAt: Timestamp.now(),
        })
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
      if (isFirebaseConfigured && firestore && user?.uid) {
        const portfolioRef = doc(firestore, 'portfolios', id)
        await deleteDoc(portfolioRef)
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

  return {
    data: portfoliosWithProfit,
    isLoading: isLoading || isUpdatingPrices,
    // 총 자산과 총 비용을 계산하여 반환 (스냅샷 생성용)
    totalValue: portfoliosWithProfit.reduce((sum, p) => sum + p.marketValue, 0),
    totalCost: portfoliosWithProfit.reduce((sum, p) => sum + p.investment, 0),
  }
}

