'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

export default function DividendsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">배당 캘린더</h2>
        <p className="text-muted-foreground">
          예정된 배당금 일정을 확인하세요
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>다가오는 배당</CardTitle>
          <CardDescription>향후 3개월 내 예정된 배당</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 rounded-lg border">
              <div>
                <div className="font-medium">JNJ - Johnson & Johnson</div>
                <div className="text-sm text-muted-foreground">
                  2024년 12월 10일
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold">{formatCurrency(150000)}</div>
                <div className="text-sm text-muted-foreground">배당률 2.8%</div>
              </div>
            </div>
            <div className="flex justify-between items-center p-4 rounded-lg border">
              <div>
                <div className="font-medium">KO - The Coca-Cola Company</div>
                <div className="text-sm text-muted-foreground">
                  2025년 1월 15일
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold">{formatCurrency(80000)}</div>
                <div className="text-sm text-muted-foreground">배당률 3.2%</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>연간 배당 예상</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">연간 예상 배당금</span>
              <span className="font-bold text-lg">{formatCurrency(460000)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">배당 수익률</span>
              <span className="font-bold text-lg">2.9%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


<<<<<<< Updated upstream
=======



>>>>>>> Stashed changes
