'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Activity, Zap } from 'lucide-react'
import { formatCurrency, formatPercent } from '@/lib/utils'

interface HeroAssetCardImprovedProps {
  totalAsset: number
  totalProfit: number
  profitRate: number
  todayProfit: number
  todayProfitRate: number
  market?: 'KRX' | 'US'
}

export function HeroAssetCardImproved({
  totalAsset,
  totalProfit,
  profitRate,
  todayProfit,
  todayProfitRate,
  market = 'KRX',
}: HeroAssetCardImprovedProps) {
  const isProfit = profitRate >= 0
  const isTodayProfit = todayProfitRate >= 0

  return (
    <motion.div
      className="relative group"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* 배경 글로우 효과 */}
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-all duration-500" />

      {/* 메인 카드 */}
      <div className="relative bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 overflow-hidden">
        {/* 그리드 패턴 오버레이 */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px]" />

        {/* 애니메이션 그라데이션 블롭 */}
        <motion.div
          className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-cyan-400/20 to-purple-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "linear"
          }}
        />

        <div className="relative">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-mono text-white/50 uppercase tracking-wider">
                Total Assets
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-400/10 border border-green-400/20 backdrop-blur-sm">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
              </div>
              <span className="text-xs font-mono text-green-400 font-semibold">실시간</span>
            </div>
          </div>

          {/* 메인 금액 */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="font-mono text-5xl lg:text-6xl font-bold text-white tracking-tight mb-2">
              {formatCurrency(totalAsset, market)}
            </div>
            <div className="text-sm font-mono text-white/40">
              총 평가 자산
            </div>
          </motion.div>

          {/* 수익 정보 */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {/* 총 수익 */}
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${
                isProfit
                  ? 'bg-green-400/10 border border-green-400/20'
                  : 'bg-red-400/10 border border-red-400/20'
              }`}>
                {isProfit ? (
                  <TrendingUp className="w-5 h-5 text-green-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-400" />
                )}
                <span className={`font-mono font-bold text-xl ${
                  isProfit ? 'text-green-400' : 'text-red-400'
                }`}>
                  {formatPercent(profitRate)}
                </span>
              </div>
              <div className="flex-1">
                <div className={`font-mono text-2xl font-semibold ${
                  isProfit ? 'text-green-400' : 'text-red-400'
                }`}>
                  {isProfit ? '+' : ''}{formatCurrency(totalProfit, market)}
                </div>
                <div className="text-xs font-mono text-white/40">총 수익</div>
              </div>
            </div>

            {/* 오늘 수익 */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-mono text-white/60">오늘의 변동</span>
              </div>
              <div className="text-right">
                <div className={`font-mono font-semibold ${
                  isTodayProfit ? 'text-green-400' : 'text-red-400'
                }`}>
                  {isTodayProfit ? '+' : ''}{formatCurrency(todayProfit, market)}
                </div>
                <div className={`text-xs font-mono ${
                  isTodayProfit ? 'text-green-400/70' : 'text-red-400/70'
                }`}>
                  ({formatPercent(todayProfitRate)})
                </div>
              </div>
            </div>
          </motion.div>

          {/* 미니 차트 (데코레이션) */}
          <motion.div
            className="mt-6 pt-6 border-t border-white/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-white/40">7일 추이</span>
              <span className="text-xs font-mono text-green-400">+5.2%</span>
            </div>
            <div className="h-12 w-full relative">
              <svg className="w-full h-full" viewBox="0 0 200 40" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00FF87" />
                    <stop offset="50%" stopColor="#00D9FF" />
                    <stop offset="100%" stopColor="#A78BFA" />
                  </linearGradient>
                  <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#00FF87" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#00FF87" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* 영역 */}
                <path
                  d="M 0 35 L 20 30 L 40 32 L 60 25 L 80 28 L 100 20 L 120 22 L 140 18 L 160 20 L 180 15 L 200 12 L 200 40 L 0 40 Z"
                  fill="url(#areaGradient)"
                />
                {/* 라인 */}
                <path
                  d="M 0 35 L 20 30 L 40 32 L 60 25 L 80 28 L 100 20 L 120 22 L 140 18 L 160 20 L 180 15 L 200 12"
                  fill="none"
                  stroke="url(#lineGradient)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                {/* 포인트들 */}
                <circle cx="200" cy="12" r="3" fill="#00D9FF" className="animate-pulse" />
              </svg>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 서브 통계 카드들 */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        {[
          { label: '최고', value: formatCurrency(totalAsset * 1.05, market), color: 'blue' },
          { label: '평균', value: formatCurrency(totalAsset * 0.98, market), color: 'purple' },
          { label: '최저', value: formatCurrency(totalAsset * 0.92, market), color: 'pink' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            className="group/stat relative"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 + i * 0.1 }}
          >
            <div className={`absolute -inset-0.5 bg-gradient-to-br ${
              stat.color === 'blue' ? 'from-blue-500 to-cyan-500' :
              stat.color === 'purple' ? 'from-purple-500 to-pink-500' :
              'from-pink-500 to-rose-500'
            } rounded-xl blur opacity-0 group-hover/stat:opacity-30 transition`} />
            <div className="relative bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl p-3">
              <div className="text-xs font-mono text-white/40 mb-1">{stat.label}</div>
              <div className="font-mono text-sm font-semibold text-white truncate">{stat.value}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
