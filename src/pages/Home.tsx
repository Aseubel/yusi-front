import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui'
import { Sparkles, Heart, Users, ArrowRight, Zap, Album } from 'lucide-react'
import { useEffect, useMemo, useState, useId } from 'react'
import { getPlatformStats, type PlatformStats } from '../lib/stats'
import { useTranslation } from 'react-i18next'

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

const FloatingParticles = () => {
  const seed = useId()
  const particles = useMemo(() => {
    let value = 0
    for (let i = 0; i < seed.length; i++) {
      value = (value * 31 + seed.charCodeAt(i)) >>> 0
    }
    const next = () => {
      value = (value * 1664525 + 1013904223) >>> 0
      return value / 4294967296
    }
    return [...Array(20)].map((_, index) => ({
      id: index,
      left: next() * 100,
      top: next() * 100,
      xOffset: next() * 20 - 10,
      duration: 3 + next() * 2,
      delay: next() * 2,
      intensity: index % 3 === 0 ? 0.6 : 0.4,
    }))
  }, [seed])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full"
          style={{
            background: `radial-gradient(circle, hsl(var(--primary) / ${particle.intensity}), transparent)`,
            left: `${particle.left}%`,
            top: `${particle.top}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, particle.xOffset, 0],
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
          }}
        />
      ))}
    </div>
  )
}

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
      className="group relative h-full"
    >
      <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl blur-xl -z-10" style={{ background: gradient }} />
      <div className="relative p-8 h-full rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300 group-hover:border-primary/30 group-hover:shadow-2xl flex flex-col">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110 shadow-lg"
          style={{ background: gradient }}
        >
          <Icon className="w-7 h-7 text-white" />
        </div>
        <h3 className="text-xl font-bold mb-3">{title}</h3>
        <p className="text-muted-foreground leading-relaxed flex-grow">{description}</p>
      </div>
    </motion.div>
  )
}

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
        background: 'radial-gradient(circle, hsl(var(--primary) / 0.15), transparent 60%)',
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
    <div className="absolute inset-0 bg-primary/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="relative p-6 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4 text-primary">
        <Icon className="w-6 h-6" />
      </div>
      <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-gradient mb-2">
        <AnimatedCounter value={value} suffix={suffix} />
      </div>
      <div className="text-muted-foreground font-medium">{label}</div>
    </div>
  </motion.div>
)

export const Home = () => {
  const { t } = useTranslation()
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
      title: t('home.features.situation.title'),
      description: t('home.features.situation.desc'),
      gradient: 'var(--theme-gradient)',
    },
    {
      icon: Heart,
      title: t('home.features.memory.title'),
      description: t('home.features.memory.desc'),
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    },
    {
      icon: Sparkles,
      title: t('home.features.understand.title'),
      description: t('home.features.understand.desc'),
      gradient: 'linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)',
    },
    {
      icon: Zap,
      title: t('home.features.resonance.title'),
      description: t('home.features.resonance.desc'),
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    },
  ]

  const statsConfig = [
    { key: 'userCount' as const, suffix: '+', label: t('home.stats.explorers'), icon: Users },
    { key: 'diaryCount' as const, suffix: '+', label: t('home.stats.moments'), icon: Album },
    { key: 'resonanceCount' as const, suffix: '+', label: t('home.stats.understandings'), icon: Heart },
  ]

  return (
    <>
      <GlowCursor />

      <div className="relative">
        <section className="relative min-h-[85vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden">
          <FloatingParticles />

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
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary mb-8"
            >
              <Sparkles className="w-4 h-4" />
              <span>{t('home.badge')}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6"
            >
              <span className="text-gradient">
                {t('home.slogan')}
              </span>
              <br />
              <span className="text-foreground/90">{t('home.subtitle')}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed"
            >
              {t('home.description')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link to="/room">
                <Button size="lg" className="group px-8 py-6 text-lg rounded-full btn-gradient glow">
                  {t('home.startExplore')}
                  <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/plaza">
                <Button variant="outline" size="lg" className="px-8 py-6 text-lg rounded-full border-2 hover:bg-primary/5 transition-all duration-300">
                  {t('home.visitPlaza')}
                </Button>
              </Link>
            </motion.div>
          </motion.div>

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

        <section className="py-20 bg-muted/30 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <FeatureCard
                  key={feature.title}
                  {...feature}
                  delay={index * 0.1}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 border-y border-border/50 bg-background/50 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <h2 className="text-3xl font-bold mb-4">{t('home.stats.title')}</h2>
              <p className="text-muted-foreground">{t('home.stats.subtitle')}</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {statsConfig.map((item) => (
                <StatCard
                  key={item.key}
                  label={item.label}
                  value={stats ? stats[item.key] : 0}
                  suffix={item.suffix}
                  icon={item.icon}
                />
              ))}
            </div>
            {statsLoading && <p className="text-center text-sm text-muted-foreground mt-4">Loading...</p>}
          </div>
        </section>
      </div>
    </>
  )
}
