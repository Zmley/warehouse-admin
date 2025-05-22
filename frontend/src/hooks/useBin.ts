import { useCallback, useState } from 'react'
import {
  addBins,
  getBinCodes,
  getBinCodesByProductCode,
  getBins,
  getPickupBinsByProductCodeApi as getPickBinByProductCode
} from 'api/binApi'
import { useLocation, useParams } from 'react-router-dom'
import { Bin } from 'types/Bin'
import { BinUploadType } from 'types/BinUploadType'

export interface FetchParams {
  warehouseID: string
  type?: string
  keyword?: string
  page?: number
  limit?: number
}

export interface BasicBin {
  binID: string
  binCode: string
}

export const useBin = (autoLoad: boolean = false) => {
  const [bins, setBins] = useState<Bin[]>([])
  const [binCodes, setBinCodes] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const { warehouseID } = useParams()

  const [pickupBinCode, setPickupBinCode] = useState<string | null>(null)

  const location = useLocation()

  const searchParams = new URLSearchParams(location.search)
  const type = searchParams.get('type')

  const fetchBinCodes = useCallback(async () => {
    try {
      if (!warehouseID) {
        setError('❌ Warehouse ID is missing')
        return []
      }

      const res = await getBinCodes(warehouseID)

      if (!res.success) {
        setError(res.error || '❌ Failed to fetch bins')
        return []
      }

      const codes = res.data.map((bin: any) => bin.binCode)
      setBinCodes(codes)

      setError(null)
      return res.bins
    } catch (err) {
      setError('❌ Failed to fetch bins')
      return []
    }
  }, [warehouseID])

  const fetchBins = useCallback(
    async ({ type, keyword, page = 1, limit = 10 }: FetchParams) => {
      setIsLoading(true)

      if (!warehouseID) {
        setError('❌ Warehouse ID is missing')
        return []
      }

      try {
        const res = await getBins({
          warehouseID,
          type,
          keyword,
          page,
          limit
        })
        setBins(res.data)
        setTotalPages(res.total)
      } catch (err) {
        console.error('❌ Error fetching bins:', err)
        setError('Failed to fetch bins')
      } finally {
        setIsLoading(false)
      }
    },
    [warehouseID]
  )

  const uploadBinList = useCallback(
    async (list: BinUploadType[]) => {
      if (!warehouseID || !type) {
        const errorMsg = '❌ Missing warehouseID or type'
        console.error(errorMsg)
        return { error: errorMsg }
      }

      const payload = list.map(bin => ({
        ...bin,
        warehouseID,
        type
      }))

      try {
        const res = await addBins(payload)
        if (!res.success) {
          console.error('❌ Upload failed:', res.error)
          return { success: false, error: res.error || '❌ Upload failed' }
        }

        return res
      } catch (err: any) {
        setError(err?.message || '❌ Upload exception occurred')
        return {
          error: err?.message || '❌ Upload exception occurred'
        }
      }
    },
    [warehouseID, type]
  )

  const fetchAvailableBinCodes = useCallback(
    (productCode: string): Promise<{ binCode: string; quantity: number }[]> =>
      getBinCodesByProductCode(productCode),
    []
  )

  const getPickUpBinByProductCode = useCallback(async (productCode: string) => {
    try {
      const res = await getPickBinByProductCode(productCode)

      if (!res.data || res.data.length === 0) {
        return {
          success: false,
          error: `❌ No ${productCode} in current warehouse!`
        }
      }

      setPickupBinCode(res.data.binCode)

      return {
        success: true,
        data: res.data
      }
    } catch (err: any) {
      return {
        success: false,
        error: err?.response?.data?.error || '❌ Failed to fetch pickup bin'
      }
    }
  }, [])

  return {
    pickupBinCode,
    setPickupBinCode,
    getPickUpBinByProductCode,
    uploadBinList,
    totalPages,
    fetchBins,
    isLoading,
    bins,
    binCodes,
    error,
    fetchBinCodes,
    fetchAvailableBinCodes
  }
}
