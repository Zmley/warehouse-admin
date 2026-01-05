import { ListSessionsResponse, SessionQuery } from 'types/Log.js'
import apiClient from './axiosClient.ts'

export const getSessions = async (params?: SessionQuery) => {
  const res = await apiClient.get<ListSessionsResponse>('/logs/sessions', {
    params
  })
  return res.data
}
