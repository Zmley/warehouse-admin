import { boxTypeNum } from './transfer'

export type AnyTransferRow = Record<string, any>

const escapeHtml = (s: any) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

const parseBinKey = (code: string) => {
  const s = String(code || '').trim()

  const m1 = s.match(/^(\d+)?\s*([A-Za-z]+)(?:[\s-]?(\d+))?$/)
  if (m1) {
    const [, lvl, base, seq] = m1
    return {
      s,
      base: (base || '').toUpperCase(),
      level: lvl ? parseInt(lvl, 10) : 0,
      seq: seq ? parseInt(seq, 10) : 0
    }
  }

  const suffix = (s.match(/[A-Za-z]+$/)?.[0] || '').toUpperCase()
  const numMatch = s.match(/^\d+/)?.[0]
  const num = typeof numMatch === 'string' ? parseInt(numMatch, 10) : 0
  return { s, base: suffix || s.toUpperCase(), level: num, seq: 0 }
}

const compareBinsAlphaFirst = (a: string, b: string) => {
  const pa = parseBinKey(a)
  const pb = parseBinKey(b)

  if (pa.base.length !== pb.base.length) return pa.base.length - pb.base.length

  if (pa.base !== pb.base) return pa.base.localeCompare(pb.base)

  if (pa.level !== pb.level) return pa.level - pb.level

  if (pa.seq !== pb.seq) return pa.seq - pb.seq

  return pa.s.localeCompare(pb.s)
}

