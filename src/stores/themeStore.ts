import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 主题类型定义
export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeAccent = 'violet' | 'ocean' | 'rose' | 'amber' | 'emerald' | 'crimson';

export interface ThemeConfig {
    mode: ThemeMode;
    accent: ThemeAccent;
    enableAnimations: boolean;
    enableGlassmorphism: boolean;
}

// 主题色配置
export const accentThemes: Record<ThemeAccent, {
    name: string;
    primary: string;
    primaryLight: string;
    gradient: string;
    gradientSubtle: string;
}> = {
    violet: {
        name: '星空紫',
        primary: '262 83% 58%',
        primaryLight: '262 83% 68%',
        gradient: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #d946ef 100%)',
        gradientSubtle: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)',
    },
    ocean: {
        name: '深海蓝',
        primary: '200 98% 39%',
        primaryLight: '200 98% 49%',
        gradient: 'linear-gradient(135deg, #0077b6 0%, #00b4d8 50%, #90e0ef 100%)',
        gradientSubtle: 'linear-gradient(135deg, rgba(0, 119, 182, 0.1) 0%, rgba(0, 180, 216, 0.05) 100%)',
    },
    rose: {
        name: '玫瑰粉',
        primary: '340 82% 52%',
        primaryLight: '340 82% 62%',
        gradient: 'linear-gradient(135deg, #ec4899 0%, #f472b6 50%, #f9a8d4 100%)',
        gradientSubtle: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(244, 114, 182, 0.05) 100%)',
    },
    amber: {
        name: '琥珀金',
        primary: '38 92% 50%',
        primaryLight: '38 92% 60%',
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #fcd34d 100%)',
        gradientSubtle: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(251, 191, 36, 0.05) 100%)',
    },
    emerald: {
        name: '翡翠绿',
        primary: '160 84% 39%',
        primaryLight: '160 84% 49%',
        gradient: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)',
        gradientSubtle: 'linear-gradient(135deg, rgba(5, 150, 105, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
    },
    crimson: {
        name: '绯红',
        primary: '0 84% 60%',
        primaryLight: '0 84% 70%',
        gradient: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%)',
        gradientSubtle: 'linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
    },
};

interface ThemeStore extends ThemeConfig {
    setMode: (mode: ThemeMode) => void;
    setAccent: (accent: ThemeAccent) => void;
    toggleAnimations: () => void;
    toggleGlassmorphism: () => void;
    getEffectiveMode: () => 'light' | 'dark';
}

// 检测系统主题
const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
};

export const useThemeStore = create<ThemeStore>()(
    persist(
        (set, get) => ({
            mode: 'system',
            accent: 'violet',
            enableAnimations: true,
            enableGlassmorphism: true,

            setMode: (mode) => {
                set({ mode });
                applyTheme(get());
            },

            setAccent: (accent) => {
                set({ accent });
                applyTheme(get());
            },

            toggleAnimations: () => {
                set((state) => ({ enableAnimations: !state.enableAnimations }));
                applyTheme(get());
            },

            toggleGlassmorphism: () => {
                set((state) => ({ enableGlassmorphism: !state.enableGlassmorphism }));
                applyTheme(get());
            },

            getEffectiveMode: () => {
                const { mode } = get();
                return mode === 'system' ? getSystemTheme() : mode;
            },
        }),
        {
            name: 'yusi-theme',
        }
    )
);

// 应用主题到 DOM
export const applyTheme = (config: ThemeConfig) => {
    const root = document.documentElement;
    const effectiveMode = config.mode === 'system' ? getSystemTheme() : config.mode;

    // 设置暗色/亮色模式
    if (effectiveMode === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }

    // 设置主题强调色
    const accent = accentThemes[config.accent];
    root.style.setProperty('--theme-primary', accent.primary);
    root.style.setProperty('--theme-primary-light', accent.primaryLight);
    root.style.setProperty('--theme-gradient', accent.gradient);
    root.style.setProperty('--theme-gradient-subtle', accent.gradientSubtle);

    // 设置动画开关
    if (!config.enableAnimations) {
        root.classList.add('reduce-motion');
    } else {
        root.classList.remove('reduce-motion');
    }

    // 设置玻璃态开关
    if (!config.enableGlassmorphism) {
        root.classList.add('no-glass');
    } else {
        root.classList.remove('no-glass');
    }
};

// 初始化主题
export const initializeTheme = () => {
    const stored = localStorage.getItem('yusi-theme');
    if (stored) {
        try {
            const config = JSON.parse(stored).state as ThemeConfig;
            applyTheme(config);
        } catch {
            applyTheme({
                mode: 'system',
                accent: 'violet',
                enableAnimations: true,
                enableGlassmorphism: true,
            });
        }
    }

    // 监听系统主题变化
    if (typeof window !== 'undefined' && window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            const { mode } = useThemeStore.getState();
            if (mode === 'system') {
                applyTheme(useThemeStore.getState());
            }
        });
    }
};
