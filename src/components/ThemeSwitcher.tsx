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
                className="h-11 w-11 rounded-full sm:h-9 sm:w-9"
                title={t('theme.title')}
                aria-label={t('theme.title')}
            >
                <Palette className="w-4 h-4" />
            </Button>

            {isOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 max-h-[calc(100dvh-5rem)] w-[min(18rem,calc(100vw-1.5rem))] overflow-y-auto rounded-xl border border-border/50 bg-popover/95 p-3 shadow-xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 zoom-in-95 sm:left-1/2 sm:right-auto sm:w-72 sm:-translate-x-1/2 sm:p-4">
                    <div className="space-y-4">
                        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <span className="text-sm font-medium text-foreground">{t('theme.mode')}</span>
                            <div className="flex w-full items-center gap-1 rounded-full bg-muted/50 p-1 sm:w-auto">
                                <button
                                    type="button"
                                    onClick={() => useThemeStore.getState().setMode('light')}
                                    aria-pressed={mode === 'light'}
                                    className={cn(
                                        "flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all sm:min-h-9 sm:flex-none",
                                        mode === 'light'
                                            ? "bg-background text-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Sun className="w-3.5 h-3.5" />
                                    {t('theme.light')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => useThemeStore.getState().setMode('dark')}
                                    aria-pressed={mode === 'dark'}
                                    className={cn(
                                        "flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all sm:min-h-9 sm:flex-none",
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
                                            type="button"
                                            key={c}
                                            onClick={() => setColor(c)}
                                            aria-pressed={isActive}
                                            className={cn(
                                                "relative flex min-h-11 flex-col items-center gap-1.5 rounded-lg p-2 transition-all",
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
                                    type="button"
                                    onClick={() => handleLanguageChange('zh')}
                                    className={cn(
                                        "min-h-11 flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all sm:min-h-9",
                                        i18n.language === 'zh'
                                            ? "bg-background text-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {t('languages.zh')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleLanguageChange('en')}
                                    className={cn(
                                        "min-h-11 flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all sm:min-h-9",
                                        i18n.language === 'en'
                                            ? "bg-background text-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {t('languages.en')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
