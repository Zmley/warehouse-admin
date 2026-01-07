import { useState, useCallback } from 'react'
import {
  createWarehouse,
  deleteWarehouse,
  getWarehouses,
  updateWarehouse
} from 'api/warehouse'
import {
  CreateWarehousePayload,
  UpdateWarehousePayload,
  Warehouse
} from 'types/warehouse'

const useWarehouses = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [error, setError] = useState<string | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchWarehouses = useCallback(async () => {
    try {
      const data = await getWarehouses()
      setWarehouses(data)
    } catch (err) {
      setError('Error fetching warehouses')
      console.error(err)
    }
  }, [])

  const createWarehouseEntry = useCallback(
    async (payload: CreateWarehousePayload) => {
      setCreateError(null)
      setIsCreating(true)
      try {
        const data = await createWarehouse(payload)
        if (data?.warehouseID && data?.warehouseCode) {
          setWarehouses(prev => {
            if (prev.some(item => item.warehouseID === data.warehouseID)) {
              return prev
            }
            return [data, ...prev]
          })
        }
        return data
      } catch (err: any) {
        const msg =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          'Error creating warehouse'
        setCreateError(msg)
        console.error(err)
        return null
      } finally {
        setIsCreating(false)
      }
    },
    []
  )

  const updateWarehouseEntry = useCallback(
    async (payload: UpdateWarehousePayload) => {
      setUpdateError(null)
      setIsUpdating(true)
      try {
        const data = await updateWarehouse(payload)
        setWarehouses(prev =>
          prev.map(item =>
            item.warehouseID === data.warehouseID ? data : item
          )
        )
        return data
      } catch (err: any) {
        const msg =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          'Error updating warehouse'
        setUpdateError(msg)
        console.error(err)
        return null
      } finally {
        setIsUpdating(false)
      }
    },
    []
  )

  const deleteWarehouseEntry = useCallback(async (warehouseID: string) => {
    setDeleteError(null)
    setIsDeleting(true)
    try {
      const data = await deleteWarehouse(warehouseID)
      if (data?.success) {
        setWarehouses(prev =>
          prev.filter(item => item.warehouseID !== warehouseID)
        )
      }
      return data
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Error deleting warehouse'
      setDeleteError(msg)
      console.error(err)
      return null
    } finally {
      setIsDeleting(false)
    }
  }, [])

  return {
    warehouses,
    error,
    fetchWarehouses,
    createWarehouse: createWarehouseEntry,
    createError,
    isCreating,
    clearCreateError: () => setCreateError(null),
    updateWarehouse: updateWarehouseEntry,
    updateError,
    isUpdating,
    clearUpdateError: () => setUpdateError(null),
    deleteWarehouse: deleteWarehouseEntry,
    deleteError,
    isDeleting,
    clearDeleteError: () => setDeleteError(null)
  }
}

export default useWarehouses
