import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui'
import { authApi } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

export const Login = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((state) => state.login)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    userName: '',
    password: '',
  })

  const from = (location.state as { from?: string })?.from || '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.userName || !formData.password) return

    setLoading(true)
    try {
      const res = await authApi.login(formData)
      const { user, accessToken, refreshToken } = res.data.data
      login(user, accessToken, refreshToken)
      localStorage.setItem('yusi-user-id', user.userId)
      toast.success(t('login.success'))
      navigate(from, { replace: true })
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">{t('login.title')}</CardTitle>
            <CardDescription className="text-center">
              {t('login.description')}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="username">
                  {t('login.username')}
                </label>
                <Input
                  id="username"
                  placeholder={t('login.usernamePlaceholder')}
                  value={formData.userName}
                  onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium leading-none" htmlFor="password">
                    {t('login.password')}
                  </label>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('login.passwordPlaceholder')}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  disabled={loading}
                />
                <div className="flex justify-end">
                  <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                    {t('login.forgotPassword')}
                  </Link>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button className="w-full" type="submit" isLoading={loading}>
                {t('login.submit')}
              </Button>
              <div className="text-sm text-center text-muted-foreground">
                {t('login.noAccount')}{' '}
                <Link to="/register" className="text-primary hover:underline">
                  {t('login.registerNow')}
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
  )
}
