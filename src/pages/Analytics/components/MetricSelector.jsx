import { memo } from 'react'
import MultiSelectInput from '../../../components/forms/MultiSelectInput'
import { MONTHLY_METRICS } from '../../../constants/comparisonConstants'

const METRIC_OPTIONS = MONTHLY_METRICS.map((metric) => ({
  label: metric.label,
  value: metric.key,
}))

const MetricSelector = memo(function MetricSelector({ values, onChange, error }) {
  return (
    <MultiSelectInput
      label="Metrics"
      name="metrics"
      values={values}
      onChange={onChange}
      options={METRIC_OPTIONS}
      error={error}
      placeholder="Select metrics"
      searchable={false}
      unitLabel="Metric"
    />
  )
})

export default MetricSelector
