import { useThemeStore, THEME_COLORS, type ThemeColor } from '../stores/themeStore';
import { Moon, Sun, Palette, Check, Globe } from 'lucide-react';
import { Button } from './ui/Button';
import { useState, useRef, useEffect } from 'react';
import { cn } from '../utils';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../i18n';

const COLOR_OPTIONS: ThemeColor[] = ['purple', 'blue', 'green', 'orange', 'pink', 'teal'];

export const ThemeSwitcher = () => {
    const { mode, color, setColor } = useThemeStore();
    const [isOpen, setIsOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const { t, i18n } = useTranslation();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLanguageChange = (lng: 'zh' | 'en') => {
        changeLanguage(lng);
    };

    return (
        <div className="relative" ref={panelRef}>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
                className="rounded-full w-9 h-9"
                title={t('theme.title')}
                aria-label={t('theme.title')}
            >
                <Palette className="w-4 h-4" />
            </Button>

            {isOpen && (
                <div className="absolute left-1/2 top-full mt-2 w-72 bg-popover/95 backdrop-blur-xl border border-border/50 shadow-xl rounded-xl p-4 z-50 animate-in fade-in slide-in-from-top-2 zoom-in-95 -translate-x-1/2">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">{t('theme.mode')}</span>
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
                                    {t('theme.light')}
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
                                    {t('theme.dark')}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <span className="text-sm font-medium text-foreground">{t('theme.color')}</span>
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
                                            <span className="text-[10px] text-muted-foreground">{t(`themeColors.${c}`)}</span>
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

                        <div className="space-y-2 pt-2 border-t border-border/50">
                            <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-foreground">{t('theme.language')}</span>
                            </div>
                            <div className="flex items-center gap-1 bg-muted/50 rounded-full p-1">
                                <button
                                    onClick={() => handleLanguageChange('zh')}
                                    className={cn(
                                        "flex-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                                        i18n.language === 'zh'
                                            ? "bg-background text-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    中文
                                </button>
                                <button
                                    onClick={() => handleLanguageChange('en')}
                                    className={cn(
                                        "flex-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                                        i18n.language === 'en'
                                            ? "bg-background text-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    English
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
