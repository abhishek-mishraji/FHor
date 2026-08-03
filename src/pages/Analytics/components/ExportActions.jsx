import { memo, useEffect, useRef, useState } from "react";
import Button from "../../../components/ui/Button";

const EXPORT_FORMATS = [
  // { key: 'excel', label: 'Excel (.xls)' },
  // { key: 'csv', label: 'CSV (.csv)' },
  { key: "pdf", label: "PDF (Print)" },
];

const ExportActions = memo(function ExportActions({
  disabled = false,
  exporting = false,
  onExport,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleOutsideClick = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  const handleSelect = (format) => {
    setIsOpen(false);
    onExport(format);
  };

  return (
    <div className="export-actions" ref={containerRef}>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={disabled}
        isLoading={exporting}
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        Export
      </Button>

      {isOpen ? (
        <div className="export-actions__panel">
          {EXPORT_FORMATS.map((format) => (
            <button
              key={format.key}
              type="button"
              className="export-actions__option"
              onClick={() => handleSelect(format.key)}
            >
              {format.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
});

export default ExportActions;
