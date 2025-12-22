'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

export default function FirePage() {
  const [currentAge, setCurrentAge] = useState(30)
  const [retirementAge, setRetirementAge] = useState(55)
  const [currentSavings, setCurrentSavings] = useState(50000000)
  const [monthlyContribution, setMonthlyContribution] = useState(2000000)
  const [expectedReturn, setExpectedReturn] = useState(7)

  const yearsToRetirement = retirementAge - currentAge
  const monthlyReturn = expectedReturn / 100 / 12
  const totalMonths = yearsToRetirement * 12

  // FV = PV * (1 + r)^n + PMT * (((1 + r)^n - 1) / r)
  const futureValue =
    currentSavings * Math.pow(1 + monthlyReturn, totalMonths) +
    monthlyContribution *
      ((Math.pow(1 + monthlyReturn, totalMonths) - 1) / monthlyReturn)

  const fireNumber = futureValue * 0.04 // 4% rule
  const monthlyFireIncome = fireNumber * 0.04 / 12

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">FIRE 계산기</h2>
        <p className="text-muted-foreground">
          Financial Independence, Retire Early 목표를 계산하세요
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>현재 상황</CardTitle>
            <CardDescription>현재 나이와 저축액을 입력하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentAge">현재 나이</Label>
              <Input
                id="currentAge"
                type="number"
                value={currentAge}
                onChange={(e) => setCurrentAge(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="retirementAge">은퇴 목표 나이</Label>
              <Input
                id="retirementAge"
                type="number"
                value={retirementAge}
                onChange={(e) => setRetirementAge(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentSavings">현재 저축액</Label>
              <Input
                id="currentSavings"
                type="number"
                value={currentSavings}
                onChange={(e) => setCurrentSavings(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthlyContribution">월 저축액</Label>
              <Input
                id="monthlyContribution"
                type="number"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expectedReturn">예상 수익률 (%)</Label>
              <Input
                id="expectedReturn"
                type="number"
                value={expectedReturn}
                onChange={(e) => setExpectedReturn(Number(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>FIRE 목표</CardTitle>
            <CardDescription>계산 결과</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                은퇴까지 남은 기간
              </div>
              <div className="text-3xl font-bold">{yearsToRetirement}년</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                예상 은퇴 시 자산
              </div>
              <div className="text-3xl font-bold">
                {formatCurrency(futureValue)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                FIRE 목표 금액 (4% 규칙)
              </div>
              <div className="text-3xl font-bold text-primary">
                {formatCurrency(fireNumber)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                월 예상 수입
              </div>
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(monthlyFireIncome)}
              </div>
            </div>
            <div className="pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                * 4% 규칙: 은퇴 시 자산의 4%를 매년 인출하면 원금이 유지됩니다.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


<<<<<<< Updated upstream
=======



>>>>>>> Stashed changes
