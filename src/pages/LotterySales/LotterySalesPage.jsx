import { useContext, useMemo, useState } from "react";
import { AppContext } from "../../context/appContext";
import PageHeader from "../../components/common/PageHeader";
import DataTable from "../../components/common/DataTable";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import SelectInput from "../../components/forms/SelectInput";
import TextInput from "../../components/forms/TextInput";
import { useApi } from "../../hooks/useApi";
import { usePermissions } from "../../hooks/usePermissions";
import lotteryService from "../../services/lotteryService";
import storeService from "../../services/storeService";
import { handleServiceError } from "../../utils/errorHandler";
import { formatCurrency } from "../../utils/numberUtils";
import { getMonthOptions, getYearOptions } from "../../utils/dateUtils";
import "../../page-styles/MonthlyReports/MonthlyReports.css";
import validateLotteryForm from "../../validations/lotteryValidation";

const COLUMNS = [
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
    key: "onlineSales",
    header: "Online sales",
    render: (r) => formatCurrency(r.onlineSales),
  },
  {
    key: "scratchOffSales",
    header: "Scratch off sales",
    render: (r) => formatCurrency(r.scratchOffSales),
  },
  {
    key: "commission",
    header: "Commission",
    render: (r) => formatCurrency(r.commission),
  },
];

const initialForm = {
  storeId: "",
  reportMonth: "",
  reportYear: "",
  onlineSales: "",
  scratchOffSales: "",
  onlineCashes: "",
  scratchOffCashes: "",
  commission: "",
};

const getReportId = (report) =>
  report?.reportId ?? report?.lotterySalesReportMonthlyId;

const LotterySalesPage = () => {
  const { notify } = useContext(AppContext);
  const { isAdmin } = usePermissions();

  const [filters, setFilters] = useState({ storeId: "" });
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewReport, setViewReport] = useState(null);

  const storesQuery = useApi(
    () => (isAdmin ? storeService.getStores() : storeService.getClientStores()),
    { initialData: [] },
  );

  const reportsQuery = useApi(
    () => {
      if (isAdmin) return lotteryService.getAdminReports(filters);
      if (!filters.storeId) return Promise.resolve([]);
      return lotteryService.getClientReports({ storeId: filters.storeId });
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

  // Prefill store in modal when creating a report; handled in openCreate

  const storeOptions = useMemo(
    () =>
      (storesQuery.data || []).map((s) => ({
        label: s.storeName,
        value: String(s.storeId),
      })),
    [storesQuery.data],
  );

  const openCreate = () => {
    setSelected(null);
    setForm(() => ({ ...initialForm, storeId: filters.storeId || "" }));
    setErrors({});
    setIsModalOpen(true);
  };
  const openEdit = (r) => {
    setSelected(r);
    setForm({ ...r });
    setErrors({});
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setSelected(null);
    setForm(initialForm);
    setErrors({});
    setIsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const validationErrors = validateLotteryForm(form);
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
        onlineSales: Number(form.onlineSales),
        scratchOffSales: Number(form.scratchOffSales),
        onlineCashes: Number(form.onlineCashes),
        scratchOffCashes: Number(form.scratchOffCashes),
        commission: Number(form.commission),
      };
      const saved = selected
        ? await lotteryService.updateReport(getReportId(selected), payload)
        : await lotteryService.createReport(payload);
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
        message: "Lottery sales report saved.",
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
      await lotteryService.deleteReport(getReportId(report));
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

  return (
    <div className="monthly-reports-page">
      <PageHeader
        eyebrow="Lottery"
        title="Lottery sales"
        description="Manage monthly lottery sales reports."
        actions={
          isAdmin ? (
            <Button onClick={openCreate}>New lottery report</Button>
          ) : null
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
        columns={[
          ...COLUMNS.map((column) => ({
            key: column.key,
            header: column.header,
            render: column.render,
          })),
          {
            key: "view",
            header: "",
            render: (row) => (
              <Button
                variant="ghost"
                size="sm"
                onClick={(event) => {
                  event.stopPropagation();
                  setViewReport(row);
                }}
              >
                View
              </Button>
            ),
          },
          ...(isAdmin
            ? [
                {
                  key: "edit",
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
        ]}
        rows={reportsQuery.data || []}
        keyField={getReportId}
        onRowClick={setViewReport}
      />

      <Modal
        isOpen={isModalOpen}
        title={selected ? "Edit lottery report" : "New lottery report"}
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
            onChange={(e) =>
              setForm((f) => ({ ...f, storeId: e.target.value }))
            }
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
            label="Online sales"
            name="onlineSales"
            value={form.onlineSales}
            onChange={(e) =>
              setForm((f) => ({ ...f, onlineSales: e.target.value }))
            }
            error={errors.onlineSales}
          />
          <TextInput
            label="Scratch off sales"
            name="scratchOffSales"
            value={form.scratchOffSales}
            onChange={(e) =>
              setForm((f) => ({ ...f, scratchOffSales: e.target.value }))
            }
            error={errors.scratchOffSales}
          />
          <TextInput
            label="Online cashes"
            name="onlineCashes"
            value={form.onlineCashes}
            onChange={(e) =>
              setForm((f) => ({ ...f, onlineCashes: e.target.value }))
            }
            error={errors.onlineCashes}
          />
          <TextInput
            label="Scratch off cashes"
            name="scratchOffCashes"
            value={form.scratchOffCashes}
            onChange={(e) =>
              setForm((f) => ({ ...f, scratchOffCashes: e.target.value }))
            }
            error={errors.scratchOffCashes}
          />
          <TextInput
            label="Commission"
            name="commission"
            value={form.commission}
            onChange={(e) =>
              setForm((f) => ({ ...f, commission: e.target.value }))
            }
            error={errors.commission}
          />
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
        title="Lottery sales report"
        onClose={() => setViewReport(null)}
        footer={
          <Button variant="primary" onClick={() => setViewReport(null)}>
            Close
          </Button>
        }
      >
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
              <strong>Online sales:</strong>{" "}
              {formatCurrency(viewReport.onlineSales)}
            </p>
            <p>
              <strong>Scratch-off sales:</strong>{" "}
              {formatCurrency(viewReport.scratchOffSales)}
            </p>
            <p>
              <strong>Online cashes:</strong>{" "}
              {formatCurrency(viewReport.onlineCashes)}
            </p>
            <p>
              <strong>Scratch-off cashes:</strong>{" "}
              {formatCurrency(viewReport.scratchOffCashes)}
            </p>
            <p>
              <strong>Commission:</strong>{" "}
              {formatCurrency(viewReport.commission)}
            </p>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default LotterySalesPage;
