import React, { useRef, useState } from 'react'
import { Autocomplete, TextField, InputAdornment, SxProps } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'

interface AutocompleteTextFieldProps {
  label: string
  value: string
  onChange: (newValue: string) => void
  onSubmit?: () => void
  options: string[]
  sx?: SxProps
  freeSolo?: boolean

  disabled?: boolean
}

const AutocompleteTextField: React.FC<AutocompleteTextFieldProps> = ({
  label,
  value,
  onChange,
  onSubmit,
  options,
  sx
}) => {
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const showOptions = value.length > 0
  const filteredOptions = showOptions
    ? options.filter(option =>
        option.toLowerCase().startsWith(value.toLowerCase())
      )
    : []

  return (
    <Autocomplete
      freeSolo
      disableClearable
      options={filteredOptions}
      inputValue={value}
      open={open && filteredOptions.length > 0}
      onInputChange={(_, newInputValue, reason) => {
        onChange(newInputValue)
        if (reason === 'input') setOpen(true)
      }}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onClose={() => setOpen(false)}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          setOpen(false)
          onSubmit?.()
          if (inputRef.current) inputRef.current.blur()
        }
      }}
      sx={{
        minWidth: 100,
        ...sx
      }}
      renderInput={params => (
        <TextField
          {...params}
          inputRef={inputRef}
          placeholder={label}
          variant='outlined'
          size='small'
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position='start'>
                <SearchIcon sx={{ color: '#3F72AF' }} />
              </InputAdornment>
            ),
            sx: {
              borderRadius: 2,
              backgroundColor: '#f9f9f9',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#ccc'
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#3F72AF'
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#3F72AF',
                borderWidth: '2px'
              }
            }
          }}
        />
      )}
    />
  )
}

export default AutocompleteTextField
