import React, { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Typography,
  IconButton,
  CircularProgress,
  Box,
  TextField
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import SaveIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import dayjs from 'dayjs'
import { useNavigate, useParams } from 'react-router-dom'
import { InventoryItem } from 'types/InventoryItem'
import { tableRowStyle } from 'styles/tableRowStyle'

interface InventoryTableProps {
  inventories: InventoryItem[]
  page: number
  totalPages: number
  isLoading: boolean
  onPageChange: (event: unknown, newPage: number) => void
  onDelete: (inventoryID: string) => Promise<void>
  onEditBin: (binCode: string) => void
  onUpdateQuantity: (inventoryID: string, newQty: number) => Promise<void>
}

const groupByBinCode = (list: InventoryItem[]) => {
  const map: Record<string, InventoryItem[]> = {}
  list.forEach(item => {
    const code = item.bin?.binCode || '--'
    if (!map[code]) map[code] = []
    map[code].push(item)
  })
  return map
}

const InventoryTable: React.FC<InventoryTableProps> = ({
  inventories,
  page,
  totalPages,
  isLoading,
  onPageChange,
  onDelete,
  onEditBin,
  onUpdateQuantity
}) => {
  const navigate = useNavigate()
  const { warehouseID, warehouseCode } = useParams<{
    warehouseID: string
    warehouseCode: string
  }>()

  const [editBinCode, setEditBinCode] = useState<string | null>(null)
  const [quantityDraft, setQuantityDraft] = useState<
    Record<string, number | ''>
  >({})
  const [saving, setSaving] = useState<string | null>(null)

  const grouped = groupByBinCode(inventories)
  const binCodes = Object.keys(grouped)

  return (
    <Paper elevation={3} sx={{ borderRadius: 3 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: '#f0f4f9' }}>
            {[
              'Bin Code',
              'Product Code',
              'Quantity',
              'Updated At',
              'Action'
            ].map(header => (
              <TableCell
                key={header}
                align='center'
                sx={{ border: '1px solid #e0e0e0' }}
              >
                {header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} align='center'>
                <CircularProgress size={32} sx={{ m: 2 }} />
              </TableCell>
            </TableRow>
          ) : inventories.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} align='center'>
                <Typography color='text.secondary' sx={{ my: 3 }}>
                  No inventory found.
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            binCodes.map(binCode => {
              const items = grouped[binCode]
              const isEditing = editBinCode === binCode

              return items.map((item, idx) => (
                <TableRow key={item.inventoryID} sx={tableRowStyle}>
                  {/* ✅ Bin Code */}
                  {idx === 0 && (
                    <TableCell
                      align='center'
                      sx={{ border: '1px solid #e0e0e0', fontWeight: 700 }}
                      rowSpan={items.length}
                    >
                      {binCode}
                    </TableCell>
                  )}

                  {/* ✅ Product Code + DeleteIcon */}
                  <TableCell
                    align='center'
                    sx={{ border: '1px solid #e0e0e0' }}
                  >
                    <Box
                      display='flex'
                      justifyContent='center'
                      alignItems='center'
                    >
                      <Typography
                        sx={{ color: '#1976d2', cursor: 'pointer', mr: 1 }}
                        onClick={() =>
                          navigate(
                            `/${warehouseID}/${warehouseCode}/product?keyword=${item.productCode}`
                          )
                        }
                      >
                        {item.productCode}
                      </Typography>

                      {isEditing && (
                        <IconButton
                          color='error'
                          size='small'
                          onClick={() => {
                            if (
                              window.confirm(
                                `Are you sure you want to delete this inventory item?`
                              )
                            ) {
                              onDelete(item.inventoryID)
                            }
                          }}
                        >
                          <DeleteIcon fontSize='small' />
                        </IconButton>
                      )}
                    </Box>
                  </TableCell>

                  {/* ✅ Quantity —> 变成数字输入框（编辑模式） */}
                  <TableCell
                    align='center'
                    sx={{ border: '1px solid #e0e0e0' }}
                  >
                    {isEditing ? (
                      <TextField
                        type='number'
                        size='small'
                        value={
                          quantityDraft[item.inventoryID] !== undefined
                            ? quantityDraft[item.inventoryID]
                            : item.quantity
                        }
                        onChange={e => {
                          const value = e.target.value
                          setQuantityDraft(prev => ({
                            ...prev,
                            [item.inventoryID]:
                              value === '' ? '' : Number(value) // ✅ 允许空字符串
                          }))
                        }}
                        sx={{ width: 80 }}
                      />
                    ) : (
                      <Typography sx={{ fontWeight: 500, color: '#3F72AF' }}>
                        {item.quantity}
                      </Typography>
                    )}
                  </TableCell>

                  {/* ✅ Updated At */}
                  <TableCell
                    align='center'
                    sx={{ border: '1px solid #e0e0e0' }}
                  >
                    {dayjs(item.updatedAt).format('YYYY-MM-DD HH:mm:ss')}
                  </TableCell>

                  {/* ✅ Action（只在首行显示） */}
                  {idx === 0 && (
                    <TableCell
                      align='center'
                      sx={{ border: '1px solid #e0e0e0' }}
                      rowSpan={items.length}
                    >
                      {isEditing ? (
                        <>
                          {/* ✅ Save 按钮 */}
                          <IconButton
                            size='small'
                            sx={{ color: 'green' }}
                            disabled={saving !== null}
                            onClick={async () => {
                              setSaving(binCode)
                              try {
                                // 🚨 检查有没有 空 或 0
                                const invalid = items.some(i => {
                                  const newQty =
                                    quantityDraft[i.inventoryID] !== undefined
                                      ? quantityDraft[i.inventoryID]
                                      : i.quantity
                                  return newQty === '' || newQty === 0
                                })

                                if (invalid) {
                                  alert('❌ 数量不能为空或 0，请修改后再保存。')
                                  setSaving(null)
                                  return
                                }

                                // ✅ 遍历 bin 下所有 item，如果数量有变化就更新
                                for (const i of items) {
                                  if (
                                    quantityDraft[i.inventoryID] !==
                                      undefined &&
                                    quantityDraft[i.inventoryID] !== i.quantity
                                  ) {
                                    await onUpdateQuantity(
                                      i.inventoryID,
                                      quantityDraft[i.inventoryID] as number
                                    )
                                  }
                                }

                                onEditBin(binCode)
                                setEditBinCode(null)
                              } finally {
                                setSaving(null)
                              }
                            }}
                          >
                            <SaveIcon fontSize='small' />
                          </IconButton>

                          {/* ❌ Cancel 按钮 */}
                          <IconButton
                            size='small'
                            sx={{ color: 'gray' }}
                            onClick={() => {
                              setEditBinCode(null)
                              setQuantityDraft({})
                            }}
                          >
                            <CancelIcon fontSize='small' />
                          </IconButton>
                        </>
                      ) : (
                        <>
                          {/* ✏️ Edit Bin 按钮 */}
                          <IconButton
                            size='small'
                            sx={{ color: '#1976d2' }}
                            onClick={() => setEditBinCode(binCode)}
                          >
                            <EditIcon fontSize='small' />
                          </IconButton>
                        </>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            })
          )}
        </TableBody>
      </Table>

      <TablePagination
        component='div'
        count={totalPages}
        page={page}
        onPageChange={onPageChange}
        rowsPerPage={10}
        rowsPerPageOptions={[10]}
        labelRowsPerPage=''
      />
    </Paper>
  )
}

export default InventoryTable
