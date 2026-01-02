// Centralized UI constants for shared styling and sizing.
export const UI_COLORS = {
  border: '#e5e7eb',
  muted: '#94a3b8',
  text: '#0f172a',
  success: '#166534',
  panelBg: '#f7f9fc',
  cardBg: '#fff',
  cardDash: '#cfd8e3',
  cardHeadBg: '#fffdf6',
  gridHeadBg: '#f8fafc',
  gridBorder: '#e5e7eb',
  binBg: '#eef2ff',
  binBorder: '#dfe3ee',
  binText: '#2f477f',
  tableHeaderBg: '#f6f8fb',
  tableHeaderBorder: '#d9e1ec',
  tableHeaderText: '#0f172a',
  containerBorder: '#e6eaf1',
  containerShadow: '0 6px 16px rgba(16,24,40,0.06)',
  cellBorder: '#edf2f7',
  rowStripe: '#fbfdff',
  rowHover: '#e0f2fe',
  cellText: '#111827'
} as const

export const UI_DIMENSIONS = {
  rowHeight: 34,
  headerHeight: 40,
  maxScrollArea: 560,
  minBodyRows: 10,
  compactRowHeight: 32
} as const

export const PAGE_SIZES = {
  BIN_DEFAULT: 50,
  BIN: 100,
  INVENTORY: 50,
  PRODUCT: 100,
  TASK: 10,
  LOW_STOCK: 100
} as const
