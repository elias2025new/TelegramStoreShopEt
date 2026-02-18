
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/utils/supabase/client';

interface AdminContextType {
    isOwner: boolean;
    storeId: string | null;
    isLoading: boolean;
}

const AdminContext = createContext<AdminContextType>({
    isOwner: false,
    storeId: null,
    isLoading: true,
});

export function AdminProvider({ children }: { children: ReactNode }) {
    const [isOwner, setIsOwner] = useState(false);
    const [storeId, setStoreId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

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

                const { data, error } = await supabase
                    .from('stores')
                    .select('id')
                    .eq('owner_id', telegramId)
                    .single();

                if (!error && data) {
                    setIsOwner(true);
                    setStoreId(data.id);
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
        <AdminContext.Provider value={{ isOwner, storeId, isLoading }}>
            {children}
        </AdminContext.Provider>
    );
}

export function useAdmin() {
    return useContext(AdminContext);
}
