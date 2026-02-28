
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/utils/supabase/client';

interface AdminContextType {
    isOwner: boolean;
    storeId: string | null;
    isLoading: boolean;
    adminOpen: boolean;
    setAdminOpen: (open: boolean) => void;
}

const AdminContext = createContext<AdminContextType>({
    isOwner: false,
    storeId: null,
    isLoading: true,
    adminOpen: false,
    setAdminOpen: () => { },
});

export function AdminProvider({ children }: { children: ReactNode }) {
    const [isOwner, setIsOwner] = useState(false);
    const [storeId, setStoreId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [adminOpen, setAdminOpen] = useState(false);

    useEffect(() => {
        async function checkOwnership() {
            try {
                if (typeof window === 'undefined' || !window.Telegram?.WebApp) {
                    setIsLoading(false);
                    return;
                }

                const tgUser = window.Telegram.WebApp.initDataUnsafe?.user;
                if (!tgUser?.id) {
                    setIsLoading(false);
                    return;
                }

                const telegramId = tgUser.id;

                // 1. Check if primary owner
                const { data: storeData, error: storeError } = await supabase
                    .from('stores')
                    .select('id')
                    .eq('owner_id', telegramId)
                    .single();

                if (!storeError && storeData) {
                    setIsOwner(true);
                    setStoreId(storeData.id);
                    return;
                }

                // 2. Check if secondary admin
                const { data: adminData, error: adminError } = await supabase
                    .from('store_admins')
                    .select('store_id')
                    .eq('telegram_id', telegramId)
                    .single();

                if (!adminError && adminData) {
                    setIsOwner(true);
                    setStoreId(adminData.store_id);
                }
            } catch (err) {
                console.error('Admin check failed:', err);
            } finally {
                setIsLoading(false);
            }
        }

        checkOwnership();
    }, []);

    return (
        <AdminContext.Provider value={{ isOwner, storeId, isLoading, adminOpen, setAdminOpen }}>
            {children}
        </AdminContext.Provider>
    );
}

export function useAdmin() {
    return useContext(AdminContext);
}
