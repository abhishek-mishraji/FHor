import { memo } from "react";
import MultiSelectInput from "../../../components/forms/MultiSelectInput";
import {
  DAILY_METRICS,
  GAS_METRICS,
  LOTTERY_METRICS,
  MONTHLY_METRICS,
  REPORT_TYPES,
} from "../../../constants/comparisonConstants";

const toOptions = (metrics) =>
  metrics.map((metric) => ({ label: metric.label, value: metric.key }));

const METRIC_OPTIONS_BY_REPORT_TYPE = {
  [REPORT_TYPES.MONTHLY]: toOptions(MONTHLY_METRICS),
  [REPORT_TYPES.DAILY]: toOptions(DAILY_METRICS),
  [REPORT_TYPES.GAS_MONTHLY]: toOptions(GAS_METRICS),
  [REPORT_TYPES.LOTTERY_MONTHLY]: toOptions(LOTTERY_METRICS),
};

const MetricSelector = memo(function MetricSelector({
  reportType = REPORT_TYPES.MONTHLY,
  values,
  onChange,
  error,
}) {
  return (
    <MultiSelectInput
      label="Metrics"
      name="metrics"
      values={values}
      onChange={onChange}
      options={
        METRIC_OPTIONS_BY_REPORT_TYPE[reportType] ||
        METRIC_OPTIONS_BY_REPORT_TYPE.MONTHLY
      }
      error={error}
      placeholder="Select metrics"
      searchable={false}
      unitLabel="Metric"
    />
  );
});

export default MetricSelector;
