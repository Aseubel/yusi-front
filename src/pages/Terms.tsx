import { motion } from 'framer-motion'
import { FileText, CheckCircle, XCircle, AlertTriangle, Scale } from 'lucide-react'
import { Card } from '../components/ui'

const sections = [
    {
        icon: CheckCircle,
        title: '服务条款',
        content: [
            '您需要提供准确、完整的注册信息',
            '您有责任保护账户安全，对账户下的所有活动负责',
            '您同意遵守所有适用的法律法规',
            '我们保留随时修改或终止服务的权利',
            '建议未成年人在监护人指导下使用本服务'
        ]
    },
    {
        icon: FileText,
        title: '用户内容',
        content: [
            '您保留对您创作内容的所有权',
            '您授予我们使用、存储、展示您内容的许可',
            '您承诺不发布违法、侵权或有害的内容',
            '我们有权删除违反规定的内容',
            '您对您发布的内容承担全部责任'
        ]
    },
    {
        icon: XCircle,
        title: '禁止行为',
        content: [
            '发布违法、淫秽、暴力或仇恨言论',
            '侵犯他人知识产权或隐私权',
            '传播病毒、恶意软件或进行网络攻击',
            '冒充他人或提供虚假信息',
            '干扰服务的正常运行',
            '未经授权访问他人账户或数据'
        ]
    },
    {
        icon: AlertTriangle,
        title: '免责声明',
        content: [
            '服务按"现状"提供，不提供任何明示或暗示的保证',
            '我们对用户生成的内容不承担审核义务',
            '不对因使用服务而产生的任何损失负责',
            'AI生成内容仅供参考，不构成专业建议',
            '第三方链接不在我们的控制范围内'
        ]
    },
    {
        icon: Scale,
        title: '知识产权',
        content: [
            'Yusi及其相关标识是我们的商标',
            '未经许可，不得使用我们的商标或品牌',
            '用户内容中的知识产权归用户所有',
            '我们尊重他人的知识产权，您也应如此',
            '如发现侵权，请及时联系我们处理'
        ]
    }
]

const terminationReasons = [
    '违反本协议的任何条款',
    '从事违法或有害活动',
    '侵犯他人权利',
    '长期不活跃账户',
    '应法律要求或政府指令'
]

export const Terms = () => {
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
                        <FileText className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-4xl font-bold mb-4">用户协议</h1>
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
                        <h2 className="text-xl font-semibold mb-4">协议说明</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            欢迎使用Yusi！本用户协议（以下简称"本协议"）是您与Yusi之间关于使用我们服务的法律协议。
                            请仔细阅读本协议的全部内容。使用我们的服务即表示您同意接受本协议的所有条款和条件。
                            如果您不同意本协议的任何内容，请勿使用我们的服务。
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
                    transition={{ duration: 0.5, delay: 0.7 }}
                    className="mt-8"
                >
                    <Card className="p-6">
                        <h2 className="text-xl font-semibold mb-4">账户终止</h2>
                        <p className="text-muted-foreground leading-relaxed mb-4">
                            我们保留在以下情况下暂停或终止您的账户的权利：
                        </p>
                        <ul className="space-y-2">
                            {terminationReasons.map((reason, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                    <XCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                                    {reason}
                                </li>
                            ))}
                        </ul>
                        <p className="text-muted-foreground leading-relaxed mt-4">
                            您也可以随时申请注销您的账户。账户注销后，您的数据将按照隐私政策处理。
                        </p>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                    className="mt-8"
                >
                    <Card className="p-6">
                        <h2 className="text-xl font-semibold mb-4">争议解决</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            因本协议引起的或与本协议有关的任何争议，双方应首先通过友好协商解决。
                            协商不成的，任何一方均可向我们所在地有管辖权的人民法院提起诉讼。
                            本协议的解释和执行适用中华人民共和国法律。
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
                        <h2 className="text-xl font-semibold mb-4">协议修改</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            我们保留随时修改本协议的权利。修改后的协议将在本页面发布，
                            并在页面顶部显示最后更新日期。重大变更时，我们会通过站内消息或邮件通知您。
                            继续使用我们的服务即表示您接受修改后的协议。
                        </p>
                    </Card>
                </motion.div>
            </div>
        </div>
    )
}
