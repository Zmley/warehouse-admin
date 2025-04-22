// please keep this file incase our client neess to upload excel file with location
export const extractBoxTypeFromString = (input: string): string => {
  const match = input.match(/_(\w)/)
  return match ? match[1] : ''
}
