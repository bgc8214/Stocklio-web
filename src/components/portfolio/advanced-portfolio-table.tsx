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
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Trash2, TrendingUp, TrendingDown, ArrowUpDown } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { PortfolioWithProfit } from '@/types/portfolio'

interface PortfolioWithCategory extends PortfolioWithProfit {
  categoryName: string
  categoryIcon: string
}

interface AdvancedPortfolioTableProps {
  portfolios: PortfolioWithCategory[]
  onEdit?: (portfolio: PortfolioWithCategory) => void
  onDelete?: (portfolio: PortfolioWithCategory) => void
  onBulkDelete?: (portfolios: PortfolioWithCategory[]) => void
}

type SortField = 'ticker' | 'profit' | 'profitRate' | 'marketValue'
type SortOrder = 'asc' | 'desc'

export function AdvancedPortfolioTable({
  portfolios,
  onEdit,
  onDelete,
  onBulkDelete,
}: AdvancedPortfolioTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [sortField, setSortField] = useState<SortField>('ticker')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [deletingPortfolio, setDeletingPortfolio] = useState<PortfolioWithCategory | null>(null)
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const sorted = [...portfolios].sort((a, b) => {
    let comparison = 0
    switch (sortField) {
      case 'ticker':
        comparison = a.ticker.localeCompare(b.ticker)
        break
      case 'profit':
        comparison = a.profit - b.profit
        break
      case 'profitRate':
        comparison = a.profitRate - b.profitRate
        break
      case 'marketValue':
        comparison = a.marketValue - b.marketValue
        break
    }
    return sortOrder === 'asc' ? comparison : -comparison
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(portfolios.map(p => p.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelect = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedIds(newSelected)
  }

  const handleBulkDelete = () => {
    if (onBulkDelete) {
      const selectedPortfolios = portfolios.filter(p => selectedIds.has(p.id))
      onBulkDelete(selectedPortfolios)
      setSelectedIds(new Set())
      setShowBulkDeleteDialog(false)
    }
  }

  const allSelected = portfolios.length > 0 && selectedIds.size === portfolios.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < portfolios.length

  return (
    <>
      <div className="space-y-4">
        {/* 일괄 삭제 버튼 */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between rounded-lg bg-muted p-3">
            <span className="text-sm font-medium">
              {selectedIds.size}개 종목 선택됨
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowBulkDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              선택 삭제
            </Button>
          </div>
        )}

        {/* 테이블 */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="모두 선택"
                    ref={(el) => {
                      if (el) {
                        // @ts-ignore
                        el.indeterminate = someSelected
                      }
                    }}
                  />
                </TableHead>
                <TableHead>카테고리</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('ticker')}
                >
                  <div className="flex items-center gap-1">
                    티커
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>종목명</TableHead>
                <TableHead className="text-right">수량</TableHead>
                <TableHead className="text-right">평단가</TableHead>
                <TableHead className="text-right">현재가</TableHead>
                <TableHead
                  className="text-right cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('marketValue')}
                >
                  <div className="flex items-center justify-end gap-1">
                    평가액
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead
                  className="text-right cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('profit')}
                >
                  <div className="flex items-center justify-end gap-1">
                    수익금
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead
                  className="text-right cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('profitRate')}
                >
                  <div className="flex items-center justify-end gap-1">
                    수익률
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                {onDelete && <TableHead className="w-[100px]">작업</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.length > 0 ? (
                sorted.map((portfolio) => (
                  <TableRow
                    key={portfolio.id}
                    className={`hover:bg-muted/50 ${onEdit ? 'cursor-pointer' : ''}`}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(portfolio.id)}
                        onCheckedChange={(checked) =>
                          handleSelect(portfolio.id, checked as boolean)
                        }
                        aria-label={`${portfolio.name} 선택`}
                      />
                    </TableCell>
                    <TableCell onClick={() => onEdit?.(portfolio)}>
                      <span className="inline-flex items-center gap-1">
                        <span>{portfolio.categoryIcon}</span>
                        <span className="text-sm">{portfolio.categoryName}</span>
                      </span>
                    </TableCell>
                    <TableCell className="font-medium" onClick={() => onEdit?.(portfolio)}>
                      {portfolio.ticker}
                    </TableCell>
                    <TableCell onClick={() => onEdit?.(portfolio)}>{portfolio.name}</TableCell>
                    <TableCell className="text-right" onClick={() => onEdit?.(portfolio)}>
                      {portfolio.quantity}
                    </TableCell>
                    <TableCell className="text-right" onClick={() => onEdit?.(portfolio)}>
                      {formatCurrency(portfolio.averageCost, portfolio.market)}
                    </TableCell>
                    <TableCell className="text-right" onClick={() => onEdit?.(portfolio)}>
                      {formatCurrency(portfolio.currentPrice, portfolio.market)}
                    </TableCell>
                    <TableCell className="text-right font-semibold" onClick={() => onEdit?.(portfolio)}>
                      {formatCurrency(portfolio.marketValue)}
                    </TableCell>
                    <TableCell className="text-right" onClick={() => onEdit?.(portfolio)}>
                      <div className={`flex items-center justify-end gap-1 font-semibold ${
                        portfolio.profit >= 0 ? 'text-profit' : 'text-loss'
                      }`}>
                        {portfolio.profit >= 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        {portfolio.profit >= 0 ? '+' : ''}
                        {formatCurrency(portfolio.profit)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right" onClick={() => onEdit?.(portfolio)}>
                      <span className={`font-semibold ${
                        portfolio.profitRate >= 0 ? 'text-profit' : 'text-loss'
                      }`}>
                        {portfolio.profitRate >= 0 ? '+' : ''}
                        {portfolio.profitRate.toFixed(2)}%
                      </span>
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
                  <TableCell
                    colSpan={onDelete ? 11 : 10}
                    className="text-center py-8 text-muted-foreground"
                  >
                    보유 종목이 없습니다
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 단일 삭제 다이얼로그 */}
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

      {/* 일괄 삭제 다이얼로그 */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>선택 종목 일괄 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 선택한 {selectedIds.size}개 종목을 삭제하시겠습니까?
              <br />
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
