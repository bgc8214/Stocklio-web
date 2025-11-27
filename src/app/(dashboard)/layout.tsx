'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layouts/sidebar'
import { Header } from '@/components/layouts/header'
import { useAuth } from '@/lib/hooks/use-auth'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // 개발 모드: Firebase 설정이 없거나 사용자가 없어도 접근 허용
    // 프로덕션에서는 이 부분을 활성화하여 인증 필요하도록 설정
    // if (!loading && !user && isFirebaseConfigured) {
    //   router.push('/login')
    // }
  }, [user, loading, router])

  // 개발 모드: 로딩 중이거나 사용자가 없어도 레이아웃 표시
  // if (loading) {
  //   return (
  //     <div className="flex h-screen items-center justify-center">
  //       <div className="text-center">
  //         <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
  //         <p className="text-muted-foreground">로딩 중...</p>
  //       </div>
  //     </div>
  //   )
  // }

  // 개발 모드: 사용자가 없어도 접근 허용
  // if (!user && isFirebaseConfigured) {
  //   return null
  // }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 사이드바 (데스크톱) */}
      <aside className="hidden lg:block">
        <Sidebar />
      </aside>

      {/* 메인 콘텐츠 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-background p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

