import { Layout } from '../components/Layout'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui'
import { Sparkles, Heart, MessageCircle, Users, ArrowRight, Star, Zap, Shield, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getPlatformStats, type PlatformStats } from '../lib/stats'

// 动态数字动画组件
const AnimatedCounter = ({ value, suffix = '' }: { value: number; suffix?: string }) => {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (v) => Math.floor(v))
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const controls = animate(count, value, { duration: 2, ease: 'easeOut' })
    const unsubscribe = rounded.on('change', (v) => setDisplayValue(v))
    return () => {
      controls.stop()
      unsubscribe()
    }
  }, [value, count, rounded])

  return <span>{displayValue.toLocaleString()}{suffix}</span>
}

// 漂浮粒子背景
const FloatingParticles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            background: `radial-gradient(circle, hsl(var(--theme-primary) / ${i % 3 === 0 ? '0.6' : '0.4'}), transparent)`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  )
}

// 功能卡片组件
const FeatureCard = ({
  icon: Icon,
  title,
  description,
  gradient,
  delay
}: {
  icon: typeof Sparkles;
  title: string;
  description: string;
  gradient: string;
  delay: number
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group relative"
    >
      <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl blur-xl -z-10" style={{ background: gradient }} />
      <div className="relative p-8 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300 group-hover:border-primary/30 group-hover:shadow-2xl">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110"
          style={{ background: gradient }}
        >
          <Icon className="w-7 h-7 text-white" />
        </div>
        <h3 className="text-xl font-bold mb-3">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </motion.div>
  )
}

// 光标轨迹效果
const GlowCursor = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <motion.div
      className="fixed w-96 h-96 rounded-full pointer-events-none -z-10 hidden md:block"
      style={{
        background: 'radial-gradient(circle, hsl(var(--theme-primary) / 0.15), transparent 60%)',
        left: position.x - 192,
        top: position.y - 192,
      }}
      animate={{
        left: position.x - 192,
        top: position.y - 192,
      }}
      transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
    />
  )
}

