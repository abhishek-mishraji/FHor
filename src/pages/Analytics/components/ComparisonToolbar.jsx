import { memo, useMemo } from "react";
import Button from "../../../components/ui/Button";
import SelectInput from "../../../components/forms/SelectInput";
import MultiSelectInput from "../../../components/forms/MultiSelectInput";
import TextInput from "../../../components/forms/TextInput";
import {
  COMPARISON_MODE_OPTIONS,
  MODE_FIELD_CONFIG,
  REPORT_TYPE_OPTIONS,
} from "../../../constants/comparisonConstants";
import {
  getDayOptions,
  getMonthOptions,
  getYearOptions,
} from "../../../utils/dateUtils";
import ComparisonTypeSelector from "./ComparisonTypeSelector";
import MetricSelector from "./MetricSelector";

const monthOptions = getMonthOptions();

// Sticky filter bar. Which fields render is driven per comparison mode by
// MODE_FIELD_CONFIG so every mode only shows what it actually uses.
// After a comparison runs the bar collapses to a one-line summary so the
// table gets the vertical space; "Adjust Filters" expands it again.
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
  collapsed = false,
  onExpand,
}) {
  const fields = MODE_FIELD_CONFIG[values.mode] || {};
  const yearOptions = useMemo(
    () => getYearOptions(new Date().getFullYear(), 25),
    [],
  );
  // Day picklist for Selected Days — every day inside the chosen range.
  const dayOptions = useMemo(
    () => getDayOptions(values.fromDate, values.toDate),
    [values.fromDate, values.toDate],
  );

  if (collapsed) {
    const summaryChips = [
      storeOptions.find((option) => option.value === String(values.storeId))
        ?.label,
      REPORT_TYPE_OPTIONS.find((option) => option.value === values.reportType)
        ?.label,
      COMPARISON_MODE_OPTIONS.find((option) => option.value === values.mode)
        ?.label,
    ].filter(Boolean);

    return (
      <section
        className="comparison-toolbar comparison-toolbar--collapsed"
        aria-label="Comparison filters (collapsed)"
      >
        <div className="comparison-toolbar__summary">
          <span className="comparison-toolbar__summary-label">Filters</span>
          {summaryChips.map((chip) => (
            <span key={chip} className="comparison-toolbar__chip">
              {chip}
            </span>
          ))}
        </div>
        <div className="comparison-toolbar__summary-actions">
          {exportSlot}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onExpand}
          >
            Adjust Filters
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="comparison-toolbar" aria-label="Comparison filters">
      <div className="comparison-toolbar__scope">
        <SelectInput
          label="Store"
          name="storeId"
          value={values.storeId}
          onChange={onChange}
          options={storeOptions}
          error={errors.storeId}
          placeholder={storesLoading ? "Loading stores..." : "Select a store"}
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
      </div>

      <div className="comparison-toolbar__fields">
        {fields.year ? (
          <SelectInput
            label={fields.comparisonYear ? "Comparison A Year" : "Year"}
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
            label={fields.comparisonMonth ? "Comparison A Month" : "Month"}
            name="month"
            value={values.month}
            onChange={onChange}
            options={monthOptions}
            error={errors.month}
            placeholder="Select month"
          />
        ) : null}

        {fields.comparisonYear ? (
          <SelectInput
            label="Comparison B Year"
            name="comparisonYear"
            value={values.comparisonYear}
            onChange={onChange}
            options={yearOptions}
            error={errors.comparisonYear}
            placeholder="Select year"
          />
        ) : null}

        {fields.comparisonMonth ? (
          <SelectInput
            label="Comparison B Month"
            name="comparisonMonth"
            value={values.comparisonMonth}
            onChange={onChange}
            options={monthOptions}
            error={errors.comparisonMonth}
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
            placeholder={
              dayOptions.length ? "Select days" : "Pick a date range first"
            }
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

        {/* <AggregationSelector
          value={values.aggregate}
          onChange={onChange}
          error={errors.aggregate}
        /> */}
      </div>

      <div className="comparison-toolbar__actions">
        <Button
          type="button"
          variant="ghost"
          onClick={onReset}
          disabled={comparing}
        >
          Reset
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled
          title="Saved views are coming soon"
        >
          Save View
        </Button>
        <span
          className="comparison-toolbar__actions-spacer"
          aria-hidden="true"
        />
        {exportSlot}
        <Button
          type="button"
          variant="primary"
          className="comparison-toolbar__compare"
          onClick={onCompare}
          isLoading={comparing}
        >
          Compare
        </Button>
      </div>
    </section>
  );
});

export default ComparisonToolbar;
