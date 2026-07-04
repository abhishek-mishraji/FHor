import { useMemo, useState } from 'react'
import { useDebounce } from '../../../hooks/useDebounce'
import { usePagination } from '../../../hooks/usePagination'

// Interaction state for the enterprise comparison table: label search,
// three-state column sorting (asc → desc → off), per-column widths from
// drag-resizing, and pagination over the filtered + sorted rows.
export const useComparisonTable = ({ rows, columns }) => {
  const [sort, setSort] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [columnWidths, setColumnWidths] = useState({})
  const debouncedSearch = useDebounce(searchTerm)

  const filteredRows = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase()

    if (!term) {
      return rows
    }

    return rows.filter((row) => String(row.label).toLowerCase().includes(term))
  }, [rows, debouncedSearch])

  const sortedRows = useMemo(() => {
    if (!sort) {
      return filteredRows
    }

    const column = columns.find((candidate) => candidate.key === sort.key)

    if (!column?.accessor) {
      return filteredRows
    }

    const direction = sort.dir === 'asc' ? 1 : -1

    return [...filteredRows].sort((a, b) => {
      const aValue = column.accessor(a)
      const bValue = column.accessor(b)

      // Nulls sort last regardless of direction.
      if (aValue === null || aValue === undefined) {
        return bValue === null || bValue === undefined ? 0 : 1
      }
      if (bValue === null || bValue === undefined) {
        return -1
      }
      if (typeof aValue === 'string' || typeof bValue === 'string') {
        return String(aValue).localeCompare(String(bValue)) * direction
      }

      return (aValue - bValue) * direction
    })
  }, [filteredRows, sort, columns])

  const pagination = usePagination(sortedRows)

  const toggleSort = (key) =>
    setSort((previous) => {
      if (previous?.key !== key) {
        return { key, dir: 'asc' }
      }

      return previous.dir === 'asc' ? { key, dir: 'desc' } : null
    })

  const setColumnWidth = (key, width) =>
    setColumnWidths((previous) => ({ ...previous, [key]: width }))

  return {
    sort,
    toggleSort,
    searchTerm,
    setSearchTerm,
    columnWidths,
    setColumnWidth,
    sortedRows,
    pagination,
  }
}
