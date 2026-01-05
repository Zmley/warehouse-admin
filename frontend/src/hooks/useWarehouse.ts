import { useState, useCallback } from 'react'
import { getWarehouses } from 'api/warehouse'
import { Warehouse } from 'types/warehouse'

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
