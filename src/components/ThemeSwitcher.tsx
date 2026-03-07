import { useThemeStore, THEME_COLORS, type ThemeColor } from '../stores/themeStore';
import { Moon, Sun, Palette, Check } from 'lucide-react';
import { Button } from './ui/Button';
import { useState, useRef, useEffect } from 'react';
import { cn } from '../utils';

const COLOR_OPTIONS: ThemeColor[] = ['purple', 'blue', 'green', 'orange', 'pink', 'teal'];

export const ThemeSwitcher = () => {
    const { mode, color, setColor } = useThemeStore();
    const [isOpen, setIsOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={panelRef}>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
                className="rounded-full w-9 h-9"
                title="主题设置"
                aria-label="主题设置"
            >
                <Palette className="w-4 h-4" />
            </Button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-popover/95 backdrop-blur-xl border border-border/50 shadow-xl rounded-xl p-4 z-50 animate-in fade-in slide-in-from-top-2 zoom-in-95">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">外观模式</span>
                            <div className="flex items-center gap-1 bg-muted/50 rounded-full p-1">
                                <button
                                    onClick={() => useThemeStore.getState().setMode('light')}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                                        mode === 'light'
                                            ? "bg-background text-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Sun className="w-3.5 h-3.5" />
                                    浅色
                                </button>
                                <button
                                    onClick={() => useThemeStore.getState().setMode('dark')}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                                        mode === 'dark'
                                            ? "bg-background text-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Moon className="w-3.5 h-3.5" />
                                    深色
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <span className="text-sm font-medium text-foreground">主题色</span>
                            <div className="grid grid-cols-3 gap-2">
                                {COLOR_OPTIONS.map((c) => {
                                    const config = THEME_COLORS[c];
                                    const isActive = color === c;
                                    return (
                                        <button
                                            key={c}
                                            onClick={() => setColor(c)}
                                            className={cn(
                                                "relative flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all",
                                                isActive
                                                    ? "bg-primary/10 ring-1 ring-primary/50"
                                                    : "hover:bg-muted/50"
                                            )}
                                        >
                                            <div
                                                className="w-6 h-6 rounded-full shadow-sm ring-2 ring-white/20"
                                                style={{ background: config.lightBg }}
                                            />
                                            <span className="text-[10px] text-muted-foreground">{config.name}</span>
                                            {isActive && (
                                                <div className="absolute top-1 right-1">
                                                    <Check className="w-3 h-3 text-primary" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
