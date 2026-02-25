import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { toast } from "sonner";
import { api } from "../../lib/api";

interface AdminGuardProps {
    children: React.ReactNode;
}

export const AdminGuard = ({ children }: AdminGuardProps) => {
    const { user, token } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        const checkAdmin = async () => {
            if (!token || !user) {
                toast.error("这就想进后台？先登录再说！");
                navigate("/login", { replace: true });
                return;
            }

            // Client-side quick check
            if (user.permissionLevel < 10) {
                toast.error("权限不够哦，你不是管理员");
                navigate("/", { replace: true });
                return;
            }

            // Server-side verification (optional but recommended)
            try {
                await api.get("/admin/stats"); // Using stats as a ping
            } catch {
                toast.error("权限验证失败");
                navigate("/", { replace: true });
            }
        };

        checkAdmin();
    }, [user, token, navigate]);

    if (!user || user.permissionLevel < 10) {
        return null;
    }

    return <>{children}</>;
};
