import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

admin.initializeApp()

const db = admin.firestore()

/**
 * 매일 자정 실행되는 스냅샷 생성 함수
 * Cloud Scheduler가 자동으로 호출
 */
export const createDailySnapshots = functions
  .region('asia-northeast3') // 서울 리전
  .pubsub
  .schedule('0 0 * * *') // 매일 자정 (한국 시간)
  .timeZone('Asia/Seoul')
  .onRun(async (context) => {
    console.log('Starting daily snapshot creation...')

    try {
      // 모든 사용자 조회
      const portfoliosSnapshot = await db.collection('portfolios').get()
      const userIds = portfoliosSnapshot.docs.map((doc) => doc.id)

      console.log(`Found ${userIds.length} users to process`)

      let successCount = 0
      let failCount = 0

      // 각 사용자별 스냅샷 생성
      for (const userId of userIds) {
        try {
          await createSnapshotForUser(userId)
          successCount++
        } catch (error) {
          console.error(`Failed to create snapshot for user ${userId}:`, error)
          failCount++
        }
      }

      console.log(`Snapshot creation completed: ${successCount} success, ${failCount} failed`)
      return null
    } catch (error) {
      console.error('Error in createDailySnapshots:', error)
      throw error
    }
  })

/**
 * 특정 사용자의 스냅샷 생성
 */
async function createSnapshotForUser(userId: string) {
  const EXCHANGE_RATE = 1300 // USD/KRW 환율

  // 1. 포트폴리오 조회
  const stocksSnapshot = await db
    .collection('portfolios')
    .doc(userId)
    .collection('stocks')
    .get()

  if (stocksSnapshot.empty) {
    console.log(`User ${userId} has no portfolios, skipping`)
    return
  }

  const portfolios = stocksSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }))

  // 2. 총 자산 계산 (환율 적용)
  let totalValue = 0
  let totalCost = 0

  portfolios.forEach((portfolio: any) => {
    const marketValue = portfolio.currentPrice * portfolio.quantity
    const investment = portfolio.averageCost * portfolio.quantity

    // 환율 적용: US 주식은 달러 → 원화 변환
    if (portfolio.market === 'US') {
      totalValue += marketValue * EXCHANGE_RATE
      totalCost += investment * EXCHANGE_RATE
    } else {
      totalValue += marketValue
      totalCost += investment
    }
  })

  // 3. 스냅샷 데이터 생성
  const today = new Date().toISOString().split('T')[0]
  const totalProfit = totalValue - totalCost
  const profitRate = totalCost !== 0 ? (totalProfit / totalCost) * 100 : 0

  // 4. 어제 스냅샷 조회 (일일 수익 계산)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayDate = yesterday.toISOString().split('T')[0]

  let dailyProfit = 0
  try {
    const yesterdaySnapshot = await db
      .collection('portfolios')
      .doc(userId)
      .collection('snapshots')
      .doc(yesterdayDate)
      .get()

    if (yesterdaySnapshot.exists) {
      const yesterdayData = yesterdaySnapshot.data()
      dailyProfit = totalValue - (yesterdayData?.totalValue || 0)
    }
  } catch (error) {
    console.error(`Failed to get yesterday snapshot for user ${userId}:`, error)
  }

  // 5. Firestore에 저장
  const snapshotData = {
    totalValue,
    totalCost,
    totalProfit,
    profitRate,
    dailyProfit,
    monthlyProfit: totalProfit, // 간단히 총 수익으로 설정
    yearlyProfit: totalProfit,
  }

  await db
    .collection('portfolios')
    .doc(userId)
    .collection('snapshots')
    .doc(today)
    .set(snapshotData)

  console.log(`Snapshot created for user ${userId}: ${today}`)
}
