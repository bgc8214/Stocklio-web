import { NextRequest, NextResponse } from 'next/server'
import { collection, getDocs } from 'firebase/firestore'
import { firestore } from '@/lib/firebase/config'
import { getPortfolios } from '@/lib/firebase/firestore'
import { saveSnapshot } from '@/lib/firebase/firestore'
import { getStockPrices } from '@/lib/api/yahoo-finance'
import { toKrw } from '@/lib/utils'

// Cron job에서 호출할 보안 토큰
const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-key'

/**
 * 매일 자정 실행되는 스냅샷 생성 API
 * GitHub Actions 또는 외부 Cron에서 호출
 */
export async function POST(request: NextRequest) {
  try {
    // 보안 체크
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (token !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!firestore) {
      return NextResponse.json(
        { error: 'Firebase not configured' },
        { status: 500 }
      )
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    }

    // 모든 사용자 UID 조회
    const usersSnapshot = await getDocs(collection(firestore, 'portfolios'))
    const userIds = usersSnapshot.docs.map((doc) => doc.id)

    console.log(`Found ${userIds.length} users to process`)

    // 각 사용자별 스냅샷 생성
    for (const userId of userIds) {
      try {
        await createSnapshotForUser(userId)
        results.success++
      } catch (error: any) {
        results.failed++
        results.errors.push(`User ${userId}: ${error.message}`)
        console.error(`Failed to create snapshot for user ${userId}:`, error)
      }
    }

    return NextResponse.json({
      message: 'Daily snapshots created',
      timestamp: new Date().toISOString(),
      results,
    })
  } catch (error: any) {
    console.error('Error creating daily snapshots:', error)
    return NextResponse.json(
      { error: 'Failed to create snapshots', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * 특정 사용자의 스냅샷 생성
 */
async function createSnapshotForUser(userId: string) {
  // 1. 사용자의 포트폴리오 조회
  const portfolios = await getPortfolios(userId)

  if (portfolios.length === 0) {
    console.log(`User ${userId} has no portfolios, skipping`)
    return
  }

  // 2. 주가 업데이트
  const uniqueTickers = Array.from(new Set(portfolios.map((p) => p.ticker)))
  const prices = await getStockPrices(uniqueTickers)
  const priceMap = new Map(prices.map((p) => [p.ticker, p.currentPrice]))

  // 3. 환율 적용하여 총 자산 계산 (원화 기준)
  const EXCHANGE_RATE = 1300 // USD/KRW
  let totalValue = 0
  let totalCost = 0

  portfolios.forEach((portfolio) => {
    const currentPrice = priceMap.get(portfolio.ticker) || portfolio.currentPrice
    const marketValue = currentPrice * portfolio.quantity
    const investment = portfolio.averageCost * portfolio.quantity

    // 환율 적용
    totalValue += toKrw(marketValue, portfolio.market, EXCHANGE_RATE)
    totalCost += toKrw(investment, portfolio.market, EXCHANGE_RATE)
  })

  // 4. 스냅샷 데이터 생성
  const today = new Date().toISOString().split('T')[0]
  const totalProfit = totalValue - totalCost
  const profitRate = totalCost !== 0 ? (totalProfit / totalCost) * 100 : 0

  // 5. 어제 스냅샷 조회 (일일 수익 계산용)
  // TODO: Firestore에서 어제 스냅샷 조회하여 dailyProfit 계산

  const snapshotData = {
    date: today,
    totalValue,
    totalCost,
    totalProfit,
    profitRate,
    dailyProfit: 0, // TODO: 어제 대비 수익
    monthlyProfit: totalProfit, // 간단히 총 수익으로 설정 (추후 개선)
    yearlyProfit: totalProfit,
  }

  // 6. Firestore에 저장
  await saveSnapshot(userId, snapshotData)

  console.log(`Snapshot created for user ${userId}: ${today}`)
}

// GET 요청 시 상태 확인
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (token !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    status: 'ready',
    message: 'Daily snapshot cron job is configured',
    timestamp: new Date().toISOString(),
  })
}
