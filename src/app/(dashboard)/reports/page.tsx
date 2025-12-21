'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">월간 리포트</h2>
        <p className="text-muted-foreground">
          월별 포트폴리오 성과를 확인하세요
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>2024년 11월 리포트</CardTitle>
          <CardDescription>이번 달 포트폴리오 성과 요약</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">월초 자산</div>
                <div className="text-2xl font-bold">{formatCurrency(50000000)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">월말 자산</div>
                <div className="text-2xl font-bold">{formatCurrency(52345678)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">월간 수익</div>
                <div className="text-2xl font-bold text-profit">
                  +{formatCurrency(2345678)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">수익률</div>
                <div className="text-2xl font-bold text-profit">+4.69%</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>카테고리별 성과</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 rounded-lg bg-muted/50">
              <div>
                <div className="font-medium">📈 나스닥100</div>
                <div className="text-sm text-muted-foreground">5개 종목</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-profit">+12.5%</div>
                <div className="text-sm text-muted-foreground">
                  {formatCurrency(26172839)}
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center p-4 rounded-lg bg-muted/50">
              <div>
                <div className="font-medium">📊 S&P 500</div>
                <div className="text-sm text-muted-foreground">3개 종목</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-profit">+8.2%</div>
                <div className="text-sm text-muted-foreground">
                  {formatCurrency(15703703)}
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center p-4 rounded-lg bg-muted/50">
              <div>
                <div className="font-medium">💰 배당주</div>
                <div className="text-sm text-muted-foreground">2개 종목</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-profit">+3.1%</div>
                <div className="text-sm text-muted-foreground">
                  {formatCurrency(10469136)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}




