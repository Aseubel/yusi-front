import { Layout } from '../components/Layout'
import { RoomCreate, RoomJoin, ScenarioSubmit } from '../components/room'
import { motion } from 'framer-motion'
import { Sparkles, Users, PenTool, History } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui'

export const RoomLobby = () => {
    return (
        <Layout>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-12"
            >
                {/* Hero Section */}
                <section className="text-center space-y-6 py-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary"
                    >
                        <Sparkles className="w-4 h-4" />
                        <span>情景探索</span>
                    </motion.div>

                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                        <span className="bg-gradient-to-r from-primary via-violet-500 to-indigo-500 bg-clip-text text-transparent dark:from-indigo-400 dark:via-violet-400 dark:to-cyan-400">
                            把灵魂放进情景
                        </span>
                        <br />
                        <span className="text-foreground/80">更懂彼此</span>
                    </h2>

                    <p className="max-w-[42rem] mx-auto text-muted-foreground sm:text-xl sm:leading-8">
                        创建一个情景室或加入朋友的房间，一起用叙事探索真实自我与关系合拍度。
                    </p>

                    <Link to="/room/history">
                        <Button variant="outline" size="sm" className="gap-2">
                            <History className="w-4 h-4" />
                            查看历史记录
                        </Button>
                    </Link>
                </section>

                {/* 功能卡片 */}
                <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="relative group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative">
                            <RoomCreate />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="relative group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative">
                            <RoomJoin />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="relative group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-rose-500/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative">
                            <ScenarioSubmit />
                        </div>
                    </motion.div>
                </div>

                {/* 功能说明 */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="max-w-4xl mx-auto"
                >
                    <div className="grid md:grid-cols-3 gap-8 text-center py-12 border-t border-border/50">
                        <div className="space-y-3">
                            <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center mx-auto">
                                <Users className="w-6 h-6 text-violet-500" />
                            </div>
                            <h3 className="font-semibold">多人协作</h3>
                            <p className="text-sm text-muted-foreground">邀请好友加入，最多支持8人同时参与情景体验</p>
                        </div>
                        <div className="space-y-3">
                            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto">
                                <Sparkles className="w-6 h-6 text-blue-500" />
                            </div>
                            <h3 className="font-semibold">AI分析</h3>
                            <p className="text-sm text-muted-foreground">智能分析每个人的回答，生成深度性格画像与匹配报告</p>
                        </div>
                        <div className="space-y-3">
                            <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center mx-auto">
                                <PenTool className="w-6 h-6 text-pink-500" />
                            </div>
                            <h3 className="font-semibold">投稿情景</h3>
                            <p className="text-sm text-muted-foreground">创作你的专属情景，与全平台用户分享探索体验</p>
                        </div>
                    </div>
                </motion.section>
            </motion.div>
        </Layout>
    )
}
