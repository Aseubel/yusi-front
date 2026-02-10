import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '../utils'
import { User as UserIcon, Home, LayoutGrid, Book, Heart, Users, Settings, LogOut, Shield, X } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { ThemeSwitcher } from './ThemeSwitcher'
import { Button } from './ui/Button'
import { initializeTheme } from '../stores/themeStore'
import { ChatWidget } from './ChatWidget'
import { Footer } from './Footer'

export interface LayoutProps {
  children?: ReactNode
}

export const Layout = ({ children }: LayoutProps) => {
  const { pathname } = useLocation()
  const { user, logout } = useAuthStore()
  const [isTyping, setIsTyping] = useState(false)
  const [displayedMessage, setDisplayedMessage] = useState('')
  const [showMessage, setShowMessage] = useState(false)
  const typingRef = useRef<{ frame: number | null; index: number; lastTime: number; delay: number }>({
    frame: null,
    index: 0,
    lastTime: 0,
    delay: 70,
  })
  const authorMessage = useMemo(
    () => '标签不能定义人，思想不能被计算。本站内容仅供娱乐参考，不代表任何立场。',
    []
  )

  // Initialize theme
  useEffect(() => {
    initializeTheme()
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  useEffect(() => {
    return () => {
      if (typingRef.current.frame) {
        cancelAnimationFrame(typingRef.current.frame)
      }
    }
  }, [])

  const navItems = [
    { label: '首页', href: '/', icon: Home },
    { label: '广场', href: '/plaza', icon: Users },
    { label: '情景室', href: '/room', icon: LayoutGrid },
    { label: '日记', href: '/diary', icon: Book },
    { label: '匹配', href: '/match', icon: Heart },
  ]

  const startTyping = () => {
    if (isTyping) return
    if (typingRef.current.frame) {
      cancelAnimationFrame(typingRef.current.frame)
    }
    setShowMessage(true)
    setIsTyping(true)
    setDisplayedMessage('')
    typingRef.current = { frame: null, index: 0, lastTime: 0, delay: 70 }

    const step = (time: number) => {
      if (!typingRef.current.lastTime) {
        typingRef.current.lastTime = time
      }
      const elapsed = time - typingRef.current.lastTime
      if (elapsed >= typingRef.current.delay) {
        const nextIndex = typingRef.current.index + 1
        setDisplayedMessage(authorMessage.slice(0, nextIndex))
        typingRef.current.index = nextIndex
        typingRef.current.lastTime = time
        typingRef.current.delay = 50 + Math.random() * 50
        if (nextIndex >= authorMessage.length) {
          setIsTyping(false)
          typingRef.current.frame = null
          return
        }
      }
      typingRef.current.frame = requestAnimationFrame(step)
    }

    typingRef.current.frame = requestAnimationFrame(step)
  }

  const closeMessage = () => {
    if (typingRef.current.frame) {
      cancelAnimationFrame(typingRef.current.frame)
    }
    typingRef.current.frame = null
    setIsTyping(false)
    setDisplayedMessage('')
    setShowMessage(false)
  }

  return (
    <div className="app-shell">
      {/* Background Effect - Subtle and Theme Compatible */}
      <div className="fixed inset-0 z-[-1] pointer-events-none">
        <div className="absolute inset-0 bg-background" />
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] bg-[url('/noise.svg')] mix-blend-overlay" />
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-[100px]" />
      </div>

      <header className="sticky top-0 z-[100] w-full border-b border-border/40 bg-background/80 backdrop-blur-xl transition-colors duration-300">
        <div className="container-page flex h-16 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-8">
            <button
              type="button"
              onClick={startTyping}
              className="flex items-center space-x-2 group relative cursor-pointer"
            >
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-500 text-primary-foreground font-bold shadow-lg shadow-primary/20 transition-all duration-300 group-hover:scale-105 group-hover:rotate-3 group-hover:shadow-primary/40">
                Y
              </span>
              <span className="font-bold text-xl tracking-tight text-foreground/90 group-hover:text-foreground transition-colors">
                Yusi
              </span>
            </button>

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
                        : "text-muted-foreground hover:text-primary hover:bg-primary/10"
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
                  {user.permissionLevel >= 10 && (
                    <Link to="/admin">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="管理后台"
                        className="rounded-full w-8 h-8"
                      >
                        <Shield className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
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

      {showMessage && (
        <div className="w-full border-b border-border/40 bg-background/70 backdrop-blur-xl">
          <div className="container-page px-4 md:px-8 py-3 flex items-center gap-3">
            <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">作者留言</span>
            <div className="flex-1 min-w-0 text-sm text-foreground/90">
              <span className="whitespace-pre-wrap break-words">{displayedMessage}</span>
              <span className={cn("typewriter-cursor ml-1", isTyping ? "opacity-100" : "opacity-50")} />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={closeMessage}
              className="rounded-full"
              title="关闭"
              aria-label="关闭留言"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <main className="flex-1 container-page px-4 md:px-8 py-6">
        {children}
      </main>

      <Footer />

      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border/50 pb-safe transition-colors duration-300">
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
