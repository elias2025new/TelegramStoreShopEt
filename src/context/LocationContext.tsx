'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface LocationContextType {
    locationName: string | null;
    locationEnabled: boolean;
    locationAsked: boolean;
    enableLocation: () => Promise<void>;
    disableLocation: () => void;
    markAsked: () => void;
}

const LocationContext = createContext<LocationContextType>({
    locationName: null,
    locationEnabled: false,
    locationAsked: false,
    enableLocation: async () => { },
    disableLocation: () => { },
    markAsked: () => { },
});

async function reverseGeocode(lat: number, lon: number): Promise<string> {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        const a = data.address || {};
        // Pick shortest meaningful name
        return (
            a.suburb ||
            a.neighbourhood ||
            a.city_district ||
            a.town ||
            a.city ||
            a.county ||
            a.state ||
            'Unknown'
        );
    } catch {
        return 'Unknown';
    }
}

export function LocationProvider({ children }: { children: React.ReactNode }) {
    const [locationName, setLocationName] = useState<string | null>(null);
    const [locationEnabled, setLocationEnabled] = useState(false);
    const [locationAsked, setLocationAsked] = useState(false);

    useEffect(() => {
        const asked = localStorage.getItem('location_asked') === 'true';
        const enabled = localStorage.getItem('location_enabled') === 'true';
        const cached = localStorage.getItem('location_name');
        setLocationAsked(asked);
        if (enabled && cached) {
            setLocationEnabled(true);
            setLocationName(cached);
        }
    }, []);

    const enableLocation = useCallback(async () => {
        localStorage.setItem('location_asked', 'true');
        setLocationAsked(true);

        const telegram = (window as any).Telegram?.WebApp;

        // Try Telegram's native LocationManager first (v7.2+)
        if (telegram?.LocationManager) {
            const lm = telegram.LocationManager;

            const handleLocationFetch = () => {
                if (!lm.isLocationAvailable) {
                    lm.openSettings();
                    return;
                }

                lm.getLocation(async (data: any) => {
                    if (data && data.latitude && data.longitude) {
                        try {
                            const name = await reverseGeocode(data.latitude, data.longitude);
                            setLocationName(name);
                            setLocationEnabled(true);
                            localStorage.setItem('location_enabled', 'true');
                            localStorage.setItem('location_name', name);
                        } catch {
                            setLocationEnabled(false);
                        }
                    } else {
                        // User denied permission or error
                        setLocationEnabled(false);
                    }
                });
            };

            if (!lm.isInited) {
                lm.init(() => handleLocationFetch());
            } else {
                handleLocationFetch();
            }
            return;
        }

        // Fallback to standard Geolocation API
        try {
            const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    timeout: 8000,
                    maximumAge: 300_000,
                })
            );
            const name = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
            setLocationName(name);
            setLocationEnabled(true);
            localStorage.setItem('location_enabled', 'true');
            localStorage.setItem('location_name', name);
        } catch {
            // User denied or error — silently fail
            setLocationEnabled(false);
        }
    }, []);

    const disableLocation = useCallback(() => {
        setLocationEnabled(false);
        localStorage.setItem('location_enabled', 'false');
    }, []);

    const markAsked = useCallback(() => {
        setLocationAsked(true);
        localStorage.setItem('location_asked', 'true');
    }, []);

    return (
        <LocationContext.Provider
            value={{ locationName, locationEnabled, locationAsked, enableLocation, disableLocation, markAsked }}
        >
            {children}
        </LocationContext.Provider>
    );
}

export function useLocation() {
    return useContext(LocationContext);
}
