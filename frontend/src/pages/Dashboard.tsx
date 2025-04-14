import { useEffect, useState } from 'react'
import { Box, Button, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { getWarehouses } from '../api/warehouseApi'
import Topbar from '../components/Topbar'

interface Warehouse {
  warehouseID: string
  warehouseCode: string
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate()

  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const data = await getWarehouses()
        setWarehouses(data)
      } catch (err) {
        setError('Error fetching warehouses')
        console.error(err)
      }
    }

    fetchWarehouses()
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
