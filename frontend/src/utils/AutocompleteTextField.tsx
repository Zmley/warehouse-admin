import { Autocomplete, TextField, InputAdornment, SxProps } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'

interface AutocompleteTextFieldProps {
  label: string
  value: string
  onChange: (newValue: string) => void
  onSubmit: () => void
  options: string[]
  sx?: SxProps
}

const AutocompleteTextField: React.FC<AutocompleteTextFieldProps> = ({
  label,
  value,
  onChange,
  onSubmit,
  options,
  sx
}) => {
  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(value.toLowerCase())
  )

  return (
    <Autocomplete
      freeSolo
      options={filteredOptions}
      inputValue={value}
      onInputChange={(_, newInputValue) => onChange(newInputValue)}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          onSubmit()
        }
      }}
      sx={{
        minWidth: 250,
        ...sx
      }}
      renderInput={params => (
        <TextField
          {...params}
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
