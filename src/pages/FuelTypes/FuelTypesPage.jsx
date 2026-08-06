import { useContext, useEffect, useMemo, useState } from "react";
import { AppContext } from "../../context/appContext";
import PageHeader from "../../components/common/PageHeader";
import DataTable from "../../components/common/DataTable";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import SelectInput from "../../components/forms/SelectInput";
import TextInput from "../../components/forms/TextInput";
import CheckboxGroupInput from "../../components/forms/CheckboxGroupInput";
import { useApi } from "../../hooks/useApi";
import fuelTypeService from "../../services/fuelTypeService";
import storeService from "../../services/storeService";
import { handleServiceError } from "../../utils/errorHandler";
import "../../page-styles/MonthlyReports/MonthlyReports.css";

const FUEL_TYPE_COLUMNS = [
  {
    key: "fuelTypeId",
    header: "ID",
    render: (row) => row.fuelTypeId,
  },
  {
    key: "fuelName",
    header: "Fuel Name",
    render: (row) => row.fuelName,
  },
  {
    key: "active",
    header: "Status",
    render: (row) => (
      <span
        className={`status-badge status-badge--${row.active ? "active" : "inactive"}`}
      >
        {row.active ? "Active" : "Inactive"}
      </span>
    ),
  },
];

const initialFuelForm = {
  fuelName: "",
  active: true,
};

