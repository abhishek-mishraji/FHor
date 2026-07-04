import { memo, useEffect, useMemo, useRef } from 'react'
import Button from '../../../components/ui/Button'
import EmptyState from '../../../components/ui/EmptyState'
import PaginationBar from '../../../components/common/PaginationBar'
import { useComparisonTable } from '../hooks/useComparisonTable'

const MIN_COLUMN_WIDTH = 72
const SKELETON_ROWS = 8

// Placeholder columns so the very first load (no columns yet) still shows a
// believable skeleton grid.
const SKELETON_FALLBACK_COLUMNS = Array.from({ length: 5 }, (_, index) => ({
  key: `skeleton-${index}`,
  sticky: index === 0,
}))

const SortIndicator = ({ dir }) => (
  <span className="comparison-table__sort-indicator" aria-hidden="true">
    {dir === 'asc' ? '▲' : dir === 'desc' ? '▼' : '⇅'}
  </span>
)

const ResizeHandle = ({ columnKey, getWidth, setColumnWidth }) => {
  const dragRef = useRef(null)

  const handlePointerDown = (event) => {
    event.preventDefault()
    event.stopPropagation()

    const headerCell = event.currentTarget.closest('th')
    dragRef.current = {
      startX: event.clientX,
      startWidth: getWidth(columnKey) ?? headerCell?.offsetWidth ?? 120,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event) => {
    if (!dragRef.current) {
      return
    }

    const nextWidth = Math.max(
      MIN_COLUMN_WIDTH,
      dragRef.current.startWidth + event.clientX - dragRef.current.startX,
    )
    setColumnWidth(columnKey, nextWidth)
  }

  const handlePointerUp = (event) => {
    dragRef.current = null
    event.currentTarget.releasePointerCapture(event.pointerId)
  }

  return (
    <span
      className="comparison-table__resize-handle"
      role="presentation"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={(event) => event.stopPropagation()}
    />
  )
}

const HeaderCell = ({ column, sort, toggleSort, getWidth, setColumnWidth, rowSpan }) => {
  const isSorted = sort?.key === column.key
  const ariaSort = isSorted ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'

  return (
    <th
      rowSpan={rowSpan}
      scope="col"
      aria-sort={column.sortable ? ariaSort : undefined}
      className={[
        'comparison-table__th',
        column.sticky ? 'comparison-table__cell--sticky comparison-table__th--corner' : '',
        column.align === 'right' ? 'comparison-table__cell--right' : '',
        column.sortable ? 'comparison-table__th--sortable' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={column.sortable ? () => toggleSort(column.key) : undefined}
    >
      <span className="comparison-table__th-content">
        <span>
          {column.header}
          {column.subHeader ? (
            <span className="comparison-table__th-sub">{column.subHeader}</span>
          ) : null}
        </span>
        {column.sortable ? <SortIndicator dir={isSorted ? sort.dir : null} /> : null}
      </span>
      <ResizeHandle columnKey={column.key} getWidth={getWidth} setColumnWidth={setColumnWidth} />
    </th>
  )
}

// Groups consecutive columns sharing the same `group.key` for the two-row
// header used by multi-metric comparisons.
const buildHeaderGroups = (columns) => {
  const groups = []

  columns.forEach((column) => {
    const lastGroup = groups[groups.length - 1]

    if (column.group && lastGroup?.group?.key === column.group.key) {
      lastGroup.columns.push(column)
      return
    }

    groups.push({ group: column.group || null, columns: [column] })
  })

  return groups
}

const SkeletonBody = ({ columns }) => (
  <tbody>
    {Array.from({ length: SKELETON_ROWS }, (_, rowIndex) => (
      <tr key={rowIndex} className="comparison-table__row">
        {columns.map((column) => (
          <td
            key={column.key}
            className={[
              'comparison-table__td',
              column.sticky ? 'comparison-table__cell--sticky' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <span className="comparison-table__skeleton" />
          </td>
        ))}
      </tr>
    ))}
  </tbody>
)

const ComparisonTable = memo(function ComparisonTable({
  columns,
  rows,
  loading = false,
  error = null,
  onRetry,
  emptyTitle = 'No data for this selection',
  emptyDescription = 'Adjust the filters and run the comparison again.',
  searchPlaceholder = 'Search rows...',
  toolbar = null,
  onVisibleRowsChange = null,
}) {
  const table = useComparisonTable({ rows, columns })

  // Exports read the rows exactly as the user sees them (searched + sorted,
  // all pages) without lifting the table's interaction state.
  useEffect(() => {
    onVisibleRowsChange?.(table.sortedRows)
  }, [onVisibleRowsChange, table.sortedRows])
  const hasGroupedHeader = columns.some((column) => column.group)
  const headerGroups = useMemo(() => buildHeaderGroups(columns), [columns])
  const getWidth = (key) => table.columnWidths[key]

  const renderHeader = () => {
    if (!hasGroupedHeader) {
      return (
        <tr>
          {columns.map((column) => (
            <HeaderCell
              key={column.key}
              column={column}
              sort={table.sort}
              toggleSort={table.toggleSort}
              getWidth={getWidth}
              setColumnWidth={table.setColumnWidth}
            />
          ))}
        </tr>
      )
    }

    return (
      <>
        <tr>
          {headerGroups.map((headerGroup, index) =>
            headerGroup.group ? (
              <th
                key={`group-${headerGroup.group.key}-${index}`}
                colSpan={headerGroup.columns.length}
                className="comparison-table__th comparison-table__th--group"
                scope="colgroup"
              >
                {headerGroup.group.label}
              </th>
            ) : (
              headerGroup.columns.map((column) => (
                <HeaderCell
                  key={column.key}
                  column={column}
                  sort={table.sort}
                  toggleSort={table.toggleSort}
                  getWidth={getWidth}
                  setColumnWidth={table.setColumnWidth}
                  rowSpan={2}
                />
              ))
            ),
          )}
        </tr>
        <tr>
          {headerGroups
            .filter((headerGroup) => headerGroup.group)
            .flatMap((headerGroup) =>
              headerGroup.columns.map((column) => (
                <HeaderCell
                  key={column.key}
                  column={column}
                  sort={table.sort}
                  toggleSort={table.toggleSort}
                  getWidth={getWidth}
                  setColumnWidth={table.setColumnWidth}
                />
              )),
            )}
        </tr>
      </>
    )
  }

  return (
    <div className="comparison-table">
      <div className="comparison-table__toolbar">
        <input
          type="search"
          className="comparison-table__search"
          value={table.searchTerm}
          onChange={(event) => table.setSearchTerm(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label="Search table rows"
        />
        {toolbar}
      </div>

      {error ? (
        <div className="comparison-table__error" role="alert">
          <p>{error.message || 'Something went wrong while loading the comparison.'}</p>
          {onRetry ? (
            <Button type="button" variant="secondary" size="sm" onClick={onRetry}>
              Retry
            </Button>
          ) : null}
        </div>
      ) : (
        <>
          <div className="comparison-table__scroll">
            <table className="comparison-table__table">
              <colgroup>
                {columns.map((column) => (
                  <col
                    key={column.key}
                    style={{ width: getWidth(column.key) ?? column.width }}
                  />
                ))}
              </colgroup>
              <thead className="comparison-table__head">{renderHeader()}</thead>
              {loading ? (
                <SkeletonBody columns={columns.length ? columns : SKELETON_FALLBACK_COLUMNS} />
              ) : (
                <tbody>
                  {table.pagination.pageItems.map((row) => (
                    <tr key={row.id} className="comparison-table__row">
                      {columns.map((column) => {
                        const tone = column.tone?.(row) || null

                        return (
                          <td
                            key={column.key}
                            className={[
                              'comparison-table__td',
                              column.sticky ? 'comparison-table__cell--sticky' : '',
                              column.align === 'right' ? 'comparison-table__cell--right' : '',
                              tone ? `comparison-table__td--${tone}` : '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            title={column.cellTitle?.(row) || undefined}
                          >
                            {column.render(row)}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
            {!loading && !table.pagination.pageItems.length ? (
              <div className="comparison-table__empty">
                <EmptyState title={emptyTitle} description={emptyDescription} />
              </div>
            ) : null}
          </div>

          {!loading && table.pagination.totalItems > 0 ? (
            <PaginationBar
              page={table.pagination.page}
              totalPages={table.pagination.totalPages}
              totalItems={table.pagination.totalItems}
              pageSize={table.pagination.pageSize}
              onPageChange={table.pagination.setPage}
              onPageSizeChange={table.pagination.setPageSize}
            />
          ) : null}
        </>
      )}
    </div>
  )
})

export default ComparisonTable
