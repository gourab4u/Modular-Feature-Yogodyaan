import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { LoadingSpinner } from '../../../shared/components/ui/LoadingSpinner'
import { useAdmin } from '../../admin/contexts/AdminContext'
import { useAuth } from '../../auth/contexts/AuthContext'

interface ProtectedAdminRouteProps {
  children: React.ReactNode
}

export function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const { admin, isAdmin, loading } = useAdmin()
  const { userRoles = [] } = useAuth() || {}
  const navigate = useNavigate()
  const location = useLocation()

  const canAccessAdminDashboard =
    isAdmin ||
    userRoles.includes('mantra_curator') ||
    userRoles.includes('admin') ||
    userRoles.includes('super_admin')

  useEffect(() => {
    if (
      !loading &&
      (!admin || !canAccessAdminDashboard) &&
      location.pathname !== '/admin/login'
    ) {
      navigate('/admin/login', { replace: true })
    }
  }, [admin, isAdmin, canAccessAdminDashboard, loading, navigate, location.pathname])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!admin || !canAccessAdminDashboard) {
    // Redirect instead of returning null for better UX
    navigate('/admin/login', { replace: true })
    return null
  }

  return <>{children}</>
}