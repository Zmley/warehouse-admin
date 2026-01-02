import type { InventoryItem } from 'types/Inventory'

export const filterOptions = (
  opts: string[],
  kw: string,
  limit = 50
): string[] => {
  const q = kw.trim().toLowerCase()
  if (!q) return []
  const out: string[] = []
  for (let i = 0; i < opts.length && out.length < limit; i++) {
    const o = opts[i]
    if (o.toLowerCase().startsWith(q)) out.push(o)
  }
  return out
}

const escapeHtml = (val: unknown) =>
  String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

export const buildInventoryPrintHtml = (inventories: InventoryItem[]): string => {
  const rows = inventories
    .map(inv => {
      const binCode = escapeHtml(inv.bin?.binCode ?? '--')
      const productCode = escapeHtml(inv.productCode ?? '--')
      const quantity = escapeHtml(inv.quantity ?? '--')
      const updated =
        inv.updatedAt && !Number.isNaN(Date.parse(inv.updatedAt))
          ? escapeHtml(new Date(inv.updatedAt).toLocaleString())
          : '--'
      return `
          <tr>
            <td>${binCode}</td>
            <td>${productCode}</td>
            <td style="text-align:right;">${quantity}</td>
            <td>${updated}</td>
          </tr>
        `
    })
    .join('')

  return `
    <html>
      <head>
        <title>Inventory Snapshot</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 16px; color: #0f172a; }
          h1 { margin: 0 0 12px; font-size: 20px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #e5e7eb; padding: 8px 10px; font-size: 13px; }
          th { background: #eef2ff; text-align: left; }
          tr:nth-child(even) { background: #f8fafc; }
        </style>
      </head>
      <body>
        <h1>Inventory Snapshot</h1>
        <table>
          <thead>
            <tr>
              <th>Bin Code</th>
              <th>Product Code</th>
              <th style="text-align:right;">Quantity</th>
              <th>Updated At</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>
  `
}

export const groupByBinCode = (list: InventoryItem[]) => {
  const map: Record<string, InventoryItem[]> = {}
  list.forEach(item => {
    const code = item.bin?.binCode || '--'
    if (!map[code]) map[code] = []
    map[code].push(item)
  })
  return map
}
