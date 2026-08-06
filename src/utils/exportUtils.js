import horLogo from '../assets/hor-logo.png'
import { buildReportFooter, buildReportHeader } from '../components/report-print/printRenderers'
import sharedPrintStyles from '../components/report-print/PrintStyles.css?inline'
import { formatDate, formatMonthYear } from './dateUtils'

const triggerDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

const escapeCsvCell = (value) => {
  const text = String(value ?? '')

  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }

  return text
}

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

const buildHtmlTable = ({ headers, body, tones = [] }) => `
  <table border="1">
    <thead>
      <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr>
    </thead>
    <tbody>
      ${body
        .map((row, rowIndex) => `<tr>${row
          .map((cell, columnIndex) => {
            const tone = tones[rowIndex]?.[columnIndex]
            const style =
              tone === 'positive'
                ? ' style="color: #15803d; font-weight: 700;"'
                : tone === 'negative'
                  ? ' style="color: #b91c1c; font-weight: 700;"'
                  : ''

            return `<td${style}>${escapeHtml(cell)}</td>`
          })
          .join('')}</tr>`)
        .join('')}
    </tbody>
  </table>
`

// Export matrix honours column visibility: pass the same columns the table renders.
export const buildExportMatrix = (columns, rows) => ({
  headers: columns.map((column) => column.header),
  body: rows.map((row) =>
    columns.map((column) => {
      const raw = row[column.key]
      if ((raw === undefined || raw === null) && column.render) {
        return String(column.render(row) ?? '')
      }
      return raw ?? ''
    }),
  ),
  tones: rows.map((row) =>
    columns.map((column) => (typeof column.tone === 'function' ? column.tone(row) : null)),
  ),
})
export const exportCsv = ({ headers, body }, filename) => {
  const lines = [headers, ...body].map((row) => row.map(escapeCsvCell).join(','))
  const blob = new Blob([String.fromCharCode(0xfeff), lines.join('\n')], { type: 'text/csv;charset=utf-8' })

  triggerDownload(blob, `${filename}.csv`)
}

// Optional summary block prepended above the data table (used by the
// comparison export so the summary cards travel with the sheet).
const buildSummaryCardsTable = (summaryCards) =>
  buildHtmlTable({
    headers: ['Summary', 'Value', 'Detail'],
    body: summaryCards.map((card) => [card.label, card.value, card.caption ?? '']),
  })

