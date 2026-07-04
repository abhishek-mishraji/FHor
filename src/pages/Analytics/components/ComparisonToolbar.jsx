import { memo, useMemo } from 'react'
import Button from '../../../components/ui/Button'
import SelectInput from '../../../components/forms/SelectInput'
import MultiSelectInput from '../../../components/forms/MultiSelectInput'
import { MODE_FIELD_CONFIG } from '../../../constants/comparisonConstants'
import { getMonthOptions, getYearOptions } from '../../../utils/dateUtils'
import AggregationSelector from './AggregationSelector'
import ComparisonTypeSelector from './ComparisonTypeSelector'
import MetricSelector from './MetricSelector'

const monthOptions = getMonthOptions()

// Sticky filter bar. Which fields render is driven per comparison mode by
// MODE_FIELD_CONFIG so every mode only shows what it actually uses.
const ComparisonToolbar = memo(function ComparisonToolbar({
  isAdmin,
  values,
  errors,
  onChange,
  storeOptions = [],
  storesLoading = false,
  departmentOptions = [],
  onCompare,
  onReset,
  comparing = false,
  exportSlot = null,
}) {
  const fields = MODE_FIELD_CONFIG[values.mode] || {}
  const yearOptions = useMemo(() => getYearOptions(), [])

  return (
    <section className="comparison-toolbar" aria-label="Comparison filters">
      <div className="comparison-toolbar__fields">
        {isAdmin ? (
          <SelectInput
            label="Store"
            name="storeId"
            value={values.storeId}
            onChange={onChange}
            options={storeOptions}
            error={errors.storeId}
            placeholder={storesLoading ? 'Loading stores...' : 'Select a store'}
            disabled={storesLoading}
          />
        ) : null}

        <ComparisonTypeSelector value={values.mode} onChange={onChange} error={errors.mode} />

        {fields.year ? (
          <SelectInput
            label="Year"
            name="year"
            value={values.year}
            onChange={onChange}
            options={yearOptions}
            error={errors.year}
            placeholder="Select year"
          />
        ) : null}

        {fields.years ? (
          <MultiSelectInput
            label="Years"
            name="years"
            values={values.years}
            onChange={onChange}
            options={yearOptions}
            error={errors.years}
            placeholder="Select years"
            searchable={false}
            unitLabel="Year"
          />
        ) : null}

        {fields.month ? (
          <SelectInput
            label="Month"
            name="month"
            value={values.month}
            onChange={onChange}
            options={monthOptions}
            error={errors.month}
            placeholder="Select month"
          />
        ) : null}

        {fields.referenceMonth ? (
          <SelectInput
            label="Reference Month"
            name="referenceMonth"
            value={values.referenceMonth}
            onChange={onChange}
            options={monthOptions}
            error={errors.referenceMonth}
            placeholder="Select reference month"
          />
        ) : null}

        {fields.comparisonMonths ? (
          <MultiSelectInput
            label="Comparison Months"
            name="comparisonMonths"
            values={values.comparisonMonths}
            onChange={onChange}
            options={monthOptions}
            error={errors.comparisonMonths}
            placeholder="Select months"
            searchable={false}
            unitLabel="Month"
          />
        ) : null}

        {fields.department ? (
          <SelectInput
            label="Department"
            name="departmentId"
            value={values.departmentId}
            onChange={onChange}
            options={departmentOptions}
            error={errors.departmentId}
            placeholder="All departments"
          />
        ) : null}

        {fields.metrics ? (
          <MetricSelector values={values.metrics} onChange={onChange} error={errors.metrics} />
        ) : null}

        <AggregationSelector
          value={values.aggregate}
          onChange={onChange}
          error={errors.aggregate}
        />
      </div>

      <div className="comparison-toolbar__actions">
        <Button type="button" variant="primary" onClick={onCompare} isLoading={comparing}>
          Compare
        </Button>
        <Button type="button" variant="ghost" onClick={onReset} disabled={comparing}>
          Reset
        </Button>
        {exportSlot}
        <Button type="button" variant="secondary" disabled title="Saved views are coming soon">
          Save View
        </Button>
      </div>
    </section>
  )
})

export default ComparisonToolbar
