import { memo, useMemo } from 'react'
import Button from '../../../components/ui/Button'
import SelectInput from '../../../components/forms/SelectInput'
import MultiSelectInput from '../../../components/forms/MultiSelectInput'
import TextInput from '../../../components/forms/TextInput'
import { MODE_FIELD_CONFIG, REPORT_TYPE_OPTIONS } from '../../../constants/comparisonConstants'
import { getDayOptions, getMonthOptions, getYearOptions } from '../../../utils/dateUtils'
import AggregationSelector from './AggregationSelector'
import ComparisonTypeSelector from './ComparisonTypeSelector'
import MetricSelector from './MetricSelector'

const monthOptions = getMonthOptions()

// Sticky filter bar. Which fields render is driven per comparison mode by
// MODE_FIELD_CONFIG so every mode only shows what it actually uses.
const ComparisonToolbar = memo(function ComparisonToolbar({
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
  // Day picklist for Selected Days — every day inside the chosen range.
  const dayOptions = useMemo(
    () => getDayOptions(values.fromDate, values.toDate),
    [values.fromDate, values.toDate],
  )

  return (
    <section className="comparison-toolbar" aria-label="Comparison filters">
      <div className="comparison-toolbar__fields">
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

        <SelectInput
          label="Report Type"
          name="reportType"
          value={values.reportType}
          onChange={onChange}
          options={REPORT_TYPE_OPTIONS}
          error={errors.reportType}
          placeholder="Select report type"
        />

        <ComparisonTypeSelector
          reportType={values.reportType}
          value={values.mode}
          onChange={onChange}
          error={errors.mode}
        />

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

        {fields.referenceDate ? (
          <TextInput
            type="date"
            label="Reference Day"
            name="referenceDate"
            value={values.referenceDate}
            onChange={onChange}
            error={errors.referenceDate}
          />
        ) : null}

        {fields.fromDate ? (
          <TextInput
            type="date"
            label="From Date"
            name="fromDate"
            value={values.fromDate}
            onChange={onChange}
            error={errors.fromDate}
          />
        ) : null}

        {fields.toDate ? (
          <TextInput
            type="date"
            label="To Date"
            name="toDate"
            value={values.toDate}
            onChange={onChange}
            error={errors.toDate}
          />
        ) : null}

        {fields.comparisonDates ? (
          <MultiSelectInput
            label="Comparison Days"
            name="comparisonDates"
            values={values.comparisonDates}
            onChange={onChange}
            options={dayOptions}
            error={errors.comparisonDates}
            placeholder={dayOptions.length ? 'Select days' : 'Pick a date range first'}
            unitLabel="Day"
          />
        ) : null}

        {fields.date ? (
          <TextInput
            type="date"
            label="Day"
            name="date"
            value={values.date}
            onChange={onChange}
            error={errors.date}
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
          <MetricSelector
            reportType={values.reportType}
            values={values.metrics}
            onChange={onChange}
            error={errors.metrics}
          />
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
