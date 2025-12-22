'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function JournalsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">투자 일지</h2>
          <p className="text-muted-foreground">
            투자 결정과 생각을 기록하세요
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          새 일지 작성
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">2024년 11월 투자 회고</CardTitle>
            <CardDescription>2024년 11월 27일</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-3">
              이번 달에는 나스닥100에 집중 투자했습니다. 기술주들의 강세가
              지속되면서 포트폴리오 수익률이 크게 상승했습니다...
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">배당주 전략 검토</CardTitle>
            <CardDescription>2024년 11월 20일</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-3">
              배당주 비중을 늘려 안정적인 수익을 확보하려고 합니다. JNJ와
              KO를 추가로 매수할 계획입니다...
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">리밸런싱 실행</CardTitle>
            <CardDescription>2024년 11월 15일</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-3">
              목표 비중에 맞추기 위해 일부 종목을 매도하고 다른 종목을
              매수했습니다. 포트폴리오 다각화를 강화했습니다...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


<<<<<<< Updated upstream
=======



>>>>>>> Stashed changes
