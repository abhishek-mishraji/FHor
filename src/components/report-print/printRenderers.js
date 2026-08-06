const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

export const buildReportHeader = ({ logoDataUrl, title }) => `
  <div class="doc-header">
    ${logoDataUrl ? `<img class="logo" src="${logoDataUrl}" alt="Hands Of Retail" />` : '<div></div>'}
    <div class="company-block">
      <div class="company-name">Hands Of Retail</div>
      <div class="company-url">handsoffretail.com</div>
    </div>
  </div>
  <h1 class="report-title">${escapeHtml(title)}</h1>
`

export const buildReportFooter = () => `
  <footer class="report-print__footer">
    <span>Hands Of Retail · handsoffretail.com</span>
    <span>Generated report</span>
  </footer>
`