export const buildPendingTransfersHtml = (
  transfers: AnyTransferRow[] = [],
  opts: {
    mergeAllIntoOne?: boolean
    titlePrefix?: string
    sortBy?: 'BIN' | 'BOX'
    sortMap?: Record<string, 'BIN' | 'BOX'>
  } = {}
) => {
  const rows = Array.isArray(transfers)
    ? transfers.map(t => ({
        bin: t?.sourceBin?.binCode || t?.sourceBinCode || '--',
        productCode: t?.productCode || '--',
        qty: Number(t?.quantity ?? 0),
        boxType: t?.boxType || t?.product?.boxType || '--',
        note: t?.note || t?.product?.note || '',
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

  const bySrc: Record<string, AnyTransferRow[]> = {}
  for (const r of rows) {
    const key = r.srcWh || 'Unknown'
    if (!bySrc[key]) bySrc[key] = []
    bySrc[key].push(r)
  }

  const makeTableBody = (list: AnyTransferRow[], sortBy: 'BIN' | 'BOX') => {
    const byBin: Record<string, AnyTransferRow[]> = {}
    for (const r of list) {
      const key = r.bin || '--'
      if (!byBin[key]) byBin[key] = []
      byBin[key].push(r)
    }

    let bins = Object.keys(byBin)
    if (!bins.length) {
      return `<tr><td class="empty" colspan="6">No pending transfers.</td></tr>`
    }

    if (sortBy === 'BIN') {
      bins.sort((a, b) => compareBinsAlphaFirst(String(a), String(b)))
    } else {
      bins.sort((a, b) => {
        const ga = byBin[a]
        const gb = byBin[b]
        const aMin = Math.min(
          ...ga.map(x => boxTypeNum(x.boxType)),
          Number.POSITIVE_INFINITY
        )
        const bMin = Math.min(
          ...gb.map(x => boxTypeNum(x.boxType)),
          Number.POSITIVE_INFINITY
        )
        if (aMin !== bMin) return aMin - bMin
        const aText = (ga[0]?.boxType ?? '').toString()
        const bText = (gb[0]?.boxType ?? '').toString()
        const tCmp = aText.localeCompare(bText)
        if (tCmp !== 0) return tCmp
        const ap = (ga[0]?.productCode ?? '').toString()
        const bp = (gb[0]?.productCode ?? '').toString()
        const pCmp = ap.localeCompare(bp)
        if (pCmp !== 0) return pCmp
        return String(a).localeCompare(String(b))
      })
    }

    let bodyHtml = ''
    bins.forEach((bin, i) => {
      const group = byBin[bin]
      const first = group[0]
      bodyHtml += `
      <tr>
        <td class="c" rowspan="${group.length}">${i + 1}</td>
        <td class="mono" rowspan="${group.length}">${escapeHtml(bin)}</td>
        <td class="mono">${escapeHtml(first.productCode)}</td>
        <td class="c">${first.qty}</td>
        <td class="mono">${escapeHtml(first.boxType)}</td>
        <td class="note"><input class="note-input" type="text" placeholder="" autocomplete="off" spellcheck="false" /></td>
      </tr>`
      for (let j = 1; j < group.length; j++) {
        const r = group[j]
        bodyHtml += `
      <tr>
        <td class="mono">${escapeHtml(r.productCode)}</td>
        <td class="c">${r.qty}</td>
        <td class="mono">${escapeHtml(r.boxType)}</td>
        <td class="note"><input class="note-input" type="text" placeholder="" autocomplete="off" spellcheck="false" /></td>
      </tr>`
      }
    })
    return bodyHtml
  }

  const sections = Object.entries(bySrc).map(([src, list]) => {
    const dsts = Array.from(new Set(list.map(r => r.dstWh))).filter(Boolean)
    const dstLabel = dsts.length === 1 ? dsts[0] : 'Multiple Destinations'
    const sortForSrc =
      (opts.sortMap && opts.sortMap[src]) || opts.sortBy || 'BIN'
    const sortLabel = sortForSrc === 'BIN' ? 'sort by Bin' : 'sort by Box Type'
    const title =
      (opts.titlePrefix ? `${opts.titlePrefix} ` : '') +
      `${src} → ${dstLabel}   ${timeLabel} (${sortLabel})`
    const bodyHtml = makeTableBody(list, sortForSrc)
    return `
      <section class="section">
        <div class="sub">${escapeHtml(title)}</div>
        <table class="compact">
          <thead>
            <tr>
              <th style="width:8%">#</th>
              <th style="width:18%">Bin</th>
              <th style="width:22%">Product</th>
              <th style="width:10%">Qty</th>
              <th style="width:18%">Box Type</th>
              <th style="width:12%">Note</th>
            </tr>
          </thead>
          <tbody>${bodyHtml}</tbody>
        </table>
      </section>`
  })

  return `<!doctype html>
<html><head><meta charset="utf-8"/>
<title>Warehouse Transfer</title>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 8mm;
    font-size: 15px; 
    color:#111;
    font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"PingFang SC","Microsoft Yahei",Arial,sans-serif;
  }
  .paper { max-width: 760px; margin: 0 auto; } 
  h1 {
    text-align:center;
    font-size:18px; 
    margin:6px 0 10px;
    font-weight:800;
  }
  .sub {
    text-align:center;
    font-size:14px;
    font-weight:700;
    margin:6px 0 8px;
  }
  table {
    width:100%;
    border-collapse:collapse;
    margin-bottom:8px;
    table-layout:fixed;
  }
  th, td {
    border:1px solid #111827;
    padding: 3px 5px;
    font-size: 18px;
    line-height: 1.25;
    text-align:center;
    vertical-align:middle;
  }
  th { background:#f3f4f6; font-weight:800; }
  .mono { font-family: ui-monospace, Menlo, Consolas, "Courier New", monospace; font-weight: 800; }
  .c { text-align:center; }
  .empty { text-align:center; color:#64748b; }

  .section { 
    page-break-inside: avoid;
    margin: 10px 0 12px;
    padding-top: 10px;
    border-top: 2px dashed #cfd8e3;
  }
  .section:first-of-type {
    border-top: none;
    padding-top: 0;
  }

  .note { background:#fff; }
  .note-input {
    width: 100%;
    height: 22px;
    border: none;
    border-bottom: 1px solid #111827;
    outline: none;
    font-size: 15px;
    line-height: 20px;
    padding: 0 4px;
    background: transparent;
    font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"PingFang SC","Microsoft Yahei",Arial,sans-serif;
  }
  .note-input::placeholder { color: #9ca3af; }

  @media print {
    body { margin: 6mm; }
    thead { display: table-header-group; }
    tr,td,th { page-break-inside: avoid; }
    /* 确保输入框在打印时保留下划线与内容 */
    .note-input {
      border: none;
      border-bottom: 1px solid #111827;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
</style></head>
<body>
  <div class="paper">
    <h1>Warehouse Transfer</h1>
    ${sections.join('')}
  </div>
</body></html>`
}
