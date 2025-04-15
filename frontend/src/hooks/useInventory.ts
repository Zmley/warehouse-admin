import { useState } from 'react'
import {
  fetchInventory,
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
  const fetchAllInventory = async (binID?: string) => {
    try {
      setLoading(true)

      if (!warehouseID) {
        setError('❌ No warehouse selected.')
        return
      }

      const data = await fetchInventory({
        warehouseID,
        binID: binID === 'All' ? undefined : binID
      })

      setInventory(data.inventory)
      setError(null)
    } catch (err) {
      setError('❌ Failed to fetch inventory data')
    } finally {
      setLoading(false)
    }
  }

  const removeInventoryItem = async (id: string) => {
    await deleteInventory(id)
    setInventory(prev => prev.filter(item => item.inventoryID !== id))
  }

  const editInventoryItem = async (
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
    removeInventoryItem,
    editInventoryItem,
    fetchAllInventory,
    addInventoryItem
  }
}
