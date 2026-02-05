import { cn } from '../utils'
import { Outlet, useLocation, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Home, 
  BookHeart, 
  Users, 
  Sparkles, 
  MapPin, 
  Settings,
  Menu,
  X,
  LogOut
} from 'lucide-react'
import { Button } from './ui/Button'
import { Avatar } from './ui/Avatar'
import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'

interface NavItem {
  path: string
  label: string
  icon: React.ElementType
  badge?: number
}

const navItems: NavItem[] = [
  { path: '/', label: '首页', icon: Home },
  { path: '/rooms', label: '情景室', icon: Sparkles },
  { path: '/diary', label: '知己日记', icon: BookHeart },
  { path: '/plaza', label: '灵魂广场', icon: Users },
  { path: '/match', label: '灵魂匹配', icon: Sparkles },
  { path: '/map', label: '足迹地图', icon: MapPin },
]

const bottomNavItems: NavItem[] = [
  { path: '/', label: '首页', icon: Home },
  { path: '/rooms', label: '情景室', icon: Sparkles },
  { path: '/diary', label: '日记', icon: BookHeart },
  { path: '/plaza', label: '广场', icon: Users },
  { path: '/settings', label: '设置', icon: Settings },
]

export function Layout() {
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const { user, logout } = useAuthStore()

  // Handle scroll for header styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 flex-col border-r border-border bg-surface/50 backdrop-blur-xl z-sticky">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-glow">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-serif text-xl font-bold text-text-primary">Yusi</h1>
              <p className="text-xs text-text-muted">灵魂叙事</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-fast',
                  'group relative overflow-hidden',
                  active 
                    ? 'bg-primary-500/10 text-primary-400' 
                    : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                )}
              >
                {/* Active Indicator */}
                {active && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-500 rounded-r-full"
                  />
                )}
                <Icon className={cn(
                  'w-5 h-5 transition-transform group-hover:scale-110',
                  active && 'text-primary-400'
                )} />
                <span className="font-medium">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-hover">
            <Avatar 
              name={user?.userName || 'User'} 
              size="sm"
              status="online"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">
                {user?.userName || '访客'}
              </p>
              <p className="text-xs text-text-muted truncate">
                {user?.email || '未登录'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="text-text-muted hover:text-error"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className={cn(
        'lg:hidden fixed top-0 left-0 right-0 z-sticky transition-all duration-fast',
        isScrolled 
          ? 'bg-surface/80 backdrop-blur-xl border-b border-border' 
          : 'bg-transparent'
      )}>
        <div className="flex items-center justify-between px-4 h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-serif text-lg font-bold text-text-primary">Yusi</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <Avatar 
              name={user?.userName || 'User'} 
              size="sm"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-b border-border bg-surface/95 backdrop-blur-xl"
            >
              <nav className="p-4 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.path)
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                        active 
                          ? 'bg-primary-500/10 text-primary-400' 
                          : 'text-text-secondary hover:bg-surface-hover'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
                <div className="pt-2 mt-2 border-t border-border">
                  <button
                    onClick={logout}
                    className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-error hover:bg-error/10 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>退出登录</span>
                  </button>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className={cn(
        'lg:ml-64 min-h-screen',
        'pt-16 lg:pt-0' // Mobile header offset
      )}>
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-xl border-t border-border z-sticky pb-safe">
        <div className="flex items-center justify-around h-16">
          {bottomNavItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors',
                  active ? 'text-primary-400' : 'text-text-muted'
                )}
              >
                <div className="relative">
                  <Icon className={cn(
                    'w-5 h-5 transition-transform',
                    active && 'scale-110'
                  )} />
                  {active && (
                    <motion.div
                      layoutId="mobileNavIndicator"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary-500 rounded-full"
                    />
                  )}
                </div>
                <span className="text-xs">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Mobile Bottom Safe Area */}
      <div className="lg:hidden h-16" />
    </div>
  )
}

export default Layout
