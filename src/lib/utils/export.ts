import { PortfolioWithProfit } from '@/types/portfolio'
import { formatCurrency } from '@/lib/utils'

interface PortfolioWithCategory extends PortfolioWithProfit {
  categoryName: string
}

export function exportToCSV(portfolios: PortfolioWithCategory[], filename: string = 'portfolio.csv') {
  // CSV 헤더
  const headers = [
    '카테고리',
    '티커',
    '종목명',
    '시장',
    '수량',
    '평단가',
    '현재가',
    '평가액',
    '투자금액',
    '수익금',
    '수익률(%)',
  ]

  // CSV 데이터
  const rows = portfolios.map((p) => [
    p.categoryName,
    p.ticker,
    p.name,
    p.market,
    p.quantity.toString(),
    p.averageCost.toString(),
    p.currentPrice.toString(),
    p.marketValue.toString(),
    p.investment.toString(),
    p.profit.toString(),
    p.profitRate.toFixed(2),
  ])

  // CSV 문자열 생성
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => {
        // 쉼표나 따옴표가 있으면 큰따옴표로 감싸기
        if (cell.includes(',') || cell.includes('"')) {
          return `"${cell.replace(/"/g, '""')}"`
        }
        return cell
      }).join(',')
    ),
  ].join('\n')

  // BOM 추가 (Excel에서 한글 깨짐 방지)
  const bom = '\uFEFF'
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' })

  // 다운로드
  const link = document.createElement('a')
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

export function exportToText(portfolios: PortfolioWithCategory[], filename: string = 'portfolio.txt') {
  const lines = [
    '포트폴리오 내역',
    '='.repeat(80),
    '',
    ...portfolios.map((p, index) => {
      return [
        `${index + 1}. ${p.name} (${p.ticker})`,
        `   카테고리: ${p.categoryName}`,
        `   시장: ${p.market}`,
        `   수량: ${p.quantity}`,
        `   평단가: ${formatCurrency(p.averageCost, p.market)}`,
        `   현재가: ${formatCurrency(p.currentPrice, p.market)}`,
        `   평가액: ${formatCurrency(p.marketValue)}`,
        `   수익금: ${formatCurrency(p.profit)} (${p.profitRate >= 0 ? '+' : ''}${p.profitRate.toFixed(2)}%)`,
        '',
      ].join('\n')
    }),
    '='.repeat(80),
    `총 ${portfolios.length}개 종목`,
  ].join('\n')

  const blob = new Blob([lines], { type: 'text/plain;charset=utf-8;' })
  const link = document.createElement('a')
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}
