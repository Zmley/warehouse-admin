import { useState, useCallback } from 'react'
import { getProducts } from '../api/productApi'

export const useProduct = () => {
  const [productCodes, setProductCodes] = useState<string[]>([])
  const [loading] = useState<boolean>(false)

  const fetchProducts = useCallback(async () => {
    try {
      const res = await getProducts()
      setProductCodes(res.productCodes)
    } catch (err) {
      console.error('❌ Failed to load products', err)
    }
  }, [])

  return { productCodes, fetchProducts, loading }
}
