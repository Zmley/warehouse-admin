import React, { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { InventoryUploadType } from 'types/InventoryUploadType'
import { useInventory } from 'hooks/useInventory'
import UploadDialog from 'components/UploadDialog'

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

  const hasChinese = (str: string) => /[\u4e00-\u9fa5]/.test(str)

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
      const raw = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][]

      if (!raw.length) {
        setError('❌ Empty Excel file')
        return
      }

      const headers = raw[0].map(cell => cell?.toString().toLowerCase().trim())

      const binCodeIdx = headers.findIndex(h => h?.includes('bincode'))
      const productCodeIdx = headers.findIndex(h => h?.includes('productcode'))
      const quantityIdx = headers.findIndex(h => h?.includes('quantity'))

      if (binCodeIdx === -1 || productCodeIdx === -1 || quantityIdx === -1) {
        setError(
          '❌ Missing required columns: binCode, productCode, or quantity.'
        )
        return
      }

      const parsed: InventoryUploadType[] = []
      let lastBinCode = ''

      raw.slice(1).forEach(row => {
        const binRaw = row[binCodeIdx]?.toString().trim()
        const productRaw = row[productCodeIdx]?.toString().trim()
        const quantityRaw = row[quantityIdx]?.toString().trim()

        const binCode = binRaw || lastBinCode
        if (binRaw) lastBinCode = binRaw

        if (!binCode || !productRaw || !quantityRaw) return
        if (
          hasChinese(binCode) ||
          hasChinese(productRaw) ||
          hasChinese(quantityRaw)
        )
          return

        const quantity = parseInt(quantityRaw)
        if (!isNaN(quantity)) {
          parsed.push({
            binCode,
            productCode: productRaw,
            quantity
          })
        }
      })

      setInventories(parsed)
      setSuccessMessage('')
      setError('')
    }

    reader.readAsArrayBuffer(file)
  }

  const handleConfirmUpload = async () => {
    setIsUploading(true)
    try {
      const res = await uploadInventoryList(inventories)
      if (res.success) {
        setInventories([])
        setSuccessMessage(
          `✅ Uploaded ${res.result.insertedCount} inventory item(s). Skipped ${res.result.skippedCount} items due to duplicates.`
        )
        setSkippedItems(res.result.skipped || [])
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

export default UploadInventoryModal
