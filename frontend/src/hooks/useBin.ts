import { useCallback, useState } from 'react'
import { getBinsInWarehouse } from '../api/binApi'
import { useParams } from 'react-router-dom'

export const useBin = (autoLoad: boolean = false) => {
  const [bins, setBins] = useState<{ binID: string; binCode: string }[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const { warehouseID } = useParams()

  const fetchAllBins = useCallback(async (): Promise<
    { binID: string; binCode: string }[]
  > => {
    try {
      setLoading(true)
      if (!warehouseID) {
        setError('❌ Warehouse ID is missing')
        return []
      }

      const binsData = await getBinsInWarehouse(warehouseID)
      setBins(binsData)
      setError(null)
      return binsData
    } catch (err) {
      setError('❌ Failed to fetch bins')
      return []
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line
  }, [])

  return {
    bins,
    loading,
    error,
    fetchAllBins
  }
}
