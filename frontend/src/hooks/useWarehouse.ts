import { useEffect, useState } from 'react'
import { getAllWarehouses } from '../api/warehouseApi'

interface Warehouse {
  warehouseID: string
  warehouseCode: string
}

const useWarehouses = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const data = await getAllWarehouses()
        setWarehouses(data)
      } catch (err) {
        setError('Error fetching warehouses')
        console.error(err)
      }
    }

    fetchWarehouses()
  }, [])

  return { warehouses, error }
}

export default useWarehouses
