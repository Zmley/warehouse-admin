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
  Typography
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

  onEditBin: (binCode: string) => void
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
  onEditBin,
  isEmptyBin,
  navigateToProduct
}) => {
  return (
    <TableBody>
      {binCodes.map(binCode => {
        const items = grouped[binCode]
        const editing = editBinCode === binCode
        const empty = isEmptyBin(items)

        const rowSpanCount =
          items.length + (empty ? 0 : newRows[binCode]?.length || 0)

        return (
          <React.Fragment key={binCode}>
            {items.map((item, idx) => {
              const isPlaceholder = !item.inventoryID // 空货位占位行
              const showDelete = editing && !isPlaceholder

              const currentProduct = isPlaceholder
                ? emptyDraft[binCode]?.productCode ?? ''
                : productDraft[item.inventoryID] ?? item.productCode

              const currentQuantity = isPlaceholder
                ? emptyDraft[binCode]?.quantity ?? ''
                : quantityDraft[item.inventoryID] ?? item.quantity

              return (
                <TableRow
                  key={item.inventoryID ?? `empty-${binCode}`}
                  sx={{ ...tableRowStyle, height: ROW_HEIGHT }}
                >
                  {idx === 0 && (
                    <TableCell
                      align='center'
                      sx={{
                        border: '1px solid #e0e0e0',
                        fontWeight: 700,
                        height: ROW_HEIGHT,
                        p: 0
                      }}
                      rowSpan={rowSpanCount}
                    >
                      {binCode}
                    </TableCell>
                  )}

                  {/* Product Code（空货位显示空白，不再显示 none） */}
                  <TableCell
                    align='center'
                    sx={{
                      border: '1px solid #e0e0e0',
                      height: ROW_HEIGHT,
                      p: 0
                    }}
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
                            />
                          )}
                          sx={{ width: 150 }}
                        />
                        {showDelete && (
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
                              >
                                <DeleteIcon fontSize='small' />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                      </Box>
                    ) : item.productCode ? (
                      <Typography
                        sx={{ color: '#1976d2', cursor: 'pointer' }}
                        onClick={() => navigateToProduct(item.productCode!)}
                      >
                        {item.productCode}
                      </Typography>
                    ) : (
                      <></>
                    )}
                  </TableCell>

                  {/* Quantity（空货位显示空白） */}
                  <TableCell
                    align='center'
                    sx={{
                      border: '1px solid #e0e0e0',
                      height: ROW_HEIGHT,
                      p: 0
                    }}
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
                          width: 80,
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
                      />
                    ) : item.inventoryID ? (
                      <Typography sx={{ fontWeight: 500, color: '#3F72AF' }}>
                        {item.quantity}
                      </Typography>
                    ) : (
                      <></>
                    )}
                  </TableCell>

                  {/* Updated At（空货位不显示） */}
                  <TableCell
                    align='center'
                    sx={{
                      border: '1px solid #e0e0e0',
                      height: ROW_HEIGHT,
                      p: 0
                    }}
                  >
                    {item.inventoryID && item.updatedAt ? (
                      dayjs(item.updatedAt).format('YYYY-MM-DD HH:mm:ss')
                    ) : (
                      <></>
                    )}
                  </TableCell>

                  {/* Actions（按 bin 合并） */}
                  {idx === 0 && (
                    <TableCell
                      align='center'
                      sx={{
                        border: '1px solid #e0e0e0',
                        height: ROW_HEIGHT,
                        p: 0
                      }}
                      rowSpan={rowSpanCount}
                    >
                      {editing ? (
                        <Box display='flex' justifyContent='center' gap={1}>
                          <Tooltip title='Save'>
                            <span>
                              <IconButton
                                color='success'
                                size='small'
                                sx={{ height: 32, width: 32, p: 0 }}
                                disabled={saving !== null}
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

                          {/* 非空货位才显示新增按钮 */}
                          {!empty && (
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
                          )}
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

            {/* 非空货位下的“新行”输入（空货位不显示） */}
            {editing &&
              !empty &&
              (newRows[binCode] || []).map((row, index) => (
                <TableRow
                  key={`new-${binCode}-${index}`}
                  sx={{ height: ROW_HEIGHT }}
                >
                  <TableCell
                    align='center'
                    sx={{
                      border: '1px solid #e0e0e0',
                      height: ROW_HEIGHT,
                      p: 0
                    }}
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
                          />
                        )}
                        sx={{ width: 150 }}
                      />
                      <Tooltip title='Delete'>
                        <span>
                          <IconButton
                            color='error'
                            size='small'
                            sx={{ height: 32, width: 32, p: 0 }}
                            onClick={() => onDeleteNewRow(binCode, index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </TableCell>

                  <TableCell
                    align='center'
                    sx={{
                      border: '1px solid ${CELL_BORDER}',
                      height: ROW_HEIGHT,
                      p: 0
                    }}
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
                        width: 80,
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
                    />
                  </TableCell>

                  <TableCell
                    align='center'
                    sx={{
                      border: '1px solid ${CELL_BORDER}',
                      height: ROW_HEIGHT,
                      p: 0
                    }}
                  />
                </TableRow>
              ))}
          </React.Fragment>
        )
      })}

      {/* 填充行，保持最小高度（移动到父里也可，这里留空即可） */}
    </TableBody>
  )
}

export default InventoryRows
