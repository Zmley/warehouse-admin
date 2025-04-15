import { useEffect } from 'react'
import { Box, Button, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import useWarehouses from '../hooks/useWarehouse'
import Topbar from '../components/Topbar'

const Dashboard: React.FC = () => {
  const navigate = useNavigate()

  const { warehouses, error, fetchWarehouses } = useWarehouses()

  useEffect(() => {
    fetchWarehouses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSelectWarehouse = (
    warehouseID: string,
    warehouseCode: string
  ) => {
    navigate(`/${warehouseID}/${warehouseCode}`)
  }

  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh'
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
      <Topbar />
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Typography variant='h4' gutterBottom>
          Select a Warehouse
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {warehouses.map(warehouse => (
            <Button
              key={warehouse.warehouseID}
              variant='outlined'
              onClick={() =>
                handleSelectWarehouse(
                  warehouse.warehouseID,
                  warehouse.warehouseCode
                )
              }
            >
              {warehouse.warehouseCode}
            </Button>
          ))}
        </Box>
      </Box>
    </Box>
  )
}

export default Dashboard
