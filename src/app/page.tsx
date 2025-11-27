import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, PieChart, Target } from 'lucide-react'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* 헤더 */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600" />
            <span className="text-xl font-bold">MyFolio</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost">로그인</Button>
            </Link>
            <Link href="/signup">
              <Button>회원가입</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 히어로 섹션 */}
      <section className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="container mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold tracking-tight">
              3개 카테고리로 간단하게
              <br />
              포트폴리오를 관리하세요
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              나스닥100, S&P 500, 배당주로 분류하여 목표를 설정하고
              <br />
              수익 추이를 한눈에 확인하세요
            </p>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Link href="/dashboard">
              <Button size="lg" className="text-lg px-8">
                대시보드 바로가기
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="lg" variant="outline" className="text-lg px-8">
                회원가입
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8">
                로그인
              </Button>
            </Link>
          </div>

          {/* 기능 카드 */}
          <div className="grid md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-6 text-center space-y-2">
                <TrendingUp className="h-12 w-12 mx-auto text-primary" />
                <h3 className="font-semibold text-lg">수익 추이</h3>
                <p className="text-sm text-muted-foreground">
                  일별, 월별, 연간 수익을 차트로 확인하세요
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center space-y-2">
                <PieChart className="h-12 w-12 mx-auto text-primary" />
                <h3 className="font-semibold text-lg">자산 배분</h3>
                <p className="text-sm text-muted-foreground">
                  카테고리별 자산 비중을 시각화하세요
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center space-y-2">
                <Target className="h-12 w-12 mx-auto text-primary" />
                <h3 className="font-semibold text-lg">목표 설정</h3>
                <p className="text-sm text-muted-foreground">
                  카테고리별 목표 금액을 설정하고 진행률을 추적하세요
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  )
}
