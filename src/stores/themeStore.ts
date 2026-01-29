import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Theme type definition - strictly Light or Dark
export type ThemeMode = 'light' | 'dark';

export interface ThemeConfig {
    mode: ThemeMode;
}

interface ThemeStore extends ThemeConfig {
    setMode: (mode: ThemeMode) => void;
    toggleMode: () => void;
}

// Helper to get system preference
const getSystemPreference = (): ThemeMode => {
    if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
};

export const useThemeStore = create<ThemeStore>()(
    persist(
        (set, get) => ({
            mode: 'light', // Default will be overridden by persist or initialization logic

            setMode: (mode) => {
                set({ mode });
                applyTheme(mode);
            },

            toggleMode: () => {
                const { mode } = get();
                const newMode = mode === 'light' ? 'dark' : 'light';
                set({ mode: newMode });
                applyTheme(newMode);
            },
        }),
        {
            name: 'yusi-theme',
        }
    )
);

// Apply theme to DOM
export const applyTheme = (mode: ThemeMode) => {
    const root = document.documentElement;
    
    if (mode === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
    } else {
        root.classList.remove('dark');
        root.classList.add('light');
    }
};

// Initialize theme
export const initializeTheme = () => {
    // Check local storage manually if needed, but zustand persist handles state.
    // However, we need to apply the class to HTML tag on load.
    
    // We can peek at localStorage to see if it's empty, if so, use system preference.
    const stored = localStorage.getItem('yusi-theme');
    let initialMode: ThemeMode = 'light';

    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            if (parsed.state && (parsed.state.mode === 'light' || parsed.state.mode === 'dark')) {
                initialMode = parsed.state.mode;
            } else {
                initialMode = getSystemPreference();
            }
        } catch {
            initialMode = getSystemPreference();
        }
    } else {
        initialMode = getSystemPreference();
        // We might want to save this preference immediately or just let it be strictly in state
        useThemeStore.getState().setMode(initialMode);
    }

    applyTheme(initialMode);
};
