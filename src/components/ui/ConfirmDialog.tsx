import { AlertTriangle, Info, X } from 'lucide-react'
import { Button } from './Button'
import { cn } from '../../utils'

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
}

export const ConfirmDialog = ({
    isOpen,
    title,
    description,
    variant = 'primary',
    confirmText = '确认',
    cancelText = '取消',
    isLoading = false,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) => {
    if (!isOpen) return null

    const Icon = variant === 'danger' ? AlertTriangle : Info

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onCancel}
        >
            <div
                className="bg-card w-full max-w-md border border-border rounded-2xl shadow-xl p-6 animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start gap-4">
                    <div
                        className={cn(
                            'p-2.5 rounded-full shrink-0',
                            variant === 'danger'
                                ? 'bg-destructive/10 text-destructive'
                                : 'bg-primary/10 text-primary'
                        )}
                    >
                        <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold">{title}</h2>
                        {description && (
                            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                                {description}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-1.5 hover:bg-muted rounded-md transition-colors shrink-0 -mt-1 -mr-1"
                    >
                        <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-6">
                    <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
                        {cancelText}
                    </Button>
                    <Button
                        variant={variant === 'danger' ? 'danger' : 'primary'}
                        onClick={onConfirm}
                        isLoading={isLoading}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </div>
    )
}
