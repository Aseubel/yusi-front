import { type ReactNode, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '../utils'
import { User as UserIcon, Home, LayoutGrid, Book, Heart, Users, Settings, LogOut } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { ThemeSwitcher } from './ThemeSwitcher'
import { Button } from './ui/Button'
import { initializeTheme } from '../stores/themeStore'
import { ChatWidget } from './ChatWidget'

export interface LayoutProps {
  children?: ReactNode
}

export const Layout = ({ children }: LayoutProps) => {
  const { pathname } = useLocation()
  const { user, logout } = useAuthStore()

  // Initialize theme
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
    <div className="flex min-h-screen flex-col font-sans antialiased pb-16 md:pb-0 relative overflow-x-hidden bg-background text-foreground transition-colors duration-300">
      {/* Background Effect - Subtle and Theme Compatible */}
      <div className="fixed inset-0 z-[-1] pointer-events-none">
          <div className="absolute inset-0 bg-background" />
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[100px]" />
          <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-[100px]" />
      </div>

      <header className="sticky top-0 z-[100] w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container-page flex h-16 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center space-x-2 group relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-500 text-primary-foreground font-bold shadow-lg shadow-primary/20 transition-all duration-300 group-hover:scale-105 group-hover:rotate-3 group-hover:shadow-primary/40">
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
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
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
            <ThemeSwitcher />
            
            {user ? (
              <div className="flex items-center gap-3 pl-4 border-l border-border/50">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border/50 backdrop-blur-sm">
                  <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium hidden md:inline-block text-foreground">
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
                    onClick={logout}
                    title="退出登录"
                    className="rounded-full w-8 h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" /> 
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-4 border-l border-border/50">
                <Link to="/login">
                  <Button variant="ghost" size="sm">登录</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">注册</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 container-page px-4 md:px-8 py-6">
        {children}
      </main>

      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border/50 pb-safe">
        <nav className="flex justify-around items-center h-16">
          {navItems.map((item) => {
             const isActive = pathname === item.href
             return (
               <Link
                 key={item.href}
                 to={item.href}
                 className={cn(
                   "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
                   isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                 )}
               >
                 <item.icon className={cn("w-5 h-5", isActive && "fill-current/20")} />
                 <span className="text-[10px] font-medium">{item.label}</span>
               </Link>
             )
          })}
        </nav>
      </div>
      
      <ChatWidget />
    </div>
  )
}
