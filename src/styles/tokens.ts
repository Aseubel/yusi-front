/**
 * Yusi Design Tokens
 * 设计令牌 - 统一的设计系统变量
 * 遵循 "数字禅意" (Digital Zen) 设计理念
 */

// ============================================
// Color Palette - 色彩系统
// ============================================

export const colors = {
  // Primary Colors - 主色调
  primary: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6', // Soul Purple
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
    950: '#2e1065',
  },

  // Background Colors - 背景色
  background: {
    DEFAULT: '#0f0f1a', // Deep Space
    elevated: '#1a1a2e', // Elevated Surface
    overlay: 'rgba(15, 15, 26, 0.8)',
    subtle: 'rgba(255, 255, 255, 0.02)',
  },

  // Surface Colors - 表面色
  surface: {
    DEFAULT: '#16162a',
    hover: '#1e1e3a',
    active: '#252550',
    glass: 'rgba(22, 22, 42, 0.6)',
  },

  // Text Colors - 文字色
  text: {
    primary: '#e2e8f0',
    secondary: '#94a3b8',
    muted: '#64748b',
    disabled: '#475569',
    inverse: '#0f172a',
  },

  // Border Colors - 边框色
  border: {
    DEFAULT: 'rgba(255, 255, 255, 0.08)',
    hover: 'rgba(255, 255, 255, 0.12)',
    active: 'rgba(255, 255, 255, 0.16)',
    focus: 'rgba(139, 92, 246, 0.5)',
  },

  // Emotion Colors - 情感色彩
  emotion: {
    joy: { DEFAULT: '#fbbf24', light: '#fef3c7', dark: '#d97706' },      // 喜悦 - 琥珀金
    sadness: { DEFAULT: '#60a5fa', light: '#dbeafe', dark: '#2563eb' },  // 悲伤 - 天空蓝
    anxiety: { DEFAULT: '#fb923c', light: '#ffedd5', dark: '#ea580c' },  // 焦虑 - 活力橙
    love: { DEFAULT: '#f472b6', light: '#fce7f3', dark: '#db2777' },     // 温暖 - 玫瑰粉
    anger: { DEFAULT: '#f87171', light: '#fee2e2', dark: '#dc2626' },    // 愤怒 - 珊瑚红
    fear: { DEFAULT: '#a78bfa', light: '#ede9fe', dark: '#7c3aed' },     // 恐惧 - 神秘紫
    hope: { DEFAULT: '#34d399', light: '#d1fae5', dark: '#059669' },     // 希望 - 翡翠绿
    calm: { DEFAULT: '#2dd4bf', light: '#ccfbf1', dark: '#0d9488' },     // 平静 - 青绿色
    confusion: { DEFAULT: '#818cf8', light: '#e0e7ff', dark: '#4f46e5' }, // 困惑 - 靛蓝
    neutral: { DEFAULT: '#9ca3af', light: '#f3f4f6', dark: '#4b5563' },  // 随想 - 中性灰
  },

  // Semantic Colors - 语义色
  semantic: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },

  // Gradient Presets - 渐变预设
  gradient: {
    primary: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #c084fc 100%)',
    soul: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    warm: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
    cool: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
    ethereal: 'linear-gradient(180deg, rgba(139, 92, 246, 0.15) 0%, transparent 100%)',
    glow: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
  },
} as const;

// ============================================
// Typography - 字体系统
// ============================================

export const typography = {
  // Font Families
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
    serif: ['Noto Serif SC', 'Georgia', 'serif'],
    display: ['Cinzel', 'serif'],
    mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
  },

  // Font Sizes
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    '5xl': ['3rem', { lineHeight: '1' }],
    '6xl': ['3.75rem', { lineHeight: '1' }],
    '7xl': ['4.5rem', { lineHeight: '1' }],
    '8xl': ['6rem', { lineHeight: '1' }],
  },

  // Font Weights
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },

  // Letter Spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },

  // Line Heights
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
} as const;

// ============================================
// Spacing - 间距系统
// ============================================

