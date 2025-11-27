'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Plus, Download } from 'lucide-react'

interface PortfolioFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  categoryFilter: string
  onCategoryFilterChange: (value: string) => void
  marketFilter: string
  onMarketFilterChange: (value: string) => void
  onAdd?: () => void
  onExport?: () => void
  selectedCount?: number
}

export function PortfolioFilters({
  search,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  marketFilter,
  onMarketFilterChange,
  onAdd,
  onExport,
  selectedCount = 0,
}: PortfolioFiltersProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* 필터 영역 */}
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
        {/* 카테고리 필터 */}
        <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="카테고리" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 카테고리</SelectItem>
            <SelectItem value="1">📈 나스닥100</SelectItem>
            <SelectItem value="2">📊 S&P 500</SelectItem>
            <SelectItem value="3">💰 배당주</SelectItem>
            <SelectItem value="none">📦 미분류</SelectItem>
          </SelectContent>
        </Select>

        {/* 시장 필터 */}
        <Select value={marketFilter} onValueChange={onMarketFilterChange}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="시장" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 시장</SelectItem>
            <SelectItem value="US">🇺🇸 US</SelectItem>
            <SelectItem value="KRX">🇰🇷 KRX</SelectItem>
          </SelectContent>
        </Select>

        {/* 검색 */}
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="종목 검색 (티커, 종목명)..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center gap-2">
        {selectedCount > 0 && (
          <span className="text-sm text-muted-foreground">
            {selectedCount}개 선택됨
          </span>
        )}

        {onExport && (
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            내보내기
          </Button>
        )}

        {onAdd && (
          <Button onClick={onAdd}>
            <Plus className="h-4 w-4 mr-2" />
            종목 추가
          </Button>
        )}
      </div>
    </div>
  )
}
