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
  Box
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
  onDelete: (inventoryID: string) => Promise<void> // ✅ 单个 inventory 删除
  onEditBin: (binCode: string) => void // ✅ 编辑整个 bin
}

/** ✅ 按 Bin Code 分组 */
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
  onEditBin
}) => {
  const navigate = useNavigate()
  const { warehouseID, warehouseCode } = useParams<{
    warehouseID: string
    warehouseCode: string
  }>()

  /** ✅ 当前正在编辑的 binCode */
  const [editBinCode, setEditBinCode] = useState<string | null>(null)

  /** ✅ 将数据按 Bin Code 分组 */
  const grouped = groupByBinCode(inventories)
  const binCodes = Object.keys(grouped)

  return (
    <Paper elevation={3} sx={{ borderRadius: 3 }}>
      <Table>
        {/* ✅ 表头 */}
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
          {/* ✅ Loading 状态 */}
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
            /** ✅ 遍历分组数据 */
            binCodes.map(binCode => {
              const items = grouped[binCode]
              const isEditing = editBinCode === binCode

              return items.map((item, idx) => (
                <TableRow key={item.inventoryID} sx={tableRowStyle}>
                  {/* ✅ Bin Code（首行显示 + rowSpan） */}
                  {idx === 0 ? (
                    <TableCell
                      align='center'
                      sx={{ border: '1px solid #e0e0e0', fontWeight: 700 }}
                      rowSpan={items.length}
                    >
                      {binCode}
                    </TableCell>
                  ) : null}

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

                      {/* ✅ 只有在当前 bin 编辑模式下才显示 DeleteIcon */}
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
                              onDelete(item.inventoryID) // ✅ 传 inventoryID
                            }
                          }}
                        >
                          <DeleteIcon fontSize='small' />
                        </IconButton>
                      )}
                    </Box>
                  </TableCell>

                  {/* ✅ Quantity */}
                  <TableCell
                    align='center'
                    sx={{ border: '1px solid #e0e0e0' }}
                  >
                    <Typography sx={{ fontWeight: 500, color: '#3F72AF' }}>
                      {item.quantity}
                    </Typography>
                  </TableCell>

                  {/* ✅ Updated At */}
                  <TableCell
                    align='center'
                    sx={{ border: '1px solid #e0e0e0' }}
                  >
                    {dayjs(item.updatedAt).format('YYYY-MM-DD HH:mm:ss')}
                  </TableCell>

                  {/* ✅ Action（只在首行显示，保留 Edit 逻辑） */}
                  {idx === 0 ? (
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
                            onClick={() => {
                              onEditBin(binCode)
                              setEditBinCode(null)
                            }}
                          >
                            <SaveIcon fontSize='small' />
                          </IconButton>

                          {/* ❌ Cancel 按钮 */}
                          <IconButton
                            size='small'
                            sx={{ color: 'gray' }}
                            onClick={() => setEditBinCode(null)}
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
                  ) : null}
                </TableRow>
              ))
            })
          )}
        </TableBody>
      </Table>

      {/* ✅ 分页组件 */}
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