export const spacing = {
  0: '0px',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  11: '2.75rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  28: '7rem',
  32: '8rem',
  36: '9rem',
  40: '10rem',
  44: '11rem',
  48: '12rem',
  52: '13rem',
  56: '14rem',
  60: '15rem',
  64: '16rem',
  72: '18rem',
  80: '20rem',
  96: '24rem',
} as const;

// ============================================
// Border Radius - 圆角系统
// ============================================

export const borderRadius = {
  none: '0px',
  sm: '0.125rem',
  DEFAULT: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  full: '9999px',
  // Custom
  card: '1.25rem',
  button: '0.75rem',
  input: '0.625rem',
  modal: '1.5rem',
} as const;

// ============================================
// Shadows - 阴影系统
// ============================================

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
  none: 'none',
  // Custom
  glow: '0 0 20px rgba(139, 92, 246, 0.3)',
  'glow-lg': '0 0 40px rgba(139, 92, 246, 0.4)',
  card: '0 4px 20px rgba(0, 0, 0, 0.2)',
  'card-hover': '0 8px 30px rgba(0, 0, 0, 0.3)',
} as const;

// ============================================
// Transitions - 过渡动画
// ============================================

export const transitions = {
  duration: {
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
    slower: '500ms',
  },
  timing: {
    DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  property: {
    DEFAULT: 'color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter',
    colors: 'color, background-color, border-color, text-decoration-color, fill, stroke',
    transform: 'transform',
    opacity: 'opacity',
    shadow: 'box-shadow',
  },
} as const;

// ============================================
// Z-Index - 层级系统
// ============================================

export const zIndex = {
  hide: -1,
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
} as const;

// ============================================
// Breakpoints - 响应式断点
// ============================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ============================================
// Animation Keyframes - 动画关键帧
// ============================================

export const keyframes = {
  fadeIn: {
    from: { opacity: '0' },
    to: { opacity: '1' },
  },
  fadeOut: {
    from: { opacity: '1' },
    to: { opacity: '0' },
  },
  slideUp: {
    from: { transform: 'translateY(20px)', opacity: '0' },
    to: { transform: 'translateY(0)', opacity: '1' },
  },
  slideDown: {
    from: { transform: 'translateY(-20px)', opacity: '0' },
    to: { transform: 'translateY(0)', opacity: '1' },
  },
  scaleIn: {
    from: { transform: 'scale(0.95)', opacity: '0' },
    to: { transform: 'scale(1)', opacity: '1' },
  },
  pulse: {
    '0%, 100%': { opacity: '1' },
    '50%': { opacity: '0.5' },
  },
  shimmer: {
    '0%': { backgroundPosition: '-200% 0' },
    '100%': { backgroundPosition: '200% 0' },
  },
  float: {
    '0%, 100%': { transform: 'translateY(0)' },
    '50%': { transform: 'translateY(-10px)' },
  },
  spin: {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },
  bounce: {
    '0%, 100%': { transform: 'translateY(0)' },
    '50%': { transform: 'translateY(-25%)' },
  },
  glow: {
    '0%, 100%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)' },
    '50%': { boxShadow: '0 0 40px rgba(139, 92, 246, 0.6)' },
  },
} as const;

// ============================================
// Component Specific Tokens
// ============================================

export const components = {
  button: {
    sizes: {
      xs: { height: '1.75rem', padding: '0 0.625rem', fontSize: '0.75rem' },
      sm: { height: '2rem', padding: '0 0.75rem', fontSize: '0.875rem' },
      md: { height: '2.5rem', padding: '0 1rem', fontSize: '0.875rem' },
      lg: { height: '3rem', padding: '0 1.5rem', fontSize: '1rem' },
      xl: { height: '3.5rem', padding: '0 2rem', fontSize: '1.125rem' },
    },
  },
  input: {
    sizes: {
      sm: { height: '2rem', padding: '0 0.625rem' },
      md: { height: '2.5rem', padding: '0 0.75rem' },
      lg: { height: '3rem', padding: '0 1rem' },
    },
  },
  card: {
    padding: {
      sm: '1rem',
      md: '1.5rem',
      lg: '2rem',
    },
  },
} as const;

// ============================================
// Export All Tokens
// ============================================

export const tokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  zIndex,
  breakpoints,
  keyframes,
  components,
} as const;

export default tokens;
