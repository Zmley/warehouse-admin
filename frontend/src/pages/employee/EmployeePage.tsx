import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Alert,
  Stack,
  InputAdornment,
  IconButton,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Tooltip,
  Tabs,
  Tab,
  TableContainer,
  Popover,
  TableFooter,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import CircularProgress from '@mui/material/CircularProgress'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import CloseIcon from '@mui/icons-material/Close'
import RefreshIcon from '@mui/icons-material/Refresh'
import { useAuth } from 'hooks/useAuth'
import { EmployeeType } from 'constants/index'

const EmployeePage: React.FC = () => {
  const {
    isLoading,
    error,
    result,
    registerEmployee,
    employees,
    loadEmployees,
    deleteEmployee,
    userProfile
  } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<EmployeeType>(EmployeeType.PICKER)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [roleFilter, setRoleFilter] = useState<EmployeeType>(
    EmployeeType.PICKER
  )

  const [cooldown, setCooldown] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const [popoverAnchor, setPopoverAnchor] = useState<null | HTMLElement>(null)
  const openPopover = Boolean(popoverAnchor)

  const [editingAccountID, setEditingAccountID] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [refreshLoading, setRefreshLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (error || result) {
      setCooldown(true)
      const timer = setTimeout(() => setCooldown(false), 1000)
      return () => clearTimeout(timer)
    }
  }, [error, result])

  useEffect(() => {
    loadEmployees()
  }, [])

  useEffect(() => {
    if (result && !error) {
      loadEmployees()
      setShowSuccess(true)
    }
  }, [result, error])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password || !confirmPassword) return

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match')
      setCooldown(true)
      const timer = setTimeout(() => setCooldown(false), 1000)
      setTimeout(() => clearTimeout(timer), 1000)
      return
    }

    setPasswordError(null)

    await registerEmployee({
      email,
      password,
      role: role,
      firstName,
      lastName,
      warehouseID: userProfile.warehouseID
    })

    setPassword('')
    setConfirmPassword('')
  }

  const isSubmitDisabled = isLoading || cooldown

  return (
    <Box
      sx={{
        display: 'flex',
        width: '100%',
        height: '100%',
        position: 'relative'
      }}
    >
      <Box
        sx={{
          flex: 1,
          pl: 3,
          minHeight: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mb: 2,
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tabs
              value={roleFilter}
              onChange={(e, v) => setRoleFilter(v)}
              TabIndicatorProps={{ style: { height: 3 } }}
            >
              <Tab
                label='Picker'
                value={EmployeeType.PICKER}
                sx={{ fontWeight: 700 }}
              />
              <Tab
                label='Transport Worker'
                value={EmployeeType.TRANSPORT_WORKER}
                sx={{ fontWeight: 700 }}
              />
              <Tab
                label='Admin'
                value={EmployeeType.ADMIN}
                sx={{ fontWeight: 700 }}
              />
            </Tabs>
            <IconButton
              size='small'
              sx={{ ml: 1, color: '#3a5f93' }}
              onClick={async () => {
                setRefreshLoading(true)
                await loadEmployees()
                setRefreshLoading(false)
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Box>
          <Button
            variant='contained'
            size='small'
            onClick={e => setPopoverAnchor(e.currentTarget)}
            sx={{
              backgroundColor: '#4b74b3',
              borderRadius: '6px',
              padding: '4px 12px',
              textTransform: 'uppercase',
              fontWeight: 600,
              letterSpacing: 0.5,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
              '&:hover': {
                backgroundColor: '#3a5f93'
              }
            }}
          >
            <span style={{ fontSize: '16px', fontWeight: 800 }}>+</span> CREATE
            ACCOUNT
          </Button>
        </Box>
        <Popover
          open={openPopover}
          anchorEl={popoverAnchor}
          onClose={() => setPopoverAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          PaperProps={{ sx: { p: 2, width: 320 } }}
        >
          <Box
            sx={{
              mb: 3,
              p: 2,
              border: '1px solid #e6eaf1',
              borderRadius: 2,
              backgroundColor: '#fafafa',
              boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
            }}
          >
            <Typography variant='h6' fontWeight={700} mb={2}>
              Create Employee Account
            </Typography>

            {showSuccess ? (
              <Stack spacing={2}>
                <Alert severity='success' variant='filled' sx={{ mt: 2 }}>
                  {(result && result.message) ||
                    'Employee created successfully'}{' '}
                  — <strong>{result && result.email}</strong>
                </Alert>
                <Button
                  variant='contained'
                  onClick={() => {
                    setShowSuccess(false)
                    setEmail('')
                    setPassword('')
                    setConfirmPassword('')
                    setFirstName('')
                    setLastName('')
                  }}
                  sx={{
                    backgroundColor: '#4b74b3',
                    borderRadius: '6px',
                    padding: '6px 0',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    '&:hover': {
                      backgroundColor: '#3a5f93'
                    }
                  }}
                >
                  Continue Creating
                </Button>
              </Stack>
            ) : (
              <Box component='form' onSubmit={handleSubmit}>
                <Stack spacing={2}>
                  {(error || passwordError) && (
                    <Alert severity='error' variant='outlined'>
                      {passwordError || error}
                    </Alert>
                  )}

                  <TextField
                    label='First Name'
                    fullWidth
                    size='small'
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    required
                  />

                  <TextField
                    label='Last Name'
                    fullWidth
                    size='small'
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    required
                  />

                  <TextField
                    label='Email'
                    type='text'
                    fullWidth
                    size='small'
                    value={email.replace('@outlook.com', '')}
                    onChange={e => {
                      const prefix = e.target.value.replace(/@.*/, '')
                      setEmail(prefix + '@outlook.com')
                    }}
                    required
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position='end'>
                          @outlook.com
                        </InputAdornment>
                      )
                    }}
                  />

                  <TextField
                    label='Password'
                    type={showPassword ? 'text' : 'password'}
                    fullWidth
                    size='small'
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position='end'>
                          <IconButton onClick={() => setShowPassword(p => !p)}>
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />

                  <TextField
                    label='Confirm Password'
                    type={showConfirmPassword ? 'text' : 'password'}
                    fullWidth
                    size='small'
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position='end'>
                          <IconButton
                            onClick={() => setShowConfirmPassword(p => !p)}
                          >
                            {showConfirmPassword ? (
                              <VisibilityOff />
                            ) : (
                              <Visibility />
                            )}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />

                  <TextField
                    select
                    label='Role'
                    fullWidth
                    size='small'
                    value={role}
                    onChange={e => setRole(e.target.value as EmployeeType)}
                  >
                    <MenuItem value={EmployeeType.PICKER}>Picker</MenuItem>
                    <MenuItem value={EmployeeType.TRANSPORT_WORKER}>
                      Transport Worker
                    </MenuItem>
                  </TextField>

                  <Button
                    variant='contained'
                    type='submit'
                    disabled={isSubmitDisabled}
                    sx={{
                      backgroundColor: '#4b74b3',
                      borderRadius: '6px',
                      padding: '6px 0',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      '&:hover': {
                        backgroundColor: '#3a5f93'
                      }
                    }}
                  >
                    CREATE
                  </Button>
                </Stack>
              </Box>
            )}
          </Box>
        </Popover>
        <TableContainer
          sx={{
            maxHeight: 'calc(100vh - 180px)',
            height: 'calc(100vh - 180px)',
            overflowY: 'auto',
            borderRadius: 2,
            border: '1px solid #e6eaf1',
            backgroundColor: '#fff',
            boxShadow: '0 6px 16px rgba(16,24,40,0.06)'
          }}
        >
          <Table
            stickyHeader
            size='small'
            sx={{
              tableLayout: 'fixed',
              width: '100%',
              '& .MuiTableCell-stickyHeader': {
                background: '#f6f8fb',
                color: '#0f172a',
                fontWeight: 800,
                letterSpacing: 0.2,
                boxShadow: 'inset 0 -1px 0 #d9e1ec'
              },
              '& .MuiTableBody-root td': { fontSize: 13, color: '#0f172a' },
              '& .MuiTableBody-root .MuiTableCell-root': {
                borderColor: '#edf2f7'
              },
              '& .MuiTableBody-root tr:nth-of-type(even)': {
                backgroundColor: '#fbfdff'
              },
              '& td, & th': {
                borderRight: '1px solid #e0e0e0'
              },
              '& td:last-of-type, & th:last-of-type': {
                borderRight: 'none'
              },
              '& tfoot th, & tfoot td': {
                position: 'sticky',
                bottom: 0,
                background: '#f6f8fb',
                zIndex: 2,
                borderTop: '1px solid #d9e1ec'
              }
            }}
          >
            <TableHead>
              <TableRow
                sx={{
                  height: 40,
                  '& th': {
                    borderRight: '1px solid #d9e1ec',
                    fontSize: 13,
                    p: 0,
                    color: '#0f172a'
                  },
                  '& th:last-of-type': { borderRight: 'none' }
                }}
              >
                <TableCell align='center' sx={{ width: '14%' }}>
                  Name
                </TableCell>
                <TableCell align='center'>Email</TableCell>
                <TableCell align='center'>Warehouse</TableCell>
                <TableCell align='center'>Cart</TableCell>
                <TableCell align='center'>Role</TableCell>
                <TableCell align='center'>Created At</TableCell>
                <TableCell align='center'>Action</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {employees
                .filter(emp => emp.role === roleFilter)
                .map(emp => (
                  <TableRow key={emp.accountID} hover>
                    <TableCell align='center' sx={{ width: '14%' }}>
                      <Tooltip title={`Role: ${emp.role}`}>
                        <span>
                          {`${emp.firstName || ''} ${
                            emp.lastName || ''
                          }`.trim() || '-'}
                        </span>
                      </Tooltip>
                    </TableCell>
                    <TableCell align='center'>{emp.email}</TableCell>

                    <TableCell align='center'>
                      <Tooltip
                        title={
                          `Warehouse ID: ${
                            emp.currentWarehouse?.warehouseID || '-'
                          }` +
                          `\nBins: ${
                            emp.currentWarehouse?.bins
                              ?.map(b => `${b.binCode} (${b.binID})`)
                              .join(', ') || '-'
                          }`
                        }
                      >
                        <span>
                          {emp.currentWarehouse?.warehouseCode || '-'}
                        </span>
                      </Tooltip>
                    </TableCell>

                    <TableCell align='center'>
                      <Tooltip
                        title={
                          emp.cart
                            ? `Cart Bin ID: ${emp.cart.binID}`
                            : 'No Cart Assigned'
                        }
                      >
                        <span>{emp.cart?.binCode || '-'}</span>
                      </Tooltip>
                    </TableCell>

                    <TableCell align='center'>{emp.role}</TableCell>

                    <TableCell align='center'>
                      {new Date(emp.createdAt).toLocaleString()}
                    </TableCell>

                    <TableCell align='center'>
                      {editingAccountID === emp.accountID ? (
                        <Stack
                          direction='row'
                          spacing={1}
                          justifyContent='center'
                        >
                          <IconButton
                            color='error'
                            size='small'
                            onClick={() => setDeleteTarget(emp.accountID)}
                          >
                            <DeleteIcon />
                          </IconButton>
                          <IconButton
                            size='small'
                            onClick={() => setEditingAccountID(null)}
                          >
                            <CloseIcon />
                          </IconButton>
                        </Stack>
                      ) : (
                        <IconButton
                          size='small'
                          onClick={() => {
                            if (emp.role === EmployeeType.PICKER) {
                              setEditingAccountID(emp.accountID)
                            }
                          }}
                          disabled={emp.role !== EmployeeType.PICKER}
                          sx={{
                            color:
                              emp.role === EmployeeType.PICKER
                                ? '#1976d2'
                                : '#9e9e9e'
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell
                  colSpan={7}
                  align='right'
                  sx={{
                    fontSize: 13,
                    fontWeight: 600,
                    p: 1.5,
                    backgroundColor: '#f6f8fb'
                  }}
                >
                  Total:{' '}
                  {employees.filter(emp => emp.role === roleFilter).length}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
        <Dialog
          open={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            Are you sure you want to delete this account?
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              color='error'
              onClick={async () => {
                await deleteEmployee(deleteTarget as string)
                setDeleteTarget(null)
                loadEmployees()
              }}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
        {(isLoading || refreshLoading) && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(255,255,255,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999
            }}
          >
            <CircularProgress />
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default EmployeePage
