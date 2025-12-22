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
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
  }

  // 빈 검색어 처리
  if (query.trim().length === 0) {
    return NextResponse.json([])
  }

  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}`

    const response = await fetchWithRetry(
      url,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
        next: { revalidate: 300 }, // 5분 캐싱
      },
      3,
      1000
    )

    // Rate limit 에러 처리
    if (response.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    if (!response.ok) {
      throw new Error('Failed to search stocks')
    }

    const data = await response.json()

    if (!data.quotes) {
      return NextResponse.json([])
    }

    const results = data.quotes
      .filter((quote: any) => quote.quoteType === 'EQUITY')
      .map((quote: any) => ({
        symbol: quote.symbol,
        name: quote.longname || quote.shortname || quote.symbol,
        exchange: quote.exchange || '',
        currency: quote.currency || 'USD',
      }))
      .slice(0, 10) // 최대 10개 결과만 반환

    return NextResponse.json(results)
  } catch (error) {
    console.error('Error searching stocks:', error)

    // 네트워크 에러 처리
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { error: 'Network error. Please check your connection.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to search stocks' },
      { status: 500 }
    )
  }
}


<<<<<<< Updated upstream
=======



>>>>>>> Stashed changes
