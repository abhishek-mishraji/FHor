import { useCallback, useContext, useMemo, useRef, useState } from "react";
import "../../page-styles/Analytics/Analytics.css";
import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/ui/EmptyState";
import { AppContext } from "../../context/appContext";
import { useApi } from "../../hooks/useApi";
import { usePermissions } from "../../hooks/usePermissions";
import monthlyReportService from "../../services/monthlyReportService";
import storeService from "../../services/storeService";
import {
  buildDefaultFilters,
  COMPARISON_MODES,
  DEFAULT_COLUMN_PREFS,
  DEFAULT_METRICS_BY_REPORT_TYPE,
  DEFAULT_MODE_BY_REPORT_TYPE,
  REPORT_TYPES,
} from "../../constants/comparisonConstants";
import {
  buildComparisonColumns,
  computeSummary,
  formatMetricValue,
  getDeltaTone,
  getVisibleColumnGroups,
} from "../../utils/comparisonUtils";
import {
  buildExportMatrix,
  exportCsv,
  exportExcel,
  exportPdf,
} from "../../utils/exportUtils";
import { validateComparisonForm } from "../../validations/comparisonValidation";
import ColumnSelector from "./components/ColumnSelector";
import ComparisonTable from "./components/ComparisonTable";
import ComparisonToolbar from "./components/ComparisonToolbar";
import ExportActions from "./components/ExportActions";
import { useComparisonQuery } from "./hooks/useComparisonQuery";

const NUMERIC_FIELDS = new Set([
  "year",
  "month",
  "comparisonYear",
  "comparisonMonth",
  "referenceMonth",
]);
const NUMERIC_ARRAY_FIELDS = new Set(["years", "comparisonMonths"]);

const SUMMARY_CARD_ROWS = [
  { key: "sum", label: "SUM" },
  { key: "avg", label: "AVERAGE" },
  { key: "min", label: "MINIMUM" },
  { key: "max", label: "MAXIMUM" },
];

const buildPdfColumns = (columns, result) =>
  columns.map((column) => {
    if (column.key === "label" && result.rowDimension === "Department") {
      return { ...column, header: "Department Sales" };
    }

    if (column.key.endsWith(".current")) {
      return { ...column, header: result.currentHeader || column.header };
    }

    if (column.key.endsWith(".previous")) {
      return { ...column, header: result.previousHeader || column.header };
    }

    if (column.key.endsWith(".difference")) {
      return { ...column, header: "$ Difference YOY" };
    }

    if (column.key.endsWith(".pctDifference")) {
      return { ...column, header: "% Difference YOY" };
    }

    return column;
  });

const sortRowsByPercentageDifference = (rows, columns) => {
  const percentageColumn = columns.find((column) =>
    column.key.endsWith(".pctDifference"),
  );

  if (!percentageColumn?.accessor) {
    return rows;
  }

  return [...rows].sort((firstRow, secondRow) => {
    const firstValue = percentageColumn.accessor(firstRow);
    const secondValue = percentageColumn.accessor(secondRow);
    const firstPercentage = Number.isFinite(firstValue)
      ? firstValue
      : Number.NEGATIVE_INFINITY;
    const secondPercentage = Number.isFinite(secondValue)
      ? secondValue
      : Number.NEGATIVE_INFINITY;

    return secondPercentage - firstPercentage;
  });
};

