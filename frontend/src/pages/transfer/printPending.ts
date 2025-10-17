type AnyT = Record<string, any>

export const printPendingTransfers = (transfers: AnyT[] = []) => {
  const rows = Array.isArray(transfers)
    ? transfers.map(t => ({
        bin: t?.sourceBin?.binCode || t?.sourceBinCode || '--',
        productCode: t?.productCode || '--',
        qty: Number(t?.quantity ?? 0),
        boxType: t?.boxType || t?.product?.boxType || '--',
        srcWh:
          t?.sourceWarehouse?.warehouseCode ||
          t?.sourceBin?.warehouse?.warehouseCode ||
          '--',
        dstWh:
          t?.destinationWarehouse?.warehouseCode ||
          t?.destinationBin?.warehouse?.warehouseCode ||
          '--'
      }))
    : []

  const now = new Date()
  const M = now.getMonth() + 1
  const D = now.getDate()
  const HH = String(now.getHours()).padStart(2, '0')
  const MM = String(now.getMinutes()).padStart(2, '0')
  const timeLabel = `${M}/${D} ${HH}:${MM}`

  const bySrc: Record<string, AnyT[]> = {}
  for (const r of rows) {
    const key = r.srcWh || 'Unknown'
    if (!bySrc[key]) bySrc[key] = []
    bySrc[key].push(r)
  }

  const sections = Object.entries(bySrc).map(([src, list]) => {
    const dsts = Array.from(new Set(list.map(r => r.dstWh)))
    const dstLabel = dsts.length === 1 ? dsts[0] : 'Multiple Destinations'
    const title = `${src} → ${dstLabel}   ${timeLabel}`

    // group by Bin
    const byBin: Record<string, AnyT[]> = {}
    for (const r of list) {
      const key = r.bin || '--'
      if (!byBin[key]) byBin[key] = []
      byBin[key].push(r)
    }

    const bins = Object.keys(byBin).sort()
    let bodyHtml = ''
    bins.forEach((bin, i) => {
      const group = byBin[bin]
      const first = group[0]
      bodyHtml += `
        <tr>
          <td rowspan="${group.length}">${i + 1}</td>
          <td rowspan="${group.length}">${escapeHtml(bin)}</td>
          <td>${escapeHtml(first.productCode)}</td>
          <td>${first.qty}</td>
          <td>${escapeHtml(first.boxType)}</td>
        </tr>`
      for (let j = 1; j < group.length; j++) {
        const r = group[j]
        bodyHtml += `<tr><td>${escapeHtml(r.productCode)}</td><td>${
          r.qty
        }</td><td>${escapeHtml(r.boxType)}</td></tr>`
      }
    })

    if (!bins.length)
      bodyHtml = `<tr><td colspan="5" class="empty">No pending transfers</td></tr>`

    return `
      <section class="section">
        <div class="sub">${escapeHtml(title)}</div>
        <table>
          <thead>
            <tr>
              <th>#</th><th>Bin</th><th>Product</th><th>Qty</th><th>Box Type</th>
            </tr>
          </thead>
          <tbody>${bodyHtml}</tbody>
        </table>
      </section>`
  })

  const html = `<!doctype html>
<html><head><meta charset="utf-8"/>
<title>Warehouse Transfer 仓库调货</title>
<style>
  body { margin: 10px; font-size: 11px; color:#111; font-family: Arial, sans-serif; }
  h1 { text-align:center; font-size:13px; margin:4px 0; font-weight:800; }
  .sub { text-align:center; font-size:11px; font-weight:700; margin:4px 0; }
  table { width:100%; border-collapse:collapse; margin-bottom:8px; table-layout:fixed; }
  th, td { border:0.8px solid #222; padding:2px 4px; font-size:10px; text-align:center; vertical-align:middle; }
  th { background:#f4f4f4; }
  .empty { text-align:center; color:#666; }
  .section { page-break-inside: avoid; }
  @media print {
    body { margin:6mm; }
    thead { display: table-header-group; }
  }
</style></head>
<body>
  <h1>Warehouse Transfer 仓库调货</h1>
  ${sections.join('')}
  <script>window.onload=()=>setTimeout(()=>window.print(),0)</script>
</body></html>`

  const w = window.open('', '_blank')
  if (!w) return
  w.document.open()
  w.document.write(html)
  w.document.close()
}

function escapeHtml(s: any) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
