import { memo, useMemo } from 'react'
import SelectInput from '../../../components/forms/SelectInput'
import { COMPARISON_MODE_OPTIONS, REPORT_TYPES } from '../../../constants/comparisonConstants'

// Comparison mode dropdown with the mockup's "About this comparison" hint
// shown for the active mode. Modes are scoped to the active report type.
const ComparisonTypeSelector = memo(function ComparisonTypeSelector({
  reportType = REPORT_TYPES.MONTHLY,
  value,
  onChange,
  error,
}) {
  const options = useMemo(
    () => COMPARISON_MODE_OPTIONS.filter((option) => option.reportType === reportType),
    [reportType],
  )
  const activeOption = options.find((option) => option.value === value)

  return (
    <div className="comparison-type-selector">
      <SelectInput
        label="Comparison Type"
        name="mode"
        value={value}
        onChange={onChange}
        options={options}
        error={error}
        placeholder="Select comparison type"
      />
      {activeOption ? (
        <p className="comparison-type-selector__hint">{activeOption.description}</p>
      ) : null}
    </div>
  )
})

export default ComparisonTypeSelector
