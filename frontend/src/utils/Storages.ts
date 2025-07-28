export const saveTokens = (data: {
  accessToken: string
  idToken: string
  refreshToken: string
}) => {
  localStorage.setItem('accessToken', data.accessToken)
  localStorage.setItem('idToken', data.idToken)
  localStorage.setItem('refreshToken', data.refreshToken)
}

export const getAccessToken = (): string | null => {
  return localStorage.getItem('accessToken')
}

export const clearTokens = () => {
  localStorage.clear()
}
export const areTokensValid = (): boolean => {
  return !!(
    localStorage.getItem('accessToken') &&
    localStorage.getItem('idToken') &&
    localStorage.getItem('refreshToken')
  )
}
