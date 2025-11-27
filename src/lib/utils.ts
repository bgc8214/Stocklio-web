import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 통화 포맷팅 (시장 구분)
 * @param value - 금액
 * @param market - 'KRX' (원화) 또는 'US' (달러)
 */
export function formatCurrency(value: number, market: 'KRX' | 'US' = 'KRX'): string {
  if (market === 'US') {
    // 미국 주식: 달러 표시
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  // 한국 주식: 원화 표시
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

/**
 * 달러를 원화로 변환
 * @param usdAmount - 달러 금액
 * @param exchangeRate - 환율 (USD/KRW)
 */
export function convertUsdToKrw(usdAmount: number, exchangeRate: number): number {
  return usdAmount * exchangeRate
}

/**
 * 원화를 달러로 변환
 * @param krwAmount - 원화 금액
 * @param exchangeRate - 환율 (USD/KRW)
 */
export function convertKrwToUsd(krwAmount: number, exchangeRate: number): number {
  return krwAmount / exchangeRate
}

/**
 * 시장 구분에 따라 원화로 통일된 금액 반환
 * @param value - 금액
 * @param market - 'KRX' 또는 'US'
 * @param exchangeRate - 환율 (USD/KRW), 기본값 1300
 */
export function toKrw(value: number, market: 'KRX' | 'US', exchangeRate: number = 1300): number {
  return market === 'US' ? convertUsdToKrw(value, exchangeRate) : value
}
