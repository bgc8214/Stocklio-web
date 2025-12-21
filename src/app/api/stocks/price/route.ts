import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const ticker = searchParams.get('ticker')

  if (!ticker) {
    return NextResponse.json({ error: 'Ticker parameter is required' }, { status: 400 })
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
      next: { revalidate: 60 }, // 1분 캐싱
    })

    if (!response.ok) {
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
    return NextResponse.json(
      { error: 'Failed to fetch stock price' },
      { status: 500 }
    )
  }
}




