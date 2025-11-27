'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Search, Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { PortfolioWithProfit } from '@/types/portfolio'

interface CategoryStockTableProps {
  portfolios: PortfolioWithProfit[]
  categoryName: string
  onAdd?: () => void
  onEdit?: (portfolio: PortfolioWithProfit) => void
  onDelete?: (portfolio: PortfolioWithProfit) => void
}

export function CategoryStockTable({
  portfolios,
  categoryName,
  onAdd,
  onEdit,
  onDelete,
}: CategoryStockTableProps) {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'ticker' | 'profit'>('ticker')
  const [deletingPortfolio, setDeletingPortfolio] = useState<PortfolioWithProfit | null>(null)

  const filtered = portfolios
    .filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.ticker.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'profit') return b.profitRate - a.profitRate
      return a.ticker.localeCompare(b.ticker)
    })

  return (
    <Card>
      <CardHeader>
        <CardTitle>보유 종목</CardTitle>
        <CardDescription>{categoryName} 카테고리의 종목 목록</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="종목 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          {onAdd && (
            <Button onClick={onAdd}>
              <Plus className="h-4 w-4 mr-2" />
              종목 추가
            </Button>
          )}
        </div>

        {filtered.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    onClick={() => setSortBy('ticker')}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    티커
                  </TableHead>
                  <TableHead>종목명</TableHead>
                  <TableHead className="text-right">수량</TableHead>
                  <TableHead className="text-right">평단가</TableHead>
                  <TableHead className="text-right">현재가</TableHead>
                  <TableHead className="text-right">평가액</TableHead>
                  <TableHead className="text-right">수익금</TableHead>
                  <TableHead
                    className="text-right cursor-pointer hover:bg-muted/50"
                    onClick={() => setSortBy('profit')}
                  >
                    수익률
                  </TableHead>
                  {onDelete && <TableHead className="w-[100px]">작업</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((portfolio) => (
                  <TableRow
                    key={portfolio.id}
                    className={`hover:bg-muted/50 ${onEdit ? 'cursor-pointer' : ''}`}
                    onClick={() => onEdit?.(portfolio)}
                  >
                    <TableCell className="font-medium">{portfolio.ticker}</TableCell>
                    <TableCell>{portfolio.name}</TableCell>
                    <TableCell className="text-right">{portfolio.quantity}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(portfolio.averageCost, portfolio.market)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(portfolio.currentPrice, portfolio.market)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(portfolio.marketValue)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-semibold ${
                        portfolio.profit >= 0 ? 'text-profit' : 'text-loss'
                      }`}
                    >
                      <div className="flex items-center justify-end gap-1">
                        {portfolio.profit >= 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        {portfolio.profit >= 0 ? '+' : ''}
                        {formatCurrency(portfolio.profit)}
                      </div>
                    </TableCell>
                    <TableCell
                      className={`text-right font-semibold ${
                        portfolio.profitRate >= 0 ? 'text-profit' : 'text-loss'
                      }`}
                    >
                      {portfolio.profitRate >= 0 ? '+' : ''}
                      {portfolio.profitRate.toFixed(2)}%
                    </TableCell>
                    {onDelete && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingPortfolio(portfolio)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">
              {search ? '검색 결과가 없습니다' : '보유 종목이 없습니다'}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {search
                ? '다른 검색어로 시도해보세요'
                : '이 카테고리에 종목을 추가하여 시작하세요'}
            </p>
            {onAdd && !search && (
              <Button onClick={onAdd} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                첫 번째 종목 추가하기
              </Button>
            )}
          </div>
        )}

        {/* 삭제 확인 다이얼로그 */}
        <AlertDialog
          open={!!deletingPortfolio}
          onOpenChange={(open) => !open && setDeletingPortfolio(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>종목 삭제</AlertDialogTitle>
              <AlertDialogDescription>
                정말로 {deletingPortfolio?.name} ({deletingPortfolio?.ticker})을(를)
                삭제하시겠습니까?
                <br />
                이 작업은 되돌릴 수 없습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deletingPortfolio && onDelete) {
                    onDelete(deletingPortfolio)
                    setDeletingPortfolio(null)
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                삭제
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
