// InventoryRows.tsx
import React from 'react'
import {
  TableBody,
  TableCell,
  TableRow,
  Box,
  Autocomplete,
  TextField,
  Tooltip,
  IconButton,
  Typography,
  CircularProgress
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import SaveIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import { InventoryItem } from 'types/Inventory'
import { tableRowStyle } from 'styles/tableRowStyle'
import dayjs from 'dayjs'

type DraftQty = Record<string, number | ''>
type DraftProd = Record<string, string>
type EmptyDraft = Record<string, { productCode: string; quantity: number | '' }>
type NewRows = Record<string, { productCode: string; quantity: number | '' }[]>

type Props = {
  grouped: Record<string, InventoryItem[]>
  binCodes: string[]
  ROW_HEIGHT: number
  CELL_BORDER: string
  productOptions: string[]

  editBinCode: string | null
  setEditBinCode: (code: string | null) => void

  productDraft: DraftProd
  setProductDraft: React.Dispatch<React.SetStateAction<DraftProd>>

  quantityDraft: DraftQty
  setQuantityDraft: React.Dispatch<React.SetStateAction<DraftQty>>

  emptyDraft: EmptyDraft
  setEmptyDraft: React.Dispatch<React.SetStateAction<EmptyDraft>>

  newRows: NewRows
  setNewRows: React.Dispatch<React.SetStateAction<NewRows>>

  onDelete: (inventoryID: string) => Promise<void>
  onAddRow: (binCode: string) => void
  onDeleteNewRow: (binCode: string, index: number) => void
  onSaveGroup: (binCode: string) => Promise<void>

  saving: string | null
  isLoading: boolean

  isEmptyBin: (items: InventoryItem[]) => boolean
  navigateToProduct: (productCode: string) => void
}

const InventoryRows: React.FC<Props> = ({
  grouped,
  binCodes,
  ROW_HEIGHT,
  CELL_BORDER,
  productOptions,
  editBinCode,
  setEditBinCode,
  productDraft,
  setProductDraft,
  quantityDraft,
  setQuantityDraft,
  emptyDraft,
  setEmptyDraft,
  newRows,
  setNewRows,
  onDelete,
  onAddRow,
  onDeleteNewRow,
  onSaveGroup,
  saving,
  isLoading, // unused
  isEmptyBin,
  navigateToProduct
}) => {
  return (
    <TableBody>
      {binCodes.map(binCode => {
        const items = grouped[binCode]
        const editing = editBinCode === binCode
        const empty = isEmptyBin(items)

        // 空/非空都把新增行计入 rowSpan
        const rowSpanCount = items.length + (newRows[binCode]?.length || 0)
        const isBusy = saving === binCode

        return (
          <React.Fragment key={binCode}>
            {items.map((item, idx) => {
              const isPlaceholder = !item.inventoryID
              const currentProduct = isPlaceholder
                ? emptyDraft[binCode]?.productCode ?? ''
                : productDraft[item.inventoryID] ?? item.productCode
              const currentQuantity = isPlaceholder
                ? emptyDraft[binCode]?.quantity ?? ''
                : quantityDraft[item.inventoryID] ?? item.quantity

              return (
                <TableRow
                  key={item.inventoryID ?? `empty-${binCode}`}
                  sx={{
                    ...tableRowStyle,
                    height: ROW_HEIGHT,
                    position: 'relative',
                    ...(isBusy
                      ? { opacity: 0.6, pointerEvents: 'none' as const }
                      : {})
                  }}
                >
                  {idx === 0 && (
                    <TableCell
                      align='center'
                      rowSpan={rowSpanCount}
                      sx={{
                        border: `1px solid ${CELL_BORDER}`,
                        fontWeight: 700,
                        fontSize: 13,
                        p: 0
                      }}
                    >
                      {binCode}
                    </TableCell>
                  )}

                  {/* Product Code */}
                  <TableCell
                    align='center'
                    sx={{ border: `1px solid ${CELL_BORDER}`, p: 0 }}
                  >
                    {editing ? (
                      <Box
                        display='flex'
                        alignItems='center'
                        justifyContent='center'
                        gap={1}
                      >
                        <Autocomplete
                          size='small'
                          options={productOptions}
                          value={currentProduct}
                          onChange={(_, newValue) => {
                            if (isPlaceholder) {
                              setEmptyDraft(prev => ({
                                ...prev,
                                [binCode]: {
                                  productCode: newValue || '',
                                  quantity: prev[binCode]?.quantity ?? ''
                                }
                              }))
                            } else {
                              setProductDraft(prev => ({
                                ...prev,
                                [item.inventoryID!]: newValue || ''
                              }))
                            }
                          }}
                          renderInput={params => (
                            <TextField
                              {...params}
                              placeholder='ProductCode'
                              size='small'
                              sx={{
                                '& .MuiInputBase-root': {
                                  height: 32,
                                  fontSize: 13,
                                  p: 0
                                },
                                '& .MuiOutlinedInput-input': {
                                  p: '0 !important',
                                  height: '32px !important',
                                  lineHeight: '32px !important',
                                  textAlign: 'center'
                                }
                              }}
                              disabled={isBusy}
                            />
                          )}
                          sx={{ width: 160 }}
                          disabled={isBusy}
                        />
                        {!isPlaceholder && (
                          <Tooltip title='Delete Item'>
                            <span>
                              <IconButton
                                color='error'
                                size='small'
                                sx={{ height: 32, width: 32, p: 0 }}
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      'Are you sure you want to delete this inventory item?'
                                    )
                                  ) {
                                    onDelete(item.inventoryID!)
                                  }
                                }}
                                disabled={isBusy}
                              >
                                <DeleteIcon fontSize='small' />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                      </Box>
                    ) : item.productCode ? (
                      <Typography
                        sx={{
                          color: '#2563eb',
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                          textDecoration: 'none',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                        onClick={() => navigateToProduct(item.productCode!)}
                      >
                        {item.productCode}
                      </Typography>
                    ) : null}
                  </TableCell>

                  {/* Quantity */}
                  <TableCell
                    align='center'
                    sx={{ border: `1px solid ${CELL_BORDER}`, p: 0 }}
                  >
                    {editing ? (
                      <TextField
                        type='number'
                        size='small'
                        value={currentQuantity}
                        onChange={e => {
                          const value = e.target.value
                          if (isPlaceholder) {
                            setEmptyDraft(prev => ({
                              ...prev,
                              [binCode]: {
                                productCode: prev[binCode]?.productCode ?? '',
                                quantity: value === '' ? '' : Number(value)
                              }
                            }))
                          } else {
                            setQuantityDraft(prev => ({
                              ...prev,
                              [item.inventoryID!]:
                                value === '' ? '' : Number(value)
                            }))
                          }
                        }}
                        sx={{
                          width: 86,
                          '& .MuiInputBase-root': {
                            height: 32,
                            fontSize: 13,
                            p: 0
                          },
                          '& .MuiOutlinedInput-input': {
                            p: '0 !important',
                            height: '32px !important',
                            lineHeight: '32px !important',
                            textAlign: 'center'
                          }
                        }}
                        disabled={isBusy}
                      />
                    ) : item.inventoryID ? (
                      <Typography
                        sx={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}
                      >
                        {item.quantity}
                      </Typography>
                    ) : null}
                  </TableCell>

                  {/* Updated At */}
                  <TableCell
                    align='center'
                    sx={{ border: `1px solid ${CELL_BORDER}`, p: 0 }}
                  >
                    {item.inventoryID && item.updatedAt
                      ? dayjs(item.updatedAt).format('YYYY-MM-DD HH:mm:ss')
                      : null}
                  </TableCell>

                  {/* Actions（合并到首行） */}
                  {idx === 0 && (
                    <TableCell
                      align='center'
                      rowSpan={rowSpanCount}
                      sx={{ border: `1px solid ${CELL_BORDER}`, p: 0 }}
                    >
                      {editing ? (
                        isBusy ? (
                          <Box
                            display='flex'
                            justifyContent='center'
                            alignItems='center'
                            sx={{ height: 32 }}
                          >
                            <CircularProgress size={18} thickness={5} />
                          </Box>
                        ) : (
                          <Box display='flex' justifyContent='center' gap={1}>
                            <Tooltip title='Save'>
                              <span>
                                <IconButton
                                  color='success'
                                  size='small'
                                  sx={{ height: 32, width: 32, p: 0 }}
                                  onClick={() => onSaveGroup(binCode)}
                                >
                                  <SaveIcon />
                                </IconButton>
                              </span>
                            </Tooltip>

                            <Tooltip title='Cancel'>
                              <span>
                                <IconButton
                                  color='secondary'
                                  size='small'
                                  sx={{ height: 32, width: 32, p: 0 }}
                                  onClick={() => {
                                    setEditBinCode(null)
                                    setQuantityDraft({})
                                    setProductDraft({})
                                    setNewRows(prev => ({
                                      ...prev,
                                      [binCode]: []
                                    }))
                                    setEmptyDraft(prev => {
                                      const cp = { ...prev }
                                      delete cp[binCode]
                                      return cp
                                    })
                                  }}
                                >
                                  <CancelIcon />
                                </IconButton>
                              </span>
                            </Tooltip>

                            <Tooltip title='Add Product'>
                              <span>
                                <IconButton
                                  color='primary'
                                  size='small'
                                  sx={{ height: 32, width: 32, p: 0 }}
                                  onClick={() => onAddRow(binCode)}
                                >
                                  <AddCircleOutlineIcon />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Box>
                        )
                      ) : isBusy ? (
                        <Box
                          display='flex'
                          justifyContent='center'
                          alignItems='center'
                          sx={{ height: 32 }}
                        >
                          <CircularProgress size={18} thickness={5} />
                        </Box>
                      ) : (
                        <Tooltip title='Edit'>
                          <span>
                            <IconButton
                              color='primary'
                              size='small'
                              sx={{ height: 32, width: 32, p: 0 }}
                              onClick={() => {
                                setEditBinCode(binCode)
                                if (empty && !emptyDraft[binCode]) {
                                  setEmptyDraft(prev => ({
                                    ...prev,
                                    [binCode]: { productCode: '', quantity: '' }
                                  }))
                                }
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              )
            })}

            {/* 编辑态新增行：空/非空都渲染 */}
            {editing &&
              (newRows[binCode] || []).map((row, index) => (
                <TableRow
                  key={`new-${binCode}-${index}`}
                  sx={{
                    height: ROW_HEIGHT,
                    ...(isBusy
                      ? { opacity: 0.6, pointerEvents: 'none' as const }
                      : {})
                  }}
                >
                  <TableCell
                    align='center'
                    sx={{ border: `1px solid ${CELL_BORDER}`, p: 0 }}
                  >
                    <Box
                      display='flex'
                      justifyContent='center'
                      alignItems='center'
                      gap={1}
                    >
                      <Autocomplete
                        size='small'
                        options={productOptions}
                        value={row.productCode}
                        onChange={(_, newValue) => {
                          setNewRows(prev => {
                            const updated = [...(prev[binCode] || [])]
                            updated[index].productCode = newValue || ''
                            return { ...prev, [binCode]: updated }
                          })
                        }}
                        renderInput={params => (
                          <TextField
                            {...params}
                            placeholder='ProductCode'
                            size='small'
                            sx={{
                              '& .MuiInputBase-root': {
                                height: 32,
                                fontSize: 13,
                                p: 0
                              },
                              '& .MuiOutlinedInput-input': {
                                p: '0 !important',
                                height: '32px !important',
                                lineHeight: '32px !important',
                                textAlign: 'center'
                              }
                            }}
                            disabled={isBusy}
                          />
                        )}
                        sx={{ width: 160 }}
                        disabled={isBusy}
                      />
                      <Tooltip title='Delete'>
                        <span>
                          <IconButton
                            color='error'
                            size='small'
                            sx={{ height: 32, width: 32, p: 0 }}
                            onClick={() => onDeleteNewRow(binCode, index)}
                            disabled={isBusy}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </TableCell>

                  <TableCell
                    align='center'
                    sx={{ border: `1px solid ${CELL_BORDER}`, p: 0 }}
                  >
                    <TextField
                      type='number'
                      size='small'
                      value={row.quantity}
                      onChange={e => {
                        const value = e.target.value
                        setNewRows(prev => {
                          const updated = [...(prev[binCode] || [])]
                          updated[index].quantity =
                            value === '' ? '' : Number(value)
                          return { ...prev, [binCode]: updated }
                        })
                      }}
                      sx={{
                        width: 86,
                        '& .MuiInputBase-root': {
                          height: 32,
                          fontSize: 13,
                          p: 0
                        },
                        '& .MuiOutlinedInput-input': {
                          p: '0 !important',
                          height: '32px !important',
                          lineHeight: '32px !important',
                          textAlign: 'center'
                        }
                      }}
                      disabled={isBusy}
                    />
                  </TableCell>

                  <TableCell
                    align='center'
                    sx={{ border: `1px solid ${CELL_BORDER}`, p: 0 }}
                  />
                </TableRow>
              ))}
          </React.Fragment>
        )
      })}
    </TableBody>
  )
}

export default InventoryRows
