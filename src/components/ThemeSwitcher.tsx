import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Palette,
    Sun,
    Moon,
    Monitor,
    Sparkles,
    Check,
    ChevronDown
} from 'lucide-react';
import {
    useThemeStore,
    accentThemes,
    type ThemeMode,
    type ThemeAccent
} from '../stores/themeStore';

const modeOptions: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: '浅色', icon: Sun },
    { value: 'dark', label: '深色', icon: Moon },
    { value: 'system', label: '跟随系统', icon: Monitor },
];

export const ThemeSwitcher = () => {
    const [isOpen, setIsOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const { mode, accent, enableAnimations, enableGlassmorphism, setMode, setAccent, toggleAnimations, toggleGlassmorphism, getEffectiveMode } = useThemeStore();

    const effectiveMode = getEffectiveMode();
    const currentAccent = accentThemes[accent];

    // 点击外部关闭
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={panelRef}>
            {/* 触发按钮 */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border/50 bg-background/80 backdrop-blur-sm hover:bg-accent/50 transition-all duration-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                <div
                    className="w-5 h-5 rounded-full"
                    style={{ background: currentAccent.gradient }}
                />
                {effectiveMode === 'dark' ? (
                    <Moon className="w-4 h-4 text-muted-foreground" />
                ) : (
                    <Sun className="w-4 h-4 text-muted-foreground" />
                )}
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </motion.button>

            {/* 主题面板 */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 top-full mt-2 w-80 p-4 rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl z-50"
                    >
                        {/* 模式选择 */}
                        <div className="mb-4">
                            <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
                                <Monitor className="w-4 h-4" />
                                <span>显示模式</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {modeOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => setMode(option.value)}
                                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-200 ${mode === option.value
                                                ? 'border-primary bg-primary/10 text-foreground'
                                                : 'border-transparent bg-muted/50 text-muted-foreground hover:bg-muted'
                                            }`}
                                    >
                                        <option.icon className="w-5 h-5" />
                                        <span className="text-xs font-medium">{option.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 强调色选择 */}
                        <div className="mb-4">
                            <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
                                <Palette className="w-4 h-4" />
                                <span>主题色</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {(Object.keys(accentThemes) as ThemeAccent[]).map((key) => {
                                    const theme = accentThemes[key];
                                    const isActive = accent === key;
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => setAccent(key)}
                                            className={`relative flex items-center gap-2 p-3 rounded-xl border transition-all duration-200 ${isActive
                                                    ? 'border-primary shadow-lg'
                                                    : 'border-transparent bg-muted/50 hover:bg-muted'
                                                }`}
                                            style={isActive ? { boxShadow: `0 4px 20px -4px hsl(${theme.primary} / 0.3)` } : {}}
                                        >
                                            <div
                                                className="w-6 h-6 rounded-full flex-shrink-0"
                                                style={{ background: theme.gradient }}
                                            />
                                            <span className="text-xs font-medium truncate">{theme.name}</span>
                                            {isActive && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center"
                                                >
                                                    <Check className="w-2.5 h-2.5 text-primary-foreground" />
                                                </motion.div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 效果选项 */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 mb-2 text-sm font-medium text-muted-foreground">
                                <Sparkles className="w-4 h-4" />
                                <span>视觉效果</span>
                            </div>

                            <label className="flex items-center justify-between p-3 rounded-xl bg-muted/50 cursor-pointer hover:bg-muted transition-colors">
                                <span className="text-sm">动画效果</span>
                                <div
                                    onClick={toggleAnimations}
                                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${enableAnimations ? 'bg-primary' : 'bg-muted-foreground/30'
                                        }`}
                                >
                                    <motion.div
                                        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                                        animate={{ left: enableAnimations ? 24 : 4 }}
                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                    />
                                </div>
                            </label>

                            <label className="flex items-center justify-between p-3 rounded-xl bg-muted/50 cursor-pointer hover:bg-muted transition-colors">
                                <span className="text-sm">毛玻璃效果</span>
                                <div
                                    onClick={toggleGlassmorphism}
                                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${enableGlassmorphism ? 'bg-primary' : 'bg-muted-foreground/30'
                                        }`}
                                >
                                    <motion.div
                                        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                                        animate={{ left: enableGlassmorphism ? 24 : 4 }}
                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                    />
                                </div>
                            </label>
                        </div>

                        {/* 预览提示 */}
                        <div className="mt-4 p-3 rounded-xl text-xs text-center text-muted-foreground" style={{ background: currentAccent.gradientSubtle }}>
                            当前主题: <span className="font-medium" style={{ color: `hsl(${currentAccent.primary})` }}>{currentAccent.name}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
