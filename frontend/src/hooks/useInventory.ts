import { useCallback, useState } from 'react'
import {
  getInventories,
  deleteInventory,
  updateInventory,
  createInventory,
  uploadInventories
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

  const fetchInventories = useCallback(
    async (
      binID?: string,
      page: number = 1,
      limit: number = 10,
      keyword?: string
    ) => {
      try {
        setIsLoading(true)
        setError(null)

        const { inventory, totalCount } = await getInventories({
          warehouseID: warehouseID || '',
          binID: binID === 'All' ? undefined : binID,
          page,
          limit,
          keyword
        })

        setInventories(inventory)
        setTotalPages(totalCount)
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

  const editInventory = useCallback(
    async (id: string, updatedData: Partial<InventoryItem>) => {
      try {
        const result = await updateInventory(id, updatedData)

        if (result.success) {
          setInventories(prev =>
            prev.map(item =>
              item.inventoryID === id ? { ...item, ...updatedData } : item
            )
          )
          setError(null)
          return result
        } else {
          throw new Error('Failed to update inventory item')
        }
      } catch (err: any) {
        const message =
          err?.response?.data?.message || '❌ Failed to update inventory item'
        setError(message)
      }
    },
    []
  )

  const addInventory = useCallback(
    async (newItem: {
      productCode: string
      binCode: string
      quantity: number
    }) => {
      try {
        const result = await createInventory(newItem)
        if (result.success) {
          setInventories(prev => [...prev, result.inventory])
          setError(null)
          return result
        } else {
          const message = result.message || '❌ Failed to add inventory item'
          setError(message)
        }
      } catch (err: any) {
        const message =
          err?.response?.data?.message || '❌ Error adding inventory item'
        setError(message)
      }
    },
    []
  )

  const uploadInventoryList = async (inventories: InventoryUploadType[]) => {
    try {
      const result = await uploadInventories(inventories)
      return result
    } catch (error) {
      console.error('❌ Error uploading inventory:', error)
      throw error
    }
  }

  return {
    uploadInventoryList,
    inventories,
    isLoading,
    error,
    totalPages,
    fetchInventories,
    removeInventory,
    editInventory,
    addInventory,
    setError
  }
}
