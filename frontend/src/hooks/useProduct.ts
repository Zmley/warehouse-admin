import { useState, useCallback } from 'react'
import {
  addProducts,
  getBoxTypes,
  getLowStockProducts,
  getLowStockWithOthersAPI,
  getProductCodes,
  getProducts
} from '../api/product'
import { Product, ProductFetchParams, LowStockParams } from 'types/product'
import { useParams } from 'react-router-dom'
import { ProductsUploadType } from 'types/product'

export const useProduct = () => {
  const [productCodes, setProductCodes] = useState<string[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [totalProductsCount, setTotalProductsCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [boxTypes, setBoxTypes] = useState<string[]>([])

  const fetchProductCodes = useCallback(async () => {
    try {
      const res = await getProductCodes()
      if (res.success) {
        setProductCodes(res.productCodes)
      } else {
        throw new Error('Invalid response')
      }
    } catch (err) {
      console.error('❌ Failed to load product codes', err)
    }
  }, [])

  const { warehouseID } = useParams<{ warehouseID: string }>()

  const fetchProducts = useCallback(
    async (params?: ProductFetchParams) => {
      if (!warehouseID) return
      setIsLoading(true)
      setError(null)
      try {
        const res = await getProducts({ warehouseID, ...params })
        if (res.success) {
          setProducts(res.products)
          setTotalProductsCount(res.total || res.products.length)
        } else {
          throw new Error('Invalid response')
        }
      } catch (err) {
        console.error('❌ Failed to load products:', err)
        setError('Failed to load products')
      } finally {
        setIsLoading(false)
      }
    },
    [warehouseID]
  )

  const uploadProductList = useCallback(async (list: ProductsUploadType[]) => {
    try {
      const res = await addProducts(list)
      if (!res.success) {
        return {
          success: false,
          message: 'No new products inserted. All may already exist.',
          result: res.result
        }
      }
      return res
    } catch (error) {
      console.error('❌ Upload failed', error)
      return {
        success: false,
        message: 'Upload failed due to network or server error.'
      }
    }
  }, [])

  const fetchLowStockProducts = useCallback(
    async (params: LowStockParams) => {
      if (!warehouseID) return
      setIsLoading(true)
      setError(null)
      try {
        const res = await getLowStockProducts({ warehouseID, ...params })
        if (res?.success) {
          setProducts(res.products || [])
          setTotalProductsCount(res.total ?? res.products?.length ?? 0)
        } else {
          throw new Error('Invalid response')
        }
      } catch (err) {
        console.error('❌ Failed to load low-stock products:', err)
        setError('Failed to load low-stock products')
      } finally {
        setIsLoading(false)
      }
    },
    [warehouseID]
  )

  const fetchLowStockWithOthers = useCallback(
    async (params: { keyword?: string; maxQty: number; boxType?: string }) => {
      if (!warehouseID) return
      setIsLoading(true)
      setError(null)
      try {
        const res = await getLowStockWithOthersAPI({ warehouseID, ...params })
        if (res?.data?.success || res?.status === 200) {
          const list = res.data?.products || res.data?.data?.products || []
          setProducts(list)
          setTotalProductsCount(list.length)
        } else {
          throw new Error('Invalid response')
        }
      } catch (err) {
        console.error('❌ Failed to load low-stock-with-others:', err)
        setError('Failed to load low-stock-with-others')
      } finally {
        setIsLoading(false)
      }
    },
    [warehouseID]
  )

  const fetchBoxTypes = useCallback(async (keyword?: string) => {
    try {
      const res = await getBoxTypes(keyword ? { keyword } : undefined)
      if (res.success) setBoxTypes(res.boxTypes)
    } catch (e) {
      console.error('❌ getBoxTypes failed', e)
    }
  }, [])

  return {
    uploadProductList,
    productCodes,
    products,
    totalProductsCount,
    fetchProductCodes,
    fetchProducts,
    isLoading,
    error,
    fetchLowStockProducts,
    fetchLowStockWithOthers,
    boxTypes,
    fetchBoxTypes
  }
}
