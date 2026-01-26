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
  Tooltip,
  InputAdornment,
  Divider,
  Paper
} from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import { useNavigate } from 'react-router-dom'
import useWarehouses from 'hooks/useWarehouse'
import { useProduct } from 'hooks/useProduct'
import ProductUploadModal from 'components/ProductUploadModal'
import { PageValues } from 'constants/index'
import ProductTable from 'pages/product/productTable.tsx/ProductTable'
import BatchDeleteProductsDialog from 'pages/product/BatchDeleteProductsDialog'

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
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false)

  const {
    products,
    totalProductsCount,
    isLoading: productsLoading,
    fetchProducts,
    fetchProductCodes,
    productCodes
  } = useProduct()
  const [productKeyword, setProductKeyword] = useState('')
  const [productInput, setProductInput] = useState('')
  const [productPage, setProductPage] = useState(0)

  useEffect(() => {
    fetchWarehouses()
    fetchProductCodes()
  }, [fetchWarehouses, fetchProductCodes])

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

  useEffect(() => {
    fetchProducts({
      keyword: productKeyword || undefined,
      page: productPage + 1,
      limit: 100
    })
  }, [productKeyword, productPage, fetchProducts])

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
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          gap: 4
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 3,
            border: '1px solid #e5e7eb',
            background: '#ffffff'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2,
              mb: 1.5
            }}
          >
            <Box>
              <Typography variant='h5' fontWeight='bold'>
                Warehouse Management
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Select a warehouse to enter operations
              </Typography>
            </Box>
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
            </Stack>
          </Box>

          <Divider sx={{ mb: 1.5 }} />

          <Grid
            container
            spacing={2}
            justifyContent='center'
            alignItems='center'
          >
            {warehouses.map(warehouse => (
              <Grid item key={warehouse.warehouseID} xs={12} sm={6} md={4} lg={3}>
                <Card
                  sx={{
                    borderRadius: 4,
                    boxShadow: 3,
                    minHeight: 96,
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
                      <Typography variant='subtitle1' align='center'>
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
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            border: '1px solid #e5e7eb',
            background: '#ffffff'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2,
              mb: 2
            }}
          >
            <Box>
              <Typography variant='h5' fontWeight='bold'>
                Product Management (All Warehouses)
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Total quantities across all warehouses
              </Typography>
            </Box>
            <Stack direction='row' spacing={2} alignItems='center'>
              <Button variant='contained' onClick={() => setUploadOpen(true)}>
                ➕ Upload Products
              </Button>
              <Button
                variant='outlined'
                color='error'
                onClick={() => setBatchDeleteOpen(true)}
              >
                Batch Delete
              </Button>
              <Autocomplete
                freeSolo
                options={productCodes}
                inputValue={productInput}
                onInputChange={(_event, value) => setProductInput(value)}
                onChange={(_event, value) => {
                  const next = typeof value === 'string' ? value : ''
                  setProductInput(next)
                  setProductKeyword(next)
                  setProductPage(0)
                }}
                renderInput={(params: any) => (
                  <TextField
                    {...params}
                    size='small'
                    placeholder='Search product code'
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        setProductKeyword(productInput.trim())
                        setProductPage(0)
                      }
                    }}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position='start'>
                          <SearchIcon fontSize='small' />
                        </InputAdornment>
                      )
                    }}
                  />
                )}
                sx={{ width: 260 }}
              />
              <IconButton
                size='small'
                onClick={() => {
                  fetchProducts({
                    keyword: productKeyword || undefined,
                    page: productPage + 1,
                    limit: 100
                  })
                }}
              >
                <RefreshIcon fontSize='small' />
              </IconButton>
            </Stack>
          </Box>

          <Divider sx={{ mb: 2 }} />

          <ProductTable
            products={products}
            isLoading={productsLoading}
            page={productPage}
            total={totalProductsCount}
            onPageChange={(_, next) => setProductPage(next)}
          />
        </Paper>

        <BatchDeleteProductsDialog
          open={batchDeleteOpen}
          onClose={() => setBatchDeleteOpen(false)}
          productCodes={productCodes}
          onDeleted={() =>
            fetchProducts({
              keyword: productKeyword || undefined,
              page: productPage + 1,
              limit: 100
            })
          }
        />
      </Box>

      <ProductUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={() =>
          fetchProducts({
            keyword: productKeyword || undefined,
            page: productPage + 1,
            limit: 100
          }).then(() => fetchProductCodes())
        }
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
