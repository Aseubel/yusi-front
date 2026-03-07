import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark';

export type ThemeColor = 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'teal';

export interface ThemeConfig {
    mode: ThemeMode;
    color: ThemeColor;
}

interface ThemeStore extends ThemeConfig {
    setMode: (mode: ThemeMode) => void;
    toggleMode: () => void;
    setColor: (color: ThemeColor) => void;
}

export const THEME_COLORS: Record<ThemeColor, { name: string; primary: string; lightBg: string }> = {
    purple: { name: '紫罗兰', primary: '262 60% 50%', lightBg: 'linear-gradient(135deg, #7c3aed, #a855f7)' },
    blue: { name: '海洋蓝', primary: '217 91% 60%', lightBg: 'linear-gradient(135deg, #3b82f6, #60a5fa)' },
    green: { name: '翡翠绿', primary: '160 84% 39%', lightBg: 'linear-gradient(135deg, #10b981, #34d399)' },
    orange: { name: '暖阳橙', primary: '25 95% 53%', lightBg: 'linear-gradient(135deg, #f97316, #fb923c)' },
    pink: { name: '樱花粉', primary: '330 81% 60%', lightBg: 'linear-gradient(135deg, #ec4899, #f472b6)' },
    teal: { name: '青碧', primary: '175 72% 42%', lightBg: 'linear-gradient(135deg, #14b8a6, #2dd4bf)' },
};

const getSystemPreference = (): ThemeMode => {
    if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
};

export const useThemeStore = create<ThemeStore>()(
    persist(
        (set, get) => ({
            mode: 'light',
            color: 'purple',

            setMode: (mode) => {
                set({ mode });
                applyTheme(mode, get().color);
            },

            toggleMode: () => {
                const { mode, color } = get();
                const newMode = mode === 'light' ? 'dark' : 'light';
                set({ mode: newMode });
                applyTheme(newMode, color);
            },

            setColor: (color) => {
                set({ color });
                applyTheme(get().mode, color);
            },
        }),
        {
            name: 'yusi-theme',
        }
    )
);

export const applyTheme = (mode: ThemeMode, color: ThemeColor) => {
    const root = document.documentElement;
    
    root.classList.remove('light', 'dark');
    root.classList.add(mode);
    
    root.classList.remove('theme-purple', 'theme-blue', 'theme-green', 'theme-orange', 'theme-pink', 'theme-teal');
    root.classList.add(`theme-${color}`);
    
    const colorConfig = THEME_COLORS[color];
    root.style.setProperty('--primary', colorConfig.primary);
};

export const initializeTheme = () => {
    const stored = localStorage.getItem('yusi-theme');
    let initialMode: ThemeMode = 'light';
    let initialColor: ThemeColor = 'purple';

    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            if (parsed.state) {
                if (parsed.state.mode === 'light' || parsed.state.mode === 'dark') {
                    initialMode = parsed.state.mode;
                }
                if (parsed.state.color && THEME_COLORS[parsed.state.color as ThemeColor]) {
                    initialColor = parsed.state.color;
                }
            }
        } catch {
            initialMode = getSystemPreference();
        }
    } else {
        initialMode = getSystemPreference();
    }

    applyTheme(initialMode, initialColor);
    
    const state = useThemeStore.getState();
    if (state.mode !== initialMode || state.color !== initialColor) {
        useThemeStore.setState({ mode: initialMode, color: initialColor });
    }
};
