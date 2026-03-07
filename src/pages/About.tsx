import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, Sparkles, Users, Shield, Lightbulb, Target, Mail, Github, Twitter, MessageSquare } from 'lucide-react'
import { Button, Card } from '../components/ui'
import { useTranslation } from 'react-i18next'

const features = [
    {
        icon: Sparkles,
        titleKey: 'about.features.scenario.title',
        descKey: 'about.features.scenario.description'
    },
    {
        icon: Users,
        titleKey: 'about.features.understanding.title',
        descKey: 'about.features.understanding.description'
    },
    {
        icon: Heart,
        titleKey: 'about.features.memory.title',
        descKey: 'about.features.memory.description'
    },
    {
        icon: Shield,
        titleKey: 'about.features.privacy.title',
        descKey: 'about.features.privacy.description'
    }
]

const values = [
    {
        icon: Lightbulb,
        titleKey: 'about.values.understanding.title',
        descKey: 'about.values.understanding.description'
    },
    {
        icon: Heart,
        titleKey: 'about.values.memory.title',
        descKey: 'about.values.memory.description'
    },
    {
        icon: Target,
        titleKey: 'about.values.connection.title',
        descKey: 'about.values.connection.description'
    }
]

export const About = () => {
    const { t } = useTranslation()
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
                        {t('about.title')}
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        {t('about.subtitle')}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="mb-16"
                >
                    <Card className="p-8">
                        <h2 className="text-2xl font-semibold mb-4">{t('about.thinking')}</h2>
                        <div className="space-y-4 text-muted-foreground leading-relaxed">
                            <p>
                                {t('about.thinkingP1')}
                            </p>
                            <p>
                                {t('about.thinkingP2')}
                            </p>
                            <p>
                                {t('about.thinkingP3')}
                            </p>
                            <p>
                                {t('about.thinkingP4')}
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
                    <h2 className="text-2xl font-semibold mb-8 text-center">{t('about.featuresTitle')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.titleKey}
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
                                            <h3 className="font-semibold mb-2">{t(feature.titleKey)}</h3>
                                            <p className="text-sm text-muted-foreground">{t(feature.descKey)}</p>
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
                    <h2 className="text-2xl font-semibold mb-8 text-center">{t('about.valuesTitle')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {values.map((value, index) => (
                            <motion.div
                                key={value.titleKey}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                                className="text-center"
                            >
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                                    <value.icon className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="font-semibold mb-2">{t(value.titleKey)}</h3>
                                <p className="text-sm text-muted-foreground">{t(value.descKey)}</p>
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
                        <h2 className="text-2xl font-semibold mb-4">{t('about.contactTitle')}</h2>
                        <p className="text-muted-foreground mb-6">
                            {t('about.contactDesc')}
                        </p>
                        <div className="flex justify-center gap-4 mb-6">
                            <Link to="/contact">
                                <Button size="sm" className="gap-2">
                                    <MessageSquare className="w-4 h-4" />
                                    {t('about.submitSuggestion')}
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
                                <Button variant="outline" size="sm">{t('about.privacyPolicy')}</Button>
                            </Link>
                            <Link to="/terms">
                                <Button variant="outline" size="sm">{t('about.userAgreement')}</Button>
                            </Link>
                        </div>
                    </Card>
                </motion.div>
            </div>
        </div>
    )
}
