import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { useBin } from 'hooks/useBin'
import { BinUploadType } from 'types/BinUploadType'
import UploadDialog from 'components/UploadDialog'
import { parseBinUploadRows } from 'utils/excelUploadParser'

interface Props {
  open: boolean
  onClose: () => void
}

const UploadBinModal: React.FC<Props> = ({ open, onClose }) => {
  const [bins, setBins] = useState<BinUploadType[]>([])
  const [skippedCodes, setSkippedCodes] = useState<string[]>([])
  const [successMessage, setSuccessMessage] = useState('')
  const [error, setError] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const { uploadBinList } = useBin()
  const location = useLocation()
  const queryParams = new URLSearchParams(location.search)
  const type = queryParams.get('type') || ''

  const resetState = () => {
    setBins([])
    setSkippedCodes([])
    setSuccessMessage('')
    setError('')
    setIsUploading(false)
  }

  useEffect(() => {
    if (!open) resetState()
  }, [open])

  const hasChinese = (str: string) => /[\u4e00-\u9fa5]/.test(str)

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

      const { bins, error } = parseBinUploadRows(raw, type)
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
      const res = await uploadBinList(bins)
      if (res.success) {
        setSuccessMessage(
          `✅ Uploaded ${res.insertedCount} bin(s). Skipped ${res.skippedCount} duplicates.`
        )
        setSkippedCodes(res.duplicatedBinCodes || [])
        setBins([])
      } else {
        setError(res.error || '❌ Upload failed.')
      }
    } catch (err: any) {
      setError('❌ Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <UploadDialog
      open={open}
      title='Upload Bins'
      columns={['Bin Code', 'Default Product Codes', 'Type']}
      rows={bins}
      getRowCells={row => [
        row.binCode,
        row.defaultProductCodes?.join(', ') || '--',
        row.type || '--'
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

export default UploadBinModal
