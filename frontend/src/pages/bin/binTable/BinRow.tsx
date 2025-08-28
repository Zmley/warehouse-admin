import * as React from 'react'
import dayjs from 'dayjs'
import { TableRow, TableCell, Tooltip, IconButton } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import { BinType } from 'constants/index'

const COL_WIDTH = {
  type: 90,
  binCode: 150,
  codes: 260,
  updated: 150,
  action: 140
}
const rowHeight = 34

type Props = {
  binType: string
  binID: string
  row: any
  rowIndex: number
  rowSpan: number
  codes: string[]
  onEdit: (binID: string, codes: string[]) => void
}

const BinRow: React.FC<Props> = ({
  binType,
  binID,
  row,
  rowIndex,
  rowSpan,
  codes,
  onEdit
}) => {
  const canEdit = binType === BinType.PICK_UP || binType === BinType.INVENTORY
  const applies = canEdit

  return (
    <TableRow sx={{ height: rowHeight }}>
      {rowIndex === 0 && (
        <TableCell
          align='center'
          rowSpan={rowSpan}
          sx={{
            width: COL_WIDTH.type,
            minWidth: COL_WIDTH.type,
            fontWeight: 700,
            border: '1px solid #e0e0e0',
            fontSize: 13,
            height: rowHeight,
            p: 0
          }}
        >
          {row.type}
        </TableCell>
      )}

      {rowIndex === 0 && (
        <TableCell
          align='center'
          rowSpan={rowSpan}
          sx={{
            width: COL_WIDTH.binCode,
            minWidth: COL_WIDTH.binCode,
            fontWeight: 700,
            border: '1px solid #e0e0e0',
            fontSize: 13,
            height: rowHeight,
            p: 0
          }}
        >
          {row.binCode}
        </TableCell>
      )}

      <TableCell
        align='center'
        sx={{
          border: '1px solid #e0e0e0',
          width: COL_WIDTH.codes,
          minWidth: COL_WIDTH.codes,
          fontSize: 13,
          height: rowHeight,
          p: 0,
          color: applies
            ? undefined
            : (theme: any) => theme.palette.action.disabled,
          fontStyle: applies ? undefined : 'italic'
        }}
      >
        {applies ? row._code || '' : 'Not Applied'}
      </TableCell>

      <TableCell
        align='center'
        sx={{
          border: '1px solid #e0e0e0',
          width: COL_WIDTH.updated,
          minWidth: COL_WIDTH.updated,
          fontSize: 13,
          height: rowHeight,
          p: 0
        }}
      >
        {row.updatedAt ? dayjs(row.updatedAt).format('YYYY-MM-DD HH:mm') : '--'}
      </TableCell>

      {rowIndex === 0 && (
        <TableCell
          align='center'
          rowSpan={rowSpan}
          sx={{
            border: '1px solid #e0e0e0',
            width: COL_WIDTH.action,
            minWidth: COL_WIDTH.action,
            fontSize: 13,
            height: rowHeight,
            p: 0
          }}
        >
          {canEdit ? (
            <Tooltip title='Edit'>
              <span>
                <IconButton
                  color='primary'
                  size='small'
                  sx={{ height: 32, width: 32, p: 0 }}
                  onClick={() => onEdit(binID, codes)}
                  aria-label='edit row'
                >
                  <EditIcon />
                </IconButton>
              </span>
            </Tooltip>
          ) : (
            <Tooltip title='Not Editable'>
              <span>
                <IconButton
                  size='small'
                  sx={{ height: 32, width: 32, p: 0 }}
                  disabled
                  aria-label='disabled edit'
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
}

export default React.memo(BinRow)
