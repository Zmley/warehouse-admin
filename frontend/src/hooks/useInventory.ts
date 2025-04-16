import { useState } from 'react'
import {
  getInventories,
  deleteInventory,
  updateInventory,
  addInventory
} from '../api/inventoryApi'
import { InventoryItem } from '../types/inventoryTypes'
import { useParams } from 'react-router-dom'

export const useInventory = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const { warehouseID } = useParams()
  const [totalCount, setTotalCount] = useState(0)

  const fetchInventories = async (
    binID?: string,
    page: number = 1,
    limit: number = 20
  ) => {
    try {
      setLoading(true)

      if (!warehouseID) {
        setError('❌ No warehouse selected.')
        return
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
    } catch (err) {
      setError('❌ Failed to fetch inventory data')
    } finally {
      setLoading(false)
    }
  }

  const removeInventory = async (id: string) => {
    await deleteInventory(id)
    setInventory(prev => prev.filter(item => item.inventoryID !== id))
  }

  const editInventory = async (
    id: string,
    updatedData: Partial<InventoryItem>
  ) => {
    await updateInventory(id, updatedData)
    setInventory(prev =>
      prev.map(item =>
        item.inventoryID === id ? { ...item, ...updatedData } : item
      )
    )
  }

  const addInventoryItem = async (newItem: {
    productCode: string
    binID: string
    quantity: number
  }) => {
    const response = await addInventory(newItem)
    if (response.inventory) {
      setInventory(prev => [...prev, response.inventory])
    }
    return response
  }

  return {
    inventory,
    loading,
    error,
    totalCount,
    removeInventory,
    editInventory,
    fetchInventories,
    addInventoryItem
  }
}
