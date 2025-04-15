import { useCallback, useState } from 'react'
import { getBins } from '../api/binApi'
import { useParams } from 'react-router-dom'

export const useBin = (autoLoad: boolean = false) => {
  const [bins, setBins] = useState<{ binID: string; binCode: string }[]>([])
  const [binCodes, setAllBinCodes] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const { warehouseID } = useParams()

  const fetchBins = useCallback(async (): Promise<
    { binID: string; binCode: string }[]
  > => {
    try {
      if (!warehouseID) {
        setError('❌ Warehouse ID is missing')
        return []
      }

      const binsData = await getBins(warehouseID)
      setBins(binsData)

      const codes = binsData.map(bin => bin.binCode)
      setAllBinCodes(codes)

      setError(null)
      return binsData
    } catch (err) {
      setError('❌ Failed to fetch bins')
      return []
    }
    // eslint-disable-next-line
  }, [])

  return {
    bins,
    binCodes,
    error,
    fetchBins
  }
}
