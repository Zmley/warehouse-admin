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
  openOnFocus?: boolean
}

const MiniAuto: React.FC<Props> = ({
  value,
  onChange,
  options,
  label = '',
  freeSolo = false,
  width = 180,
  sx,
  openOnFocus = false
}) => {
  const [inputValue, setInputValue] = React.useState(value ?? '')
  const [userTyped, setUserTyped] = React.useState(false)
  const [isFocused, setIsFocused] = React.useState(false)

  React.useEffect(() => {
    setInputValue(value ?? '')
  }, [value])

  const trimmed = (inputValue || '').trim()
  const shouldOpen =
    (openOnFocus && isFocused) || (userTyped && trimmed.length >= 1)

  return (
    <Autocomplete
      options={options}
      freeSolo={freeSolo}
      value={value ?? ''}
      onChange={(_, v) => {
        onChange((v as string) ?? '')
        setUserTyped(false)
      }}
      inputValue={inputValue}
      onInputChange={(_, v, reason) => {
        setInputValue(v ?? '')
        if (reason === 'input') setUserTyped(true)
        if (reason === 'clear' || reason === 'reset') setUserTyped(false)
      }}
      open={shouldOpen}
      onOpen={e => {
        if (!shouldOpen) e.preventDefault()
      }}
      onClose={() => {
        setUserTyped(false)
      }}
      filterOptions={opts => {
        if (openOnFocus && isFocused && trimmed.length < 1) return opts
        if (!userTyped) return []
        const q = trimmed.toLowerCase()
        if (q.length < 1) return []
        return opts.filter(opt => opt.toLowerCase().startsWith(q))
      }}
      noOptionsText={shouldOpen ? 'No options' : ''}
      renderInput={params => (
        <TextField
          {...params}
          label={label}
          size='small'
          onFocus={() => {
            if (openOnFocus) setIsFocused(true)
          }}
          onBlur={() => setIsFocused(false)}
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
}

export default MiniAuto
