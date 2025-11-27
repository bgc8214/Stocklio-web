export interface User {
  uid: string
  email: string
  displayName?: string
  photoURL?: string
  createdAt: Date
  lastLoginAt: Date
}

export interface UserSettings {
  userId: string
  exchangeRate: number // USD/KRW 환율 (예: 1300)
  defaultCurrency: 'KRW' | 'USD' // 기본 표시 통화
  updatedAt: Date
}
