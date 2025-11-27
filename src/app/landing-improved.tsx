'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowRight, TrendingUp, Activity, Shield } from 'lucide-react'

export default function LandingImproved() {
  return (
    <main className="relative min-h-screen bg-[#0A0E27] overflow-hidden">
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
        <motion.div
          className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-pink-500 rounded-full blur-[120px] opacity-10"
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      {/* 그리드 오버레이 */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      {/* 노이즈 텍스처 */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none mix-blend-overlay">
        <svg className="w-full h-full">
          <filter id="noiseFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)" />
        </svg>
      </div>

      {/* 헤더 */}
      <header className="relative border-b border-white/5 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <div className="flex h-20 items-center justify-between">
            {/* 로고 */}
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-xl blur opacity-75" />
                <div className="relative w-full h-full bg-gradient-to-br from-cyan-400 to-purple-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">M</span>
                </div>
              </div>
              <div>
                <div className="font-bold text-xl text-white">MyFolio</div>
                <div className="text-xs font-mono text-white/40">Portfolio Manager</div>
              </div>
            </motion.div>

            {/* 네비게이션 */}
            <motion.div
              className="flex items-center gap-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Link href="/login">
                <button className="px-6 py-2.5 text-white/80 font-medium hover:text-white transition-colors">
                  로그인
                </button>
              </Link>
              <Link href="/signup">
                <button className="group relative px-6 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-xl overflow-hidden transition-all hover:shadow-lg hover:shadow-cyan-500/20">
                  <span className="relative z-10">무료로 시작하기</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-purple-400/20 translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
                </button>
              </Link>
            </motion.div>
          </div>
        </div>
      </header>

      {/* 히어로 섹션 */}
      <section className="relative container mx-auto px-6 py-24 lg:py-32">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* 왼쪽: 텍스트 */}
            <div>
              {/* 라벨 */}
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm font-mono text-white/70">REAL-TIME PORTFOLIO TRACKING</span>
              </motion.div>

              {/* 메인 헤드라인 */}
              <div className="mb-8 space-y-2">
                <motion.h1
                  className="font-bold text-6xl lg:text-7xl text-white leading-[1.1]"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  투자의
                </motion.h1>
                <motion.h1
                  className="font-bold text-6xl lg:text-7xl bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent leading-[1.1]"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                >
                  모든 순간을
                </motion.h1>
                <motion.h1
                  className="font-bold text-6xl lg:text-7xl text-white leading-[1.1]"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.6 }}
                >
                  한눈에
                </motion.h1>
              </div>

              {/* 서브 헤드라인 */}
              <motion.p
                className="text-xl text-white/60 mb-10 max-w-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.6 }}
              >
                나스닥100 · S&P 500 · 배당주
                <br />
                <span className="text-white/40">3개 카테고리로 관리하는 스마트 포트폴리오</span>
              </motion.p>

              {/* CTA 버튼 */}
              <motion.div
                className="flex flex-wrap gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1, duration: 0.6 }}
              >
                <Link href="/dashboard">
                  <button className="group relative px-8 py-4 bg-white text-black font-semibold rounded-xl overflow-hidden transition-all hover:shadow-2xl hover:shadow-cyan-500/30">
                    <span className="relative z-10 flex items-center gap-2">
                      대시보드 시작하기
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  </button>
                </Link>

                <button className="px-8 py-4 border border-white/20 text-white font-semibold rounded-xl backdrop-blur-sm hover:bg-white/5 transition-all">
                  데모 보기
                </button>
              </motion.div>

              {/* 통계 */}
              <motion.div
                className="flex items-center gap-8 mt-12 pt-8 border-t border-white/10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.3, duration: 0.6 }}
              >
                <div>
                  <div className="text-3xl font-bold text-white font-mono">1,234+</div>
                  <div className="text-sm text-white/50">활성 사용자</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white font-mono">₩52B+</div>
                  <div className="text-sm text-white/50">관리 자산</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white font-mono">99.9%</div>
                  <div className="text-sm text-white/50">가동 시간</div>
                </div>
              </motion.div>
            </div>

            {/* 오른쪽: 플로팅 카드 */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              {/* 메인 자산 카드 */}
              <div className="relative group">
                {/* 글로우 효과 */}
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition duration-500" />

                {/* 카드 본체 */}
                <div className="relative bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-8">
                  {/* 그리드 패턴 */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] rounded-3xl" />

                  <div className="relative">
                    {/* 헤더 */}
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-xs font-mono text-white/50 uppercase tracking-wider">
                        Total Assets
                      </span>
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-400/10 border border-green-400/20">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-xs font-mono text-green-400">Live</span>
                      </div>
                    </div>

                    {/* 메인 금액 */}
                    <div className="font-mono text-5xl lg:text-6xl font-bold text-white mb-8 tracking-tight">
                      ₩152,345,678
                    </div>

                    {/* 수익 정보 */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-400/10 border border-green-400/20">
                          <TrendingUp className="w-4 h-4 text-green-400" />
                          <span className="font-mono font-semibold text-green-400 text-lg">+12.34%</span>
                        </div>
                        <span className="font-mono text-xl text-green-400">+₩13,456,789</span>
                      </div>

                      <div className="flex items-center justify-between text-sm font-mono pt-4 border-t border-white/10">
                        <span className="text-white/40">Today</span>
                        <span className="text-green-400 font-semibold">+₩234,567 (+0.15%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 서브 카드들 */}
              <div className="grid grid-cols-3 gap-4 mt-6">
                {[
                  { label: 'NASDAQ 100', value: '₩52M', change: '+8.2%', color: 'from-blue-500 to-cyan-500' },
                  { label: 'S&P 500', value: '₩68M', change: '+11.5%', color: 'from-purple-500 to-pink-500' },
                  { label: 'DIVIDEND', value: '₩32M', change: '+15.3%', color: 'from-green-500 to-emerald-500' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    className="relative group/card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.3 + i * 0.1, duration: 0.5 }}
                  >
                    <div className={`absolute -inset-0.5 bg-gradient-to-br ${item.color} rounded-xl blur opacity-0 group-hover/card:opacity-50 transition`} />
                    <div className="relative bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                      <div className="text-xs font-mono text-white/40 mb-2">{item.label}</div>
                      <div className="font-mono text-lg font-bold text-white mb-1">{item.value}</div>
                      <div className="text-xs font-mono text-green-400">{item.change}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 기능 섹션 */}
      <section className="relative container mx-auto px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              투자를 더 <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">스마트</span>하게
            </h2>
            <p className="text-xl text-white/60">
              포트폴리오 관리에 필요한 모든 기능
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: TrendingUp,
                title: '실시간 수익 추이',
                description: '일별, 월별, 연간 수익을 한눈에 확인하고 투자 성과를 분석하세요',
                gradient: 'from-cyan-500 to-blue-500'
              },
              {
                icon: Activity,
                title: '스마트 리밸런싱',
                description: '목표 비중 대비 현재 비중을 분석하고 최적의 매매 타이밍을 제안합니다',
                gradient: 'from-purple-500 to-pink-500'
              },
              {
                icon: Shield,
                title: '안전한 데이터 관리',
                description: 'Firebase 기반 보안 시스템으로 투자 데이터를 안전하게 보호합니다',
                gradient: 'from-green-500 to-emerald-500'
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                className="group relative"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
              >
                <div className={`absolute -inset-0.5 bg-gradient-to-r ${feature.gradient} rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-500`} />
                <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 h-full">
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} mb-6`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-white/60 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="relative container mx-auto px-6 py-24">
        <motion.div
          className="relative max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-3xl blur-2xl opacity-30" />
          <div className="relative bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-12 text-center">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              지금 바로 시작하세요
            </h2>
            <p className="text-xl text-white/60 mb-8 max-w-2xl mx-auto">
              무료로 계정을 만들고 스마트한 포트폴리오 관리를 경험해보세요
            </p>
            <Link href="/signup">
              <button className="group relative px-10 py-5 bg-white text-black font-bold text-lg rounded-xl overflow-hidden transition-all hover:shadow-2xl hover:shadow-cyan-500/30">
                <span className="relative z-10 flex items-center gap-2">
                  무료로 시작하기
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </button>
            </Link>
          </div>
        </motion.div>
      </section>
    </main>
  )
}
