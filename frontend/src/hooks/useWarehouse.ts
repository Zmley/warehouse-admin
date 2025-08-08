import { useState, useCallback } from 'react'
import { getWarehouses } from 'api/warehouse'

interface Warehouse {
  warehouseID: string
  warehouseCode: string
}

const useWarehouses = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [error, setError] = useState<string | null>(null)

  const fetchWarehouses = useCallback(async () => {
    try {
      const data = await getWarehouses()
      setWarehouses(data)
    } catch (err) {
      setError('Error fetching warehouses')
      console.error(err)
    }
  }, [])

  return { warehouses, error, fetchWarehouses }
}

export default useWarehouses
