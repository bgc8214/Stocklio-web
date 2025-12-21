'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format, addMonths, subMonths } from 'date-fns'
import { ko } from 'date-fns/locale'

interface MonthSelectorProps {
  selectedMonth: Date
  onMonthChange: (date: Date) => void
}

export function MonthSelector({ selectedMonth, onMonthChange }: MonthSelectorProps) {
  const handlePrevMonth = () => {
    onMonthChange(subMonths(selectedMonth, 1))
  }

  const handleNextMonth = () => {
    const nextMonth = addMonths(selectedMonth, 1)
    const now = new Date()

    // 다음 달이 미래인 경우 이동 금지
    if (nextMonth > now) return

    onMonthChange(nextMonth)
  }

  const isNextDisabled = addMonths(selectedMonth, 1) > new Date()

  return (
    <div className="flex items-center justify-center gap-4">
      <Button
        variant="outline"
        size="icon"
        onClick={handlePrevMonth}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="min-w-[180px] text-center">
        <h3 className="text-2xl font-bold">
          {format(selectedMonth, 'yyyy년 M월', { locale: ko })}
        </h3>
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={handleNextMonth}
        disabled={isNextDisabled}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
