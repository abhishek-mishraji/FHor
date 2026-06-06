import Button from '../ui/Button'

const PaginationBar = ({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) => (
  <div className="pagination-bar">
    <div className="pagination-bar__summary">
      <span>{totalItems} records</span>
      <label className="pagination-bar__size">
        <span>Rows</span>
        <select value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}>
          {[5, 10, 20, 50].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>
    </div>

    <div className="pagination-bar__actions">
      <Button type="button" variant="ghost" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
        Previous
      </Button>
      <span>
        Page {page} of {totalPages}
      </span>
      <Button
        type="button"
        variant="ghost"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        Next
      </Button>
    </div>
  </div>
)

export default PaginationBar
