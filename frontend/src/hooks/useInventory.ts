import { useState } from 'react'
import {
  getInventories,
  deleteInventory,
  updateInventory,
  createInventory
} from '../api/inventoryApi'
import { InventoryItem } from '../types/inventoryTypes'
import { useParams } from 'react-router-dom'

export const useInventory = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const { warehouseID } = useParams()

  const fetchInventories = async (
    binID?: string,
    page: number = 1,
    limit: number = 10
  ) => {
    try {
      setLoading(true)

      if (!warehouseID) {
        const message = '❌ No warehouse selected.'
        setError(message)
        return { success: false, message }
      }

      const { inventory, totalCount } = await getInventories({
        warehouseID,
        binID: binID === 'All' ? undefined : binID,
        page,
        limit
      })

      setInventory(inventory)
      setTotalCount(totalCount)
      setError(null)
      return { success: true }
    } catch (err: any) {
      const message =
        err?.response?.data?.message || '❌ Failed to fetch inventory data'
      setError(message)
      return { success: false, message }
    } finally {
      setLoading(false)
    }
  }

  const removeInventory = async (id: string) => {
    try {
      await deleteInventory(id)
      setInventory(prev => prev.filter(item => item.inventoryID !== id))
      setError(null)
      return { success: true }
    } catch (err: any) {
      const message =
        err?.response?.data?.message || '❌ Failed to delete inventory item'
      setError(message)
      return { success: false, message }
    }
  }

  const editInventory = async (
    id: string,
    updatedData: Partial<InventoryItem>
  ) => {
    try {
      await updateInventory(id, updatedData)
      setInventory(prev =>
        prev.map(item =>
          item.inventoryID === id ? { ...item, ...updatedData } : item
        )
      )
      setError(null)
      return { success: true }
    } catch (err: any) {
      const message =
        err?.response?.data?.message || '❌ Failed to update inventory item'
      setError(message)
      return { success: false, message }
    }
  }

  const addInventory = async (newItem: {
    productCode: string
    binID: string
    quantity: number
  }) => {
    try {
      const response = await createInventory(newItem)
      if (response.inventory) {
        setInventory(prev => [...prev, response.inventory])
        setError(null)
        return { success: true, inventory: response.inventory }
      } else {
        const message = response.message || '❌ Failed to add inventory item'
        setError(message)
        return { success: false, message }
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message || '❌ Error adding inventory item'
      setError(message)
      return { success: false, message }
    }
  }

  return {
    inventory,
    loading,
    error,
    totalCount,
    removeInventory,
    editInventory,
    fetchInventories,
    addInventory,
    setError
  }
}
