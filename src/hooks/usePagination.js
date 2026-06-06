import { useMemo, useState } from 'react'
import environment from '../config/environment'

export const usePagination = (items = [], initialPageSize = environment.defaultPageSize) => {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)

  const totalItems = items.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(page, totalPages)

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize

    return items.slice(start, start + pageSize)
  }, [items, pageSize, safePage])

  return {
    page: safePage,
    pageSize,
    totalItems,
    totalPages,
    pageItems,
    setPage,
    setPageSize,
  }
}
