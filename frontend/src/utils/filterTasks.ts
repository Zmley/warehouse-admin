export const filterTasks = (
  tasks: any[],
  filterStatus: 'ALL' | 'PENDING' | 'COMPLETED',
  keyword: string
) => {
  const base =
    filterStatus === 'ALL'
      ? tasks
      : tasks.filter(task => task.status === filterStatus)

  if (!keyword.trim()) return base

  const lowerKeyword = keyword.trim().toLowerCase()

  return base.filter(
    task =>
      task.productCode?.toLowerCase().includes(lowerKeyword) ||
      task.destinationBinCode?.toLowerCase().includes(lowerKeyword) ||
      task.sourceBins?.some((b: any) =>
        b.Bin?.binCode?.toLowerCase().includes(lowerKeyword)
      )
  )
}
