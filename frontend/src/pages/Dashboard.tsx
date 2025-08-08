import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Typography,
  Card,
  CardActionArea,
  CardContent,
  Grid
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import useWarehouses from 'hooks/useWarehouse'
import Topbar from 'components/Topbar'
import { UploadProductModal } from 'components/UploadGenericModal'
import { PageValues } from 'constants/index'

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { warehouses, error, fetchWarehouses } = useWarehouses()

  const [uploadOpen, setUploadOpen] = useState(false)

  useEffect(() => {
    fetchWarehouses()
  }, [])

  const handleSelectWarehouse = (
    warehouseID: string,
    warehouseCode: string
  ) => {
    navigate(`/${warehouseID}/${warehouseCode}/${PageValues.TASK}`)
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
      <Topbar />
      <Box
        sx={{
          flex: 1,
          backgroundColor: '#f9fafc',
          p: 4
        }}
      >
        <Box display='flex' justifyContent='flex-end' mb={2}>
          <Button variant='contained' onClick={() => setUploadOpen(true)}>
            ➕ Upload Products
          </Button>
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
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      <UploadProductModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
      />
    </Box>
  )
}

export default Dashboard
