import { Outlet, Link, useLocation } from "react-router-dom";
import { cn } from "../../utils";
import { LayoutDashboard, Users, FileText, ArrowLeft, Menu, type LucideIcon } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "../../components/ui/Sheet";
import { Button } from "../../components/ui/Button";
import { useState } from "react";

type NavItem = {
    label: string;
    href: string;
    icon: LucideIcon;
};

const navItems: NavItem[] = [
    { label: "仪表盘", href: "/admin", icon: LayoutDashboard },
    { label: "用户管理", href: "/admin/users", icon: Users },
    { label: "场景审核", href: "/admin/scenarios", icon: FileText },
];

const SidebarContent = ({
    navItems,
    pathname,
    onNavigate,
}: {
    navItems: NavItem[];
    pathname: string;
    onNavigate: () => void;
}) => (
    <div className="flex flex-col h-full">
        <div className="h-16 flex items-center px-6 border-b border-border">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span className="font-semibold">返回前台</span>
            </Link>
        </div>

        <div className="p-4 flex-1">
            <div className="text-xs font-semibold text-muted-foreground mb-4 px-2 uppercase tracking-wider">
                管理后台
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
                                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-md"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
        </div>
    </div>
);

export const AdminLayout = () => {
    const { pathname } = useLocation();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="flex h-screen bg-background">
            {/* Desktop Sidebar */}
            <aside className="hidden md:block w-64 border-r border-border bg-card/50 backdrop-blur-xl">
                <SidebarContent navItems={navItems} pathname={pathname} onNavigate={() => setIsOpen(false)} />
            </aside>

            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 w-full h-16 border-b border-border bg-background/80 backdrop-blur-md z-50 flex items-center px-4 justify-between">
                <div className="font-semibold">管理后台</div>
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="w-5 h-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-64">
                        <SidebarContent navItems={navItems} pathname={pathname} onNavigate={() => setIsOpen(false)} />
                    </SheetContent>
                </Sheet>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-auto md:pt-0 pt-16">
                <div className="container mx-auto p-4 md:p-8 max-w-7xl">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
