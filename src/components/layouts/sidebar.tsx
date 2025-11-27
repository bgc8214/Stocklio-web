'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Wallet,
  PieChart,
  BarChart3,
  Calendar,
  TrendingUp,
  BookOpen,
  Settings,
  LogOut,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/hooks/use-auth'

const navigation = [
  { name: '대시보드', href: '/dashboard', icon: LayoutDashboard },
  { name: '포트폴리오', href: '/portfolio', icon: Wallet },
  { name: '카테고리', href: '/categories', icon: PieChart },
  { name: '수익 추이 분석', href: '/analytics', icon: BarChart3 },
  { name: '리밸런싱', href: '/rebalancing', icon: BarChart3 },
  { name: '월간 리포트', href: '/reports', icon: Calendar },
  { name: '배당 캘린더', href: '/dividends', icon: TrendingUp },
  { name: 'FIRE 계산기', href: '/fire', icon: TrendingUp },
  { name: '투자 일지', href: '/journals', icon: BookOpen },
  { name: '설정', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { signOut, isFirebaseConfigured } = useAuth()

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      {/* 로고 */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600" />
          <span className="text-xl font-bold">MyFolio</span>
        </Link>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* 로그아웃 - Firebase 설정이 있을 때만 표시 */}
      {isFirebaseConfigured && (
        <div className="border-t p-4">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={signOut}
          >
            <LogOut className="mr-3 h-5 w-5" />
            로그아웃
          </Button>
        </div>
      )}
    </div>
  )
}