// 统计卡片组件
const StatCard = ({ value, suffix, label, icon: Icon }: {
  value: number;
  suffix: string;
  label: string;
  icon: typeof Users;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="relative group"
  >
    <div className="absolute inset-0 gradient-bg-subtle rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="relative p-6 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl gradient-bg-subtle mb-4">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <div className="text-3xl sm:text-4xl md:text-5xl font-bold gradient-text mb-2">
        <AnimatedCounter value={value} suffix={suffix} />
      </div>
      <div className="text-muted-foreground font-medium">{label}</div>
    </div>
  </motion.div>
)

export const Home = () => {
  // 从后端获取真实统计数据
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    getPlatformStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setStatsLoading(false))
  }, [])

  const features = [
    {
      icon: Users,
      title: '情景室',
      description: '创建私密房间，与朋友们共同体验精心设计的情景，通过叙事表达真实自我。',
      gradient: 'var(--theme-gradient)',
    },
    {
      icon: Heart,
      title: 'AI知己',
      description: '与专属AI进行深度对话，记录心路历程，它会倾听、理解，并给予温暖回应。',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    },
    {
      icon: Sparkles,
      title: '灵魂广场',
      description: '匿名分享内心故事，与共鸣的灵魂产生连接，发现那些懂你的陌生人。',
      gradient: 'linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)',
    },
    {
      icon: Zap,
      title: '灵魂匹配',
      description: 'AI深度分析你的性格特质，推荐与你灵魂契合的伙伴，开启深度连接。',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    },
  ]

  // 统计数据配置
  const statsConfig = [
    { key: 'userCount' as const, suffix: '+', label: '探索者', icon: Users },
    { key: 'diaryCount' as const, suffix: '+', label: '深度对话', icon: MessageCircle },
    { key: 'resonanceCount' as const, suffix: '+', label: '心灵共鸣', icon: Heart },
  ]

  return (
    <Layout>
      <GlowCursor />

      <div className="relative">
        {/* Hero Section */}
        <section className="relative min-h-[85vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden">
          <FloatingParticles />

          {/* 装饰性背景 */}
          <div className="absolute inset-0 -z-20">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-violet-500/5 via-fuchsia-500/5 to-cyan-500/5 rounded-full blur-3xl" />
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative z-10 max-w-5xl mx-auto"
          >
            {/* 标语徽章 */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary mb-8"
            >
              <Sparkles className="w-4 h-4" />
              <span>探索真实自我的旅程</span>
            </motion.div>

            {/* 主标题 */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6"
            >
              <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400 bg-clip-text text-transparent dark:from-violet-400 dark:via-fuchsia-300 dark:to-cyan-300">
                把灵魂放进情景
              </span>
              <br />
              <span className="text-foreground/90">更懂彼此</span>
            </motion.h1>

            {/* 副标题 */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed"
            >
              通过情景探索、AI对话与灵魂匹配，
              <br className="hidden sm:block" />
              开启一段发现自我与连接他人的奇妙旅程
            </motion.p>

            {/* CTA 按钮 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link to="/room">
                <Button size="lg" className="group px-8 py-6 text-lg rounded-full btn-gradient glow">
                  开始探索
                  <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/plaza">
                <Button variant="outline" size="lg" className="px-8 py-6 text-lg rounded-full border-2 hover:bg-primary/5 transition-all duration-300">
                  探访广场
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* 向下滚动提示 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center pt-2"
            >
              <motion.div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full" />
            </motion.div>
          </motion.div>
        </section>

        {/* 统计数据区 */}
        <section className="py-16 border-y border-border/50 bg-muted/20">
          <div className="max-w-6xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-sm font-medium text-primary mb-4">
                <TrendingUp className="w-4 h-4" />
                实时数据
              </span>
              <h3 className="text-2xl font-bold">与数千探索者一起发现真实自我</h3>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {statsLoading ? (
                // 加载骨架屏
                [...Array(3)].map((_, i) => (
                  <div key={i} className="p-6 text-center animate-pulse">
                    <div className="w-12 h-12 rounded-xl bg-muted mx-auto mb-4" />
                    <div className="h-12 bg-muted rounded-lg mb-2 w-3/4 mx-auto" />
                    <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
                  </div>
                ))
              ) : stats ? (
                statsConfig.map((config, i) => (
                  <motion.div
                    key={config.key}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                  >
                    <StatCard
                      value={stats[config.key] || 0}
                      suffix={config.suffix}
                      label={config.label}
                      icon={config.icon}
                    />
                  </motion.div>
                ))
              ) : null}
            </div>
          </div>
        </section>

        {/* 功能特性区 */}
        <section className="py-24 md:py-32 relative">
          <div className="max-w-6xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
                探索内心的
                <span className="bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent"> 多种方式</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                无论是与好友的情景对话，还是与AI的深度交流，每一次互动都是更懂自己的契机
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {features.map((feature, i) => (
                <FeatureCard
                  key={feature.title}
                  {...feature}
                  delay={i * 0.1}
                />
              ))}
            </div>
          </div>
        </section>

        {/* 行动召唤区 */}
        <section className="py-24 md:py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto px-4 text-center relative z-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full gradient-bg-subtle border border-primary/30 text-sm font-medium mb-8">
              <Star className="w-4 h-4 text-yellow-500" />
              <span>开始你的灵魂探索之旅</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
              准备好深入了解自己了吗？
            </h2>

            <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
              加入数千名探索者，开始一段发现真实自我、连接灵魂伙伴的奇妙旅程
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button size="lg" className="group px-8 py-6 text-lg rounded-full btn-gradient glow">
                  立即注册
                  <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/room">
                <Button variant="ghost" size="lg" className="px-8 py-6 text-lg rounded-full hover:bg-primary/10 transition-all duration-300">
                  先体验一下
                </Button>
              </Link>
            </div>

            {/* 信任标识 */}
            <div className="mt-12 flex items-center justify-center gap-8 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <span className="text-sm">隐私保护</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm">匿名交流</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                <span className="text-sm">真诚连接</span>
              </div>
            </div>
          </motion.div>
        </section>
      </div>
    </Layout>
  )
}
