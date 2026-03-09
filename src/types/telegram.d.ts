
export { };

interface TelegramWebAppType {
    initData: string;
    initDataUnsafe: {
        user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
        };
        [key: string]: unknown;
    };
    version: string;
    platform: string;
    colorScheme: 'light' | 'dark';
    themeParams: Record<string, string>;
    isExpanded: boolean;
    viewportHeight: number;
    viewportStableHeight: number;
    isClosingConfirmationEnabled: boolean;
    BackButton: {
        isVisible: boolean;
        show: () => void;
        hide: () => void;
        onClick: (callback: () => void) => void;
        offClick: (callback: () => void) => void;
    };
    MainButton: {
        text: string;
        color: string;
        textColor: string;
        isVisible: boolean;
        isProgressVisible: boolean;
        isActive: boolean;
        show: () => void;
        hide: () => void;
        setText: (text: string) => void;
        onClick: (callback: () => void) => void;
        offClick: (callback: () => void) => void;
        showProgress: (leaveActive?: boolean) => void;
        hideProgress: () => void;
        enable: () => void;
        disable: () => void;
    };
    HapticFeedback: {
        impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
        notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
        selectionChanged: () => void;
    };
    showAlert: (message: string, callback?: () => void) => void;
    showConfirm: (message: string, callback?: (ok: boolean) => void) => void;
    showPopup: (params: object, callback?: (id: string) => void) => void;
    close: () => void;
    expand: () => void;
    ready: () => void;
    sendData: (data: string) => void;
    openLink: (url: string) => void;
    openTelegramLink: (url: string) => void;
    setHeaderColor?: (color: string) => void;
    setBackgroundColor?: (color: string) => void;
    enableClosingConfirmation: () => void;
    disableClosingConfirmation: () => void;
    CloudStorage: {
        setItem: (key: string, value: string, callback?: (error: Error | null, stored?: boolean) => void) => void;
        getItem: (key: string, callback?: (error: Error | null, value?: string) => void) => void;
        removeItem: (key: string, callback?: (error: Error | null, removed?: boolean) => void) => void;
        getKeys: (callback?: (error: Error | null, keys?: string[]) => void) => void;
    };
    LocationManager?: {
        isInited: boolean;
        isLocationAvailable: boolean;
        isAccessGranted: boolean;
        isAccessRequested: boolean;
        init: (callback?: () => void) => void;
        getLocation: (callback: (data: { latitude: number; longitude: number } | null) => void) => void;
        openSettings: () => void;
    };
}

declare global {
    interface Window {
        Telegram?: {
            WebApp: TelegramWebAppType;
        };
        TelegramWebviewProxy?: {
            postEvent: (eventType: string, eventData: string) => void;
        };
    }
}
