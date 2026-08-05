import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { toast } from "sonner";
import { adminApi } from "../../lib/api";
import { useTranslation } from "react-i18next";

interface AdminGuardProps {
    children: React.ReactNode;
}

export const AdminGuard = ({ children }: AdminGuardProps) => {
    const { t } = useTranslation();
    const { user, token } = useAuthStore();
    const navigate = useNavigate();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        let isActive = true;

        const checkAdmin = async () => {
            if (!isActive) return;
            if (!token || !user) {
                toast.error(t('admin.guard.notLoggedIn'));
                navigate("/login", { replace: true });
                return;
            }

            try {
                const response = await adminApi.getCurrentPermission();
                const permissionLevel = response.data.data?.permissionLevel ?? 0;
                if (response.data.code !== 200 || permissionLevel < 10) {
                    toast.error(t('admin.guard.notAdmin'));
                    navigate("/", { replace: true });
                    return;
                }
                if (isActive) setAuthorized(true);
            } catch {
                if (!isActive) return;
                toast.error(t('admin.guard.verificationFailed'));
                navigate("/", { replace: true });
            }
        };

        const timer = setTimeout(() => {
            if (!isActive) return;
            setAuthorized(false);
            void checkAdmin();
        }, 0);

        return () => {
            isActive = false;
            clearTimeout(timer);
        };
    }, [user, token, navigate, t]);

    if (!authorized) {
        return null;
    }

    return <>{children}</>;
};
