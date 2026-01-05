import { useCallback, useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from 'contexts/auth'
import {
  createEmployee,
  deleteEmployeeAPI,
  getAllEmployees,
  loginUser
} from 'api/auth'
import { saveTokens, clearTokens } from 'utils/Storages'
import {
  CreateEmployeePayload,
  CreateEmployeeResponse,
  Employee
} from 'types/auth'

export const useAuth = () => {
  const { isAuthenticated, setIsAuthenticated, userProfile } =
    useContext(AuthContext)!

  const [employees, setEmployees] = useState<Employee[]>([])

  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<CreateEmployeeResponse | null>(null)

  const handleLogin = async (email: string, password: string) => {
    setError(null)
    try {
      const tokens = await loginUser(email, password)
      saveTokens(tokens)
      setIsAuthenticated(true)

      navigate('/')
    } catch (err: any) {
      console.error(
        '❌ Login Error:',
        err.response?.data?.message || 'Unknown error'
      )
      setError(
        err.response?.data?.message || '❌ Login failed due to unknown error.'
      )
    }
  }

  const handleLogout = () => {
    clearTokens()
    setIsAuthenticated(false)
    navigate('/')
  }

  const registerEmployee = useCallback(
    async (payload: CreateEmployeePayload) => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await createEmployee(payload)
        setResult(data)
        return data
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          'Failed to create employee'
        setError(msg)
        return false
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const loadEmployees = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const list = await getAllEmployees()
      setEmployees(list)
      return list
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to load employees'
      console.error('❌ loadEmployees error:', msg)
      setError(msg)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const deleteEmployee = async (accountID: string) => {
    try {
      setIsLoading(true)
      await deleteEmployeeAPI(accountID)
      await loadEmployees()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to delete')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    handleLogin,
    handleLogout,
    isAuthenticated,
    error,
    userProfile,
    registerEmployee,
    result,
    isLoading,
    employees,
    setEmployees,
    loadEmployees,

    deleteEmployee
  }
}
