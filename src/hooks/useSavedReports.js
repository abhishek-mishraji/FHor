import { useCallback, useState } from 'react'
import { readStorageValue, storageKeys, writeStorageValue } from '../utils/storageUtils'

let savedReportSequence = Date.now()

export const useSavedReports = () => {
  const [savedReports, setSavedReports] = useState(() =>
    readStorageValue(storageKeys.savedAnalyticsReports, []),
  )

  const persist = useCallback((nextReports) => {
    setSavedReports(nextReports)
    writeStorageValue(storageKeys.savedAnalyticsReports, nextReports)
  }, [])

  const saveReport = useCallback(
    (name, config) => {
      const report = {
        id: ++savedReportSequence,
        name,
        config,
        savedAt: new Date().toISOString(),
      }

      persist([report, ...readStorageValue(storageKeys.savedAnalyticsReports, [])])

      return report
    },
    [persist],
  )

  const renameReport = useCallback(
    (reportId, name) => {
      persist(
        readStorageValue(storageKeys.savedAnalyticsReports, []).map((report) =>
          report.id === reportId ? { ...report, name } : report,
        ),
      )
    },
    [persist],
  )

  const deleteReport = useCallback(
    (reportId) => {
      persist(
        readStorageValue(storageKeys.savedAnalyticsReports, []).filter(
          (report) => report.id !== reportId,
        ),
      )
    },
    [persist],
  )

  return {
    savedReports,
    saveReport,
    renameReport,
    deleteReport,
  }
}
