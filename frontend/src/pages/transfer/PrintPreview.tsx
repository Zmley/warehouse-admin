import React, { useRef } from 'react'
import {
  AppBar,
  Box,
  Button,
  Dialog,
  IconButton,
  Toolbar,
  Typography
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import PrintIcon from '@mui/icons-material/Print'

type AnyT = Record<string, any>

const escapeHtml = (s: any) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

export const buildPendingTransfersHtml = (
  transfers: AnyT[] = [],
  opts: { mergeAllIntoOne?: boolean; titlePrefix?: string } = {}
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

  const bySrc: Record<string, AnyT[]> = {}
  for (const r of rows) {
    const key = r.srcWh || 'Unknown'
    if (!bySrc[key]) bySrc[key] = []
    bySrc[key].push(r)
  }

  const makeTableBody = (list: AnyT[]) => {
    const byBin: Record<string, AnyT[]> = {}
    for (const r of list) {
      const key = r.bin || '--'
      if (!byBin[key]) byBin[key] = []
      byBin[key].push(r)
    }

    const bins = Object.keys(byBin)
    if (!bins.length) {
      return `<tr><td class="empty" colspan="6">No pending transfers.</td></tr>`
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

  let sections: string[] = []

  sections = Object.entries(bySrc).map(([src, list]) => {
    const dsts = Array.from(new Set(list.map(r => r.dstWh))).filter(Boolean)
    const dstLabel = dsts.length === 1 ? dsts[0] : 'Multiple Destinations'
    const title =
      (opts.titlePrefix ? `${opts.titlePrefix} ` : '') +
      `${src} → ${dstLabel}   ${timeLabel}`
    const bodyHtml = makeTableBody(list)
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
              <th style="width:24%">Note</th>
            </tr>
          </thead>
          <tbody>${bodyHtml}</tbody>
        </table>
      </section>`
  })

  const html = `<!doctype html>
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
    font-size: 15px;
    line-height: 1.25;
    text-align:center;
    vertical-align:middle;
  }
  th { background:#f3f4f6; font-weight:800; }
  .mono { font-family: ui-monospace, Menlo, Consolas, "Courier New", monospace; font-weight: 800; }
  .c { text-align:center; }
  .empty { text-align:center; color:#64748b; }

  /* 每个仓库段之间用虚线分隔；第一段不显示虚线 */
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
    font-size: 14px;
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
  return html
}

export const PrintPreviewDialog: React.FC<{
  open: boolean
  html?: string
  rawTransfers?: AnyT[]
  defaultSelectedSources?: string[]
  onClose: () => void
}> = ({ open, html, rawTransfers, defaultSelectedSources, onClose }) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  const htmlToShow = React.useMemo(() => {
    if (rawTransfers && rawTransfers.length) {
      return buildPendingTransfersHtml(rawTransfers, {
        mergeAllIntoOne: false
      })
    }
    return html || ''
  }, [rawTransfers, html])

  const handlePrint = () => {
    const win = iframeRef.current?.contentWindow
    if (!win) return
    win.focus()
    win.print()
  }

  return (
    <Dialog
      open={open}
      fullScreen
      hideBackdrop
      onClose={onClose}
      PaperProps={{ sx: { bgcolor: '#0b1220' } }}
    >
      <AppBar
        position='relative'
        sx={{ bgcolor: '#0b1220', boxShadow: 'none' }}
      >
        <Toolbar sx={{ gap: 1, flexWrap: 'wrap' }}>
          <IconButton edge='start' onClick={onClose} color='inherit'>
            <CloseIcon />
          </IconButton>
          <Typography sx={{ fontWeight: 800, mr: 2 }}>
            FCS Warehouse Transfer — Print Preview
          </Typography>

          <Box sx={{ flex: 1 }} />
          <Button
            variant='contained'
            onClick={handlePrint}
            startIcon={<PrintIcon />}
            sx={{ fontWeight: 700 }}
          >
            Print
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, display: 'grid', placeItems: 'center', p: 2 }}>
        <Box
          sx={{
            width: '100%',
            height: '100%',
            maxWidth: '860px',
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0,0,0,.4)',
            border: '1px solid #1f2a44',
            bgcolor: '#0e1628'
          }}
        >
          <iframe
            ref={iframeRef}
            title='print-preview'
            style={{
              width: '100%',
              height: '100%',
              border: 0,
              background: '#fff'
            }}
            srcDoc={htmlToShow}
          />
        </Box>
      </Box>
    </Dialog>
  )
}

export default PrintPreviewDialog
