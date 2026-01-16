import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useCallback } from 'react'

/**
 * Hook to check if user is logged in and redirect to login page if not.
 * Returns a function that can be called before performing auth-required actions.
 */
export const useRequireAuth = () => {
    const navigate = useNavigate()
    const { user } = useAuthStore()

    const requireAuth = useCallback(
        (message?: string): boolean => {
            if (!user) {
                toast.error(message || '请先登录后再操作')
                navigate('/login', { state: { from: window.location.pathname } })
                return false
            }
            return true
        },
        [user, navigate]
    )

    return { isLoggedIn: !!user, requireAuth, user }
}

/**
 * Check if user is logged in (non-hook version for use outside components)
 */
export const isAuthenticated = (): boolean => {
    const { user } = useAuthStore.getState()
    return !!user
}
