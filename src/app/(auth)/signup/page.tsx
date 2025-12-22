'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, Check, X } from 'lucide-react'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { signUp, signInWithGoogle } = useAuth()
  const { toast } = useToast()

  // 비밀번호 강도 체크
  const passwordStrength = {
    hasLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  }

  const passwordScore = Object.values(passwordStrength).filter(Boolean).length
  const passwordStrengthText =
    passwordScore <= 2 ? '약함' :
    passwordScore <= 3 ? '보통' :
    passwordScore <= 4 ? '강함' : '매우 강함'

  const passwordStrengthColor =
    passwordScore <= 2 ? 'text-red-400' :
    passwordScore <= 3 ? 'text-yellow-400' :
    passwordScore <= 4 ? 'text-green-400' : 'text-emerald-400'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 유효성 검사
    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: '비밀번호 불일치',
        description: '비밀번호가 일치하지 않습니다.',
      })
      return
    }

    if (password.length < 8) {
      toast({
        variant: 'destructive',
        title: '비밀번호 오류',
        description: '비밀번호는 최소 8자 이상이어야 합니다.',
      })
      return
    }

    if (passwordScore < 3) {
      toast({
        variant: 'destructive',
        title: '비밀번호 강도 부족',
        description: '더 강한 비밀번호를 사용해주세요.',
      })
      return
    }

    setIsLoading(true)

    try {
      await signUp(email, password)
      toast({
        title: '회원가입 성공! 🎉',
        description: '환영합니다. 대시보드로 이동합니다.',
      })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '회원가입 실패',
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      await signInWithGoogle()
      toast({
        title: '회원가입 성공! 🎉',
        description: '환영합니다. 대시보드로 이동합니다.',
      })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Google 로그인 실패',
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0A0E27]">
      {/* 배경 그라데이션 메시 */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-purple-500 rounded-full blur-[120px] opacity-20"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-0 -left-40 w-[500px] h-[500px] bg-cyan-500 rounded-full blur-[120px] opacity-20"
          animate={{
            scale: [1, 1.1, 1],
            x: [0, -30, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
      </div>

      {/* 그리드 오버레이 */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      {/* 컨텐츠 */}
      <div className="relative flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* 로고 */}
          <motion.div
            className="mb-8 text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link href="/" className="inline-flex flex-col items-center gap-2">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-2xl blur opacity-75" />
                <div className="relative w-full h-full bg-gradient-to-br from-cyan-400 to-purple-500 rounded-2xl flex items-center justify-center">
                  <span className="text-white font-bold text-3xl">M</span>
                </div>
              </div>
              <div>
                <div className="font-bold text-2xl text-white">MyFolio</div>
                <div className="text-sm text-white/60">Portfolio Manager</div>
              </div>
            </Link>
          </motion.div>

          {/* 카드 */}
          <motion.div
            className="relative group"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* 글로우 효과 */}
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition duration-500" />

            {/* 메인 카드 */}
            <div className="relative bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-8">
              {/* 그리드 패턴 */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] rounded-3xl" />

              <div className="relative">
                {/* 헤더 */}
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-white mb-2">계정 만들기</h1>
                  <p className="text-white/60">포트폴리오 관리를 시작하세요</p>
                </div>

                {/* 폼 */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* 이름 */}
                  <div className="space-y-2">
                    <Label htmlFor="displayName" className="text-white/80">이름 (선택)</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                      <Input
                        id="displayName"
                        type="text"
                        placeholder="홍길동"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        disabled={isLoading}
                        className="pl-11 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-cyan-400/50 focus:ring-cyan-400/20"
                      />
                    </div>
                  </div>

                  {/* 이메일 */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white/80">이메일</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        className="pl-11 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-cyan-400/50 focus:ring-cyan-400/20"
                      />
                    </div>
                  </div>

                  {/* 비밀번호 */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white/80">비밀번호</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="최소 8자 이상"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="pl-11 pr-11 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-cyan-400/50 focus:ring-cyan-400/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>

                    {/* 비밀번호 강도 표시 */}
                    {password && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-2 pt-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-white/60">비밀번호 강도</span>
                          <span className={`text-sm font-semibold ${passwordStrengthColor}`}>
                            {passwordStrengthText}
                          </span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full ${
                              passwordScore <= 2 ? 'bg-red-400' :
                              passwordScore <= 3 ? 'bg-yellow-400' :
                              passwordScore <= 4 ? 'bg-green-400' : 'bg-emerald-400'
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${(passwordScore / 5) * 100}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className={`flex items-center gap-1 ${passwordStrength.hasLength ? 'text-green-400' : 'text-white/40'}`}>
                            {passwordStrength.hasLength ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                            8자 이상
                          </div>
                          <div className={`flex items-center gap-1 ${passwordStrength.hasNumber ? 'text-green-400' : 'text-white/40'}`}>
                            {passwordStrength.hasNumber ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                            숫자 포함
                          </div>
                          <div className={`flex items-center gap-1 ${passwordStrength.hasUpper ? 'text-green-400' : 'text-white/40'}`}>
                            {passwordStrength.hasUpper ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                            대문자 포함
                          </div>
                          <div className={`flex items-center gap-1 ${passwordStrength.hasSpecial ? 'text-green-400' : 'text-white/40'}`}>
                            {passwordStrength.hasSpecial ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                            특수문자 포함
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* 비밀번호 확인 */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-white/80">비밀번호 확인</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="비밀번호를 다시 입력하세요"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="pl-11 pr-11 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-cyan-400/50 focus:ring-cyan-400/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-sm text-red-400 flex items-center gap-1">
                        <X className="w-3 h-3" />
                        비밀번호가 일치하지 않습니다
                      </p>
                    )}
                    {confirmPassword && password === confirmPassword && (
                      <p className="text-sm text-green-400 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        비밀번호가 일치합니다
                      </p>
                    )}
                  </div>

                  {/* 제출 버튼 */}
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold text-base rounded-xl transition-all hover:shadow-lg hover:shadow-cyan-500/30"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        가입 중...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        회원가입
                        <ArrowRight className="w-5 h-5" />
                      </span>
                    )}
                  </Button>
                </form>

                {/* 구분선 */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-black/40 px-4 text-white/40 uppercase tracking-wider">
                      또는
                    </span>
                  </div>
                </div>

                {/* Google 로그인 */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-xl transition-all"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google로 계속하기
                </Button>

                {/* 로그인 링크 */}
                <p className="mt-6 text-center text-sm text-white/60">
                  이미 계정이 있으신가요?{' '}
                  <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-medium transition">
                    로그인
                  </Link>
                </p>

                {/* 약관 동의 */}
                <p className="mt-4 text-center text-xs text-white/40">
                  가입하시면{' '}
                  <Link href="/terms" className="underline hover:text-white/60">이용약관</Link>
                  {' '}및{' '}
                  <Link href="/privacy" className="underline hover:text-white/60">개인정보처리방침</Link>
                  에 동의하는 것으로 간주됩니다.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
