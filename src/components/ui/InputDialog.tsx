import { useState } from "react";
import { Button } from "./Button";
import { Input } from "./Input";
import { Textarea } from "./Textarea";
import { X, MessageSquare } from "lucide-react";

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
    confirmText = "确认",
    cancelText = "取消",
    onConfirm,
    onCancel,
}: InputDialogProps) => {
    const [value, setValue] = useState(defaultValue);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(value);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onCancel}
        >
            <div
                className="bg-card w-full max-w-md border border-border rounded-2xl shadow-xl p-6 animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-full shrink-0 bg-primary/10 text-primary">
                        <MessageSquare className="w-5 h-5" />
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

                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={onCancel}>
                            {cancelText}
                        </Button>
                        <Button type="submit">
                            {confirmText}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
