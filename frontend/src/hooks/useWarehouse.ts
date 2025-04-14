import { useState, useCallback } from 'react'
import { getWarehouses } from '../api/warehouseApi'

interface Warehouse {
  warehouseID: string
  warehouseCode: string
}

const useWarehouses = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    try {
      const data = await getWarehouses()
      setWarehouses(data)
    } catch (err) {
      setError('Error fetching warehouses')
      console.error(err)
    }
  }, [])

  return { warehouses, error, refetch }
}

export default useWarehouses
