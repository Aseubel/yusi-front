import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui'
import { authApi } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { validatePasswordStrength } from '../lib/crypto'

export const Register = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    userName: '',
    password: '',
    confirmPassword: '',
    email: '',
  })
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] as string[] })

  const handlePasswordChange = (password: string) => {
    setFormData({ ...formData, password })
    if (password) {
      setPasswordStrength(validatePasswordStrength(password))
    } else {
      setPasswordStrength({ score: 0, feedback: [] })
    }
  }

  const getStrengthColor = () => {
    if (passwordStrength.score <= 1) return 'bg-red-500'
    if (passwordStrength.score <= 2) return 'bg-orange-500'
    if (passwordStrength.score <= 3) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStrengthLabel = () => {
    if (passwordStrength.score <= 1) return t('register.strengthWeak') || '弱'
    if (passwordStrength.score <= 2) return t('register.strengthFair') || '一般'
    if (passwordStrength.score <= 3) return t('register.strengthGood') || '良好'
    return t('register.strengthStrong') || '强'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.userName || !formData.password || !formData.email) {
      toast.error(t('register.errorFillAll'))
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error(t('register.errorPasswordMismatch'))
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error(t('register.errorEmailFormat'))
      return
    }

    if (formData.userName.length < 2 || formData.userName.length > 20) {
      toast.error(t('register.errorUsernameLength'))
      return
    }

    const strength = validatePasswordStrength(formData.password)
    if (!strength.valid) {
      toast.error((t('register.errorPasswordWeak') || '密码强度不足：') + ' ' + strength.feedback.map(k => t(k)).join('; '))
      return
    }

    setLoading(true)
    try {
      await authApi.register({
        userName: formData.userName,
        password: formData.password,
        email: formData.email,
      })

      const loginRes = await authApi.login({
        userName: formData.userName,
        password: formData.password,
      })
      const { user, accessToken, refreshToken } = loginRes.data.data
      login(user, accessToken, refreshToken)
      localStorage.setItem('yusi-user-id', user.userId)

      toast.success(t('register.success'))
      navigate('/')
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
          <CardTitle className="text-2xl font-bold text-center">{t('register.title')}</CardTitle>
          <CardDescription className="text-center">
            {t('register.description')}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none" htmlFor="username">
                {t('register.username')}
              </label>
              <Input
                id="username"
                placeholder={t('register.usernamePlaceholder')}
                value={formData.userName}
                onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none" htmlFor="email">
                {t('register.email')}
              </label>
              <Input
                id="email"
                type="email"
                placeholder={t('register.emailPlaceholder')}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none" htmlFor="password">
                {t('register.password')}
              </label>
              <Input
                id="password"
                type="password"
                placeholder={t('register.passwordPlaceholder')}
                value={formData.password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                disabled={loading}
              />
              {formData.password && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded ${level <= passwordStrength.score ? getStrengthColor() : 'bg-gray-200'}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    密码强度: {getStrengthLabel()}
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none" htmlFor="confirmPassword">
                {t('register.confirmPassword')}
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder={t('register.confirmPasswordPlaceholder')}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" type="submit" isLoading={loading}>
              {t('register.submit')}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              {t('register.hasAccount')}{' '}
              <Link to="/login" className="text-primary hover:underline">
                {t('register.loginNow')}
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
