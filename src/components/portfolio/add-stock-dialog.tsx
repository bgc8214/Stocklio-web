'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useAddPortfolio, useUpdatePortfolio } from '@/lib/hooks/use-portfolio'
import { searchStocks, getStockPrice } from '@/lib/api/yahoo-finance'
import { Portfolio } from '@/types/portfolio'
import { Loader2, Search } from 'lucide-react'

const portfolioSchema = z.object({
  ticker: z.string().min(1, '티커를 입력하세요'),
  name: z.string().min(1, '종목명을 입력하세요'),
  quantity: z.number().min(1, '수량은 1 이상이어야 합니다'),
  averageCost: z.number().min(0, '평단가는 0 이상이어야 합니다'),
  market: z.enum(['KRX', 'US']),
  categoryId: z.number().optional(),
})

type PortfolioFormData = z.infer<typeof portfolioSchema>

interface AddStockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  portfolio?: Portfolio
}

export function AddStockDialog({
  open,
  onOpenChange,
  portfolio,
}: AddStockDialogProps) {
  const { toast } = useToast()
  const addMutation = useAddPortfolio()
  const updateMutation = useUpdatePortfolio()
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<
    Array<{ symbol: string; name: string; exchange: string }>
  >([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<PortfolioFormData>({
    resolver: zodResolver(portfolioSchema),
    defaultValues: {
      ticker: '',
      name: '',
      quantity: 1,
      averageCost: 0,
      market: 'US',
      categoryId: undefined,
    },
  })

  const market = watch('market')

  useEffect(() => {
    if (portfolio) {
      reset({
        ticker: portfolio.ticker,
        name: portfolio.name,
        quantity: portfolio.quantity,
        averageCost: portfolio.averageCost,
        market: portfolio.market,
        categoryId: portfolio.categoryId,
      })
    } else {
      reset({
        ticker: '',
        name: '',
        quantity: 1,
        averageCost: 0,
        market: 'US',
        categoryId: undefined,
      })
    }
  }, [portfolio, reset])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const results = await searchStocks(searchQuery)
      setSearchResults(results)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '검색 실패',
        description: '종목 검색 중 오류가 발생했습니다.',
      })
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectStock = async (stock: {
    symbol: string
    name: string
  }) => {
    setValue('ticker', stock.symbol)
    setValue('name', stock.name)
    setValue('market', 'US') // Yahoo Finance는 주로 미국 주식
    setSearchResults([])
    setSearchQuery('')

    // 현재가 자동 조회
    try {
      const price = await getStockPrice(stock.symbol)
      setValue('averageCost', Math.round(price.currentPrice * 100) / 100)
      toast({
        title: '현재가 조회 완료',
        description: `${stock.symbol}의 현재가는 ${price.currentPrice.toFixed(2)}입니다.`,
      })
    } catch (error: any) {
      console.error('Failed to fetch current price:', error)
      toast({
        variant: 'destructive',
        title: '가격 조회 실패',
        description: error.message || '현재가를 가져올 수 없습니다.',
      })
    }
  }

  // 티커 입력 시 자동으로 현재가 조회
  const handleTickerBlur = async () => {
    const ticker = watch('ticker')
    if (ticker && !watch('name')) {
      try {
        const price = await getStockPrice(ticker)
        setValue('name', ticker) // 이름이 없으면 티커로 설정
        setValue('averageCost', Math.round(price.currentPrice * 100) / 100)
        toast({
          title: '현재가 조회 완료',
          description: `${ticker}의 현재가는 ${price.currentPrice.toFixed(2)}입니다.`,
        })
      } catch (error: any) {
        console.error('Failed to fetch current price:', error)
        // 에러는 조용히 처리 (사용자가 직접 입력할 수 있도록)
      }
    }
  }

  const onSubmit = async (data: PortfolioFormData) => {
    try {
      if (portfolio) {
        await updateMutation.mutateAsync({
          id: portfolio.id,
          data,
        })
        toast({
          title: '수정 완료',
          description: '포트폴리오가 수정되었습니다.',
        })
      } else {
        await addMutation.mutateAsync(data)
        toast({
          title: '추가 완료',
          description: '포트폴리오에 종목이 추가되었습니다.',
        })
      }
      onOpenChange(false)
      reset()
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: portfolio ? '수정 실패' : '추가 실패',
        description: error.message || '오류가 발생했습니다.',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {portfolio ? '종목 수정' : '종목 추가'}
          </DialogTitle>
          <DialogDescription>
            {portfolio
              ? '포트폴리오의 종목 정보를 수정하세요.'
              : '새로운 종목을 포트폴리오에 추가하세요.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 종목 검색 */}
          <div className="space-y-2">
            <Label>종목 검색</Label>
            <div className="flex gap-2">
              <Input
                placeholder="종목명 또는 티커 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSearch()
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleSearch}
                disabled={isSearching}
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
            {searchResults.length > 0 && (
              <div className="border rounded-md max-h-40 overflow-y-auto">
                {searchResults.map((stock) => (
                  <button
                    key={stock.symbol}
                    type="button"
                    onClick={() => handleSelectStock(stock)}
                    className="w-full text-left px-3 py-2 hover:bg-muted transition-colors"
                  >
                    <div className="font-medium">{stock.symbol}</div>
                    <div className="text-sm text-muted-foreground">
                      {stock.name}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 티커 */}
          <div className="space-y-2">
            <Label htmlFor="ticker">티커 *</Label>
            <Input
              id="ticker"
              {...register('ticker')}
              placeholder="AAPL"
              onBlur={handleTickerBlur}
            />
            {errors.ticker && (
              <p className="text-sm text-destructive">
                {errors.ticker.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              티커 입력 후 포커스를 벗어나면 현재가가 자동으로 조회됩니다.
            </p>
          </div>

          {/* 종목명 */}
          <div className="space-y-2">
            <Label htmlFor="name">종목명 *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Apple Inc."
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* 시장 */}
          <div className="space-y-2">
            <Label htmlFor="market">시장 *</Label>
            <Select
              value={market}
              onValueChange={(value) => setValue('market', value as 'KRX' | 'US')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="US">미국 (US)</SelectItem>
                <SelectItem value="KRX">한국 (KRX)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 수량 */}
          <div className="space-y-2">
            <Label htmlFor="quantity">수량 *</Label>
            <Input
              id="quantity"
              type="number"
              {...register('quantity', { valueAsNumber: true })}
              min="1"
            />
            {errors.quantity && (
              <p className="text-sm text-destructive">
                {errors.quantity.message}
              </p>
            )}
          </div>

          {/* 평단가 */}
          <div className="space-y-2">
            <Label htmlFor="averageCost">평단가 *</Label>
            <Input
              id="averageCost"
              type="number"
              step="0.01"
              {...register('averageCost', { valueAsNumber: true })}
              min="0"
            />
            {errors.averageCost && (
              <p className="text-sm text-destructive">
                {errors.averageCost.message}
              </p>
            )}
          </div>

          {/* 카테고리 */}
          <div className="space-y-2">
            <Label htmlFor="categoryId">카테고리</Label>
            <Select
              value={watch('categoryId')?.toString() || ''}
              onValueChange={(value) =>
                setValue('categoryId', value ? Number(value) : undefined)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="카테고리 선택 (선택사항)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">나스닥100</SelectItem>
                <SelectItem value="2">S&P 500</SelectItem>
                <SelectItem value="3">배당주</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={addMutation.isPending || updateMutation.isPending}
            >
              {addMutation.isPending || updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  처리 중...
                </>
              ) : portfolio ? (
                '수정'
              ) : (
                '추가'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

