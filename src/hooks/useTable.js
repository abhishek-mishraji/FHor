import { useDeferredValue, useMemo } from 'react'
import environment from '../config/environment'
import { usePagination } from './usePagination'

const matchesSearch = (row, searchValue, searchFields) => {
  if (!searchValue) {
    return true
  }

  return searchFields.some((field) =>
    String(row?.[field] ?? '')
      .toLowerCase()
      .includes(searchValue.toLowerCase()),
  )
}

export const useTable = ({
  data = [],
  searchTerm = '',
  searchFields = [],
  filterFn = null,
  sortFn = null,
  pageSize = environment.defaultPageSize,
}) => {
  const deferredSearchTerm = useDeferredValue(searchTerm)

  const filteredData = useMemo(() => {
    const nextData = data.filter((row) => {
      const matchesText = matchesSearch(row, deferredSearchTerm, searchFields)
      const matchesFilter = filterFn ? filterFn(row) : true

      return matchesText && matchesFilter
    })

    if (sortFn) {
      return [...nextData].sort(sortFn)
    }

    return nextData
  }, [data, deferredSearchTerm, filterFn, searchFields, sortFn])

  const pagination = usePagination(filteredData, pageSize)

  return {
    ...pagination,
    filteredData,
    deferredSearchTerm,
  }
}
