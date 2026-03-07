import { motion } from 'framer-motion'
import { FileText, CheckCircle, XCircle, AlertTriangle, Scale } from 'lucide-react'
import { Card } from '../components/ui'
import { useTranslation } from 'react-i18next'

const sections = [
    {
        icon: CheckCircle,
        titleKey: 'terms.serviceTerms.title',
        contentKeys: [
            'terms.serviceTerms.item1',
            'terms.serviceTerms.item2',
            'terms.serviceTerms.item3',
            'terms.serviceTerms.item4',
            'terms.serviceTerms.item5'
        ]
    },
    {
        icon: FileText,
        titleKey: 'terms.userContent.title',
        contentKeys: [
            'terms.userContent.item1',
            'terms.userContent.item2',
            'terms.userContent.item3',
            'terms.userContent.item4',
            'terms.userContent.item5'
        ]
    },
    {
        icon: XCircle,
        titleKey: 'terms.prohibitedBehavior.title',
        contentKeys: [
            'terms.prohibitedBehavior.item1',
            'terms.prohibitedBehavior.item2',
            'terms.prohibitedBehavior.item3',
            'terms.prohibitedBehavior.item4',
            'terms.prohibitedBehavior.item5',
            'terms.prohibitedBehavior.item6'
        ]
    },
    {
        icon: AlertTriangle,
        titleKey: 'terms.disclaimer.title',
        contentKeys: [
            'terms.disclaimer.item1',
            'terms.disclaimer.item2',
            'terms.disclaimer.item3',
            'terms.disclaimer.item4',
            'terms.disclaimer.item5'
        ]
    },
    {
        icon: Scale,
        titleKey: 'terms.intellectualProperty.title',
        contentKeys: [
            'terms.intellectualProperty.item1',
            'terms.intellectualProperty.item2',
            'terms.intellectualProperty.item3',
            'terms.intellectualProperty.item4',
            'terms.intellectualProperty.item5'
        ]
    }
]

const terminationReasonsKeys = [
    'terms.termination.reason1',
    'terms.termination.reason2',
    'terms.termination.reason3',
    'terms.termination.reason4',
    'terms.termination.reason5'
]

export const Terms = () => {
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
                        <FileText className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-4xl font-bold mb-4">{t('terms.title')}</h1>
                    <p className="text-muted-foreground">
                        {t('terms.lastUpdated')}: {t('terms.lastUpdatedDate')}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="mb-8"
                >
                    <Card className="p-6">
                        <h2 className="text-xl font-semibold mb-4">{t('terms.agreementTitle')}</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            {t('terms.agreementContent')}
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
                    transition={{ duration: 0.5, delay: 0.7 }}
                    className="mt-8"
                >
                    <Card className="p-6">
                        <h2 className="text-xl font-semibold mb-4">{t('terms.termination.title')}</h2>
                        <p className="text-muted-foreground leading-relaxed mb-4">
                            {t('terms.termination.intro')}
                        </p>
                        <ul className="space-y-2">
                            {terminationReasonsKeys.map((reasonKey, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                    <XCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                                    {t(reasonKey)}
                                </li>
                            ))}
                        </ul>
                        <p className="text-muted-foreground leading-relaxed mt-4">
                            {t('terms.termination.footer')}
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
                        <h2 className="text-xl font-semibold mb-4">{t('terms.disputeResolution.title')}</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            {t('terms.disputeResolution.content')}
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
                        <h2 className="text-xl font-semibold mb-4">{t('terms.agreementModification.title')}</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            {t('terms.agreementModification.content')}
                        </p>
                    </Card>
                </motion.div>
            </div>
        </div>
    )
}
