import { memo } from 'react'
import SelectInput from '../../../components/forms/SelectInput'
import { COMPARISON_MODE_OPTIONS } from '../../../constants/comparisonConstants'

// Comparison mode dropdown with the mockup's "About this comparison" hint
// shown for the active mode.
const ComparisonTypeSelector = memo(function ComparisonTypeSelector({ value, onChange, error }) {
  const activeOption = COMPARISON_MODE_OPTIONS.find((option) => option.value === value)

  return (
    <div className="comparison-type-selector">
      <SelectInput
        label="Comparison Type"
        name="mode"
        value={value}
        onChange={onChange}
        options={COMPARISON_MODE_OPTIONS}
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
