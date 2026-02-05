/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // ============================================
      // Colors - 色彩系统
      // ============================================
      colors: {
        // Background
        background: {
          DEFAULT: '#0f0f1a',
          elevated: '#1a1a2e',
          overlay: 'rgba(15, 15, 26, 0.8)',
        },
        // Surface
        surface: {
          DEFAULT: '#16162a',
          hover: '#1e1e3a',
          active: '#252550',
          glass: 'rgba(22, 22, 42, 0.6)',
        },
        // Primary (Soul Purple)
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        // Text
        text: {
          primary: '#e2e8f0',
          secondary: '#94a3b8',
          muted: '#64748b',
          disabled: '#475569',
        },
        // Border
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.08)',
          hover: 'rgba(255, 255, 255, 0.12)',
          focus: 'rgba(139, 92, 246, 0.5)',
        },
        // Emotion Colors
        emotion: {
          joy: '#fbbf24',
          sadness: '#60a5fa',
          anxiety: '#fb923c',
          love: '#f472b6',
          anger: '#f87171',
          fear: '#a78bfa',
          hope: '#34d399',
          calm: '#2dd4bf',
          confusion: '#818cf8',
          neutral: '#9ca3af',
        },
        // Semantic
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
      },
      
      // ============================================
      // Font Family - 字体系统
      // ============================================
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Noto Serif SC', 'Georgia', 'serif'],
        display: ['Cinzel', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      
      // ============================================
      // Font Size - 字号系统
      // ============================================
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
      },
      
      // ============================================
      // Border Radius - 圆角系统
      // ============================================
      borderRadius: {
        'card': '1.25rem',
        'button': '0.75rem',
        'input': '0.625rem',
        'modal': '1.5rem',
      },
      
      // ============================================
      // Box Shadow - 阴影系统
      // ============================================
      boxShadow: {
        'glow': '0 0 20px rgba(139, 92, 246, 0.3)',
        'glow-lg': '0 0 40px rgba(139, 92, 246, 0.4)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 30px rgba(0, 0, 0, 0.5)',
        'inner-glow': 'inset 0 0 20px rgba(139, 92, 246, 0.1)',
      },
      
      // ============================================
      // Transitions - 过渡动画
      // ============================================
      transitionDuration: {
        'fast': '150ms',
        'normal': '250ms',
        'slow': '350ms',
        'slower': '500ms',
      },
      transitionTimingFunction: {
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      
      // ============================================
      // Z-Index - 层级系统
      // ============================================
      zIndex: {
        'dropdown': '1000',
        'sticky': '1100',
        'overlay': '1300',
        'modal': '1400',
        'popover': '1500',
        'toast': '1700',
        'tooltip': '1800',
      },
      
      // ============================================
      // Animations - 动画
      // ============================================
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'fade-out': 'fade-out 0.2s ease-in',
        'slide-up': 'slide-up 0.4s ease-out',
        'slide-down': 'slide-down 0.4s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'spin-slow': 'spin 3s linear infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'bounce-slow': 'bounce 2s ease-in-out infinite',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(139, 92, 246, 0.6)' },
        },
      },
      
      // ============================================
      // Background Image - 背景图片
      // ============================================
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-soul': 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        'gradient-primary': 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #c084fc 100%)',
        'gradient-warm': 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
        'gradient-cool': 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
        'gradient-ethereal': 'linear-gradient(180deg, rgba(139, 92, 246, 0.15) 0%, transparent 100%)',
      },
      
      // ============================================
      // Backdrop Blur - 背景模糊
      // ============================================
      backdropBlur: {
        'xs': '2px',
      },
      
      // ============================================
      // Spacing - 间距扩展
      // ============================================
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
        '34': '8.5rem',
        '38': '9.5rem',
        '42': '10.5rem',
        '46': '11.5rem',
        '50': '12.5rem',
        '54': '13.5rem',
        '58': '14.5rem',
        '62': '15.5rem',
        '66': '16.5rem',
        '70': '17.5rem',
        '74': '18.5rem',
        '78': '19.5rem',
        '82': '20.5rem',
        '86': '21.5rem',
        '90': '22.5rem',
        '94': '23.5rem',
        '98': '24.5rem',
        '100': '25rem',
      },
      
      // ============================================
      // Screens - 响应式断点
      // ============================================
      screens: {
        'xs': '475px',
        '3xl': '1600px',
        '4xl': '1920px',
      },
      
      // ============================================
      // Line Height - 行高
      // ============================================
      lineHeight: {
        'tighter': '1.1',
        'snug': '1.375',
        'relaxed': '1.625',
      },
      
      // ============================================
      // Letter Spacing - 字间距
      // ============================================
      letterSpacing: {
        'tighter': '-0.05em',
        'tight': '-0.025em',
        'wide': '0.025em',
        'wider': '0.05em',
        'widest': '0.1em',
      },
      
      // ============================================
      // Opacity - 透明度
      // ============================================
      opacity: {
        '2': '0.02',
        '4': '0.04',
        '6': '0.06',
        '8': '0.08',
        '12': '0.12',
        '88': '0.88',
        '92': '0.92',
        '96': '0.96',
      },
      
      // ============================================
      // Scale - 缩放
      // ============================================
      scale: {
        '98': '0.98',
        '102': '1.02',
      },
      
      // ============================================
      // Rotate - 旋转
      // ============================================
      rotate: {
        '15': '15deg',
        '30': '30deg',
        '60': '60deg',
      },
      
      // ============================================
      // Blur - 模糊
      // ============================================
      blur: {
        'xs': '2px',
      },
      
      // ============================================
      // saturate - 饱和度
      // ============================================
      saturate: {
        '110': '1.1',
        '130': '1.3',
        '150': '1.5',
      },
    },
  },
  plugins: [
    // Custom plugin for additional utilities
    function({ addUtilities, addComponents, theme }) {
      // Additional utilities
      addUtilities({
        '.text-shadow': {
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
        },
        '.text-shadow-lg': {
          textShadow: '0 4px 8px rgba(0, 0, 0, 0.4)',
        },
        '.text-shadow-glow': {
          textShadow: '0 0 20px rgba(139, 92, 246, 0.5)',
        },
        '.no-scrollbar': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        '.tap-highlight-transparent': {
          '-webkit-tap-highlight-color': 'transparent',
        },
        '.gpu-accelerate': {
          'transform': 'translateZ(0)',
          'will-change': 'transform',
        },
      });
      
      // Additional components
      addComponents({
        '.btn': {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          fontWeight: '500',
          borderRadius: theme('borderRadius.button'),
          transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          '&:disabled': {
            opacity: '0.5',
            cursor: 'not-allowed',
          },
        },
        '.input': {
          width: '100%',
          backgroundColor: theme('colors.surface.DEFAULT'),
          border: `1px solid ${theme('colors.border.DEFAULT')}`,
          borderRadius: theme('borderRadius.input'),
          padding: '0.625rem 0.875rem',
          color: theme('colors.text.primary'),
          transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
          '&:focus': {
            outline: 'none',
            borderColor: theme('colors.primary.500'),
            boxShadow: '0 0 0 3px rgba(139, 92, 246, 0.1)',
          },
          '&::placeholder': {
            color: theme('colors.text.muted'),
          },
        },
      });
    },
  ],
};
