import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Typography,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Stack,
  TextField,
  Tooltip
} from '@mui/material'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { useNavigate } from 'react-router-dom'
import useWarehouses from 'hooks/useWarehouse'
import { UploadProductModal } from 'components/UploadGenericModal'
import { PageValues } from 'constants/index'

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const {
    warehouses,
    error,
    fetchWarehouses,
    createWarehouse,
    createError,
    isCreating,
    clearCreateError,
    updateWarehouse,
    updateError,
    isUpdating,
    clearUpdateError,
    deleteWarehouse,
    deleteError,
    isDeleting,
    clearDeleteError
  } = useWarehouses()

  const [uploadOpen, setUploadOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [warehouseCode, setWarehouseCode] = useState('')
  const [formError, setFormError] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [editWarehouseID, setEditWarehouseID] = useState('')
  const [editWarehouseCode, setEditWarehouseCode] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteWarehouseID, setDeleteWarehouseID] = useState('')

  useEffect(() => {
    fetchWarehouses()
  }, [])

  const handleSelectWarehouse = (
    warehouseID: string,
    warehouseCode: string
  ) => {
    navigate(`/${warehouseID}/${warehouseCode}/${PageValues.TASK}`)
  }

  const handleCreateWarehouse = async () => {
    const code = warehouseCode.trim()
    if (!code) {
      setFormError('Warehouse Code is required.')
      return
    }

    const result = await createWarehouse({ warehouseCode: code })
    if (result) {
      setWarehouseCode('')
      setFormError('')
      setCreateOpen(false)
    }
  }

  const handleOpenEdit = (warehouseID: string, code: string) => {
    setEditWarehouseID(warehouseID)
    setEditWarehouseCode(code)
    clearUpdateError()
    setEditOpen(true)
  }

  const handleUpdateWarehouse = async () => {
    const code = editWarehouseCode.trim()
    if (!code) {
      return
    }
    const result = await updateWarehouse({
      warehouseID: editWarehouseID,
      warehouseCode: code
    })
    await fetchWarehouses()
    if (result) {
      setEditOpen(false)
    }
  }

  const handleOpenDelete = (warehouseID: string) => {
    setDeleteWarehouseID(warehouseID)
    clearDeleteError()
    setDeleteOpen(true)
  }

  const handleDeleteWarehouse = async () => {
    const res = await deleteWarehouse(deleteWarehouseID)
    if (res?.success) {
      setDeleteOpen(false)
    }
  }

  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: '#f5f5f5'
        }}
      >
        <Typography variant='h6' color='error'>
          {error}
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          flex: 1,
          backgroundColor: '#f9fafc',
          p: 4
        }}
      >
        <Box display='flex' justifyContent='flex-end' mb={2}>
          <Stack direction='row' spacing={2}>
            <Button
              variant='outlined'
              onClick={() => {
                setWarehouseCode('')
                setFormError('')
                clearCreateError()
                setCreateOpen(true)
              }}
            >
              ➕ Add Warehouse
            </Button>
            <Button variant='contained' onClick={() => setUploadOpen(true)}>
              ➕ Upload Products
            </Button>
          </Stack>
        </Box>

        <Typography variant='h4' align='center' gutterBottom fontWeight='bold'>
          Select a Warehouse
        </Typography>

        <Grid container spacing={3} justifyContent='center' alignItems='center'>
          {warehouses.map(warehouse => (
            <Grid item key={warehouse.warehouseID} xs={12} sm={6} md={4} lg={3}>
              <Card
                sx={{
                  borderRadius: 4,
                  boxShadow: 3,
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.05)'
                  }
                }}
              >
                <CardActionArea
                  onClick={() =>
                    handleSelectWarehouse(
                      warehouse.warehouseID,
                      warehouse.warehouseCode
                    )
                  }
                >
                  <CardContent>
                    <Typography variant='h6' align='center'>
                      {warehouse.warehouseCode}
                    </Typography>
                  </CardContent>
                </CardActionArea>
                <CardActions sx={{ justifyContent: 'center', pt: 0 }}>
                  <Tooltip title='Edit warehouse code'>
                    <IconButton
                      size='small'
                      onClick={event => {
                        event.stopPropagation()
                        handleOpenEdit(
                          warehouse.warehouseID,
                          warehouse.warehouseCode
                        )
                      }}
                    >
                      <EditOutlinedIcon fontSize='small' />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title='Delete warehouse'>
                    <IconButton
                      size='small'
                      onClick={event => {
                        event.stopPropagation()
                        handleOpenDelete(warehouse.warehouseID)
                      }}
                    >
                      <DeleteOutlineIcon fontSize='small' />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      <UploadProductModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
      />

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)}>
        <DialogTitle>Create Warehouse</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label='Warehouse Code'
            value={warehouseCode}
            onChange={event => {
              setWarehouseCode(event.target.value)
              setFormError('')
            }}
            margin='dense'
            error={Boolean(formError || createError)}
            helperText={formError || createError || ' '}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                handleCreateWarehouse()
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button
            variant='contained'
            onClick={handleCreateWarehouse}
            disabled={isCreating}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)}>
        <DialogTitle>Edit Warehouse</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label='Warehouse Code'
            value={editWarehouseCode}
            onChange={event => {
              setEditWarehouseCode(event.target.value)
              clearUpdateError()
            }}
            margin='dense'
            error={Boolean(updateError)}
            helperText={updateError || ' '}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                handleUpdateWarehouse()
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button
            variant='contained'
            onClick={handleUpdateWarehouse}
            disabled={isUpdating || !editWarehouseCode.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Delete Warehouse</DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary'>
            This action cannot be undone. Delete this warehouse?
          </Typography>
          {deleteError && (
            <Typography variant='body2' color='error' sx={{ mt: 1 }}>
              {deleteError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button
            variant='contained'
            color='error'
            onClick={handleDeleteWarehouse}
            disabled={isDeleting}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Dashboard
