import { useState, useCallback } from 'react'
import { getProducts } from '../api/productApi'

export const useProduct = () => {
  const [productCodes, setProductCodes] = useState<string[]>([])

  const loadProducts = useCallback(async () => {
    try {
      const res = await getProducts()
      setProductCodes(res.productCodes)
    } catch (err) {
      console.error('❌ Failed to load products', err)
    }
  }, [])

  return { productCodes, loadProducts }
}
