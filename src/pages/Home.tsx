import { cn } from '../utils'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { 
  Sparkles, 
  BookHeart, 
  Users, 
  MapPin,
  ArrowRight,
  Shield,
  Zap,
  Heart
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'
import { useAuthStore } from '../store/authStore'

const features = [
  {
    icon: Sparkles,
    title: '情景探索',
    description: '在多人情景室中，与志同道合的灵魂一起探索人生话题',
    path: '/rooms',
    color: 'from-primary-500 to-primary-600',
    bgGlow: 'shadow-primary-500/20',
  },
  {
    icon: BookHeart,
    title: 'AI知己日记',
    description: '与AI知己对话，记录内心深处的思考与感悟',
    path: '/diary',
    color: 'from-emotion-love to-emotion-love/80',
    bgGlow: 'shadow-emotion-love/20',
  },
  {
    icon: Users,
    title: '灵魂广场',
    description: '匿名分享你的心声，发现与你共鸣的灵魂',
    path: '/plaza',
    color: 'from-emotion-hope to-emotion-hope/80',
    bgGlow: 'shadow-emotion-hope/20',
  },
  {
    icon: MapPin,
    title: '足迹地图',
    description: '将回忆与地点关联，构建属于你的心灵地图',
    path: '/map',
    color: 'from-emotion-calm to-emotion-calm/80',
    bgGlow: 'shadow-emotion-calm/20',
  },
]

const stats = [
  { label: '活跃用户', value: '10K+', icon: Users },
  { label: '情景探索', value: '500+', icon: Sparkles },
  { label: '日记记录', value: '100K+', icon: BookHeart },
]

const highlights = [
  { icon: Shield, title: '端到端加密', description: '您的隐私安全是我们的首要任务' },
  { icon: Zap, title: 'AI驱动', description: '智能匹配，发现真正的灵魂伴侣' },
  { icon: Heart, title: '情感共鸣', description: '在理解与被理解中找到归属感' },
]

export function Home() {
  const { user } = useAuthStore()

  return (
    <div className="space-y-12 lg:space-y-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-background to-background" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-emotion-love/5 rounded-full blur-3xl" />
        
        <div className="relative px-6 py-16 lg:py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 mb-6">
              <Sparkles className="w-4 h-4 text-primary-400" />
              <span className="text-sm text-primary-400">欢迎来到 Yusi</span>
            </div>
            
            <h1 className="font-serif text-4xl lg:text-6xl font-bold text-text-primary mb-6 leading-tight">
              发现你的
              <span className="text-gradient"> 灵魂叙事</span>
            </h1>
            
            <p className="text-lg lg:text-xl text-text-secondary max-w-2xl mx-auto mb-8 leading-relaxed">
              在Yusi，我们相信每个人都有一段独特的故事等待被倾听。
              通过情景探索、AI知己日记和灵魂匹配，找到真正理解你的人。
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/rooms">
                <Button size="lg" leftIcon={<Sparkles className="w-5 h-5" />}>
                  开始探索
                </Button>
              </Link>
              <Link to="/plaza">
                <Button variant="secondary" size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                  浏览广场
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto"
          >
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-surface border border-border mb-3">
                    <Icon className="w-5 h-5 text-primary-400" />
                  </div>
                  <div className="text-2xl font-bold text-text-primary">{stat.value}</div>
                  <div className="text-sm text-text-muted">{stat.label}</div>
                </div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-serif text-3xl font-bold text-text-primary mb-4">
            探索你的内心世界
          </h2>
          <p className="text-text-secondary max-w-xl mx-auto">
            Yusi提供多种方式帮助你探索自我、记录感悟、连接他人
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.path}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link to={feature.path}>
                  <Card 
                    className="group h-full hover:border-primary-500/30 transition-all duration-normal"
                    hover
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          'flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center',
                          'bg-gradient-to-br shadow-lg',
                          feature.color,
                          feature.bgGlow
                        )}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-serif text-xl font-semibold text-text-primary group-hover:text-primary-400 transition-colors">
                              {feature.title}
                            </h3>
                            <ArrowRight className="w-4 h-4 text-text-muted opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                          </div>
                          <p className="text-text-secondary text-sm leading-relaxed">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* Highlights Section */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-500/5 to-transparent rounded-3xl" />
        
        <div className="relative py-16 px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-serif text-3xl font-bold text-text-primary mb-4">
              为什么选择 Yusi
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              我们致力于创造一个安全、温暖、真实的社交空间
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {highlights.map((highlight, index) => {
              const Icon = highlight.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="text-center h-full" variant="glass" hover>
                    <CardContent className="p-6">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-500/10 mb-4">
                        <Icon className="w-8 h-8 text-primary-400" />
                      </div>
                      <h3 className="font-serif text-lg font-semibold text-text-primary mb-2">
                        {highlight.title}
                      </h3>
                      <p className="text-text-secondary text-sm">
                        {highlight.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-500" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        
        <div className="relative px-6 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-white mb-4">
              准备好开始你的旅程了吗？
            </h2>
            <p className="text-primary-100 max-w-xl mx-auto mb-8">
              加入 Yusi 社区，与 thousands of 灵魂探索者一起，发现更真实的自己
            </p>
            <Link to={user ? '/rooms' : '/register'}>
              <Button 
                variant="secondary" 
                size="lg"
                className="bg-white text-primary-600 hover:bg-primary-50"
                leftIcon={<Sparkles className="w-5 h-5" />}
              >
                {user ? '开始探索' : '立即加入'}
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default Home
