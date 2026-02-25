import { RoomCreate, RoomJoin, ScenarioSubmit } from '../components/room'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Users, PenTool, History, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui'

export const RoomLobby = () => {
    const [showMyScenarios, setShowMyScenarios] = useState(false)

    return (
        <div className="container-page py-12 relative">
             {/* Background Decoration */}
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-primary/5 blur-[100px] rounded-full -z-10" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-16"
            >
                {/* Hero Section */}
                <section className="text-center space-y-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary shadow-sm"
                    >
                        <Sparkles className="w-4 h-4" />
                        <span>情景探索</span>
                    </motion.div>

                    <h2 className="text-4xl md:text-6xl font-bold tracking-tight">
                        <span className="text-gradient">
                            把灵魂放进情景
                        </span>
                        <br />
                        <span className="text-foreground/80 mt-2 block">更懂彼此</span>
                    </h2>

                    <p className="max-w-2xl mx-auto text-muted-foreground text-lg leading-relaxed">
                        创建一个情景室或加入朋友的房间，一起用叙事探索真实自我与关系合拍度。
                    </p>

                    <div className="flex justify-center gap-4">
                        <Link to="/room/history">
                            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-primary">
                                <History className="w-4 h-4" />
                                参与历史
                            </Button>
                        </Link>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="gap-2 text-muted-foreground hover:text-primary"
                            onClick={() => setShowMyScenarios(true)}
                        >
                            <FileText className="w-4 h-4" />
                            我的投稿
                        </Button>
                    </div>
                </section>

                {/* 功能卡片 */}
                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="relative group h-full"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative h-full">
                            <RoomCreate />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="relative group h-full"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative h-full">
                            <RoomJoin />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="relative group h-full"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-rose-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative h-full">
                            <ScenarioSubmit />
                        </div>
                    </motion.div>
                </div>

                {/* 功能说明 */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="max-w-5xl mx-auto"
                >
                    <div className="grid md:grid-cols-3 gap-8 text-center py-16 border-t border-white/10">
                        <div className="space-y-4 p-6 rounded-2xl bg-card/30 backdrop-blur-sm border border-transparent hover:border-white/10 transition-colors">
                            <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto shadow-inner">
                                <Users className="w-7 h-7 text-violet-500" />
                            </div>
                            <h3 className="font-bold text-lg">多人协作</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">邀请好友加入，最多支持8人同时参与情景体验</p>
                        </div>
                        <div className="space-y-4 p-6 rounded-2xl bg-card/30 backdrop-blur-sm border border-transparent hover:border-white/10 transition-colors">
                            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto shadow-inner">
                                <Sparkles className="w-7 h-7 text-blue-500" />
                            </div>
                            <h3 className="font-bold text-lg">AI分析</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">智能分析每个人的回答，生成深度性格画像与匹配报告</p>
                        </div>
                        <div className="space-y-4 p-6 rounded-2xl bg-card/30 backdrop-blur-sm border border-transparent hover:border-white/10 transition-colors">
                            <div className="w-14 h-14 rounded-2xl bg-pink-500/10 flex items-center justify-center mx-auto shadow-inner">
                                <PenTool className="w-7 h-7 text-pink-500" />
                            </div>
                            <h3 className="font-bold text-lg">投稿情景</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">创作你的专属情景，与全平台用户分享探索体验</p>
                        </div>
                    </div>
                </motion.section>
            </motion.div>

            {/* 我的投稿弹窗 */}
            {showMyScenarios && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                    <div className="bg-card w-full max-w-4xl border border-border rounded-2xl shadow-xl max-h-[80vh] flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <FileText className="w-5 h-5 text-primary" />
                                我的投稿
                            </h2>
                            <Button variant="ghost" size="icon" onClick={() => setShowMyScenarios(false)}>
                                <span className="sr-only">关闭</span>
                                ×
                            </Button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <ScenarioSubmit isModalMode />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
