import { memo } from 'react'
import SelectInput from '../../../components/forms/SelectInput'
import { AGGREGATE_OPTIONS } from '../../../constants/comparisonConstants'

const AggregationSelector = memo(function AggregationSelector({ value, onChange, error }) {
  return (
    <SelectInput
      label="Aggregation"
      name="aggregate"
      value={value}
      onChange={onChange}
      options={AGGREGATE_OPTIONS}
      error={error}
      placeholder="Select aggregation"
    />
  )
})

export default AggregationSelector
