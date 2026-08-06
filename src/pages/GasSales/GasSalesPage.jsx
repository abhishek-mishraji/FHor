import { useContext, useEffect, useMemo, useState } from "react";
import { AppContext } from "../../context/appContext";
import PageHeader from "../../components/common/PageHeader";
import DataTable from "../../components/common/DataTable";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import SelectInput from "../../components/forms/SelectInput";
import TextInput from "../../components/forms/TextInput";
import { useApi } from "../../hooks/useApi";
import { usePermissions } from "../../hooks/usePermissions";
import { useTable } from "../../hooks/useTable";
import storeService from "../../services/storeService";
import gasSalesService from "../../services/gasSalesService";
import { handleServiceError } from "../../utils/errorHandler";
import { formatNumber, formatCurrency } from "../../utils/numberUtils";
import { getMonthOptions, getYearOptions } from "../../utils/dateUtils";
import "../../page-styles/MonthlyReports/MonthlyReports.css";
import validateGasForm from "../../validations/gasValidation";

const ALL_COLUMNS = [
  {
    key: "storeName",
    header: "Store",
    sticky: true,
    render: (r) => r.storeName ?? "—",
  },
  {
    key: "reportMonth",
    header: "Month",
    render: (r) => `${r.reportMonth}/${r.reportYear}`,
  },
  {
    key: "creditFees",
    header: "Credit fees",
    render: (r) => formatCurrency(r.creditFees),
  },
  {
    key: "totalVolumeSold",
    header: "Total volume",
    render: (r) => formatNumber(r.totalVolumeSold),
  },
  {
    key: "netProfitPerGallon",
    header: "Net profit / gal",
    render: (r) => formatCurrency(r.netProfitPerGallon),
  },
  {
    key: "netProfit",
    header: "Net profit",
    render: (r) => formatCurrency(r.netProfit),
  },
];

const DEFAULT_VISIBLE_KEYS = [
  "storeName",
  "reportMonth",
  "totalVolumeSold",
  "creditFees",
  "netProfitPerGallon",
  "netProfit",
];

const initialForm = {
  storeId: "",
  reportMonth: "",
  reportYear: "",
  creditFees: "",
  totalVolumeSold: "",
  netProfit: "",
  netProfitPerGallon: "",
  details: [],
};

const getReportId = (report) =>
  report?.reportId ?? report?.gasSalesReportMonthlyId;

const normalizeDetails = (details = []) =>
  details.map((detail) => ({
    fuelTypeId: detail.fuelTypeId,
    fuelName: detail.fuelName || detail.fuelType || "Fuel type",
    volumeSold: detail.volumeSold ?? detail.volume ?? "",
    profitPerGallon: detail.profitPerGallon ?? "",
  }));

