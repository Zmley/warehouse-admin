import dayjs from 'dayjs'

export const printTask = (task: any) => {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const htmlContent = `
    <html>
      <head>
        <title>Print Task</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          td, th { border: 1px solid #ccc; padding: 8px; }
        </style>
      </head>
      <body>
        <h2>Task Detail</h2>
        <table>
          <tr><th>Task ID</th><td>${task.taskID}</td></tr>
          <tr><th>Product Code</th><td>${task.productCode}</td></tr>
          <tr><th>Quantity</th><td>${
            task.quantity === 0 ? 'ALL' : task.quantity
          }</td></tr>
          <tr><th>Source Bins</th><td>${
            task.sourceBins?.map((s: any) => s.bin?.binCode).join(' / ') || '--'
          }</td></tr>
          <tr><th>Target Bin</th><td>${
            task.destinationBinCode || '--'
          }</td></tr>
          <tr><th>Status</th><td>${task.status}</td></tr>
          <tr><th>Created At</th><td>${dayjs(task.createdAt).format(
            'YYYY-MM-DD HH:mm:ss'
          )}</td></tr>
          <tr><th>Updated At</th><td>${dayjs(task.updatedAt).format(
            'YYYY-MM-DD HH:mm:ss'
          )}</td></tr>
        </table>
        <script>window.onload = function() { window.print(); }</script>
      </body>
    </html>
  `

  printWindow.document.write(htmlContent)
  printWindow.document.close()
}
