import { motion } from 'framer-motion'
import { Shield, Lock, Eye, Database, UserCheck, Bell } from 'lucide-react'
import { Card } from '../components/ui'
import { useTranslation } from 'react-i18next'

const sections = [
    {
        icon: Database,
        titleKey: 'privacy.dataCollection.title',
        contentKeys: [
            'privacy.dataCollection.item1',
            'privacy.dataCollection.item2',
            'privacy.dataCollection.item3',
            'privacy.dataCollection.item4'
        ]
    },
    {
        icon: Eye,
        titleKey: 'privacy.dataUsage.title',
        contentKeys: [
            'privacy.dataUsage.item1',
            'privacy.dataUsage.item2',
            'privacy.dataUsage.item3',
            'privacy.dataUsage.item4',
            'privacy.dataUsage.item5'
        ]
    },
    {
        icon: Lock,
        titleKey: 'privacy.dataProtection.title',
        contentKeys: [
            'privacy.dataProtection.item1',
            'privacy.dataProtection.item2',
            'privacy.dataProtection.item3',
            'privacy.dataProtection.item4',
            'privacy.dataProtection.item5'
        ]
    },
    {
        icon: UserCheck,
        titleKey: 'privacy.userRights.title',
        contentKeys: [
            'privacy.userRights.item1',
            'privacy.userRights.item2',
            'privacy.userRights.item3',
            'privacy.userRights.item4',
            'privacy.userRights.item5'
        ]
    },
    {
        icon: Bell,
        titleKey: 'privacy.cookies.title',
        contentKeys: [
            'privacy.cookies.item1',
            'privacy.cookies.item2',
            'privacy.cookies.item3',
            'privacy.cookies.item4'
        ]
    },
    {
        icon: Shield,
        titleKey: 'privacy.security.title',
        contentKeys: [
            'privacy.security.item1',
            'privacy.security.item2',
            'privacy.security.item3',
            'privacy.security.item4'
        ]
    }
]

export const Privacy = () => {
    const { t } = useTranslation()

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
                    <h1 className="text-4xl font-bold mb-4">{t('privacy.title')}</h1>
                    <p className="text-muted-foreground">
                        {t('privacy.lastUpdated')}: {t('privacy.lastUpdatedDate')}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="mb-8"
                >
                    <Card className="p-6">
                        <h2 className="text-xl font-semibold mb-4">{t('privacy.introTitle')}</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            {t('privacy.introContent')}
                        </p>
                    </Card>
                </motion.div>

                <div className="space-y-6">
                    {sections.map((section, index) => (
                        <motion.div
                            key={section.titleKey}
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
                                        <h2 className="text-lg font-semibold mb-3">{t(section.titleKey)}</h2>
                                        <ul className="space-y-2">
                                            {section.contentKeys.map((itemKey, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                                                    {t(itemKey)}
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
                        <h2 className="text-xl font-semibold mb-4">{t('privacy.policyUpdate.title')}</h2>
                        <p className="text-muted-foreground leading-relaxed mb-4">
                            {t('privacy.policyUpdate.content1')}
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                            {t('privacy.policyUpdate.content2')}
                        </p>
                    </Card>
                </motion.div>
            </div>
        </div>
    )
}
