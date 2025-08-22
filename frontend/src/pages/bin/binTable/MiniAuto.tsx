import * as React from 'react'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'

type Props = {
  value: string
  onChange: (v: string) => void
  options: string[]
  label?: string
  freeSolo?: boolean
  width?: number
  sx?: any
}

const MiniAuto: React.FC<Props> = ({
  value,
  onChange,
  options,
  label = '',
  freeSolo = false,
  width = 180,
  sx
}) => (
  <Autocomplete
    options={options}
    freeSolo={freeSolo}
    value={value ?? ''}
    onChange={(_, v) => onChange((v as string) ?? '')}
    renderInput={params => (
      <TextField
        {...params}
        label={label}
        size='small'
        sx={{
          width,
          minWidth: width,
          '& .MuiInputBase-root': {
            height: 32,
            fontSize: 13,
            background: 'transparent',
            p: 0
          },
          '& .MuiOutlinedInput-input': {
            height: '32px !important',
            minHeight: '32px !important',
            padding: '0 8px !important',
            fontSize: 13,
            lineHeight: '32px'
          },
          ...sx
        }}
      />
    )}
    sx={{ width, minWidth: width }}
  />
)

export default MiniAuto
