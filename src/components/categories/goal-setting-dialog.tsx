'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useCreateCategoryGoal } from '@/lib/hooks/use-category-goals'
import { formatCurrency } from '@/lib/utils'

interface GoalSettingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  categoryId: number
  categoryName: string
  categoryIcon: string
  currentGoal?: number
}

export function GoalSettingDialog({
  open,
  onOpenChange,
  userId,
  categoryId,
  categoryName,
  categoryIcon,
  currentGoal,
}: GoalSettingDialogProps) {
  const [targetAmount, setTargetAmount] = useState('')
  const { toast } = useToast()
  const createMutation = useCreateCategoryGoal()

  useEffect(() => {
    if (open && currentGoal) {
      setTargetAmount(currentGoal.toString())
    } else if (!open) {
      setTargetAmount('')
    }
  }, [open, currentGoal])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const amount = parseFloat(targetAmount)
    if (isNaN(amount) || amount <= 0) {
      toast({
        variant: 'destructive',
        title: '입력 오류',
        description: '올바른 금액을 입력해주세요.',
      })
      return
    }

    try {
      await createMutation.mutateAsync({
        userId,
        categoryId,
        targetAmount: amount,
      })

      toast({
        title: '목표 설정 완료',
        description: `${categoryName} 목표가 ${formatCurrency(amount, 'KRX')}(으)로 설정되었습니다.`,
      })

      onOpenChange(false)
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '목표 설정 실패',
        description: error.message || '오류가 발생했습니다.',
      })
    }
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '')
    setTargetAmount(value)
  }

  const presetAmounts = [10000000, 30000000, 50000000, 100000000]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{categoryIcon}</span>
              <span>{categoryName} 목표 설정</span>
            </DialogTitle>
            <DialogDescription>
              이 카테고리에 대한 목표 금액을 설정하세요.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="targetAmount">목표 금액 (원)</Label>
              <Input
                id="targetAmount"
                type="text"
                placeholder="50000000"
                value={targetAmount}
                onChange={handleAmountChange}
                className="text-lg"
              />
              {targetAmount && (
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(parseFloat(targetAmount) || 0, 'KRX')}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>빠른 선택</Label>
              <div className="grid grid-cols-2 gap-2">
                {presetAmounts.map((amount) => (
                  <Button
                    key={amount}
                    type="button"
                    variant="outline"
                    onClick={() => setTargetAmount(amount.toString())}
                    className="justify-start"
                  >
                    {formatCurrency(amount, 'KRX')}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              취소
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? '저장 중...' : '목표 설정'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