const GasSalesPage = () => {
  const { notify } = useContext(AppContext);
  const { isAdmin } = usePermissions();

  const [filters, setFilters] = useState({ storeId: "" });
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewReport, setViewReport] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const storesQuery = useApi(
    () => (isAdmin ? storeService.getStores() : storeService.getClientStores()),
    { initialData: [] },
  );

  const reportsQuery = useApi(
    () => {
      if (isAdmin) return gasSalesService.getAdminReports(filters);
      if (!filters.storeId) return Promise.resolve([]);
      return gasSalesService.getClientReportsByStore(filters.storeId);
    },
    {
      initialData: [],
      deps: [filters.storeId, isAdmin],
      onError: (e) =>
        notify({
          type: "error",
          title: "Load failed",
          message: handleServiceError(e).message,
        }),
    },
  );

  useEffect(() => {
    if (!isModalOpen || !form.storeId || selected) {
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const fuelTypes = await storeService.getStoreFuelTypes(form.storeId);
        if (cancelled) return;
        setForm((prev) => {
          if (prev.details && prev.details.length) return prev;
          const rows = fuelTypes.map((ft) => ({
            fuelTypeId: ft.fuelTypeId,
            fuelName: ft.fuelName,
            volumeSold: "",
            profitPerGallon: "",
          }));
          return { ...prev, details: rows };
        });
      } catch (error) {
        if (!cancelled) {
          notify({
            type: "error",
            title: "Fuel types unavailable",
            message: handleServiceError(error).message,
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [form.storeId, isModalOpen, notify, selected]);

  const storeOptions = useMemo(
    () =>
      (storesQuery.data || []).map((s) => ({
        label: s.storeName,
        value: String(s.storeId),
      })),
    [storesQuery.data],
  );

  const { pageItems } = useTable({
    data: reportsQuery.data || [],
    searchTerm: "",
    searchFields: ["storeName"],
    sortFn: (a, b) =>
      String(b.reportYear || "").localeCompare(String(a.reportYear || "")),
  });

  const openCreate = () => {
    setSelected(null);
    setForm(() => ({ ...initialForm, storeId: filters.storeId || "" }));
    setErrors({});
    setIsModalOpen(true);
  };
  const openEdit = async (report) => {
    setDetailsLoading(true);
    try {
      const detailedReport = await gasSalesService.getAdminReportById(
        getReportId(report),
      );
      setSelected(detailedReport);
      setForm({
        ...detailedReport,
        details: normalizeDetails(detailedReport.details),
      });
      setErrors({});
      setIsModalOpen(true);
    } catch (error) {
      notify({
        type: "error",
        title: "Load failed",
        message: handleServiceError(error).message,
      });
    } finally {
      setDetailsLoading(false);
    }
  };
  const openView = async (report) => {
    setDetailsLoading(true);
    try {
      const detailedReport = isAdmin
        ? await gasSalesService.getAdminReportById(getReportId(report))
        : report;
      setViewReport({
        ...detailedReport,
        details: normalizeDetails(detailedReport.details),
      });
    } catch (error) {
      notify({
        type: "error",
        title: "Load failed",
        message: handleServiceError(error).message,
      });
    } finally {
      setDetailsLoading(false);
    }
  };
  const closeModal = () => {
    setSelected(null);
    setForm(initialForm);
    setErrors({});
    setIsModalOpen(false);
  };

  const setDetailValue = (index, field, value) => {
    setForm((prev) => {
      const next = {
        ...prev,
        details: Array.isArray(prev.details) ? [...prev.details] : [],
      };
      next.details[index] = { ...next.details[index], [field]: value };
      return next;
    });
  };

  const handleStoreChange = (event) => {
    const { value } = event.target;
    setSelected(null);
    setForm((previous) => ({ ...previous, storeId: value, details: [] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const validationErrors = validateGasForm(form);
      setErrors(validationErrors);

      if (Object.keys(validationErrors).length) {
        notify({
          type: "error",
          title: "Fix fields",
          message: "Please correct highlighted fields.",
        });
        return;
      }

      const payload = {
        storeId: Number(form.storeId),
        reportMonth: Number(form.reportMonth),
        reportYear: Number(form.reportYear),
        creditFees: form.creditFees === "" ? 0 : Number(form.creditFees),
        totalVolumeSold: form.totalVolumeSold === "" ? 0 : Number(form.totalVolumeSold),
        netProfit: form.netProfit === "" ? 0 : Number(form.netProfit),
        netProfitPerGallon: form.netProfitPerGallon === "" ? 0 : Number(form.netProfitPerGallon),
        details: form.details.map((detail) => ({
          fuelTypeId: Number(detail.fuelTypeId),
          volumeSold: Number(detail.volumeSold),
          profitPerGallon: Number(detail.profitPerGallon),
        })),
      };
      const saved = selected
        ? await gasSalesService.updateReport(getReportId(selected), payload)
        : await gasSalesService.createReport(payload);
      reportsQuery.setData((current) =>
        !selected
          ? [saved, ...(current || [])]
          : (current || []).map((r) =>
              getReportId(r) === getReportId(saved) ? saved : r,
            ),
      );
      notify({
        type: "success",
        title: selected ? "Updated" : "Created",
        message: "Gas sales report saved.",
      });
      closeModal();
    } catch (err) {
      const details = handleServiceError(err);
      setErrors(details.fieldErrors || {});
      notify({ type: "error", title: "Save failed", message: details.message });
    }
  };

  const handleDelete = async (report) => {
    if (!window.confirm("Delete this report?")) return;
    try {
      await gasSalesService.deleteReport(getReportId(report));
      reportsQuery.setData((current) =>
        (current || []).filter((r) => getReportId(r) !== getReportId(report)),
      );
      notify({ type: "success", title: "Deleted", message: "Report removed." });
    } catch (err) {
      notify({
        type: "error",
        title: "Delete failed",
        message: handleServiceError(err).message,
      });
    }
  };

  const tableColumns = ALL_COLUMNS.filter((column) =>
    DEFAULT_VISIBLE_KEYS.includes(column.key),
  )
    .map((column) => ({
      key: column.key,
      header: column.header,
      render: column.render,
    }))
    .concat([
      {
        key: "view",
        header: "",
        render: (row) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              openView(row);
            }}
          >
            View
          </Button>
        ),
      },
      ...(isAdmin
        ? [
            {
              key: "actions",
              header: "",
              render: (row) => (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(event) => {
                    event.stopPropagation();
                    openEdit(row);
                  }}
                >
                  Edit
                </Button>
              ),
            },
          ]
        : []),
    ]);

  return (
    <div className="monthly-reports-page">
      <PageHeader
        eyebrow="Gas"
        title="Gas sales"
        description="Manage monthly gas sales reports."
        actions={
          isAdmin ? <Button onClick={openCreate}>New gas report</Button> : null
        }
      />

      <div className="mr-filter-bar">
        <div className="mr-filter-bar__body">
          <div className="mr-filter-bar__row">
            <div className="mr-filter-bar__field">
              <SelectInput
                label="Store"
                name="storeId"
                value={filters.storeId}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, storeId: e.target.value }))
                }
                options={storeOptions}
              />
            </div>
          </div>
        </div>
      </div>

      <DataTable
        columns={tableColumns}
        rows={pageItems || []}
        keyField={getReportId}
        onRowClick={openView}
      />

      <Modal
        isOpen={isModalOpen}
        title={selected ? "Edit gas report" : "New gas report"}
        onClose={closeModal}
        footer={
          <>
            <Button variant="ghost" onClick={closeModal}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              Save
            </Button>
          </>
        }
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <SelectInput
            label="Store"
            name="storeId"
            value={form.storeId}
            onChange={handleStoreChange}
            options={storeOptions}
            error={errors.storeId}
          />
          <SelectInput
            label="Month"
            name="reportMonth"
            value={form.reportMonth}
            onChange={(e) =>
              setForm((f) => ({ ...f, reportMonth: e.target.value }))
            }
            options={getMonthOptions()}
            placeholder="Select month"
            error={errors.reportMonth}
          />
          <SelectInput
            label="Year"
            name="reportYear"
            value={form.reportYear}
            onChange={(e) =>
              setForm((f) => ({ ...f, reportYear: e.target.value }))
            }
            options={getYearOptions()}
            placeholder="Select year"
            error={errors.reportYear}
          />
          <TextInput
            label="Total volume sold"
            name="totalVolumeSold"
            value={form.totalVolumeSold}
            onChange={(e) =>
              setForm((f) => ({ ...f, totalVolumeSold: e.target.value }))
            }
            error={errors.totalVolumeSold}
          />
          <TextInput
            label="Net profit"
            name="netProfit"
            value={form.netProfit}
            onChange={(e) =>
              setForm((f) => ({ ...f, netProfit: e.target.value }))
            }
            error={errors.netProfit}
          />
          <TextInput
            label="Net profit / gallon"
            name="netProfitPerGallon"
            value={form.netProfitPerGallon}
            onChange={(e) =>
              setForm((f) => ({ ...f, netProfitPerGallon: e.target.value }))
            }
            error={errors.netProfitPerGallon}
          />
          <TextInput
            label="Credit fees"
            name="creditFees"
            value={form.creditFees}
            onChange={(e) =>
              setForm((f) => ({ ...f, creditFees: e.target.value }))
            }
            error={errors.creditFees}
          />
          {Array.isArray(form.details) && form.details.length ? (
            <div className="form-grid__full">
              <h4>Fuel details</h4>
              {form.details.map((d, idx) => (
                <div
                  key={d.fuelTypeId || idx}
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <div style={{ minWidth: 160 }}>
                    {d.fuelName || d.fuelTypeId}
                  </div>
                  <TextInput
                    label="Volume sold"
                    name={`details.${idx}.volumeSold`}
                    value={d.volumeSold}
                    onChange={(e) =>
                      setDetailValue(idx, "volumeSold", e.target.value)
                    }
                    error={errors[`details.${idx}.volumeSold`]}
                  />
                  <TextInput
                    label="Profit / gal"
                    name={`details.${idx}.profitPerGallon`}
                    value={d.profitPerGallon}
                    onChange={(e) =>
                      setDetailValue(idx, "profitPerGallon", e.target.value)
                    }
                    error={errors[`details.${idx}.profitPerGallon`]}
                  />
                </div>
              ))}
            </div>
          ) : null}
          {errors.details ? (
            <p className="form-error">{errors.details}</p>
          ) : null}
        </form>
        {selected ? (
          <div style={{ marginTop: 12 }}>
            <Button variant="secondary" onClick={() => handleDelete(selected)}>
              Delete
            </Button>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={Boolean(viewReport)}
        title="Gas sales report"
        onClose={() => setViewReport(null)}
        footer={
          <Button variant="primary" onClick={() => setViewReport(null)}>
            Close
          </Button>
        }
      >
        {detailsLoading ? <p>Loading report details...</p> : null}
        {viewReport ? (
          <div className="form-grid">
            <p>
              <strong>Store:</strong>{" "}
              {viewReport.storeName || viewReport.storeId}
            </p>
            <p>
              <strong>Period:</strong> {viewReport.reportMonth}/
              {viewReport.reportYear}
            </p>
            <p>
              <strong>Credit fees:</strong>{" "}
              {formatCurrency(viewReport.creditFees)}
            </p>
            <p>
              <strong>Total volume:</strong>{" "}
              {formatNumber(viewReport.totalVolumeSold)}
            </p>
            <p>
              <strong>Net profit / gal:</strong>{" "}
              {formatCurrency(viewReport.netProfitPerGallon)}
            </p>
            <p>
              <strong>Net profit:</strong>{" "}
              {formatCurrency(viewReport.netProfit)}
            </p>
            <div className="form-grid__full">
              <h4>Fuel details</h4>
              {(viewReport.details || []).map((detail, index) => (
                <p key={detail.fuelTypeId || index}>
                  {detail.fuelName}: {formatNumber(detail.volumeSold)} gallons,{" "}
                  {formatCurrency(detail.profitPerGallon)} / gal
                </p>
              ))}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default GasSalesPage;
