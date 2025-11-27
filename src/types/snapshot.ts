export interface Snapshot {
  id: string
  userId: string
  date: Date
  totalValue: number
  totalCost: number
  totalProfit: number
  profitRate: number
  dailyProfit: number
  createdAt: Date
}

export interface SnapshotData {
  date: string
  totalValue: number
  dailyProfit: number
  monthlyProfit: number
  yearlyProfit: number
}
