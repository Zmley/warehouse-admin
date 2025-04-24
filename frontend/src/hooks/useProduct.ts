import { useState, useCallback } from 'react'
import { addProducts, getProductCodes, getProducts } from '../api/productApi'
import { Product } from 'types/product'
import { useParams } from 'react-router-dom'
import { ProductsUploadType } from 'types/ProductsUploadType'

export interface FetchParams {
  keyword?: string
  page?: number
  limit?: number
}

export const useProduct = () => {
  const [productCodes, setProductCodes] = useState<string[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [totalProductsCount, setTotalProductsCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

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
    async (params?: FetchParams) => {
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
      return res
    } catch (error) {
      console.error('❌ Upload failed', error)
      throw error
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
    error
  }
}
