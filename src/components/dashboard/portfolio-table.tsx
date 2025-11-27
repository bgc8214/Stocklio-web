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
import { Search, Plus, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Portfolio } from '@/types/portfolio'

interface PortfolioWithCategory extends Portfolio {
  categoryName: string
  categoryIcon: string
  marketValue: number
  investment: number
  profit: number
  profitRate: number
}

interface PortfolioTableProps {
  portfolios: PortfolioWithCategory[]
  onAdd?: () => void
  onEdit?: (portfolio: PortfolioWithCategory) => void
  onDelete?: (portfolio: PortfolioWithCategory) => void
}

export function PortfolioTable({
  portfolios,
  onAdd,
  onEdit,
  onDelete,
}: PortfolioTableProps) {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'ticker' | 'profit'>('ticker')
  const [deletingPortfolio, setDeletingPortfolio] = useState<PortfolioWithCategory | null>(null)

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                onClick={() => setSortBy('ticker')}
                className="cursor-pointer hover:bg-muted/50"
              >
                카테고리
              </TableHead>
              <TableHead>티커</TableHead>
              <TableHead>종목명</TableHead>
              <TableHead className="text-right">수량</TableHead>
              <TableHead className="text-right">평단가</TableHead>
              <TableHead className="text-right">현재가</TableHead>
              <TableHead className="text-right">시가총액</TableHead>
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
            {filtered.length > 0 ? (
              filtered.map((portfolio) => (
                <TableRow
                  key={portfolio.id}
                  className={`hover:bg-muted/50 ${
                    onEdit ? 'cursor-pointer' : ''
                  }`}
                  onClick={() => onEdit?.(portfolio)}
                >
                  <TableCell>
                    <span className="inline-flex items-center gap-1">
                      <span>{portfolio.categoryIcon}</span>
                      <span>{portfolio.categoryName}</span>
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{portfolio.ticker}</TableCell>
                  <TableCell>{portfolio.name}</TableCell>
                  <TableCell className="text-right">{portfolio.quantity}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(portfolio.averageCost)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(portfolio.currentPrice)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(portfolio.marketValue)}
                  </TableCell>
                  <TableCell
                    className={`text-right font-semibold ${
                      portfolio.profitRate >= 0
                        ? 'text-profit'
                        : 'text-loss'
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
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={onDelete ? 9 : 8} className="text-center py-8 text-muted-foreground">
                  {search ? '검색 결과가 없습니다' : '보유 종목이 없습니다'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog
        open={!!deletingPortfolio}
        onOpenChange={(open) => !open && setDeletingPortfolio(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>종목 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 {deletingPortfolio?.name} ({deletingPortfolio?.ticker})을(를) 삭제하시겠습니까?
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
    </div>
  )
}

