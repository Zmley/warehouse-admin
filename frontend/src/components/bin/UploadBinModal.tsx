import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { useBin } from 'hooks/useBin'
import { BinUploadType } from 'types/BinUploadType'
import UploadDialog from 'components/UploadDialog'

interface Props {
  open: boolean
  onClose: () => void
}

const UploadBinModal: React.FC<Props> = ({ open, onClose }) => {
  const [bins, setBins] = useState<(BinUploadType & { type: string })[]>([])
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

      if (!raw.length) return setError('❌ Empty Excel file')

      if (type === 'INVENTORY') {
        const maybeHeader = raw[0]
        const isHeader =
          typeof maybeHeader[0] === 'string' &&
          maybeHeader[0].toLowerCase().includes('bincode')
        const dataRows = isHeader ? raw.slice(1) : raw

        const parsed = dataRows
          .map(row => {
            const binRaw = row[0]
            const binCode =
              typeof binRaw === 'string'
                ? binRaw.trim()
                : binRaw?.toString().trim()
            return binCode && !hasChinese(binCode) ? { binCode, type } : null
          })
          .filter(Boolean) as (BinUploadType & { type: string })[]

        setBins(parsed)
      } else {
        const headers = raw[0]
        const binCodeIndex = headers.findIndex(
          col => col && String(col).toLowerCase().includes('bincode')
        )
        const defaultCodeIndex = headers.findIndex(
          col => col && String(col).toLowerCase().includes('default')
        )

        if (binCodeIndex === -1)
          return setError("❌ 'binCode' column not found")

        const map = new Map<string, string[]>()
        raw.slice(1).forEach(row => {
          const binRaw = row[binCodeIndex]
          const defaultRaw =
            defaultCodeIndex !== -1 ? row[defaultCodeIndex] : undefined

          const binCode =
            typeof binRaw === 'string'
              ? binRaw.trim()
              : binRaw?.toString().trim()
          const defaultCode =
            typeof defaultRaw === 'string'
              ? defaultRaw.trim()
              : defaultRaw?.toString().trim()

          if (!binCode) return
          if (!map.has(binCode)) map.set(binCode, [])
          if (defaultCode) map.get(binCode)!.push(defaultCode)
        })

        const parsed = Array.from(map.entries()).map(
          ([binCode, defaultProductCodes]) => ({
            binCode,
            defaultProductCodes,
            type
          })
        )

        setBins(parsed)
      }

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
