import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, Sparkles, Users, Shield, Lightbulb, Target, Mail, Github, Twitter, MessageSquare } from 'lucide-react'
import { Button, Card } from '../components/ui'

const features = [
    {
        icon: Sparkles,
        title: '情景叙事',
        description: '通过精心设计的情景对话，在具体场景中展现真实的自己，看见他人未曾示人的那一面。'
    },
    {
        icon: Users,
        title: '深度理解',
        description: '超越简单的标签，通过行为和选择真正理解一个人，而不是用"温柔"或"果断"来定义。'
    },
    {
        icon: Heart,
        title: '记忆成型',
        description: '记录生命中的重要时刻，让AI帮助你梳理人生轨迹，明白经历如何塑造了今天的自己。'
    },
    {
        icon: Shield,
        title: '私密安全',
        description: '你的故事值得被认真对待。加密存储，只为更懂你，绝不泄露。'
    }
]

const values = [
    {
        icon: Lightbulb,
        title: '理解至上',
        description: '相信真正的了解来自具体场景中的行动，而非抽象的标签'
    },
    {
        icon: Heart,
        title: '记忆珍贵',
        description: '每一次选择都在书写人生，这些记忆造就了独一无二的你'
    },
    {
        icon: Target,
        title: '深度连接',
        description: '让人与人之间产生真正的精神共鸣'
    }
]

export const About = () => {
    return (
        <div className="min-h-screen py-12">
            <div className="max-w-4xl mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                        关于我们
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        人不被行为标签所定义，记忆使人成型。
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="mb-16"
                >
                    <Card className="p-8">
                        <h2 className="text-2xl font-semibold mb-4">我们的思考</h2>
                        <div className="space-y-4 text-muted-foreground leading-relaxed">
                            <p>
                                我们常说了解一个人，却往往只是记住了几个标签——"他是个温柔的人"、"她很果断"。
                                但这些标签真的能代表一个人吗？
                            </p>
                            <p>
                                当我们想象朋友在某个具体情境下会如何选择时，我们不会用"温柔"或"果断"来思考，
                                而是他会做什么、说什么、怎样行动。这才是真正的理解。
                            </p>
                            <p>
                                Yusi 相信，记忆使人成型。你一生中做出的每一个选择，
                                经历过的每一段故事，在无形中塑造了今天的你。
                            </p>
                            <p>
                                我们希望创造一个空间，让每个人都能静下心来审视自己的内心，
                                记录那些重要的选择和时刻；也让他人有机会看见真实的你——
                                不是标签化的你，而是具体情境中做出具体选择的你。
                            </p>
                        </div>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mb-16"
                >
                    <h2 className="text-2xl font-semibold mb-8 text-center">核心功能</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                            >
                                <Card className="p-6 h-full hover:shadow-lg transition-shadow">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <feature.icon className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold mb-2">{feature.title}</h3>
                                            <p className="text-sm text-muted-foreground">{feature.description}</p>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="mb-16"
                >
                    <h2 className="text-2xl font-semibold mb-8 text-center">我们的价值观</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {values.map((value, index) => (
                            <motion.div
                                key={value.title}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                                className="text-center"
                            >
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                                    <value.icon className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="font-semibold mb-2">{value.title}</h3>
                                <p className="text-sm text-muted-foreground">{value.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                >
                    <Card className="p-8 text-center">
                        <h2 className="text-2xl font-semibold mb-4">联系我们</h2>
                        <p className="text-muted-foreground mb-6">
                            有任何问题或建议？我们很乐意听取您的声音。
                        </p>
                        <div className="flex justify-center gap-4 mb-6">
                            <Link to="/contact">
                                <Button size="sm" className="gap-2">
                                    <MessageSquare className="w-4 h-4" />
                                    提交建议
                                </Button>
                            </Link>
                        </div>
                        <div className="flex justify-center gap-4 mb-6">
                            <a
                                href="https://github.com/Aseubel"
                                target="_blank"
                                rel="noreferrer"
                                className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-primary/10 transition-colors"
                            >
                                <Github className="w-5 h-5" />
                            </a>
                            <a
                                href="https://twitter.com"
                                target="_blank"
                                rel="noreferrer"
                                className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-primary/10 transition-colors"
                            >
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a
                                href="mailto:yangaseubel@gmail.com"
                                className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-primary/10 transition-colors"
                            >
                                <Mail className="w-5 h-5" />
                            </a>
                        </div>
                        <div className="flex justify-center gap-4">
                            <Link to="/privacy">
                                <Button variant="outline" size="sm">隐私政策</Button>
                            </Link>
                            <Link to="/terms">
                                <Button variant="outline" size="sm">用户协议</Button>
                            </Link>
                        </div>
                    </Card>
                </motion.div>
            </div>
        </div>
    )
}
