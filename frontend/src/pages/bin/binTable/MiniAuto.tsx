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
}) => {
  // 输入框显示用
  const [inputValue, setInputValue] = React.useState(value ?? '')
  // 只有“用户打字”后才允许打开
  const [userTyped, setUserTyped] = React.useState(false)

  // 外部 value 变了，同步显示但不触发展开
  React.useEffect(() => {
    setInputValue(value ?? '')
  }, [value])

  const trimmed = (inputValue || '').trim()
  const shouldOpen = userTyped && trimmed.length >= 1

  return (
    <Autocomplete
      options={options}
      freeSolo={freeSolo}
      value={value ?? ''}
      onChange={(_, v) => {
        onChange((v as string) ?? '')
        // 选择后收起菜单，并视为未打字状态
        setUserTyped(false)
      }}
      inputValue={inputValue}
      onInputChange={(_, v, reason) => {
        setInputValue(v ?? '')
        // 只有真正的键盘输入才设置为已打字
        if (reason === 'input') setUserTyped(true)
        // 清空/重置时不展开
        if (reason === 'clear' || reason === 'reset') setUserTyped(false)
      }}
      open={shouldOpen}
      onOpen={e => {
        // 未打字前禁止打开（避免初始有值时弹出且关不掉）
        if (!shouldOpen) e.preventDefault()
      }}
      onClose={() => {
        // 手动关闭时也认为未打字（避免再次自动弹出）
        setUserTyped(false)
      }}
      // 只匹配“以……开头”
      filterOptions={opts => {
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
