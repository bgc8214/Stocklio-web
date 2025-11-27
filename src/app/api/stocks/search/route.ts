import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
  }

  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    })

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
      }))
      .slice(0, 10) // 최대 10개 결과만 반환

    return NextResponse.json(results)
  } catch (error) {
    console.error('Error searching stocks:', error)
    return NextResponse.json(
      { error: 'Failed to search stocks' },
      { status: 500 }
    )
  }
}


