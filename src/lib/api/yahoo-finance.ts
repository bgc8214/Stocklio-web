/**
 * Yahoo Finance API 래퍼
 * 주식 가격 조회를 위한 유틸리티 함수
 */

export interface StockPrice {
  ticker: string
  currentPrice: number
  previousClose: number
  change: number
  changePercent: number
  currency?: string
}

/**
 * 주식 현재가 조회 (Next.js API Route를 통해 프록시)
 * @param ticker 주식 티커 (예: AAPL, MSFT, TSLA)
 * @returns 주식 가격 정보
 */
export async function getStockPrice(ticker: string): Promise<StockPrice> {
  try {
    const response = await fetch(`/api/stocks/price?ticker=${encodeURIComponent(ticker)}`)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch stock price' }))
      throw new Error(error.error || `Failed to fetch stock price for ${ticker}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error(`Error fetching stock price for ${ticker}:`, error)
    throw error
  }
}

/**
 * 여러 주식의 가격을 한 번에 조회
 * @param tickers 주식 티커 배열
 * @returns 주식 가격 정보 배열
 */
export async function getStockPrices(
  tickers: string[]
): Promise<StockPrice[]> {
  const promises = tickers.map((ticker) =>
    getStockPrice(ticker).catch((error) => {
      console.error(`Failed to fetch ${ticker}:`, error)
      return null
    })
  )

  const results = await Promise.all(promises)
  return results.filter((price): price is StockPrice => price !== null)
}

/**
 * 주식 검색 (Next.js API Route를 통해 프록시)
 * @param query 검색어
 * @returns 검색 결과 배열
 */
export async function searchStocks(query: string): Promise<Array<{
  symbol: string
  name: string
  exchange: string
}>> {
  try {
    const response = await fetch(`/api/stocks/search?q=${encodeURIComponent(query)}`)

    if (!response.ok) {
      throw new Error('Failed to search stocks')
    }

    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Error searching stocks:', error)
    return []
  }
}

/**
 * USD/KRW 환율 조회
 * @returns 환율 (USD 1달러당 원화)
 */
export async function getExchangeRate(): Promise<number> {
  try {
    const url = 'https://query1.finance.yahoo.com/v8/finance/chart/KRW=X?interval=1d&range=1d'
    
    const response = await fetch(url, {
      next: { revalidate: 3600 }, // 1시간 캐싱
    })

    if (!response.ok) {
      throw new Error('Failed to fetch exchange rate')
    }

    const data = await response.json()
    const result = data.chart.result[0]
    const meta = result.meta

    return meta.regularMarketPrice || 1300 // 기본값 1300원
  } catch (error) {
    console.error('Error fetching exchange rate:', error)
    return 1300 // 기본값 반환
  }
}