const FuelTypesPage = () => {
  const { notify } = useContext(AppContext);

  /* ------------------------------------------------------------------ */
  /*  Global fuel types section                                          */
  /* ------------------------------------------------------------------ */
  const [selectedFuelType, setSelectedFuelType] = useState(null);
  const [fuelForm, setFuelForm] = useState(initialFuelForm);
  const [fuelErrors, setFuelErrors] = useState({});
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);

  const fuelTypesQuery = useApi(() => fuelTypeService.getFuelTypes(), {
    initialData: [],
  });

  const openCreateFuel = () => {
    setSelectedFuelType(null);
    setFuelForm({ ...initialFuelForm });
    setFuelErrors({});
    setIsFuelModalOpen(true);
  };

  const openEditFuel = (fuelType) => {
    setSelectedFuelType(fuelType);
    setFuelForm({
      fuelName: fuelType.fuelName || "",
      active: fuelType.active !== false,
    });
    setFuelErrors({});
    setIsFuelModalOpen(true);
  };

  const closeFuelModal = () => {
    setSelectedFuelType(null);
    setFuelForm(initialFuelForm);
    setFuelErrors({});
    setIsFuelModalOpen(false);
  };

  const handleFuelSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!fuelForm.fuelName.trim()) {
      errors.fuelName = "Fuel name is required.";
    }

    setFuelErrors(errors);

    if (Object.keys(errors).length) {
      return;
    }

    try {
      const payload = {
        fuelName: fuelForm.fuelName.trim(),
        active: fuelForm.active,
      };

      const saved = selectedFuelType
        ? await fuelTypeService.updateFuelType(
            selectedFuelType.fuelTypeId,
            payload,
          )
        : await fuelTypeService.createFuelType(payload);

      fuelTypesQuery.setData((current) =>
        !selectedFuelType
          ? [saved, ...(current || [])]
          : (current || []).map((ft) =>
              ft.fuelTypeId === saved.fuelTypeId ? saved : ft,
            ),
      );

      notify({
        type: "success",
        title: selectedFuelType ? "Updated" : "Created",
        message: `Fuel type "${saved.fuelName}" saved.`,
      });
      closeFuelModal();
    } catch (err) {
      const details = handleServiceError(err);
      setFuelErrors(details.fieldErrors || {});
      notify({ type: "error", title: "Save failed", message: details.message });
    }
  };

  const handleDeleteFuel = async (fuelType) => {
    if (!window.confirm(`Delete fuel type "${fuelType.fuelName}"?`)) return;
    try {
      await fuelTypeService.deleteFuelType(fuelType.fuelTypeId);
      fuelTypesQuery.setData((current) =>
        (current || []).filter(
          (ft) => ft.fuelTypeId !== fuelType.fuelTypeId,
        ),
      );
      notify({
        type: "success",
        title: "Deleted",
        message: `"${fuelType.fuelName}" removed.`,
      });
    } catch (err) {
      notify({
        type: "error",
        title: "Delete failed",
        message: handleServiceError(err).message,
      });
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Store fuel-type assignment section                                  */
  /* ------------------------------------------------------------------ */
  const [assignStoreId, setAssignStoreId] = useState("");
  const [assignedIds, setAssignedIds] = useState([]);
  const [assignSaving, setAssignSaving] = useState(false);

  const storesQuery = useApi(() => storeService.getStores(), {
    initialData: [],
  });

  const storeFuelTypesQuery = useApi(
    () =>
      assignStoreId
        ? storeService.getStoreFuelTypes(assignStoreId)
        : Promise.resolve([]),
    {
      initialData: [],
      deps: [assignStoreId],
    },
  );

  useEffect(() => {
    if (storeFuelTypesQuery.data) {
      setAssignedIds(
        storeFuelTypesQuery.data.map((ft) => ft.fuelTypeId),
      );
    }
  }, [storeFuelTypesQuery.data]);

  const storeOptions = useMemo(
    () =>
      (storesQuery.data || []).map((s) => ({
        label: s.storeName,
        value: String(s.storeId),
      })),
    [storesQuery.data],
  );

  const fuelTypeOptions = useMemo(
    () =>
      (fuelTypesQuery.data || [])
        .filter((ft) => ft.active !== false)
        .map((ft) => ({
          label: ft.fuelName,
          value: ft.fuelTypeId,
        })),
    [fuelTypesQuery.data],
  );

  const handleAssignSave = async () => {
    if (!assignStoreId) {
      notify({
        type: "error",
        title: "No store",
        message: "Select a store first.",
      });
      return;
    }

    setAssignSaving(true);
    try {
      await storeService.updateStoreFuelTypes(assignStoreId, assignedIds);
      notify({
        type: "success",
        title: "Saved",
        message: "Store fuel type assignments updated.",
      });
    } catch (err) {
      notify({
        type: "error",
        title: "Save failed",
        message: handleServiceError(err).message,
      });
    } finally {
      setAssignSaving(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Fuel type table columns with action buttons                        */
  /* ------------------------------------------------------------------ */
  const fuelTypeColumnsWithActions = [
    ...FUEL_TYPE_COLUMNS,
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div style={{ display: "flex", gap: 4 }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openEditFuel(row);
            }}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteFuel(row);
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="monthly-reports-page">
      <PageHeader
        eyebrow="Admin"
        title="Fuel types"
        description="Manage global fuel types and assign them to stores."
        actions={<Button onClick={openCreateFuel}>New fuel type</Button>}
      />

      {/* Global fuel types table */}
      <DataTable
        columns={fuelTypeColumnsWithActions}
        rows={fuelTypesQuery.data || []}
        keyField="fuelTypeId"
        onRowClick={openEditFuel}
      />

      {/* Store fuel-type assignment section */}
      <section
        className="mr-filter-bar"
        style={{ marginTop: "var(--space-6, 24px)" }}
      >
        <div className="mr-filter-bar__body">
          <h3
            style={{
              margin: "0 0 12px",
              fontSize: "var(--font-size-base, 14px)",
              fontWeight: 600,
            }}
          >
            Store fuel type assignment
          </h3>
          <div className="mr-filter-bar__row">
            <div className="mr-filter-bar__field">
              <SelectInput
                label="Store"
                name="assignStoreId"
                value={assignStoreId}
                onChange={(e) => setAssignStoreId(e.target.value)}
                options={storeOptions}
                placeholder="Select a store"
              />
            </div>
          </div>
          {assignStoreId ? (
            <>
              <CheckboxGroupInput
                label="Assigned fuel types"
                name="assignedFuelTypes"
                values={assignedIds}
                onChange={(e) => setAssignedIds(e.target.value)}
                options={fuelTypeOptions}
              />
              <div style={{ marginTop: 12 }}>
                <Button
                  variant="primary"
                  onClick={handleAssignSave}
                  isLoading={assignSaving}
                >
                  Save assignments
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </section>

      {/* Create / Edit fuel type modal */}
      <Modal
        isOpen={isFuelModalOpen}
        title={selectedFuelType ? "Edit fuel type" : "New fuel type"}
        onClose={closeFuelModal}
        footer={
          <>
            <Button variant="ghost" onClick={closeFuelModal}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleFuelSubmit}>
              Save
            </Button>
          </>
        }
      >
        <form className="form-grid" onSubmit={handleFuelSubmit}>
          <TextInput
            label="Fuel name"
            name="fuelName"
            value={fuelForm.fuelName}
            onChange={(e) =>
              setFuelForm((f) => ({ ...f, fuelName: e.target.value }))
            }
            error={fuelErrors.fuelName}
          />
          <SelectInput
            label="Active"
            name="active"
            value={fuelForm.active ? "true" : "false"}
            onChange={(e) =>
              setFuelForm((f) => ({
                ...f,
                active: e.target.value === "true",
              }))
            }
            options={[
              { label: "Active", value: "true" },
              { label: "Inactive", value: "false" },
            ]}
          />
        </form>
        {selectedFuelType ? (
          <div style={{ marginTop: 12 }}>
            <Button
              variant="secondary"
              onClick={() => handleDeleteFuel(selectedFuelType)}
            >
              Delete
            </Button>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default FuelTypesPage;
