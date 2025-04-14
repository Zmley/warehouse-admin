import { useCallback, useState } from 'react'
import { getBinsInWarehouse } from '../api/binApi'

export const useBin = (autoLoad: boolean = false) => {
  const [bins, setBins] = useState<{ binID: string; binCode: string }[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAllBins = useCallback(async (): Promise<
    { binID: string; binCode: string }[]
  > => {
    try {
      setLoading(true)
      const binsData = await getBinsInWarehouse()
      setBins(binsData)
      setError(null)
      return binsData
    } catch (err) {
      setError('❌ Failed to fetch bins')
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    bins,
    loading,
    error,
    fetchAllBins
  }
}
