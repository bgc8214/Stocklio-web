import { NextRequest, NextResponse } from 'next/server'

/**
 * 재시도 로직을 포함한 fetch 함수
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
  delay = 1000
): Promise<Response> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options)

      // Rate limit 에러인 경우 재시도
      if (response.status === 429) {
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)))
          continue
        }
      }

      return response
    } catch (error) {
      lastError = error as Error
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)))
      }
    }
  }

  throw lastError || new Error('Max retries exceeded')
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const ticker = searchParams.get('ticker')

  if (!ticker) {
    return NextResponse.json({ error: 'Ticker parameter is required' }, { status: 400 })
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`

    const response = await fetchWithRetry(
      url,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
        next: { revalidate: 60 }, // 1분 캐싱
      },
      3, // 최대 3번 재시도
      1000 // 1초 지연
    )

    // Rate limit 에러 처리
    if (response.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    if (!response.ok) {
      // 404: 티커를 찾을 수 없음
      if (response.status === 404) {
        return NextResponse.json(
          { error: `Stock ticker "${ticker}" not found` },
          { status: 404 }
        )
      }

      throw new Error(`Failed to fetch stock price for ${ticker}`)
    }

    const data = await response.json()

    if (!data.chart?.result?.[0]) {
      return NextResponse.json(
        { error: `No data found for ticker: ${ticker}` },
        { status: 404 }
      )
    }

    const result = data.chart.result[0]
    const meta = result.meta

    const currentPrice = meta.regularMarketPrice || meta.previousClose || 0
    const previousClose = meta.previousClose || currentPrice
    const change = currentPrice - previousClose
    const changePercent = previousClose !== 0
      ? (change / previousClose) * 100
      : 0

    return NextResponse.json({
      ticker: meta.symbol || ticker,
      currentPrice,
      previousClose,
      change,
      changePercent,
      currency: meta.currency || 'USD',
    })
  } catch (error) {
    console.error(`Error fetching stock price for ${ticker}:`, error)

    // 네트워크 에러 처리
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { error: 'Network error. Please check your connection.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch stock price' },
      { status: 500 }
    )
  }
}


