import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import * as XLSX from 'xlsx'
import UploadDialog from 'components/UploadDialog'
import { useInventory } from 'hooks/useInventory'
import { useProduct } from 'hooks/useProduct'
import { useBin } from 'hooks/useBin'
import {
  parseInventoryRows,
  parseProductRows,
  parseBinUploadRows
} from 'utils/excelUploadParser'
import { InventoryUploadType } from 'types/Inventory'
import { ProductsUploadType } from 'types/product'
import { BinUploadType } from 'types/Bin'
import { BinKind } from 'constants/index'

interface Props {
  open: boolean
  onClose: () => void
}

export const UploadInventoryModal: React.FC<Props> = ({ open, onClose }) => {
  const [inventories, setInventories] = useState<InventoryUploadType[]>([])
  const [successMessage, setSuccessMessage] = useState('')
  const [error, setError] = useState('')
  const [skippedItems, setSkippedItems] = useState<InventoryUploadType[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const { uploadInventoryList } = useInventory()

  const resetState = () => {
    setInventories([])
    setSuccessMessage('')
    setError('')
    setSkippedItems([])
    setIsUploading(false)
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  useEffect(() => {
    if (!open) resetState()
  }, [open])

  const handleFileUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = e => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const raw = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as (
        | string
        | number
        | undefined
      )[][]

      const { inventories, error } = parseInventoryRows(raw)
      if (error) return setError(error)

      setInventories(inventories)
      setSuccessMessage('')
      setError('')
    }
    reader.readAsArrayBuffer(file)
  }

  const handleConfirmUpload = async () => {
    setIsUploading(true)
    try {
      const result = await uploadInventoryList(inventories)

      if (result?.success) {
        setError('')
        setInventories([])
        setSuccessMessage(
          `✅ Inserted ${result.insertedCount}, Updated ${result.updatedCount} inventory item(s).`
        )
      } else {
        setSuccessMessage('')
        setError(result?.message || 'Upload failed.')
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message || 'Upload failed. Please try again.'
      )
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <UploadDialog<InventoryUploadType>
      open={open}
      title='Upload Inventory'
      columns={['Bin Code', 'Product Code', 'Quantity']}
      rows={inventories}
      getRowCells={row => [row.binCode, row.productCode, row.quantity]}
      onClose={handleClose}
      onFileUpload={handleFileUpload}
      onConfirmUpload={handleConfirmUpload}
      isUploading={isUploading}
      successMessage={successMessage}
      error={error}
      skippedItems={skippedItems.map(item => (
        <code key={item.productCode}>
          BinCode: {item.binCode}, ProductCode: {item.productCode}, Quantity:{' '}
          {item.quantity}
        </code>
      ))}
    />
  )
}

export const UploadProductModal: React.FC<Props> = ({ open, onClose }) => {
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
        | number
        | undefined
      )[][]

      const { products, error } = parseProductRows(raw)
      if (error) return setError(error)

      setProducts(products)
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
        const inserted = res.result.insertedCount || 0
        const updated = res.result.updatedCount || 0
        const skipped = res.result.skippedCount || 0

        setSuccessMessage(
          `✅ Inserted: ${inserted}, Updated: ${updated}, Skipped: ${skipped}`
        )
        setSkippedCodes(res.result.duplicatedProductCodes || [])
        setProducts([])
      } else {
        setError(res.message || 'Upload failed.')
      }
    } catch (err: any) {
      setError('Upload failed. Please try again.')
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

export const UploadBinModal: React.FC<Props> = ({ open, onClose }) => {
  const [bins, setBins] = useState<BinUploadType[]>([])
  const [skippedCodes, setSkippedCodes] = useState<string[]>([])
  const [successMessage, setSuccessMessage] = useState('')
  const [error, setError] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const { uploadBinList } = useBin()

  const location = useLocation()
  const queryParams = new URLSearchParams(location.search)

  const isBinType = (v?: string | null): v is BinKind =>
    v === BinKind.INVENTORY ||
    v === BinKind.PICK_UP ||
    v === BinKind.CART ||
    v === BinKind.AISLE

  const getTypeFromUrl = (): BinKind => {
    const raw = (queryParams.get('type') || '').toUpperCase()
    return isBinType(raw) ? (raw as BinKind) : BinKind.INVENTORY
  }

  const [selectedType, setSelectedType] = useState<BinKind>(getTypeFromUrl())
  useEffect(() => {
    if (open) setSelectedType(getTypeFromUrl())
  }, [open, location.search])

  useEffect(() => {
    if (!open) {
      setBins([])
      setSkippedCodes([])
      setSuccessMessage('')
      setError('')
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
        | number
        | undefined
      )[][]

      const { bins, error } = parseBinUploadRows(raw, selectedType)
      if (error) return setError(error)

      setBins(bins)
      setSuccessMessage('')
      setError('')
    }
    reader.readAsArrayBuffer(file)
  }

  const handleConfirmUpload = async () => {
    setIsUploading(true)
    try {
      const res = await uploadBinList(bins, selectedType)
      if (res.success) {
        const inserted = res.insertedCount || 0
        const updated = res.updatedCount || 0
        const skipped = res.skippedCount || 0

        setSuccessMessage(
          `✅ Inserted: ${inserted}, Updated: ${updated}, Skipped: ${skipped}`
        )
        setSkippedCodes(res.duplicatedBinCodes || [])
        setBins([])
      } else {
        setError(res.error || 'Upload failed.')
      }
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <UploadDialog<BinUploadType>
      open={open}
      title='Upload Bins'
      columns={['Bin Code', 'Default Product Codes', 'Type']}
      rows={bins}
      getRowCells={row => [
        row.binCode,
        row.defaultProductCodes?.join(', ') || '--',
        row.type || selectedType || '--'
      ]}
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
