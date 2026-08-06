import { useContext } from 'react'
import { PrintReportContext } from './PrintContext'

export const usePrintReport = () => {
  const context = useContext(PrintReportContext)

  if (!context) {
    throw new Error('usePrintReport must be used inside PrintProvider')
  }

  return context.printReport
}
