import { Fragment, memo, useMemo } from 'react'
import { AGGREGATES } from '../../../constants/comparisonConstants'
import { computeSummary } from '../../../utils/comparisonUtils'
import { formatCurrency } from '../../../utils/numberUtils'

const SUMMARY_ROWS = [
  { key: 'sum', label: 'SUM', aggregate: AGGREGATES.SUM },
  { key: 'avg', label: 'AVERAGE', aggregate: AGGREGATES.AVG },
  { key: 'min', label: 'MINIMUM', aggregate: AGGREGATES.MIN },
  { key: 'max', label: 'MAXIMUM', aggregate: AGGREGATES.MAX },
]

const formatSummaryValue = (value) => (value === null ? '-' : formatCurrency(value))

// SUM / AVERAGE / MINIMUM / MAXIMUM of the Current and Previous columns for
// every visible metric group, computed client-side from the comparison rows.
// The row matching the backend aggregate applied to the data is highlighted.
const SummaryTable = memo(function SummaryTable({ result, visibleGroups, aggregate }) {
  const summaries = useMemo(
    () =>
      visibleGroups.map((group) => ({
        group,
        summary: computeSummary(result.rows, group.key),
      })),
    [result, visibleGroups],
  )

  if (!result.rows.length) {
    return null
  }

  return (
    <section className="summary-table" aria-label="Comparison summary">
      <header className="summary-table__header">
        <h2>Summary</h2>
        <p>Computed from the comparison rows above</p>
      </header>
      <div className="summary-table__scroll">
        <table className="summary-table__table">
          <thead>
            <tr>
              <th rowSpan={2} scope="col" className="summary-table__label-col">
                Summary
              </th>
              {summaries.map(({ group }) => (
                <th key={group.key} colSpan={2} scope="colgroup">
                  {group.label}
                </th>
              ))}
            </tr>
            <tr>
              {summaries.map(({ group }) => (
                <Fragment key={group.key}>
                  <th scope="col">{result.currentHeader || 'Current'}</th>
                  <th scope="col">{result.previousHeader || 'Previous'}</th>
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {SUMMARY_ROWS.map((row) => (
              <tr
                key={row.key}
                className={
                  row.aggregate === aggregate ? 'summary-table__row--active' : undefined
                }
              >
                <th scope="row" className="summary-table__label-col">
                  {row.label}
                </th>
                {summaries.map(({ group, summary }) => (
                  <Fragment key={group.key}>
                    <td>{formatSummaryValue(summary.current[row.key])}</td>
                    <td>{formatSummaryValue(summary.previous[row.key])}</td>
                  </Fragment>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
})

export default SummaryTable
