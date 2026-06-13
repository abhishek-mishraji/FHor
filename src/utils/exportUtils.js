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

const buildHtmlTable = ({ headers, body }) => `
  <table border="1">
    <thead>
      <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr>
    </thead>
    <tbody>
      ${body
        .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
        .join('')}
    </tbody>
  </table>
`

export const exportCsv = ({ headers, body }, filename) => {
  const lines = [headers, ...body].map((row) => row.map(escapeCsvCell).join(','))
  const blob = new Blob([String.fromCharCode(0xfeff), lines.join('\n')], { type: 'text/csv;charset=utf-8' })

  triggerDownload(blob, `${filename}.csv`)
}

export const exportExcel = ({ headers, body }, filename) => {
  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head><meta charset="UTF-8" /></head>
      <body>${buildHtmlTable({ headers, body })}</body>
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

// Opens a print-ready window; the browser print dialog saves it as PDF.
export const exportPdf = async ({ title, subtitle, matrix, chartContainer }) => {
  let chartImageHtml = ''

  if (chartContainer?.querySelector('svg')) {
    const dataUrl = await renderChartToDataUrl(chartContainer)
    chartImageHtml = `<img src="${dataUrl}" style="width:100%;max-width:900px;" alt="Chart" />`
  }

  const printWindow = window.open('', '_blank', 'width=1024,height=768')

  if (!printWindow) {
    throw new Error('Pop-up blocked. Allow pop-ups to export as PDF.')
  }

  printWindow.document.write(`
    <html>
      <head>
        <title>${escapeHtml(title)}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #11203b; padding: 24px; }
          h1 { margin-bottom: 4px; }
          p.subtitle { color: #53617c; margin-top: 0; }
          table { border-collapse: collapse; width: 100%; margin-top: 16px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 10px; font-size: 12px; text-align: left; }
          th { background: #edf4ff; text-transform: uppercase; font-size: 11px; letter-spacing: 0.06em; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <p class="subtitle">${escapeHtml(subtitle)}</p>
        ${chartImageHtml}
        ${buildHtmlTable(matrix)}
        <script>window.onload = () => { window.print(); }</script>
      </body>
    </html>
  `)
  printWindow.document.close()
}
