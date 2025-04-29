import { Autocomplete, TextField, SxProps } from '@mui/material'

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
      renderInput={params => (
        <TextField {...params} label={label} variant='outlined' size='small' />
      )}
      sx={sx}
    />
  )
}

export default AutocompleteTextField
