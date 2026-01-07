import { useState, useCallback } from 'react'
import * as warehouseAPI from 'api/warehouse'
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
      const data = await warehouseAPI.getWarehouses()
      setWarehouses(data)
    } catch (err) {
      setError('Error fetching warehouses')
      console.error(err)
    }
  }, [])

  const createWarehouse = useCallback(
    async (payload: CreateWarehousePayload) => {
      setCreateError(null)
      setIsCreating(true)
      try {
        const data = await warehouseAPI.createWarehouse(payload)
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

  const updateWarehouse = useCallback(
    async (payload: UpdateWarehousePayload) => {
      setUpdateError(null)
      setIsUpdating(true)
      try {
        const data = await warehouseAPI.updateWarehouse(payload)
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

  const deleteWarehouse = useCallback(async (warehouseID: string) => {
    setDeleteError(null)
    setIsDeleting(true)
    try {
      const data = await warehouseAPI.deleteWarehouse(warehouseID)
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
    createWarehouse,
    createError,
    isCreating,
    clearCreateError: () => setCreateError(null),
    updateWarehouse,
    updateError,
    isUpdating,
    clearUpdateError: () => setUpdateError(null),
    deleteWarehouse,
    deleteError,
    isDeleting,
    clearDeleteError: () => setDeleteError(null)
  }
}

export default useWarehouses
