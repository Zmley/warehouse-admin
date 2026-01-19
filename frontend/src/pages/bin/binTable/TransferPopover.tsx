import * as React from 'react'
import {
  Popover,
  Stack,
  Button,
  Box,
  Typography,
  IconButton
} from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import MiniAuto from './MiniAuto'

type Props = {
  anchorEl: HTMLElement | null
  open: boolean
  value: string
  options: string[]
  onChange: (v: string) => void
  onClose: () => void
  onConfirm: () => void
  width?: number
  title?: string
  openOnFocus?: boolean
}

const TransferPopover: React.FC<Props> = ({
  anchorEl,
  open,
  value,
  options,
  onChange,
  onClose,
  onConfirm,
  width = 200,
  title = 'Transfer to another bin',
  openOnFocus = false
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation()
    if (e.key === 'Enter' && value?.trim()) onConfirm()
    if (e.key === 'Escape') onClose()
  }

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      disablePortal
      transitionDuration={120}
      PaperProps={{
        sx: theme => ({
          p: 1,
          borderRadius: 2,
          border: '1px solid',
          borderColor: theme.palette.success.light,
          bgcolor:
            theme.palette.mode === 'dark'
              ? 'rgba(28,28,28,0.95)'
              : 'rgba(255,255,255,0.98)',
          boxShadow:
            theme.palette.mode === 'dark'
              ? '0 8px 22px rgba(0,0,0,0.35)'
              : '0 10px 26px rgba(30,62,98,0.12)',
          minWidth: width + 76,

          '@keyframes popIn': {
            from: { opacity: 0, transform: 'translateY(-4px) scale(.98)' },
            to: { opacity: 1, transform: 'translateY(0) scale(1)' }
          },
          animation: 'popIn 120ms ease-out'
        }),
        onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
        onClick: (e: React.MouseEvent) => e.stopPropagation(),
        onKeyDown: handleKeyDown
      }}
    >
      <Stack
        direction='row'
        alignItems='center'
        justifyContent='space-between'
        sx={{ mb: 0.5, px: 0.25 }}
      >
        <Typography
          variant='caption'
          sx={{ fontWeight: 700, letterSpacing: 0.3, opacity: 0.8 }}
        >
          {title}
        </Typography>
        <IconButton
          size='small'
          onClick={onClose}
          sx={{ width: 26, height: 26 }}
        >
          <CloseRoundedIcon fontSize='small' />
        </IconButton>
      </Stack>

      <Box
        sx={theme => ({
          position: 'absolute',
          top: -6,
          left: 16,
          width: 12,
          height: 12,
          transform: 'rotate(45deg)',
          bgcolor:
            theme.palette.mode === 'dark'
              ? 'rgba(28,28,28,0.95)'
              : 'rgba(255,255,255,0.98)',
          borderLeft: '1px solid ' + theme.palette.success.light,
          borderTop: '1px solid ' + theme.palette.success.light,
          borderTopLeftRadius: 3
        })}
      />

      <Stack
        direction='row'
        alignItems='center'
        spacing={1}
        sx={{
          '& .MuiInputBase-root': {
            height: 36,
            fontSize: 13,
            borderRadius: 1.5,
            boxShadow: 'inset 0 0 0 1px rgba(67,160,71,0.18)',
            transition: 'box-shadow .15s ease'
          },
          '& .MuiInputBase-root.Mui-focused': {
            boxShadow: 'inset 0 0 0 1px rgba(67,160,71,0.38)'
          },
          '& .MuiInputLabel-root': { display: 'none' }
        }}
      >
        <MiniAuto
          label=''
          value={value}
          onChange={onChange}
          options={options}
          freeSolo={false}
          width={width}
          openOnFocus={openOnFocus}
        />

        <Button
          variant='contained'
          size='small'
          color='success'
          disabled={!value?.trim()}
          onClick={() => value?.trim() && onConfirm()}
          sx={{
            height: 36,
            minWidth: 76,
            borderRadius: 1.5,
            textTransform: 'none',
            fontWeight: 700,
            letterSpacing: 0.2,
            boxShadow: 'none',
            '&:hover': { boxShadow: 'none' }
          }}
        >
          Confirm
        </Button>
      </Stack>
    </Popover>
  )
}

export default React.memo(TransferPopover)
