import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui'
import { authApi } from '../lib/api'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { validatePasswordStrength } from '../lib/crypto'

export const ForgotPassword = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [countdown, setCountdown] = useState(0)
  
  const [formData, setFormData] = useState({
    userName: '',
    code: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [countdown])

  const handleSendCode = async () => {
    if (!formData.userName) {
      toast.error(t('forgotPassword.errorUsername'))
      return
    }
    setLoading(true)
    try {
      await authApi.sendForgotPasswordCode(formData.userName)
      toast.success(t('forgotPassword.codeSent'))
      setStep(2)
      setCountdown(60)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.code || !formData.newPassword) {
      toast.error(t('forgotPassword.errorFillAll'))
      return
    }
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error(t('forgotPassword.errorPasswordMismatch'))
      return
    }

    const strength = validatePasswordStrength(formData.newPassword)
    if (!strength.valid) {
      toast.error(t('forgotPassword.errorPasswordWeak') || '密码强度不足：' + strength.feedback.join('; '))
      return
    }

    setLoading(true)
    try {
      await authApi.resetPassword({
        userName: formData.userName,
        code: formData.code,
        newPassword: formData.newPassword,
      })
      toast.success(t('forgotPassword.resetSuccess'))
      navigate('/login')
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
          <CardTitle className="text-2xl font-bold text-center">{t('forgotPassword.title')}</CardTitle>
          <CardDescription className="text-center">
            {step === 1 ? t('forgotPassword.step1Desc') : t('forgotPassword.step2Desc')}
          </CardDescription>
        </CardHeader>
        <form onSubmit={step === 1 ? (e) => { e.preventDefault(); handleSendCode(); } : handleResetPassword}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none" htmlFor="userName">
                {t('forgotPassword.username')}
              </label>
              <div className="flex gap-2">
                <Input
                  id="userName"
                  type="text"
                  placeholder={t('forgotPassword.usernamePlaceholder')}
                  value={formData.userName}
                  onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                  disabled={loading || step === 2}
                />
                {step === 2 && (
                   <Button 
                     type="button" 
                     variant="outline" 
                     onClick={handleSendCode}
                     disabled={loading || countdown > 0}
                     className="whitespace-nowrap w-[120px]"
                   >
                     {countdown > 0 ? `${countdown}s` : t('forgotPassword.resend')}
                   </Button>
                )}
              </div>
            </div>

            {step === 2 && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none" htmlFor="code">
                    {t('forgotPassword.code')}
                  </label>
                  <Input
                    id="code"
                    placeholder={t('forgotPassword.codePlaceholder')}
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none" htmlFor="newPassword">
                    {t('forgotPassword.newPassword')}
                  </label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder={t('forgotPassword.newPasswordPlaceholder')}
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none" htmlFor="confirmPassword">
                    {t('forgotPassword.confirmPassword')}
                  </label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder={t('forgotPassword.confirmPasswordPlaceholder')}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    disabled={loading}
                  />
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" type="submit" isLoading={loading}>
              {step === 1 ? t('forgotPassword.sendCode') : t('forgotPassword.resetPassword')}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              {t('forgotPassword.rememberPassword')}{' '}
              <Link to="/login" className="text-primary hover:underline">
                {t('forgotPassword.backToLogin')}
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
