import { useState } from "react";
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Button } from "./Button";
import { Input } from "./Input";
import { Textarea } from "./Textarea";
import { X, MessageSquare } from "lucide-react";
import { useTranslation } from 'react-i18next';

interface InputDialogProps {
    isOpen: boolean;
    title: string;
    description?: string;
    placeholder?: string;
    defaultValue?: string;
    inputType?: "text" | "textarea";
    confirmText?: string;
    cancelText?: string;
    onConfirm: (value: string) => void;
    onCancel: () => void;
}

export const InputDialog = ({
    isOpen,
    title,
    description,
    placeholder = "",
    defaultValue = "",
    inputType = "text",
    confirmText,
    cancelText,
    onConfirm,
    onCancel,
}: InputDialogProps) => {
    const { t } = useTranslation();
    const [value, setValue] = useState(defaultValue);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(value);
    };

    return (
        <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onCancel()}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
                <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-2xl outline-none sm:w-[calc(100%-2rem)] sm:p-6 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95">
                    <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <MessageSquare className="h-5 w-5" aria-hidden="true" />
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
                            <Button variant="ghost" size="icon" aria-label={t('common.close')} className="-mr-2 -mt-2 shrink-0">
                                <X className="h-4 w-4" aria-hidden="true" />
                            </Button>
                        </DialogPrimitive.Close>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-6">
                        <div className="mb-6">
                            {inputType === "textarea" ? (
                                <Textarea
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    placeholder={placeholder}
                                    className="min-h-[100px]"
                                    autoFocus
                                />
                            ) : (
                                <Input
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    placeholder={placeholder}
                                    autoFocus
                                />
                            )}
                        </div>

                        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
                            <DialogPrimitive.Close asChild>
                                <Button type="button" variant="ghost" className="w-full sm:w-auto">
                                    {cancelText || t('common.cancel')}
                                </Button>
                            </DialogPrimitive.Close>
                            <Button type="submit" className="w-full sm:w-auto">
                                {confirmText || t('common.confirm')}
                            </Button>
                        </div>
                    </form>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
};
