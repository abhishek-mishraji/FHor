import { memo } from 'react'
import Card from '../ui/Card'
import { formatNumber } from '../../utils/numberUtils'

const formatGrowth = (growthPercent) => {
  if (growthPercent === null || growthPercent === undefined) {
    return 'N/A'
  }

  const direction = growthPercent > 0 ? '▲' : growthPercent < 0 ? '▼' : '—'

  return `${direction} ${formatNumber(Math.abs(growthPercent))}%`
}

const growthClass = (growthPercent) => {
  if (growthPercent === null || growthPercent === undefined || growthPercent === 0) {
    return ''
  }

  return growthPercent > 0 ? 'kpi-card__growth--up' : 'kpi-card__growth--down'
}

const KpiGrid = memo(function KpiGrid({ summaries = [] }) {
  if (!summaries.length) {
    return null
  }

  return (
    <div className="stats-grid kpi-grid">
      {summaries.map((summary) => (
        <Card key={summary.metric} className="stat-card kpi-card">
          <div className="kpi-card__header">
            <p className="stat-card__label">{summary.label}</p>
            <span
              className={`kpi-card__growth ${growthClass(summary.growthPercent)}`.trim()}
              title="Growth from first to last data point"
            >
              {formatGrowth(summary.growthPercent)}
            </span>
          </div>
          <h3 className="stat-card__value">{formatNumber(summary.total)}</h3>
          <p className="stat-card__caption">Total</p>
          <dl className="kpi-card__stats">
            <div>
              <dt>Avg</dt>
              <dd>{formatNumber(summary.average)}</dd>
            </div>
            <div>
              <dt>Min</dt>
              <dd>{formatNumber(summary.min)}</dd>
            </div>
            <div>
              <dt>Max</dt>
              <dd>{formatNumber(summary.max)}</dd>
            </div>
          </dl>
        </Card>
      ))}
    </div>
  )
})

export default KpiGrid