const AnalyticsPage = () => {
  const { notify } = useContext(AppContext);
  const { isAdmin } = usePermissions();

  const [filters, setFilters] = useState(buildDefaultFilters);
  const [errors, setErrors] = useState({});
  const [columnPrefs, setColumnPrefs] = useState(DEFAULT_COLUMN_PREFS);
  const [lastRun, setLastRun] = useState(null);
  const [exporting, setExporting] = useState(false);
  // UI-only: the filter toolbar collapses to a summary bar after a successful
  // Compare so the table gets the vertical space.
  const [toolbarCollapsed, setToolbarCollapsed] = useState(false);
  const exportRowsRef = useRef([]);

  const handleVisibleRowsChange = useCallback((rows) => {
    exportRowsRef.current = rows;
  }, []);

  const comparisonQuery = useComparisonQuery({ isAdmin, notify });
  const { result } = comparisonQuery;

  const storesQuery = useApi(
    ({ signal }) =>
      isAdmin
        ? storeService.getStores({}, { signal })
        : storeService.getClientStores({ signal }),
    { deps: [isAdmin], initialData: [] },
  );

  const storeOptions = useMemo(
    () =>
      (storesQuery.data || []).map((store) => ({
        label: store.storeName,
        value: String(store.storeId),
      })),
    [storesQuery.data],
  );

  // Clients start on their first accessible store so the page works without
  // an extra click; owners/partners with several stores can switch freely.
  // Derived (not stored) so it never fights an explicit selection.
  const effectiveFilters = useMemo(() => {
    if (isAdmin || filters.storeId || !storeOptions.length) {
      return filters;
    }

    return { ...filters, storeId: storeOptions[0].value };
  }, [isAdmin, filters, storeOptions]);

  // There is no departments endpoint: department names are discovered from
  // the monthly reports of the selected store. Daily reports have no
  // departments, so the lookup is skipped entirely for them.
  const departmentsQuery = useApi(
    async ({ signal }) => {
      if (
        !effectiveFilters.storeId ||
        ![REPORT_TYPES.MONTHLY, REPORT_TYPES.LOTTERY_MONTHLY].includes(
          effectiveFilters.reportType,
        )
      ) {
        return [];
      }

      return isAdmin
        ? monthlyReportService.getAdminReports(
            { storeId: effectiveFilters.storeId },
            { signal },
          )
        : monthlyReportService.getClientReportsByStore(
            effectiveFilters.storeId,
            { signal },
          );
    },
    { deps: [isAdmin, effectiveFilters.storeId], initialData: [] },
  );

  const departmentNames = useMemo(() => {
    const names = new Map();

    for (const report of departmentsQuery.data || []) {
      if (report.departmentId && !names.has(String(report.departmentId))) {
        names.set(
          String(report.departmentId),
          report.departmentName || String(report.departmentId),
        );
      }
    }

    return names;
  }, [departmentsQuery.data]);

  const departmentOptions = useMemo(
    () =>
      [...departmentNames.entries()]
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([departmentId, departmentName]) => ({
          value: departmentId,
          label:
            departmentName === departmentId
              ? departmentId
              : `${departmentName} (${departmentId})`,
        })),
    [departmentNames],
  );

  const handleChange = (event) => {
    const { name, value } = event.target;

    // Switching report type swaps the whole mode/metric vocabulary, so both
    // reset to that type's defaults; store and aggregate carry over.
    if (name === "reportType") {
      setFilters((previous) => ({
        ...previous,
        reportType: value,
        mode: DEFAULT_MODE_BY_REPORT_TYPE[value],
        metrics: DEFAULT_METRICS_BY_REPORT_TYPE[value],
        departmentId: "",
        comparisonDates: [],
      }));
      setErrors({});
      return;
    }

    const nextValue = NUMERIC_FIELDS.has(name)
      ? value === ""
        ? ""
        : Number(value)
      : NUMERIC_ARRAY_FIELDS.has(name)
        ? value.map(Number)
        : value;

    setFilters((previous) => ({ ...previous, [name]: nextValue }));
    setErrors((previous) => {
      if (!previous[name]) {
        return previous;
      }

      const next = { ...previous };
      delete next[name];

      return next;
    });
  };

  const handleCompare = () => {
    const validationErrors = validateComparisonForm(effectiveFilters);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length) {
      notify({
        type: "error",
        title: "Check the filters",
        message: "Fix the highlighted fields and run the comparison again.",
      });
      return;
    }

    // Column visibility follows the newly selected metrics on every run.
    setColumnPrefs((previous) => ({ ...previous, visibleMetrics: null }));
    setLastRun(effectiveFilters);
    setToolbarCollapsed(true);
    comparisonQuery.run(effectiveFilters, departmentNames);
  };

  const handleReset = () => {
    setFilters(buildDefaultFilters());
    setErrors({});
    setColumnPrefs(DEFAULT_COLUMN_PREFS);
    setLastRun(null);
    setToolbarCollapsed(false);
    comparisonQuery.reset();
  };

  const columns = useMemo(
    () => (result ? buildComparisonColumns(result, columnPrefs) : []),
    [result, columnPrefs],
  );

  const summaryGroups = useMemo(
    () =>
      result
        ? getVisibleColumnGroups(result, columnPrefs).filter(
            (group) => group.kind === "delta" && !group.deltaOnly,
          )
        : [],
    [result, columnPrefs],
  );

  const metricOptions = useMemo(
    () =>
      (result?.columnGroups || [])
        .filter((group) => group.metric)
        .map((group) => ({ value: group.metric, label: group.label })),
    [result],
  );

  const buildSummaryCards = () =>
    result?.summaryEnabled
      ? summaryGroups.flatMap((group) => {
          const summary = computeSummary(result.rows, group.key);

          return SUMMARY_CARD_ROWS.map((row) => ({
            label: `${row.label} — ${group.label}`,
            value: formatMetricValue(group.metric, summary.current[row.key]),
            caption:
              summary.previous[row.key] === null
                ? undefined
                : `${result.previousHeader || "Previous"}: ${formatMetricValue(group.metric, summary.previous[row.key])}`,
          }));
        })
      : undefined;

  const buildPdfSummaryCards = () =>
    result?.summaryEnabled
      ? summaryGroups.map((group) => {
          const summary = computeSummary(result.rows, group.key);
          const difference =
            summary.current.sum === null || summary.previous.sum === null
              ? null
              : summary.current.sum - summary.previous.sum;
          const tone = getDeltaTone(group.metric, difference);
          const previousTone =
            tone === "positive"
              ? "negative"
              : tone === "negative"
                ? "positive"
                : null;
          const yoyPercentage =
            difference === null || summary.previous.sum === 0
              ? null
              : (difference / summary.previous.sum) * 100;

          return {
            label: `TOTAL — ${group.label}`,
            tone,
            yoyPercentage:
              yoyPercentage === null
                ? "-"
                : `${yoyPercentage >= 0 ? "+" : ""}${yoyPercentage.toFixed(2)}%`,
            periods: [
              {
                label: result.currentHeader || "Current",
                value: formatMetricValue(group.metric, summary.current.sum),
                tone,
              },
              {
                label: result.previousHeader || "Previous",
                value: formatMetricValue(group.metric, summary.previous.sum),
                tone: previousTone,
              },
            ],
          };
        })
      : undefined;

  const handleExport = async (format) => {
    if (!result) {
      return;
    }

    setExporting(true);

    try {
      const rowsForExport = exportRowsRef.current?.length
        ? exportRowsRef.current
        : result.rows;
      const matrix = buildExportMatrix(columns, rowsForExport);
      const pdfColumns = buildPdfColumns(columns, result);
      const pdfRows = sortRowsByPercentageDifference(rowsForExport, pdfColumns);
      const pdfMatrix = buildExportMatrix(pdfColumns, pdfRows);
      const summaryCards = buildSummaryCards();
      const pdfSummaryCards = buildPdfSummaryCards();
      const filename = `analytics-comparison-${result.mode.toLowerCase().replaceAll("_", "-")}-${new Date().toISOString().slice(0, 10)}`;
      const storeName = storeOptions.find(
        (option) => option.value === String(lastRun?.storeId),
      )?.label;
      const exportTitle =
        lastRun?.reportType === REPORT_TYPES.DAILY
          ? "Daily Merchandise Comparison"
          : lastRun?.reportType === REPORT_TYPES.GAS_MONTHLY
            ? "Gas Sales Comparison"
            : lastRun?.reportType === REPORT_TYPES.LOTTERY_MONTHLY
              ? "Lottery Sales Comparison"
              : "Monthly Merchandise Comparison";

      if (format === "csv") {
        exportCsv(matrix, filename);
      } else if (format === "excel") {
        exportExcel(matrix, filename, { summaryCards });
      } else {
        await exportPdf({
          title: exportTitle,
          subtitle: result.title,
          storeName,
          matrix: pdfMatrix,
          summaryCards: pdfSummaryCards,
        });
      }

      notify({
        type: "success",
        title: "Export ready",
        message:
          format === "pdf"
            ? "Use the print dialog to save the PDF."
            : "Download started.",
      });
    } catch (error) {
      notify({
        type: "error",
        title: "Export failed",
        message: error.message || "Could not export the comparison.",
      });
    } finally {
      setExporting(false);
    }
  };

  const showResults =
    Boolean(result) ||
    comparisonQuery.loading ||
    Boolean(comparisonQuery.error);
  const showMetricSection =
    result?.mode !== COMPARISON_MODES.METRIC &&
    result?.mode !== COMPARISON_MODES.YEAR_OVER_YEAR &&
    result?.mode !== COMPARISON_MODES.DAILY_METRIC;

  return (
    <div className="analytics">
      <PageHeader
        eyebrow="Analytics"
        title="Report Comparison"
        description="Compare sales performance across days, months, years, departments, and metrics."
      />

      <ComparisonToolbar
        values={effectiveFilters}
        errors={errors}
        onChange={handleChange}
        storeOptions={storeOptions}
        storesLoading={storesQuery.loading}
        departmentOptions={departmentOptions}
        onCompare={handleCompare}
        onReset={handleReset}
        comparing={comparisonQuery.loading}
        collapsed={toolbarCollapsed}
        onExpand={() => setToolbarCollapsed(false)}
        exportSlot={
          <ExportActions
            disabled={!result}
            exporting={exporting}
            onExport={handleExport}
          />
        }
      />

      {showResults ? (
        <div className="analytics__results">
          {result?.title && !comparisonQuery.error ? (
            <p className="analytics__result-title">{result.title}</p>
          ) : null}

          <ComparisonTable
            columns={columns}
            rows={result?.rows || []}
            loading={comparisonQuery.loading}
            error={comparisonQuery.error}
            onRetry={comparisonQuery.retry}
            onVisibleRowsChange={handleVisibleRowsChange}
            searchPlaceholder={`Search by ${(result?.rowDimension || "row").toLowerCase()}...`}
            toolbar={
              <ColumnSelector
                columnPrefs={columnPrefs}
                onChange={setColumnPrefs}
                metricOptions={metricOptions}
                showMetricSection={showMetricSection}
              />
            }
          />

          {/* {result?.summaryEnabled && !comparisonQuery.loading && !comparisonQuery.error ? (
            <SummaryTable
              result={result}
              visibleGroups={summaryGroups}
              aggregate={lastRun?.aggregate}
            />
          ) : null} */}
        </div>
      ) : (
        <div className="analytics__placeholder">
          <EmptyState
            title="Run your first comparison"
            description="Choose a comparison type, set the filters above, and press Compare to build the report."
          />
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
