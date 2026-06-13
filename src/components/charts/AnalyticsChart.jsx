import { forwardRef, memo } from 'react'
import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { CHART_COLORS, CHART_TYPES } from '../../constants/analyticsConstants'
import { formatNumber } from '../../utils/numberUtils'
import EmptyState from '../ui/EmptyState'

const axisStyle = { fontSize: 12, fill: 'var(--color-ink-soft)' }
const tooltipFormatter = (value) => formatNumber(value)

const seriesColor = (index) => CHART_COLORS[index % CHART_COLORS.length]

const renderPie = (rows, datasets, isDonut) => {
  const primaryDataset = datasets[0]

  return (
    <PieChart>
      <Tooltip formatter={tooltipFormatter} />
      <Legend />
      <Pie
        data={rows}
        dataKey={primaryDataset.metric}
        nameKey="label"
        innerRadius={isDonut ? '55%' : 0}
        outerRadius="85%"
        paddingAngle={isDonut ? 2 : 0}
        label={(entry) => entry.label}
      >
        {rows.map((row, index) => (
          <Cell key={row.label} fill={seriesColor(index)} />
        ))}
      </Pie>
    </PieChart>
  )
}

const renderCartesian = (chartType, rows, datasets) => {
  const isHorizontal = chartType === CHART_TYPES.HORIZONTAL_BAR
  const stackId = chartType === CHART_TYPES.STACKED_BAR ? 'stack' : undefined

  const series = datasets.map((dataset, index) => {
    const color = seriesColor(index)
    const key = dataset.metric

    switch (chartType) {
      case CHART_TYPES.AREA:
        return (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            name={dataset.label}
            stroke={color}
            fill={color}
            fillOpacity={0.22}
            strokeWidth={2}
          />
        )
      case CHART_TYPES.BAR:
      case CHART_TYPES.HORIZONTAL_BAR:
      case CHART_TYPES.GROUPED_BAR:
      case CHART_TYPES.STACKED_BAR:
        return (
          <Bar
            key={key}
            dataKey={key}
            name={dataset.label}
            fill={color}
            stackId={stackId}
            radius={isHorizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]}
            maxBarSize={48}
          />
        )
      case CHART_TYPES.COMPOSED:
        return index === 0 ? (
          <Bar key={key} dataKey={key} name={dataset.label} fill={color} radius={[6, 6, 0, 0]} maxBarSize={48} />
        ) : (
          <Line key={key} type="monotone" dataKey={key} name={dataset.label} stroke={color} strokeWidth={2} dot={{ r: 3 }} />
        )
      case CHART_TYPES.LINE:
      case CHART_TYPES.MULTI_LINE:
      default:
        return (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            name={dataset.label}
            stroke={color}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        )
    }
  })

  return (
    <ComposedChart
      data={rows}
      layout={isHorizontal ? 'vertical' : 'horizontal'}
      margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
    >
      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
      {isHorizontal ? (
        <>
          <XAxis type="number" tick={axisStyle} tickFormatter={tooltipFormatter} />
          <YAxis type="category" dataKey="label" tick={axisStyle} width={120} />
        </>
      ) : (
        <>
          <XAxis dataKey="label" tick={axisStyle} />
          <YAxis tick={axisStyle} tickFormatter={tooltipFormatter} width={80} />
        </>
      )}
      <Tooltip formatter={tooltipFormatter} />
      <Legend />
      {series}
    </ComposedChart>
  )
}

const AnalyticsChart = memo(
  forwardRef(function AnalyticsChart({ chartType, rows, datasets, height = 380 }, ref) {
    if (!rows?.length || !datasets?.length) {
      return (
        <EmptyState
          title="No chart data"
          description="Run a report with at least one metric to render a chart."
        />
      )
    }

    const isPieFamily = chartType === CHART_TYPES.PIE || chartType === CHART_TYPES.DONUT

    return (
      <div className="analytics-chart" ref={ref}>
        <ResponsiveContainer width="100%" height={height}>
          {isPieFamily
            ? renderPie(rows, datasets, chartType === CHART_TYPES.DONUT)
            : renderCartesian(chartType, rows, datasets)}
        </ResponsiveContainer>
      </div>
    )
  }),
)

export default AnalyticsChart
