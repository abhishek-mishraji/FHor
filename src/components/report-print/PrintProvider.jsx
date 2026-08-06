import { useCallback, useMemo } from "react";
import { exportPdf } from "../../utils/exportUtils";
import { PrintReportContext } from "./PrintContext";

export const PrintProvider = ({ children }) => {
  const printReport = useCallback((options) => exportPdf(options), []);
  const value = useMemo(() => ({ printReport }), [printReport]);

  return (
    <PrintReportContext.Provider value={value}>
      {children}
    </PrintReportContext.Provider>
  );
};
