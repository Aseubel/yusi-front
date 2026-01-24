import { type ReactNode, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '../utils'
import { LogOut, User as UserIcon, Home, LayoutGrid, Book, Heart, Users, Settings } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { Button } from './ui/Button'
import { initializeTheme } from '../stores/themeStore'

export interface LayoutProps {
  children?: ReactNode
}

export const Layout = ({ children }: LayoutProps) => {
  const { pathname } = useLocation()
  const { user, logout } = useAuthStore()

  // 初始化主题
  useEffect(() => {
    initializeTheme()
  }, [])

  const navItems = [
    { label: '首页', href: '/', icon: Home },
    { label: '广场', href: '/plaza', icon: Users },
    { label: '情景室', href: '/room', icon: LayoutGrid },
    { label: 'AI知己', href: '/diary', icon: Book },
    { label: '匹配', href: '/match', icon: Heart },
  ]

  return (
    <div className="flex min-h-screen flex-col font-sans antialiased pb-16 md:pb-0 relative overflow-x-hidden">
      {/* Ambient Background with Aurora Effect */}
      <div className="bg-ambient fixed inset-0 z-[-1]" />
      <div className="fixed inset-0 z-[-1] opacity-30 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150 mix-blend-overlay pointer-events-none" />

      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-white/50 dark:bg-black/20 backdrop-blur-2xl">
        <div className="container-page flex h-16 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center space-x-2 group relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-500 text-white font-bold shadow-lg shadow-primary/20 transition-all duration-300 group-hover:scale-105 group-hover:rotate-3 group-hover:shadow-primary/40">
                Y
              </span>
              <span className="font-bold text-xl tracking-tight text-foreground/90 group-hover:text-foreground transition-colors">
                Yusi
              </span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
                      isActive 
                        ? "text-primary bg-primary/10" 
                        : "text-muted-foreground hover:text-foreground hover:bg-white/10 dark:hover:bg-white/5"
                    )}
                  >
                    {isActive && (
                      <span className="absolute inset-0 bg-primary/10 rounded-full blur-sm" />
                    )}
                    <span className="relative flex items-center gap-2">
                      <item.icon className={cn("w-4 h-4", isActive ? "stroke-[2.5px]" : "stroke-2")} />
                      {item.label}
                    </span>
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-white/5 backdrop-blur-sm">
                  <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium hidden md:inline-block">
                    {user.userName}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Link to="/settings">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="设置"
                      className="rounded-full w-8 h-8"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      logout()
                      localStorage.removeItem('yusi-user-id')
                    }}
                    title="退出登录"
                    className="rounded-full w-8 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="rounded-full">登录</Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm" className="rounded-full px-5 shadow-lg shadow-primary/20">注册</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1920px] mx-auto">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-t border-white/10 pb-safe">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
             const isActive = pathname === item.href
             return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full space-y-1",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <div className={cn(
                  "p-1.5 rounded-xl transition-all duration-300",
                  isActive && "bg-primary/10"
                )}>
                  <item.icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
             )
          })}
        </div>
      </nav>
    </div>
  )
}
