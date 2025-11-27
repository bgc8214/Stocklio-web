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

      // Rate limit 에러 처리
      if (response.status === 429) {
        throw new Error('API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.')
      }

      // 종목을 찾을 수 없음
      if (response.status === 404) {
        throw new Error(`종목 코드 "${ticker}"를 찾을 수 없습니다.`)
      }

      // 네트워크 에러
      if (response.status === 503) {
        throw new Error('네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.')
      }

      throw new Error(error.error || `${ticker}의 주가 조회에 실패했습니다.`)
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
  currency?: string
}>> {
  try {
    const response = await fetch(`/api/stocks/search?q=${encodeURIComponent(query)}`)

    // Rate limit 에러 처리
    if (response.status === 429) {
      throw new Error('API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.')
    }

    // 네트워크 에러
    if (response.status === 503) {
      throw new Error('네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.')
    }

    if (!response.ok) {
      throw new Error('종목 검색에 실패했습니다.')
    }

    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Error searching stocks:', error)
    throw error
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

