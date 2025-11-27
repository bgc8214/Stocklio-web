/**
 * 통화 포맷팅 사용 예시
 *
 * 이 파일은 formatCurrency와 환율 변환 함수의 사용 예시를 보여줍니다.
 */

import { formatCurrency, toKrw, convertUsdToKrw } from '@/lib/utils'
import type { Portfolio, PortfolioWithProfit } from '@/types/portfolio'

// ============================================
// 예시 1: 개별 종목 표시
// ============================================

function StockRow({ portfolio }: { portfolio: Portfolio }) {
  const marketValue = portfolio.quantity * portfolio.currentPrice
  const investment = portfolio.quantity * portfolio.averageCost
  const profit = marketValue - investment
  const profitRate = (profit / investment) * 100

  return (
    <tr>
      <td>{portfolio.ticker}</td>
      <td>{portfolio.name}</td>
      <td>{portfolio.quantity}</td>
      {/* 시장에 따라 통화 표시 */}
      <td>{formatCurrency(portfolio.averageCost, portfolio.market)}</td>
      <td>{formatCurrency(portfolio.currentPrice, portfolio.market)}</td>
      <td>{formatCurrency(marketValue, portfolio.market)}</td>
      <td className={profit >= 0 ? 'text-green-600' : 'text-red-600'}>
        {formatCurrency(profit, portfolio.market)} ({profitRate.toFixed(2)}%)
      </td>
    </tr>
  )
}

// ============================================
// 예시 2: 총 자산 계산 (환율 적용)
// ============================================

function calculateTotalAssets(
  portfolios: Portfolio[],
  exchangeRate: number = 1300
): {
  totalValue: number      // 총 평가액 (원화)
  totalInvestment: number // 총 투자금 (원화)
  totalProfit: number     // 총 수익 (원화)
  totalProfitRate: number // 총 수익률 (%)
} {
  let totalValue = 0
  let totalInvestment = 0

  portfolios.forEach(portfolio => {
    const marketValue = portfolio.quantity * portfolio.currentPrice
    const investment = portfolio.quantity * portfolio.averageCost

    // 시장에 따라 원화로 변환하여 합산
    totalValue += toKrw(marketValue, portfolio.market, exchangeRate)
    totalInvestment += toKrw(investment, portfolio.market, exchangeRate)
  })

  const totalProfit = totalValue - totalInvestment
  const totalProfitRate = totalInvestment > 0
    ? (totalProfit / totalInvestment) * 100
    : 0

  return {
    totalValue,
    totalInvestment,
    totalProfit,
    totalProfitRate
  }
}

// ============================================
// 예시 3: 대시보드 총 자산 카드
// ============================================

function HeroAssetCard({ portfolios }: { portfolios: Portfolio[] }) {
  const exchangeRate = 1300 // 실제로는 useState나 API에서 가져옴
  const { totalValue, totalProfit, totalProfitRate } =
    calculateTotalAssets(portfolios, exchangeRate)

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-sm text-gray-600">총 자산</h2>
      {/* 총 자산은 항상 원화로 표시 */}
      <p className="text-3xl font-bold">{formatCurrency(totalValue, 'KRX')}</p>
      <p className={totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
        {formatCurrency(totalProfit, 'KRX')} ({totalProfitRate.toFixed(2)}%)
      </p>
    </div>
  )
}

// ============================================
// 예시 4: 카테고리별 자산 분배
// ============================================

function CategoryAssets({
  portfolios,
  categoryId
}: {
  portfolios: Portfolio[]
  categoryId: number
}) {
  const exchangeRate = 1300

  // 해당 카테고리 종목만 필터링
  const categoryPortfolios = portfolios.filter(p => p.categoryId === categoryId)

  // 카테고리별 총액 계산 (원화 통일)
  const categoryTotal = categoryPortfolios.reduce((total, portfolio) => {
    const marketValue = portfolio.quantity * portfolio.currentPrice
    return total + toKrw(marketValue, portfolio.market, exchangeRate)
  }, 0)

  return (
    <div>
      <h3>카테고리 총액</h3>
      {/* 카테고리 총액도 원화로 표시 */}
      <p>{formatCurrency(categoryTotal, 'KRX')}</p>

      <table>
        <thead>
          <tr>
            <th>종목</th>
            <th>평가액</th>
            <th>원화 환산</th>
          </tr>
        </thead>
        <tbody>
          {categoryPortfolios.map(portfolio => {
            const marketValue = portfolio.quantity * portfolio.currentPrice
            const marketValueInKrw = toKrw(marketValue, portfolio.market, exchangeRate)

            return (
              <tr key={portfolio.id}>
                <td>{portfolio.name}</td>
                {/* 원래 통화 표시 */}
                <td>{formatCurrency(marketValue, portfolio.market)}</td>
                {/* 원화 환산 표시 */}
                <td>{formatCurrency(marketValueInKrw, 'KRX')}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ============================================
// 예시 5: 환율 설정 컴포넌트
// ============================================

function ExchangeRateSetting({
  currentRate,
  onRateChange
}: {
  currentRate: number
  onRateChange: (rate: number) => void
}) {
  const sampleUsdAmount = 1000
  const krwAmount = convertUsdToKrw(sampleUsdAmount, currentRate)

  return (
    <div className="p-4 border rounded">
      <h3 className="font-semibold mb-2">환율 설정</h3>
      <div className="space-y-2">
        <label className="block">
          <span className="text-sm text-gray-600">USD/KRW 환율</span>
          <input
            type="number"
            value={currentRate}
            onChange={(e) => onRateChange(Number(e.target.value))}
            className="mt-1 block w-full rounded border px-3 py-2"
          />
        </label>
        <p className="text-sm text-gray-500">
          예시: ${sampleUsdAmount.toLocaleString()} = {formatCurrency(krwAmount, 'KRX')}
        </p>
      </div>
    </div>
  )
}

// ============================================
// 샘플 데이터
// ============================================

const samplePortfolios: Portfolio[] = [
  {
    id: '1',
    ticker: 'AAPL',
    name: 'Apple Inc.',
    quantity: 10,
    averageCost: 150.00,  // $150.00
    currentPrice: 175.50, // $175.50
    market: 'US',
    categoryId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    ticker: '005930',
    name: '삼성전자',
    quantity: 20,
    averageCost: 70000,   // ₩70,000
    currentPrice: 75000,  // ₩75,000
    market: 'KRX',
    categoryId: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    quantity: 5,
    averageCost: 350.00,  // $350.00
    currentPrice: 380.25, // $380.25
    market: 'US',
    categoryId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

/**
 * 사용 예시:
 *
 * const portfolios = [...]; // Firestore에서 가져온 데이터
 * const exchangeRate = 1300; // 현재 환율
 *
 * // 1. 개별 종목 표시
 * <StockRow portfolio={portfolios[0]} />
 *
 * // 2. 총 자산 계산
 * const assets = calculateTotalAssets(portfolios, exchangeRate);
 * console.log(formatCurrency(assets.totalValue, 'KRW')); // ₩123,456,789
 *
 * // 3. 대시보드 카드
 * <HeroAssetCard portfolios={portfolios} />
 *
 * // 4. 카테고리별 자산
 * <CategoryAssets portfolios={portfolios} categoryId={1} />
 */

export {
  StockRow,
  calculateTotalAssets,
  HeroAssetCard,
  CategoryAssets,
  ExchangeRateSetting,
  samplePortfolios,
}
