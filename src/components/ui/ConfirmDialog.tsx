import { AlertTriangle, Info, X } from 'lucide-react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Button } from './Button'
import { cn } from '../../utils'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

export interface ConfirmDialogProps {
    isOpen: boolean
    title: string
    description?: string
    variant?: 'primary' | 'danger'
    confirmText?: string
    cancelText?: string
    isLoading?: boolean
    onConfirm: () => void
    onCancel: () => void
    children?: ReactNode
}

export const ConfirmDialog = ({
    isOpen,
    title,
    description,
    variant = 'primary',
    confirmText,
    cancelText,
    isLoading = false,
    onConfirm,
    onCancel,
    children,
}: ConfirmDialogProps) => {
    const { t } = useTranslation()
    const Icon = variant === 'danger' ? AlertTriangle : Info

    return (
        <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onCancel()}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
                <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-2xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95">
                    <div className="flex items-start gap-4">
                        <div
                            className={cn(
                                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                                variant === 'danger'
                                    ? 'bg-destructive/10 text-destructive'
                                    : 'bg-primary/10 text-primary'
                            )}
                        >
                            <Icon className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <DialogPrimitive.Title className="text-lg font-semibold">{title}</DialogPrimitive.Title>
                            {description && (
                                <DialogPrimitive.Description className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                                    {description}
                                </DialogPrimitive.Description>
                            )}
                        </div>
                        <DialogPrimitive.Close asChild>
                            <Button variant="ghost" size="icon" aria-label={t('common.close')} disabled={isLoading} className="-mr-2 -mt-2 shrink-0">
                                <X className="h-4 w-4" aria-hidden="true" />
                            </Button>
                        </DialogPrimitive.Close>
                    </div>

                    {children && <div className="mt-4">{children}</div>}

                    <div className="mt-6 flex justify-end gap-3">
                        <DialogPrimitive.Close asChild>
                            <Button variant="ghost" disabled={isLoading}>
                                {cancelText || t('common.cancel')}
                            </Button>
                        </DialogPrimitive.Close>
                        <Button
                            variant={variant === 'danger' ? 'danger' : 'primary'}
                            onClick={onConfirm}
                            isLoading={isLoading}
                        >
                            {isLoading ? t('common.processing') : (confirmText || t('common.confirm'))}
                        </Button>
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    )
}
