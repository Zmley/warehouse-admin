import React, { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { useProduct } from 'hooks/useProduct'
import { ProductsUploadType } from 'types/ProductsUploadType'
import UploadDialog from 'components/UploadDialog'

interface Props {
  open: boolean
  onClose: () => void
}

const UploadProductModal: React.FC<Props> = ({ open, onClose }) => {
  const [products, setProducts] = useState<ProductsUploadType[]>([])
  const [successMessage, setSuccessMessage] = useState('')
  const [error, setError] = useState('')
  const [skippedCodes, setSkippedCodes] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const { uploadProductList } = useProduct()

  useEffect(() => {
    if (!open) {
      setProducts([])
      setSuccessMessage('')
      setError('')
      setSkippedCodes([])
      setIsUploading(false)
    }
  }, [open])

  const handleFileUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = e => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const raw = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as (
        | string
        | undefined
      )[][]

      if (!raw.length) {
        setError('❌ Excel file is empty')
        return
      }

      const headers = raw[0]

      const productCodeIndex = headers.findIndex(
        col =>
          typeof col === 'string' && col.toLowerCase().includes('productcode')
      )
      const barCodeIndex = headers.findIndex(
        col => typeof col === 'string' && col.toLowerCase().includes('barcode')
      )
      const boxTypeIndex = headers.findIndex(
        col => typeof col === 'string' && col.toLowerCase().includes('boxtype')
      )

      if (
        productCodeIndex === -1 ||
        barCodeIndex === -1 ||
        boxTypeIndex === -1
      ) {
        setError(
          '❌ Missing required columns: productCode, barCode, or boxType'
        )
        return
      }

      const parsed: ProductsUploadType[] = raw
        .slice(1)
        .filter(row => {
          const productCode = row[productCodeIndex]?.toString().trim()
          const barCode = row[barCodeIndex]?.toString().trim()
          const boxType = row[boxTypeIndex]?.toString().trim()
          return (
            productCode &&
            barCode &&
            boxType &&
            productCode !== '#N/A' &&
            barCode !== '#N/A' &&
            boxType !== '#N/A'
          )
        })
        .map(row => ({
          productCode: row[productCodeIndex]!.toString().trim(),
          barCode: row[barCodeIndex]!.toString().trim(),
          boxType: row[boxTypeIndex]!.toString().trim()
        }))

      setProducts(parsed)
      setSuccessMessage('')
      setError('')
    }

    reader.readAsArrayBuffer(file)
  }

  const handleConfirmUpload = async () => {
    setIsUploading(true)
    try {
      const res = await uploadProductList(products)
      if (res.success) {
        setSuccessMessage(
          `✅ Uploaded ${res.result.insertedCount} product(s). Skipped ${res.result.skippedCount} products due to duplicates.`
        )
        setSkippedCodes(res.result.duplicatedProductCodes || [])
        setProducts([])
      } else {
        setError(res.message || '❌ Upload failed.')
      }
    } catch (err: any) {
      setError('❌ Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <UploadDialog<ProductsUploadType>
      open={open}
      title='Upload Products'
      columns={['Product Code', 'Bar Code', 'Box Type']}
      rows={products}
      getRowCells={row => [row.productCode, row.barCode, row.boxType]}
      onClose={onClose}
      onFileUpload={handleFileUpload}
      onConfirmUpload={handleConfirmUpload}
      isUploading={isUploading}
      successMessage={successMessage}
      error={error}
      skippedItems={skippedCodes.map(code => (
        <code key={code}>{code}</code>
      ))}
    />
  )
}

export default UploadProductModal
