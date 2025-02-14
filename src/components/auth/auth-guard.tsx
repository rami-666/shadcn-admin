import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import axios from 'axios'
import { config } from '@/config/env'


export function AuthGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await axios.get(`${config.apiBaseUrl}/auth/status`)
        if (!response.data.isAuthenticated) {
          navigate({ to: '/sign-in' })
        }

      } catch (error) {
        console.error('Error checking auth status:', error)
        navigate({ to: '/sign-in' })
      }
    }

    false && checkAuthStatus() // TODO: RAMI REMOVE THIS
  }, [navigate])

  return <>{children}</>
} 