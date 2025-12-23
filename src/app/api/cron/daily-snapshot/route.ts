import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase/config'
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore'

const EXCHANGE_RATE = 1300 // USD/KRW 환율

interface Portfolio {
  ticker: string
  name: string
  quantity: number
  averageCost: number
  currentPrice: number
  market: 'KRX' | 'US'
  categoryId?: number
  userId: string
}

interface Snapshot {
  userId: string
  totalAssets: number
  totalInvestment: number
  totalProfit: number
  profitRate: number
  portfolioCount: number
  date: Date
}

// KRW 변환 함수
function toKrw(amount: number, market: 'KRX' | 'US', exchangeRate = EXCHANGE_RATE): number {
  return market === 'US' ? amount * exchangeRate : amount
}

export async function POST(request: NextRequest) {
  try {
    // CRON_SECRET 검증
    const authHeader = request.headers.get('authorization')
    const secret = authHeader?.replace('Bearer ', '')

    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Firestore 초기화 확인
    if (!db) {
      return NextResponse.json(
        { error: 'Firestore not initialized' },
        { status: 500 }
      )
    }

    console.log('[Cron] Daily snapshot started')

    // 모든 사용자 ID 가져오기
    const portfoliosRef = collection(db, 'portfolios')
    const portfoliosSnapshot = await getDocs(portfoliosRef)

    console.log(`[Cron] Total portfolio documents: ${portfoliosSnapshot.size}`)

    const userIds = new Set<string>()
    portfoliosSnapshot.forEach((doc) => {
      const data = doc.data()
      console.log(`[Cron] Portfolio doc:`, { id: doc.id, userId: data.userId, ticker: data.ticker })
      if (data.userId) {
        userIds.add(data.userId)
      }
    })

    console.log(`[Cron] Found ${userIds.size} users`)

    let successCount = 0
    let errorCount = 0

    // 각 사용자별로 스냅샷 생성
    for (const userId of userIds) {
      try {
        // 사용자의 포트폴리오 조회
        const userPortfoliosQuery = query(
          collection(db, 'portfolios'),
          where('userId', '==', userId)
        )
        const userPortfoliosSnapshot = await getDocs(userPortfoliosQuery)

        if (userPortfoliosSnapshot.empty) {
          console.log(`[Cron] User ${userId} has no portfolios, skipping`)
          continue
        }

        const portfolios: Portfolio[] = []
        userPortfoliosSnapshot.forEach((doc) => {
          const data = doc.data()
          portfolios.push({
            ticker: data.ticker,
            name: data.name,
            quantity: data.quantity,
            averageCost: data.averageCost,
            currentPrice: data.currentPrice,
            market: data.market,
            categoryId: data.categoryId,
            userId: data.userId,
          })
        })

        // 총 자산 계산 (KRW 기준)
        let totalAssets = 0
        let totalInvestment = 0

        portfolios.forEach((portfolio) => {
          const marketValue = portfolio.quantity * portfolio.currentPrice
          const investment = portfolio.quantity * portfolio.averageCost

          totalAssets += toKrw(marketValue, portfolio.market)
          totalInvestment += toKrw(investment, portfolio.market)
        })

        const totalProfit = totalAssets - totalInvestment
        const profitRate = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0

        // 스냅샷 저장
        const snapshot: Snapshot = {
          userId,
          totalAssets: Math.round(totalAssets),
          totalInvestment: Math.round(totalInvestment),
          totalProfit: Math.round(totalProfit),
          profitRate: parseFloat(profitRate.toFixed(2)),
          portfolioCount: portfolios.length,
          date: new Date(),
        }

        await addDoc(collection(db, 'snapshots'), snapshot)
        console.log(`[Cron] Snapshot created for user ${userId}`)
        successCount++
      } catch (error) {
        console.error(`[Cron] Error creating snapshot for user ${userId}:`, error)
        errorCount++
      }
    }

    console.log(`[Cron] Daily snapshot completed. Success: ${successCount}, Error: ${errorCount}`)

    return NextResponse.json({
      success: true,
      message: 'Daily snapshot completed',
      stats: {
        totalUsers: userIds.size,
        successCount,
        errorCount,
      },
    })
  } catch (error) {
    console.error('[Cron] Error in daily snapshot:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create daily snapshot',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
