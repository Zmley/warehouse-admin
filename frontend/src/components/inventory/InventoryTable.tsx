import React from 'react'
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
  CircularProgress
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
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
  onDelete: (id: string) => Promise<any>
  onEdit: (item: InventoryItem) => void
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
  onEdit
}) => {
  const navigate = useNavigate()
  const { warehouseID, warehouseCode } = useParams<{
    warehouseID: string
    warehouseCode: string
  }>()

  // 分组
  const grouped = groupByBinCode(inventories)
  const binCodes = Object.keys(grouped)

  return (
    <Paper elevation={3} sx={{ borderRadius: 3 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: '#f0f4f9' }}>
            {[
              //   'Inventory ID',
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
              <TableCell colSpan={6} align='center'>
                <CircularProgress size={32} sx={{ m: 2 }} />
              </TableCell>
            </TableRow>
          ) : inventories.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align='center'>
                <Typography color='text.secondary' sx={{ my: 3 }}>
                  No inventory found.
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            binCodes.map(binCode => {
              const items = grouped[binCode]
              return items.map((item, idx) => (
                <TableRow key={item.inventoryID} sx={tableRowStyle}>
                  {idx === 0 ? (
                    <TableCell
                      align='center'
                      sx={{ border: '1px solid #e0e0e0', fontWeight: 700 }}
                      rowSpan={items.length}
                    >
                      {binCode}
                    </TableCell>
                  ) : null}
                  <TableCell
                    align='center'
                    sx={{ border: '1px solid #e0e0e0' }}
                  >
                    <Typography
                      sx={{
                        color: '#1976d2',
                        cursor: 'pointer'
                      }}
                      onClick={() =>
                        navigate(
                          `/${warehouseID}/${warehouseCode}/product?keyword=${item.productCode}`
                        )
                      }
                    >
                      {item.productCode}
                    </Typography>
                  </TableCell>
                  <TableCell
                    align='center'
                    sx={{ border: '1px solid #e0e0e0' }}
                  >
                    <Typography
                      sx={{
                        cursor: 'pointer',
                        fontWeight: 500,
                        color: '#3F72AF'
                      }}
                      onClick={() => onEdit(item)}
                    >
                      {item.quantity}
                    </Typography>
                  </TableCell>
                  <TableCell
                    align='center'
                    sx={{ border: '1px solid #e0e0e0' }}
                  >
                    {dayjs(item.updatedAt).format('YYYY-MM-DD HH:mm:ss')}
                  </TableCell>
                  <TableCell
                    align='center'
                    sx={{ border: '1px solid #e0e0e0' }}
                  >
                    <IconButton
                      color='error'
                      size='small'
                      onClick={() => {
                        if (
                          window.confirm(
                            'Are you sure you want to delete this item?'
                          )
                        )
                          onDelete(item.inventoryID)
                      }}
                    >
                      <DeleteIcon fontSize='small' />
                    </IconButton>
                  </TableCell>
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
