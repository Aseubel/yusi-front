import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '../utils'
import { User as UserIcon, Home, LayoutGrid, Book, Heart, Users, Settings, LogOut, Shield, X, Bell, Menu, ChevronRight } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useNotificationStore } from '../stores/notificationStore'
import { ThemeSwitcher } from './ThemeSwitcher'
// import { LanguageSwitcher } from './LanguageSwitcher'
import { Button } from './ui/Button'
import { Sheet, SheetContent, SheetTrigger } from './ui/Sheet'
import { initializeTheme } from '../stores/themeStore'
import { ChatWidget } from './ChatWidget'
import { Footer } from './Footer'
import { useTranslation } from 'react-i18next'
import { authApi } from '../lib/api'
import { toast } from 'sonner'

export interface LayoutProps {
  children?: ReactNode
}

export const Layout = ({ children }: LayoutProps) => {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { unreadCount, fetchUnreadCount } = useNotificationStore()
  const { t } = useTranslation()
  const [isTyping, setIsTyping] = useState(false)
  const [displayedMessage, setDisplayedMessage] = useState('')
  const [showMessage, setShowMessage] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const typingRef = useRef<{ frame: number | null; index: number; lastTime: number; delay: number }>({
    frame: null,
    index: 0,
    lastTime: 0,
    delay: 70,
  })
  const authorMessage = useMemo(
    () => t('footer.slogan'),
    [t]
  )

  useEffect(() => {
    initializeTheme()
  }, [])

  useEffect(() => {
    if (!user) return
    void fetchUnreadCount()
    const timer = window.setInterval(() => {
      void fetchUnreadCount()
    }, 60_000)
    return () => window.clearInterval(timer)
  }, [user, fetchUnreadCount])

  useEffect(() => {
    window.scrollTo(0, 0)
    setMobileMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    return () => {
      if (typingRef.current.frame) {
        cancelAnimationFrame(typingRef.current.frame)
      }
    }
  }, [])

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('Logout API error:', error)
    }
    logout()
    localStorage.removeItem('yusi-user-id')
    toast.success(t('common.logoutSuccess'))
    navigate('/login')
  }

  const navItems = [
    { label: t('nav.home'), href: '/', icon: Home },
    { label: t('nav.plaza'), href: '/plaza', icon: Users },
    { label: t('nav.room'), href: '/room', icon: LayoutGrid },
    { label: t('nav.diary'), href: '/diary', icon: Book },
    { label: t('nav.match'), href: '/match', icon: Heart },
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
      <div className="fixed inset-0 z-[-1] pointer-events-none">
        <div className="absolute inset-0 bg-background" />
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] bg-[url('/noise.svg')] mix-blend-overlay" />
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-[100px]" />
      </div>

      <header className="sticky top-0 z-[100] w-full border-b border-border/40 bg-background/90 backdrop-blur-xl transition-colors duration-300">
        <div className="container-page flex h-14 min-w-0 items-center justify-between gap-2 px-3 sm:h-16 sm:px-4 md:px-8">
          <div className="flex min-w-0 items-center gap-4 md:gap-8">
            <button
              type="button"
              onClick={startTyping}
              className="group relative flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center space-x-2"
            >
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-500 text-primary-foreground font-bold shadow-lg shadow-primary/20 transition-all duration-300 group-hover:scale-105 group-hover:rotate-3 group-hover:shadow-primary/40 sm:h-9 sm:w-9">
                Y
              </span>
              <span className="hidden font-bold tracking-tight text-foreground/90 transition-colors group-hover:text-foreground min-[380px]:inline sm:text-xl">
                Yusi
              </span>
            </button>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = item.href === '/diary' ? pathname.startsWith('/diary') : pathname === item.href
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

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {/* <LanguageSwitcher /> */}
            <ThemeSwitcher />

            {user ? (
              <>
                <Link to="/messages" className="relative hidden group md:block">
                  <Button
                    variant="ghost"
                    size="icon"
                    title={t('common.messages')}
                    className="rounded-full w-8 h-8"
                  >
                    <Bell className="h-4 w-4" />
                  </Button>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-background text-[10px] font-bold text-red-500 shadow-sm border border-red-100 dark:border-red-900/30 px-0.5 pointer-events-none z-10">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link to="/messages" className="relative group md:hidden" aria-label={t('common.messages')}>
                  <Button variant="ghost" size="icon" title={t('common.messages')} className="h-11 w-11 rounded-full">
                    <Bell className="h-4 w-4" />
                  </Button>
                  {unreadCount > 0 && (
                    <span className="pointer-events-none absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border border-background bg-red-500 px-0.5 text-[10px] font-bold text-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
                <div className="hidden items-center gap-2 rounded-full border border-border/50 bg-secondary/50 px-3 py-1.5 backdrop-blur-sm md:flex">
                  <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    {user.userName}
                  </span>
                </div>
                <div className="hidden items-center gap-1 md:flex">
                  <Link to="/settings">
                    <Button
                      variant="ghost"
                      size="icon"
                      title={t('common.settings')}
                      className="rounded-full w-8 h-8"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </Link>
                  {user.isAdmin === true && (
                    <Link to="/admin">
                      <Button
                        variant="ghost"
                        size="icon"
                        title={t('common.admin')}
                        className="rounded-full w-8 h-8"
                      >
                        <Shield className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    title={t('common.logout')}
                    className="rounded-full w-8 h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="hidden items-center gap-2 border-l border-border/50 pl-4 md:flex">
                <Link to="/login">
                  <Button variant="ghost" size="sm">{t('common.login')}</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">{t('common.register')}</Button>
                </Link>
              </div>
            )}

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                    className="h-11 w-11 rounded-full md:hidden"
                  aria-label={t('common.menu')}
                  title={t('common.menu')}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[min(22rem,calc(100vw-1rem))] p-0">
                <div className="flex h-full flex-col pt-safe">
                  <div className="border-b border-border/60 px-5 pb-5 pt-8">
                    {user ? (
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <UserIcon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{user.userName}</p>
                          <p className="text-xs text-muted-foreground">{t('common.messages')}</p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="font-semibold">Yusi</p>
                        <p className="mt-1 text-sm text-muted-foreground">{t('common.login')}</p>
                      </div>
                    )}
                  </div>

                  <nav className="flex-1 space-y-1 overflow-y-auto p-3">
                    {user ? (
                      <>
                        <Link to="/messages" onClick={() => setMobileMenuOpen(false)} className="flex min-h-12 items-center justify-between rounded-xl px-3 text-sm font-medium hover:bg-primary/10 hover:text-primary">
                          <span className="flex items-center gap-3"><Bell className="h-4 w-4" />{t('common.messages')}</span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                        <Link to="/settings" onClick={() => setMobileMenuOpen(false)} className="flex min-h-12 items-center justify-between rounded-xl px-3 text-sm font-medium hover:bg-primary/10 hover:text-primary">
                          <span className="flex items-center gap-3"><Settings className="h-4 w-4" />{t('common.settings')}</span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                        {user.isAdmin === true && (
                          <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="flex min-h-12 items-center justify-between rounded-xl px-3 text-sm font-medium hover:bg-primary/10 hover:text-primary">
                            <span className="flex items-center gap-3"><Shield className="h-4 w-4" />{t('common.admin')}</span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </Link>
                        )}
                      </>
                    ) : (
                      <>
                        <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="flex min-h-12 items-center justify-between rounded-xl px-3 text-sm font-medium hover:bg-primary/10 hover:text-primary">
                          <span>{t('common.login')}</span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                        <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="flex min-h-12 items-center justify-between rounded-xl px-3 text-sm font-medium hover:bg-primary/10 hover:text-primary">
                          <span>{t('common.register')}</span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                      </>
                    )}
                  </nav>

                  {user && (
                    <div className="border-t border-border/60 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
                      <Button
                        variant="ghost"
                        className="min-h-12 w-full justify-start gap-3 px-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-4 w-4" />
                        {t('common.logout')}
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {showMessage && (
        <div className="w-full border-b border-border/40 bg-background/70 backdrop-blur-xl">
          <div className="container-page px-4 md:px-8 py-3 flex items-center gap-3">
            <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Author</span>
            <div className="flex-1 min-w-0 text-sm text-foreground/90">
              <span className="whitespace-pre-wrap break-words">{displayedMessage}</span>
              <span className={cn("typewriter-cursor ml-1", isTyping ? "opacity-100" : "opacity-50")} />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={closeMessage}
              className="rounded-full"
              title="Close"
              aria-label="Close message"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <main className="container-page min-w-0 flex-1 px-3 py-5 sm:px-4 md:px-8 md:py-6">
        {children}
      </main>

      <Footer />

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/90 pb-safe backdrop-blur-xl transition-colors duration-300 md:hidden">
        <nav className="flex h-16 items-center justify-around">
          {navItems.slice(0, 5).map((item) => {
            const isActive = item.href === '/diary' ? pathname.startsWith('/diary') : item.href === '/room' ? pathname === '/room' : pathname === item.href
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex h-full min-h-12 w-full flex-col items-center justify-center gap-1 transition-colors",
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
