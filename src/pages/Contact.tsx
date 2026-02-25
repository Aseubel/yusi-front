import { useState } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Send, CheckCircle, Loader2, Mail, ArrowLeft } from 'lucide-react'
import { Button, Card, Textarea, Input } from '../components/ui'
import { api } from '../lib/api'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

export const Contact = () => {
    const navigate = useNavigate()
    const [content, setContent] = useState('')
    const [contactEmail, setContactEmail] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)

    const handleSubmit = async () => {
        if (!content.trim()) {
            toast.error('请输入建议内容')
            return
        }

        if (content.length > 2000) {
            toast.error('内容不能超过2000字')
            return
        }

        setIsSubmitting(true)
        try {
            await api.post('/suggestions', {
                content: content.trim(),
                contactEmail: contactEmail.trim() || null
            })
            setIsSubmitted(true)
            toast.success('感谢您的建议！')
        } catch (error) {
            console.error('Submit suggestion failed:', error)
            toast.error('提交失败，请稍后重试')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isSubmitted) {
        return (
            <div className="min-h-screen py-12 flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md mx-auto px-4 text-center"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                        className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center"
                    >
                        <CheckCircle className="w-10 h-10 text-white" />
                    </motion.div>
                    <h2 className="text-2xl font-bold mb-3">感谢您的建议！</h2>
                    <p className="text-muted-foreground mb-6">
                        我们已收到您的反馈，会认真阅读并持续改进。
                    </p>
                    <div className="flex gap-3 justify-center">
                        <Button variant="outline" onClick={() => navigate(-1)}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            返回
                        </Button>
                        <Button onClick={() => {
                            setIsSubmitted(false)
                            setContent('')
                            setContactEmail('')
                        }}>
                            继续提交
                        </Button>
                    </div>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen py-12">
            <div className="max-w-2xl mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-8"
                >
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                        <MessageSquare className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold mb-2">建议与反馈</h1>
                    <p className="text-muted-foreground">
                        您的意见对我们非常重要，帮助我们做得更好
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <Card className="p-6">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    建议内容
                                    <span className="text-destructive">*</span>
                                </label>
                                <Textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="请详细描述您的建议、问题或想法..."
                                    rows={6}
                                    className="resize-none"
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>暂不支持Markdown格式😀</span>
                                    <span className={content.length > 2000 ? 'text-destructive' : ''}>
                                        {content.length}/2000
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    联系邮箱
                                    <span className="text-muted-foreground text-xs font-normal">(选填)</span>
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        type="email"
                                        value={contactEmail}
                                        onChange={(e) => setContactEmail(e.target.value)}
                                        placeholder="您的邮箱，方便我们回复您"
                                        className="pl-10"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    如需回复，请留下您的邮箱地址
                                </p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => navigate(-1)}
                                >
                                    取消
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || !content.trim()}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            提交中...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4 mr-2" />
                                            提交建议
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mt-8"
                >
                    <Card className="p-6 bg-muted/30">
                        <h3 className="font-semibold mb-3">温馨提示</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                                请尽量详细描述您的建议，便于我们理解和改进
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                                如遇到问题，请描述复现步骤和预期结果
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                                我们会认真阅读每一条建议，感谢您的支持
                            </li>
                        </ul>
                    </Card>
                </motion.div>
            </div>
        </div>
    )
}
