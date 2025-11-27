export interface StockPrice {
  ticker: string
  currentPrice: number
  previousClose: number
  change: number
  changePercent: number
}

export interface StockSearchResult {
  ticker: string
  name: string
  exchange: string
  market: 'KRX' | 'US'
}
