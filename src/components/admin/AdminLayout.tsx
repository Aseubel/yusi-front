import { Outlet, Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "../../utils";
import { LayoutDashboard, Users, FileText, Sparkles, ArrowLeft, Menu, type LucideIcon, Shield, MessageSquare, Cpu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "../../components/ui/Sheet";
import { Button } from "../../components/ui/Button";
import { useEffect, useRef, useState } from "react";

type NavItem = {
    label: string;
    href: string;
    icon: LucideIcon;
    description: string;
};

const getNavItems = (t: (key: string) => string): NavItem[] => [
    { label: t('admin.nav.dashboard'), href: "/admin", icon: LayoutDashboard, description: t('admin.nav.dashboardDesc') },
    { label: t('admin.nav.users'), href: "/admin/users", icon: Users, description: t('admin.nav.usersDesc') },
    { label: t('admin.nav.scenarios'), href: "/admin/scenarios", icon: FileText, description: t('admin.nav.scenariosDesc') },
    { label: t('admin.nav.prompts'), href: "/admin/prompts", icon: Sparkles, description: t('admin.nav.promptsDesc') },
    { label: t('admin.nav.models'), href: "/admin/models", icon: Cpu, description: t('admin.nav.modelsDesc') },
    { label: t('admin.nav.suggestions'), href: "/admin/suggestions", icon: MessageSquare, description: t('admin.nav.suggestionsDesc') },
];

const SidebarContent = ({
    navItems,
    pathname,
    onNavigate,
    t,
}: {
    navItems: NavItem[];
    pathname: string;
    onNavigate: () => void;
    t: (key: string) => string;
}) => (
    <div className="flex flex-col h-full">
        <div className="h-16 flex items-center px-4 md:px-6 border-b border-border">
            <Link
                to="/"
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group"
                onClick={onNavigate}
            >
                <div className="p-1.5 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                    <span className="font-semibold text-sm">{t('admin.layout.backToHome')}</span>
                </div>
            </Link>
        </div>

        <div className="p-3 md:p-4 flex-1 overflow-y-auto">
            <div className="flex items-center gap-2 mb-4 px-2">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t('admin.layout.adminPanel')}
                </span>
            </div>
            <nav className="space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            onClick={onNavigate}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <item.icon className={cn("w-4 h-4", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                            <div className="flex flex-col">
                                <span>{item.label}</span>
                                <span className={cn("text-[10px]", isActive ? "text-primary-foreground/70" : "text-muted-foreground/70")}>
                                    {item.description}
                                </span>
                            </div>
                        </Link>
                    );
                })}
            </nav>
        </div>
    </div>
);

export const AdminLayout = () => {
    const { t } = useTranslation();
    const { pathname } = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const mainRef = useRef<HTMLDivElement | null>(null);
    const navItems = getNavItems(t);

    useEffect(() => {
        if (mainRef.current) {
            mainRef.current.scrollTo({ top: 0, left: 0 });
        } else {
            window.scrollTo(0, 0);
        }
        setTimeout(() => setIsOpen(false), 0);
    }, [pathname]);

    return (
        <div className="flex h-screen bg-background">
            <aside className="hidden lg:block w-72 border-r border-border bg-card/30 backdrop-blur-xl">
                <SidebarContent navItems={navItems} pathname={pathname} onNavigate={() => setIsOpen(false)} t={t} />
            </aside>

            <div className="flex-1 flex flex-col min-w-0">
                <header className="lg:hidden sticky top-0 w-full h-14 border-b border-border bg-background/95 backdrop-blur-md z-50 flex items-center px-4 justify-between">
                    <div className="flex items-center gap-2">
                        <Sheet open={isOpen} onOpenChange={setIsOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9">
                                    <Menu className="w-5 h-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="p-0 w-72">
                                <SidebarContent navItems={navItems} pathname={pathname} onNavigate={() => setIsOpen(false)} t={t} />
                            </SheetContent>
                        </Sheet>
                        <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-primary" />
                            <span className="font-semibold">{t('admin.layout.adminPanel')}</span>
                        </div>
                    </div>
                    <Link
                        to="/"
                        className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                    >
                        <ArrowLeft className="w-3 h-3" />
                        {t('admin.layout.backToHome')}
                    </Link>
                </header>

                <main ref={mainRef} className="flex-1 overflow-auto">
                    <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};
