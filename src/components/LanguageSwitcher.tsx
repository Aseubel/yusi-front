import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { Button } from './ui/Button';
import { useState, useRef, useEffect } from 'react';
import { cn } from '../utils';
import { changeLanguage } from '../i18n';

export const LanguageSwitcher = () => {
    const { t, i18n } = useTranslation();
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

    const handleLanguageChange = (lng: 'zh' | 'en') => {
        changeLanguage(lng);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={panelRef}>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
                className="h-11 w-11 rounded-full sm:h-9 sm:w-9"
                title={t('theme.switchLanguage')}
                aria-label={t('theme.switchLanguage')}
            >
                <Globe className="w-4 h-4" />
            </Button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-32 bg-popover/95 backdrop-blur-xl border border-border/50 shadow-xl rounded-lg p-1 z-50 animate-in fade-in slide-in-from-top-2 zoom-in-95">
                    <button
                        type="button"
                        onClick={() => handleLanguageChange('zh')}
                        aria-pressed={i18n.language === 'zh'}
                        className={cn(
                            "min-h-11 w-full rounded-md px-3 py-2 text-left text-sm font-medium transition-all sm:min-h-9",
                            i18n.language === 'zh'
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        )}
                    >
                        {t('languages.zh')}
                    </button>
                    <button
                        type="button"
                        onClick={() => handleLanguageChange('en')}
                        aria-pressed={i18n.language === 'en'}
                        className={cn(
                            "min-h-11 w-full rounded-md px-3 py-2 text-left text-sm font-medium transition-all sm:min-h-9",
                            i18n.language === 'en'
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        )}
                    >
                        {t('languages.en')}
                    </button>
                </div>
            )}
        </div>
    );
};