export const exportExcel = ({ headers, body, tones }, filename, { summaryCards } = {}) => {
  const summaryHtml = summaryCards?.length
    ? `${buildSummaryCardsTable(summaryCards)}<br/>`
    : ''
  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head><meta charset="UTF-8" /></head>
      <body>${summaryHtml}${buildHtmlTable({ headers, body, tones })}</body>
    </html>
  `
  const blob = new Blob([html], { type: 'application/vnd.ms-excel' })

  triggerDownload(blob, `${filename}.xls`)
}

const renderChartToDataUrl = (chartContainer) =>
  new Promise((resolve, reject) => {
    const svgElement = chartContainer?.querySelector('svg')

    if (!svgElement) {
      reject(new Error('No chart is currently rendered.'))
      return
    }

    const { width, height } = svgElement.getBoundingClientRect()
    const clonedSvg = svgElement.cloneNode(true)
    clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    clonedSvg.setAttribute('width', width)
    clonedSvg.setAttribute('height', height)

    const svgBlob = new Blob([new XMLSerializer().serializeToString(clonedSvg)], {
      type: 'image/svg+xml;charset=utf-8',
    })
    const url = URL.createObjectURL(svgBlob)
    const image = new Image()

    image.onload = () => {
      const scale = 2
      const canvas = document.createElement('canvas')
      canvas.width = width * scale
      canvas.height = height * scale

      const context = canvas.getContext('2d')
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.scale(scale, scale)
      context.drawImage(image, 0, 0, width, height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/png'))
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Chart image rendering failed.'))
    }
    image.src = url
  })

export const exportChartPng = async (chartContainer, filename) => {
  const dataUrl = await renderChartToDataUrl(chartContainer)
  const response = await fetch(dataUrl)
  const blob = await response.blob()

  triggerDownload(blob, `${filename}.png`)
}

const loadImageAsDataUrl = async (url) => {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return ''
  }
}

const buildPdfTable = ({ headers, body, tones = [] }) => {
  const headerCells = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')
  const bodyRows = body
    .map((row, rowIndex) => {
      const cells = row
        .map((cell, columnIndex) => {
          const tone = tones[rowIndex]?.[columnIndex]
          const toneClass = tone ? ` cell-${tone}` : ''
          return `<td class="${toneClass.trim()}">${escapeHtml(cell)}</td>`
        })
        .join('')
      return `<tr class="${rowIndex % 2 === 0 ? 'row-even' : 'row-odd'}">${cells}</tr>`
    })
    .join('')
  return `<table class="data-table"><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>`
}

const buildGasPdfTable = ({ headers, body, tones = [], groups = [] }) => {
  const groupCells = groups
    .map((group) => `<th colspan="${group.span}">${escapeHtml(group.label)}</th>`)
    .join('')
  const subHeaders = headers.slice(1).map((header) => `<th>${escapeHtml(header)}</th>`).join('')
  const bodyRows = body
    .map((row, rowIndex) => {
      const cells = row
        .map((cell, columnIndex) => {
          const tone = tones[rowIndex]?.[columnIndex]
          const toneClass = tone ? ` cell-${tone}` : ''
          const totalClass = row[0] === 'TOTAL' ? ' total-cell' : ''
          return `<td class="${`${toneClass}${totalClass}`.trim()}">${escapeHtml(cell)}</td>`
        })
        .join('')
      return `<tr class="${row[0] === 'TOTAL' ? 'total-row' : rowIndex % 2 === 0 ? 'row-even' : 'row-odd'}">${cells}</tr>`
    })
    .join('')

  return `<table class="data-table gas-data-table">
    <colgroup>
      <col class="gas-col-fuel" />
      <col class="gas-col-metric" span="8" />
    </colgroup>
    <thead>
      <tr><th rowspan="2">${escapeHtml(headers[0])}</th>${groupCells}</tr>
      <tr>${subHeaders}</tr>
    </thead>
    <tbody>${bodyRows}</tbody>
  </table>`
}

// Period grouping per report type — mirrors the "group by" rule for each report page.
const PERIOD_BY_REPORT_TYPE = {
  Daily: (row) => ({
    key: row.reportDate || '',
    label: `Report Date: ${formatDate(row.reportDate)}`,
  }),
  Monthly: (row) => ({
    key: `${row.reportYear || ''}-${String(row.reportMonth || '').padStart(2, '0')}`,
    label: `Month: ${formatMonthYear(row.reportMonth, row.reportYear)}`,
  }),
  Yearly: (row) => ({
    key: String(row.reportYear ?? ''),
    label: `Year: ${row.reportYear ?? 'N/A'}`,
  }),
}

// Prefers the column's render() so PDF cells match what the on-screen table shows.
const pdfCell = (row, column) => {
  if (column.render) {
    const rendered = column.render(row)
    return rendered === null || rendered === undefined ? '' : String(rendered)
  }
  return row[column.key] ?? ''
}

const alphabetically = (a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: 'base' })

// Within-month row order — the one dimension the task names explicitly
// (Department Name A–Z for Monthly). Report types with no such field keep
// their incoming order (Array.sort is stable), which is the existing
// business rule for Daily/Yearly.
const ROW_SORT_BY_REPORT_TYPE = {
  Monthly: (a, b) => alphabetically(a.departmentName ?? '', b.departmentName ?? ''),
}

// Buckets rows into Client → Store → Month/Year/Date, then sorts every level:
// clients and stores alphabetically, periods chronologically, and rows within
// a period per ROW_SORT_BY_REPORT_TYPE. Rendering never touches raw API order.
const groupAndSortRows = (rows, storeMeta, reportType) => {
  const periodOf = PERIOD_BY_REPORT_TYPE[reportType] || PERIOD_BY_REPORT_TYPE.Yearly
  const rowSort = ROW_SORT_BY_REPORT_TYPE[reportType]

  const clients = new Map()

  rows.forEach((row) => {
    const meta = storeMeta?.[String(row.storeId)] || {}
    const ownerName = meta.ownerName || 'Unassigned Client'
    const storeName = row.storeName || meta.storeName || 'Unknown store'
    const storeKey = row.storeId ?? storeName

    if (!clients.has(ownerName)) clients.set(ownerName, new Map())
    const stores = clients.get(ownerName)
    if (!stores.has(storeKey)) stores.set(storeKey, { storeName, rows: [] })
    stores.get(storeKey).rows.push(row)
  })

  return [...clients.entries()]
    .sort(([a], [b]) => alphabetically(a, b))
    .map(([ownerName, stores]) => ({
      ownerName,
      stores: [...stores.values()]
        .sort((a, b) => alphabetically(a.storeName, b.storeName))
        .map((store) => {
          const periods = new Map()
          store.rows.forEach((row) => {
            const { key, label } = periodOf(row)
            if (!periods.has(key)) periods.set(key, { label, rows: [] })
            periods.get(key).rows.push(row)
          })

          const sortedPeriods = [...periods.entries()].sort(([a], [b]) =>
            String(a).localeCompare(String(b), undefined, { numeric: true }),
          )

          return {
            storeName: store.storeName,
            periods: sortedPeriods.map(([, period]) => ({
              label: period.label,
              rows: rowSort ? [...period.rows].sort(rowSort) : period.rows,
            })),
          }
        }),
    }))
}

const buildGroupedSectionsHtml = ({ rows, columns, reportType, storeMeta, exportDateTime }) => {
  const clients = groupAndSortRows(rows, storeMeta, reportType)
  const headers = columns.map((c) => c.header)

  let html = ''

  clients.forEach(({ ownerName, stores }) => {
    html += `<section class="client-section">
      <h2 class="client-heading">Client: ${escapeHtml(ownerName)}</h2>`

    stores.forEach((store) => {
      // No forced page break here — the store flows onto the current page and
      // only spills to the next one if its heading block (below) doesn't fit.
      html += `<div class="store-section">`

      store.periods.forEach((period, periodIndex) => {
        const bodyRows = period.rows.map((row) => columns.map((c) => pdfCell(row, c)))

        // Only the first period of a store repeats the store banner.
        const storeBannerHtml =
          periodIndex === 0
            ? `<div class="store-banner">
                <div class="store-banner__name">Store: ${escapeHtml(store.storeName)}</div>
                <div class="store-banner__row">
                  <span><b>Owner:</b> ${escapeHtml(ownerName)}</span>
                  <span><b>Report Type:</b> ${escapeHtml(reportType)}</span>
                </div>
              </div>`
            : ''

        // One table per period — the header cell markup appears exactly once
        // here. The browser's print engine (thead { display: table-header-group })
        // reprints it automatically if, and only if, this table spans a real
        // page break; it never repeats mid-page.
        html += `<div class="period-group">
          <div class="section-lead">
            ${storeBannerHtml}
            <div class="period-banner">
              <span>${escapeHtml(period.label)}</span>
              <span>Generated On: ${escapeHtml(exportDateTime)}</span>
            </div>
          </div>
          ${buildPdfTable({ headers, body: bodyRows })}
        </div>`
      })

      html += `</div>` // .store-section
    })

    html += `</section>` // .client-section
  })

  return html
}

// Opens a print-ready window; the browser print dialog saves it as PDF.
// When reportType/rows/columns are supplied, the report is grouped into a
// Client → Store → Period hierarchy; otherwise it falls back to a single flat table.
export const exportPdf = async ({
  title,
  subtitle,
  storeName,
  matrix,
  chartContainer,
  reportType,
  rows,
  columns,
  storeMeta,
  summaryCards,
  gasReport,
}) => {
  const logoDataUrl = await loadImageAsDataUrl(horLogo)

  let chartImageHtml = ''
  if (chartContainer?.querySelector('svg')) {
    const dataUrl = await renderChartToDataUrl(chartContainer)
    chartImageHtml = `<img src="${dataUrl}" class="chart-img" alt="Chart" />`
  }

  const printWindow = window.open('', '_blank', 'width=1024,height=768')
  if (!printWindow) {
    throw new Error('Pop-up blocked. Allow pop-ups to export as PDF.')
  }

  const exportDateTime = new Date().toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  const isGrouped = Array.isArray(rows) && Array.isArray(columns) && Boolean(reportType)

  const summaryHtml = gasReport
    ? `<div class="gas-report-meta">
        <div><span>Store</span><strong>${escapeHtml(gasReport.storeName || 'All Stores')}</strong></div>
        <div><span>Period</span><strong>Gas Sales — ${escapeHtml(gasReport.currentPeriod)} vs ${escapeHtml(gasReport.comparisonPeriod)}</strong></div>
        <div><span>Exported</span><strong>${escapeHtml(exportDateTime)}</strong></div>
      </div>`
    : isGrouped
    ? `<div class="doc-summary">
        <span><b>Report Type:</b> ${escapeHtml(reportType)}</span>
        <span><b>Generated On:</b> ${escapeHtml(exportDateTime)}</span>
       
      </div>`
    : `<div class="meta-grid">
        ${storeName ? `<span class="meta-label">Store</span>    <span class="meta-value">${escapeHtml(storeName)}</span>` : ''}
        <span class="meta-label">Period</span>   <span class="meta-value">${escapeHtml(subtitle)}</span>
        <span class="meta-label">Exported</span> <span class="meta-value">${escapeHtml(exportDateTime)}</span>
        
      </div>`

  // Summary cards (comparison exports) print as a card grid above the chart.
  const summaryCardsHtml = summaryCards?.length
    ? `<div class="summary-cards">${summaryCards
        .map(
          (card) => `<div class="summary-card${card.tone ? ` summary-card--${card.tone}` : ''}">
            <div class="summary-card__label">${escapeHtml(card.label)}</div>
            ${card.periods?.length
              ? `<div class="summary-card__periods">${card.periods
                  .map(
                    (period) => `<div class="summary-card__period${period.tone ? ` summary-card__period--${period.tone}` : ''}">
                      <div class="summary-card__period-label">${escapeHtml(period.label)}</div>
                      <div class="summary-card__period-value">${escapeHtml(period.value)}</div>
                    </div>`,
                  )
                  .join('')}</div>`
              : `<div class="summary-card__value">${escapeHtml(card.value)}</div>
                  ${card.caption ? `<div class="summary-card__caption">${escapeHtml(card.caption)}</div>` : ''}`}
            ${card.yoyPercentage !== undefined ? `<div class="summary-card__yoy">
              <span>Total Sales YoY %</span>
              <strong>${escapeHtml(card.yoyPercentage)}</strong>
            </div>` : ''}
          </div>`,
        )
        .join('')}</div>`
    : ''

  const gasSummaryHtml = gasReport
    ? `<div class="gas-meta">
        <span><b>Store</b>${escapeHtml(gasReport.storeName || 'All Stores')}</span>
        <span><b>Current Period</b>${escapeHtml(gasReport.currentPeriod)}</span>
        <span><b>Comparison Period</b>${escapeHtml(gasReport.comparisonPeriod)}</span>
      </div>
      <div class="gas-kpis">${gasReport.kpis
        .map(
          (card) => `<div class="gas-kpi${card.tone ? ` gas-kpi--${card.tone}` : ''}">
            <div class="gas-kpi__label">${escapeHtml(card.label)}</div>
            <div class="gas-kpi__values">
              <div><span>Current</span><strong>${escapeHtml(card.current)}</strong></div>
              <div><span>Previous</span><strong>${escapeHtml(card.previous)}</strong></div>
            </div>
            <div class="gas-kpi__delta"><span>Difference</span><strong>${escapeHtml(card.difference)}</strong></div>
            <div class="gas-kpi__percent"><span>% Difference</span><strong>${escapeHtml(card.percentage)}</strong></div>
          </div>`,
        )
        .join('')}</div>
      <section class="gas-print-section">
        <div class="gas-section-title">Fuel Details</div>
        ${buildGasPdfTable({ ...gasReport.table.matrix, groups: gasReport.table.groups })}
        <div class="gas-note">All amounts are in USD.</div>
      </section>`
    : ''

  const bodyHtml = gasReport
    ? gasSummaryHtml
    : isGrouped
    ? buildGroupedSectionsHtml({ rows, columns, reportType, storeMeta, exportDateTime })
    : `${summaryCardsHtml}${chartImageHtml}${buildPdfTable(matrix)}`

  printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)} — Hands Of Retail</title>
  <style>
    ${sharedPrintStyles}
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    @page {
      size: A4 portrait;
      margin: 14mm 15mm 18mm 15mm;
      @bottom-left  { content: "Hands Of Retail · https://handsoffretail.com"; font-size: 8pt; color: #94a3b8; font-family: 'Segoe UI', Arial, sans-serif; }
      @bottom-right { content: "Page " counter(page) " of " counter(pages); font-size: 8pt; color: #94a3b8; font-family: 'Segoe UI', Arial, sans-serif; }
    }

    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10pt; color: #0f172a; background: #fff; }

    .doc-header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 12px; border-bottom: 2.5px solid #1e3a6e; margin-bottom: 16px; }
    .logo        { height: 38px; width: auto; }
    .company-block { text-align: right; }
    .company-name  { font-size: 13pt; font-weight: 700; color: #1e3a6e; letter-spacing: -0.2px; }
    .company-url   { font-size: 8pt; color: #64748b; margin-top: 2px; }
    .report-print__footer { display: flex; justify-content: space-between; gap: 12px; margin-top: 14px; padding-top: 7px; border-top: 1px solid #d8e1ee; color: #94a3b8; font-size: 8pt; }

    .report-title { font-size: 15pt; font-weight: 700; color: #1e3a6e; margin-bottom: 10px; }

    .meta-grid { display: grid; grid-template-columns: max-content 1fr; gap: 3px 16px; margin-bottom: 18px; }
    .meta-label { font-size: 8.5pt; font-weight: 600; color: #64748b; white-space: nowrap; }
    .meta-value { font-size: 8.5pt; color: #0f172a; }

    .gas-report-meta { display: grid; grid-template-columns: max-content 1fr; gap: 3px 16px; margin-bottom: 10px; }
    .gas-report-meta div { display: contents; }
    .gas-report-meta span { font-size: 8.5pt; color: #0f172a; }
    .gas-report-meta span::after { content: ':'; margin-left: 28px; }
    .gas-report-meta strong { font-size: 8.5pt; font-weight: 400; color: #0f172a; }

    .doc-summary { display: flex; flex-wrap: wrap; gap: 6px 22px; margin-bottom: 20px; padding: 9px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 8.5pt; color: #475569; }
    .doc-summary b { color: #1e3a6e; font-weight: 600; }

    .client-section { margin-bottom: 6px; }
    .client-heading { font-size: 12.5pt; font-weight: 700; color: #fff; background: #1e3a6e; padding: 7px 14px; border-radius: 4px; margin: 18px 0 12px; }
    .client-section:first-of-type .client-heading { margin-top: 0; }

    .store-section { margin-bottom: 16px; }
    .store-banner { border: 1.5px solid #cbd5e1; border-left: 5px solid #1e3a6e; border-radius: 4px; padding: 9px 14px; margin-bottom: 10px; background: #f8fafc; }
    .store-banner__name { font-size: 11.5pt; font-weight: 700; color: #1e3a6e; margin-bottom: 4px; }
    .store-banner__row { display: flex; flex-wrap: wrap; gap: 6px 18px; font-size: 8.5pt; color: #475569; }
    .store-banner__row b { color: #0f172a; font-weight: 600; }

    .period-banner { display: flex; justify-content: space-between; align-items: center; gap: 12px; background: #eef2f7; border-left: 3px solid #1e3a6e; padding: 5px 10px; font-size: 8pt; font-weight: 600; color: #1e3a6e; margin-bottom: 0; text-transform: uppercase; letter-spacing: 0.04em; }

    .period-group { margin-bottom: 14px; }
    .period-group:last-child { margin-bottom: 0; }

    /* Store header + owner + period header travel together as one
       unbreakable unit — this stops a section heading being stranded alone
       at the bottom of a page, without forcing an unnecessary page break
       (the table right after it is untouched and paginates on its own). */
    .section-lead { break-inside: avoid; page-break-inside: avoid; margin-bottom: 6px; }

    .data-table { border-collapse: collapse; width: 100%; table-layout: auto; }
    .data-table thead tr { background: #1e3a6e; }
    .data-table th { padding: 7px 10px; font-size: 7.5pt; font-weight: 600; color: #fff; text-align: left; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; }
    .data-table td { padding: 5.5px 10px; font-size: 9pt; color: #0f172a; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
    .data-table td.cell-positive { color: #15803d; font-weight: 700; }
    .data-table td.cell-negative { color: #b91c1c; font-weight: 700; }
    .row-even { background: #fff; }
    .row-odd  { background: #f8fafc; }

    thead { display: table-header-group; }
    tbody { display: table-row-group; }
    tr    { page-break-inside: avoid; break-inside: avoid; }

    .chart-img { width: 100%; max-width: 100%; margin: 14px 0; }

    .summary-cards { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; break-inside: avoid; page-break-inside: avoid; }
    .summary-card { flex: 1 1 150px; min-width: 130px; border: 1px solid #e2e8f0; border-top: 3px solid #1e3a6e; border-radius: 4px; padding: 8px 10px; background: #f8fafc; }
    .summary-card__label { font-size: 7.5pt; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px; }
    .summary-card--positive { border-top-color: #15803d; }
    .summary-card--negative { border-top-color: #b91c1c; }
    .summary-card__value { font-size: 11pt; font-weight: 700; color: #1e3a6e; }
    .summary-card__caption { font-size: 8pt; color: #475569; margin-top: 2px; }
    .summary-card__periods { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
    .summary-card__period { min-width: 0; padding: 6px 8px; background: #fff; border: 1px solid #d8e1ee; border-radius: 3px; }
    .summary-card__period-label { font-size: 8.5pt; font-weight: 700; color: #1e3a6e; overflow-wrap: anywhere; }
    .summary-card__period-value { font-size: 10.5pt; font-weight: 700; color: #0f172a; margin-top: 3px; overflow-wrap: anywhere; }
    .summary-card__period--positive .summary-card__period-value { color: #15803d; }
    .summary-card__period--negative .summary-card__period-value { color: #b91c1c; }
    .summary-card__yoy { display: inline-flex; align-items: center; gap: 8px; margin-top: 7px; padding-top: 6px; border-top: 1px solid #d8e1ee; font-size: 8pt; font-weight: 700; color: #0f172a; }
    .summary-card__yoy strong { border-left: 1px solid #cbd5e1; font-size: 9pt; padding-left: 8px; }
    .summary-card--positive .summary-card__yoy strong { color: #15803d; }
    .summary-card--negative .summary-card__yoy strong { color: #b91c1c; }

    .gas-meta { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-bottom: 12px; padding: 8px 10px; border: 1px solid #d8e1ee; border-radius: 4px; background: #f8fafc; }
    .gas-meta span { display: flex; flex-direction: column; gap: 2px; font-size: 8.5pt; color: #0f172a; }
    .gas-meta b { font-size: 7.5pt; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
    .gas-kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin-bottom: 14px; break-inside: avoid; page-break-inside: avoid; }
    .gas-kpi { min-width: 0; border: 1px solid #d8e1ee; border-radius: 4px; overflow: hidden; background: #fff; }
    .gas-kpi__label { padding: 7px 8px; background: #1e3a6e; color: #fff; font-size: 7.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
    .gas-kpi__values { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; padding: 8px 8px 5px; }
    .gas-kpi__values div, .gas-kpi__delta, .gas-kpi__percent { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .gas-kpi span { color: #64748b; font-size: 7pt; }
    .gas-kpi strong { color: #0f172a; font-size: 10pt; font-weight: 700; overflow-wrap: anywhere; }
    .gas-kpi__delta, .gas-kpi__percent { flex-direction: row; justify-content: space-between; align-items: baseline; padding: 4px 8px; border-top: 1px solid #eef2f7; }
    .gas-kpi__delta strong, .gas-kpi__percent strong { color: #15803d; }
    .gas-kpi--negative .gas-kpi__delta strong, .gas-kpi--negative .gas-kpi__percent strong { color: #b91c1c; }
    .gas-section-title { margin: 0 0 6px; color: #1e3a6e; font-size: 11pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; }
    .gas-print-section { break-inside: avoid; page-break-inside: avoid; }
    .gas-data-table { width: 100%; table-layout: fixed; }
    .gas-data-table .gas-col-fuel { width: 15%; }
    .gas-data-table .gas-col-metric { width: 10.625%; }
    .gas-data-table thead tr:first-child { background: #1e3a6e; }
    .gas-data-table thead tr:nth-child(2) { background: #eef2f7; }
    .gas-data-table thead tr:nth-child(2) th { color: #1e3a6e; border-bottom: 1px solid #cbd5e1; }
    .gas-data-table th, .gas-data-table td { overflow: hidden; text-overflow: ellipsis; }
    .gas-data-table th { padding: 6px 4px; font-size: 7pt; line-height: 1.15; text-align: center; white-space: nowrap; }
    .gas-data-table td { padding: 5px 4px; text-align: center; white-space: nowrap; }
    .gas-data-table th:first-child, .gas-data-table td:first-child { text-align: left; }
    .gas-data-table thead tr:first-child th:nth-child(3), .gas-data-table tbody td:nth-child(6) { border-left: 1px solid #d8e1ee; }
    .gas-data-table .total-row td { background: #eef2f7; font-weight: 700; border-top: 1px solid #cbd5e1; }
    .gas-note { margin-top: 9px; padding: 7px 9px; border: 1px solid #bfdbfe; border-radius: 4px; background: #eff6ff; color: #475569; font-size: 8pt; }

    @media print {
      .gas-kpis { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .gas-data-table { table-layout: fixed; width: 100%; }
      .gas-data-table thead { display: table-header-group; }
      .gas-data-table tr { break-inside: avoid; page-break-inside: avoid; }
      .gas-data-table th, .gas-data-table td { white-space: nowrap; word-break: normal; }
      .gas-print-section { break-inside: avoid; page-break-inside: avoid; }
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  ${buildReportHeader({ logoDataUrl, title })}

  ${summaryHtml}

  ${bodyHtml}

  ${buildReportFooter()}

  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`)
  printWindow.document.close()
}
