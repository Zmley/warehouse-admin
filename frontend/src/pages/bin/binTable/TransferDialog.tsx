import * as React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box
} from '@mui/material'
import MiniAuto from './MiniAuto'

type Props = {
  open: boolean
  targetValue: string
  setTargetValue: (v: string) => void
  binCodes: string[]
  onClose: () => void
  onConfirm: () => void
}

const TransferDialog: React.FC<Props> = ({
  open,
  targetValue,
  setTargetValue,
  binCodes,
  onClose,
  onConfirm
}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Transfer to another bin</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <MiniAuto
            label='Target Bin Code'
            value={targetValue}
            onChange={setTargetValue}
            options={binCodes}
            freeSolo={false}
            width={300}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant='contained' onClick={onConfirm}>
          Confirm Transfer
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default React.memo(TransferDialog)
