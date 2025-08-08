import { useCallback, useState } from 'react'
import {
  getInventories,
  deleteInventory,
  addInventories,
  bulkUpdateInventory
} from 'api/inventoryApi'
import { InventoryItem } from 'types/InventoryItem'
import { useParams } from 'react-router-dom'
import { InventoryUploadType } from 'types/InventoryUploadType'

export const useInventory = () => {
  const [inventories, setInventories] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const { warehouseID } = useParams()

  // const fetchInventories = useCallback(
  //   async (
  //     binID?: string,
  //     page: number = 1,
  //     limit: number = 10,
  //     keyword?: string
  //   ) => {
  //     try {
  //       setIsLoading(true)
  //       setError(null)

  //       const { inventory, totalCount } = await getInventories({
  //         warehouseID: warehouseID || '',
  //         binID: binID === 'All' ? undefined : binID,
  //         page,
  //         limit,
  //         keyword
  //       })

  //       setInventories(inventory)
  //       setTotalPages(totalCount)
  //       return { success: true }
  //     } catch (err: any) {
  //       const message =
  //         err?.response?.data?.message || '❌ Failed to fetch inventories.'
  //       setError(message)
  //       return { success: false, message }
  //     } finally {
  //       setIsLoading(false)
  //     }
  //   },
  //   [warehouseID]
  // )

  const fetchInventories = useCallback(
    async (
      binID?: string,
      page: number = 1,
      limit: number = 10,
      keyword?: string,
      sort: 'asc' | 'desc' = 'desc',
      sortBy: 'updatedAt' | 'binCode' = 'updatedAt'
    ) => {
      setIsLoading(true)
      setError(null)
      try {
        const { inventory, totalCount } = await getInventories({
          warehouseID: warehouseID || '', // <-- 关键
          binID: binID === 'All' ? undefined : binID,
          page,
          limit,
          keyword,
          sortBy,
          sort
        })
        setInventories(inventory)
        setTotalPages(totalCount)
        return { success: true }
      } catch (err: unknown) {
        const message =
          (err as any)?.response?.data?.message ||
          '❌ Failed to fetch inventories.'
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
      const result = await deleteInventory(id)

      if (result.success) {
        setInventories(prev => prev.filter(item => item.inventoryID !== id))
        setError(null)
        return result
      } else {
        setError(result.message || '❌ Failed to delete inventory item')
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message || '❌ Failed to delete inventory item'
      setError(message)
    }
  }, [])

  const editInventoriesBulk = useCallback(
    async (
      updates: {
        inventoryID: string
        quantity?: number
        productCode?: string
      }[]
    ) => {
      try {
        const result = await bulkUpdateInventory(updates)
        if (result.success) {
          setInventories(prev =>
            prev.map(item => {
              const update = updates.find(
                u => u.inventoryID === item.inventoryID
              )
              return update ? { ...item, ...update } : item
            })
          )
          setError(null)
          return result
        } else {
          throw new Error('Failed to bulk update inventory items')
        }
      } catch (err: any) {
        const message =
          err?.response?.data?.message ||
          '❌ Failed to bulk update inventory items'
        setError(message)
      }
    },
    []
  )

  const addInventory = useCallback(async (newItem: InventoryUploadType) => {
    try {
      const result = await addInventories([newItem])

      console.log('test: ' + result.insertedCount)

      const inserted = result.insertedCount || 0
      const updated = result.updatedCount || 0

      if (result.success && (inserted > 0 || updated > 0)) {
        return {
          success: true,
          message:
            inserted > 0
              ? '✅ Inventory added successfully.'
              : '✅ Existing inventory updated successfully.'
        }
      } else {
        return {
          success: false
        }
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message || '❌ Error uploading inventory'
      return { success: false, message }
    }
  }, [])

  const uploadInventoryList = useCallback(
    async (inventories: InventoryUploadType[]) => {
      try {
        const result = await addInventories(inventories)
        return result
      } catch (error) {
        console.error('❌ Error uploading inventory:', error)
        throw error
      }
    },
    []
  )

  return {
    uploadInventoryList,
    inventories,
    isLoading,
    error,
    totalPages,
    fetchInventories,
    removeInventory,
    editInventoriesBulk,
    addInventory
  }
}
