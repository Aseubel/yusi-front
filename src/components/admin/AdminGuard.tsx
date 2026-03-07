import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { toast } from "sonner";
import { api } from "../../lib/api";
import { useTranslation } from "react-i18next";

interface AdminGuardProps {
    children: React.ReactNode;
}

export const AdminGuard = ({ children }: AdminGuardProps) => {
    const { t } = useTranslation();
    const { user, token } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        const checkAdmin = async () => {
            if (!token || !user) {
                toast.error(t('admin.guard.notLoggedIn'));
                navigate("/login", { replace: true });
                return;
            }

            if (user.permissionLevel < 10) {
                toast.error(t('admin.guard.notAdmin'));
                navigate("/", { replace: true });
                return;
            }

            try {
                await api.get("/admin/stats");
            } catch {
                toast.error(t('admin.guard.verificationFailed'));
                navigate("/", { replace: true });
            }
        };

        checkAdmin();
    }, [user, token, navigate, t]);

    if (!user || user.permissionLevel < 10) {
        return null;
    }

    return <>{children}</>;
};
