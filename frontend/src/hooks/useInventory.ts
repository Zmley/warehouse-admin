import { useCallback, useState } from 'react'
import {
  getInventories,
  deleteInventory,
  addInventories,
  bulkUpdateInventory
} from 'api/inventory'
import {
  InventoryItem,
  InventoryUploadType,
  InventoryUpdate,
  GetInventoriesParams
} from 'types/Inventory'
import { useParams } from 'react-router-dom'
import { getInventoriesByBinCode } from 'api/bin'

export const useInventory = () => {
  const [inventories, setInventories] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const { warehouseID } = useParams()

  const fetchInventories = useCallback(
    async (
      options: Partial<Omit<GetInventoriesParams, 'warehouseID'>> = {}
    ) => {
      setIsLoading(true)
      setError(null)
      try {
        const {
          binID,
          page = 1,
          limit,
          keyword,
          sort = 'desc',
          sortBy = 'updatedAt'
        } = options

        const { data } = await getInventories({
          warehouseID: warehouseID || '',
          binID: binID === 'All' ? undefined : binID,
          page,
          limit,
          keyword,
          sortBy,
          sort
        })

        setInventories(data.inventories)
        setTotalPages(data.totalCount)
        return { success: true }
      } catch (err: any) {
        const message =
          err?.response?.data?.message || '❌ Failed to fetch inventories.'
        setError(message)
        return { success: false, message }
      } finally {
        setIsLoading(false)
      }
    },
    [warehouseID]
  )

  const removeInventory = useCallback(async (id: string) => {
    try {
      const { data } = await deleteInventory(id)
      if (data.success) {
        setInventories(prev => prev.filter(item => item.inventoryID !== id))
        setError(null)
        return data
      } else {
        setError(data.message || '❌ Failed to delete inventory item')
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message || '❌ Failed to delete inventory item'
      )
    }
  }, [])

  const editInventoriesBulk = useCallback(
    async (updates: InventoryUpdate[]) => {
      try {
        const { data } = await bulkUpdateInventory(updates)
        if (data.success) {
          setInventories(prev =>
            prev.map(item => {
              const update = updates.find(
                u => u.inventoryID === item.inventoryID
              )
              return update ? { ...item, ...update } : item
            })
          )
          setError(null)
          return data
        } else {
          throw new Error('Failed to bulk update inventory items')
        }
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
            '❌ Failed to bulk update inventory items'
        )
      }
    },
    []
  )

  const addInventory = useCallback(async (newItem: InventoryUploadType) => {
    try {
      const { data } = await addInventories([newItem])
      const inserted = data?.insertedCount ?? 0
      const updated = data?.updatedCount ?? 0
      if (data?.success && (inserted > 0 || updated > 0)) {
        return {
          success: true,
          message:
            inserted > 0
              ? '✅ Inventory added successfully.'
              : '✅ Existing inventory updated successfully.'
        }
      }
      return { success: false, message: data?.message }
    } catch (err: any) {
      return {
        success: false,
        message: err?.response?.data?.message || '❌ Error uploading inventory'
      }
    }
  }, [])

  const uploadInventoryList = useCallback(
    async (inventories: InventoryUploadType[]) =>
      (await addInventories(inventories)).data,
    []
  )

  const fetchInventoriesByBinCode = useCallback(async (binCode: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await getInventoriesByBinCode(binCode)

      if (response && Array.isArray(response.data.inventories)) {
        setInventories(response.data.inventories)
        return { success: true, inventories: response.data.inventories }
      } else {
        const message = response?.data.message || '❌ Invalid inventory data.'
        setError(message)
        return { success: false, message }
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        '❌ Failed to fetch inventories by binCode.'
      setError(message)
      return { success: false, message }
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    uploadInventoryList,
    inventories,
    isLoading,
    error,
    totalPages,
    fetchInventories,
    removeInventory,
    editInventoriesBulk,
    addInventory,
    fetchInventoriesByBinCode
  }
}
