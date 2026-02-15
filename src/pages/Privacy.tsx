import { motion } from 'framer-motion'
import { Shield, Lock, Eye, Database, UserCheck, Bell, Mail } from 'lucide-react'
import { Card } from '../components/ui'

const sections = [
    {
        icon: Database,
        title: '信息收集',
        content: [
            '账户信息：用户名、邮箱地址、密码（加密存储）',
            '用户内容：日记、对话记录、情景投稿等用户生成的内容',
            '使用数据：访问日志、设备信息、IP地址、浏览器类型',
            '位置信息：用户主动分享的地理位置信息（可选）'
        ]
    },
    {
        icon: Eye,
        title: '信息使用',
        content: [
            '提供、维护和改进我们的服务',
            '个性化用户体验，提供相关内容和推荐',
            '与用户沟通，发送服务通知和更新',
            '分析用户行为，优化产品功能',
            '保护用户安全，防止欺诈和滥用行为'
        ]
    },
    {
        icon: Lock,
        title: '信息保护',
        content: [
            '采用行业标准的SSL/TLS加密技术保护数据传输',
            '用户密码使用bcrypt算法加密存储',
            '定期进行安全审计和漏洞检测',
            '限制员工访问用户数据的权限',
            '建立数据备份和灾难恢复机制'
        ]
    },
    {
        icon: UserCheck,
        title: '用户权利',
        content: [
            '访问权：您可以查看我们持有的您的个人数据',
            '更正权：您可以更新或更正不准确的信息',
            '删除权：您可以请求删除您的账户和相关数据',
            '导出权：您可以导出您的个人数据',
            '撤回同意：您可以随时撤回之前给予的同意'
        ]
    },
    {
        icon: Bell,
        title: 'Cookie政策',
        content: [
            '我们使用Cookie来记住您的登录状态',
            '用于分析网站流量和用户行为',
            '您可以在浏览器设置中禁用Cookie',
            '禁用Cookie可能影响部分功能的使用体验'
        ]
    },
    {
        icon: Shield,
        title: '数据安全',
        content: [
            '我们采用多重安全措施保护您的数据',
            '定期进行安全审计和漏洞检测',
            '建议您使用强密码并定期更换',
            '如发现账户异常，请及时联系我们'
        ]
    }
]

export const Privacy = () => {
    const lastUpdated = '2026年2月15日'

    return (
        <div className="min-h-screen py-12">
            <div className="max-w-4xl mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12"
                >
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                        <Shield className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-4xl font-bold mb-4">隐私政策</h1>
                    <p className="text-muted-foreground">
                        最后更新：{lastUpdated}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="mb-8"
                >
                    <Card className="p-6">
                        <h2 className="text-xl font-semibold mb-4">引言</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Yusi（以下简称"我们"）非常重视您的隐私。本隐私政策说明了我们如何收集、使用、
                            存储和保护您的个人信息。使用我们的服务即表示您同意本隐私政策的条款。
                            请仔细阅读以下内容，如有任何疑问，请随时联系我们。
                        </p>
                    </Card>
                </motion.div>

                <div className="space-y-6">
                    {sections.map((section, index) => (
                        <motion.div
                            key={section.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                        >
                            <Card className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <section.icon className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-lg font-semibold mb-3">{section.title}</h2>
                                        <ul className="space-y-2">
                                            {section.content.map((item, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                    className="mt-8"
                >
                    <Card className="p-6">
                        <h2 className="text-xl font-semibold mb-4">政策更新</h2>
                        <p className="text-muted-foreground leading-relaxed mb-4">
                            我们可能会不时更新本隐私政策。更新后的政策将在本页面发布，
                            并在页面顶部显示最后更新日期。重大变更时，我们会通过站内消息或邮件通知您。
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                            继续使用我们的服务即表示您接受更新后的隐私政策。
                        </p>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.9 }}
                    className="mt-8"
                >
                    <Card className="p-6">
                        <h2 className="text-xl font-semibold mb-4">联系我们</h2>
                        <p className="text-muted-foreground leading-relaxed mb-4">
                            如果您对本隐私政策有任何疑问、意见或建议，请通过以下方式联系我们：
                        </p>
                        <div className="flex items-center gap-2 text-primary">
                            <Mail className="w-4 h-4" />
                            <a href="mailto:yangaseubel@gmail.com" className="hover:underline">
                                yangaseubel@gmail.com
                            </a>
                        </div>
                    </Card>
                </motion.div>
            </div>
        </div>
    )
}
