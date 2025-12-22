'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">설정</h2>
        <p className="text-muted-foreground">
          계정 및 애플리케이션 설정을 관리하세요
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>프로필</CardTitle>
          <CardDescription>개인 정보를 수정하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">이름</Label>
            <Input id="displayName" placeholder="이름을 입력하세요" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input id="email" type="email" placeholder="email@example.com" />
          </div>
          <Button>저장</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>알림 설정</CardTitle>
          <CardDescription>알림을 관리하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>이메일 알림</Label>
              <div className="text-sm text-muted-foreground">
                중요한 업데이트를 이메일로 받습니다
              </div>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>배당 알림</Label>
              <div className="text-sm text-muted-foreground">
                배당 예정일 알림을 받습니다
              </div>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>가격 변동 알림</Label>
              <div className="text-sm text-muted-foreground">
                큰 가격 변동 시 알림을 받습니다
              </div>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>데이터 관리</CardTitle>
          <CardDescription>포트폴리오 데이터를 관리하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full">
            데이터 내보내기 (CSV)
          </Button>
          <Button variant="outline" className="w-full">
            데이터 가져오기 (CSV)
          </Button>
          <Button variant="destructive" className="w-full">
            모든 데이터 삭제
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}


<<<<<<< Updated upstream
=======



>>>>>>> Stashed changes
