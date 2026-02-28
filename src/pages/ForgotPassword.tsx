import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui'
import { authApi } from '../lib/api'
import { toast } from 'sonner'

export const ForgotPassword = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [countdown, setCountdown] = useState(0)
  
  const [formData, setFormData] = useState({
    email: '',
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
    if (!formData.email) {
      toast.error('请输入邮箱')
      return
    }
    setLoading(true)
    try {
      await authApi.sendForgotPasswordCode(formData.email)
      toast.success('验证码已发送，请查收邮件')
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
      toast.error('请填写完整信息')
      return
    }
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('两次输入的密码不一致')
      return
    }

    setLoading(true)
    try {
      await authApi.resetPassword({
        email: formData.email,
        code: formData.code,
        newPassword: formData.newPassword,
      })
      toast.success('密码重置成功，请重新登录')
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
          <CardTitle className="text-2xl font-bold text-center">找回密码</CardTitle>
          <CardDescription className="text-center">
            {step === 1 ? '请输入您的注册邮箱以接收验证码' : '请输入验证码和新密码'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={step === 1 ? (e) => { e.preventDefault(); handleSendCode(); } : handleResetPassword}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none" htmlFor="email">
                邮箱
              </label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                     {countdown > 0 ? `${countdown}s` : '重新发送'}
                   </Button>
                )}
              </div>
            </div>

            {step === 2 && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none" htmlFor="code">
                    验证码
                  </label>
                  <Input
                    id="code"
                    placeholder="请输入6位验证码"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none" htmlFor="newPassword">
                    新密码
                  </label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="请输入新密码"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none" htmlFor="confirmPassword">
                    确认新密码
                  </label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="请再次输入新密码"
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
              {step === 1 ? '发送验证码' : '重置密码'}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              想起密码了？{' '}
              <Link to="/login" className="text-primary hover:underline">
                返回登录
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
