'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

interface LocationContextType {
    locationName: string | null;
    locationEnabled: boolean;
    locationAsked: boolean;
    locationHydrated: boolean;  // true once localStorage has been read
    enableLocation: () => Promise<void>;
    disableLocation: () => void;
    markAsked: () => void;
}

const LocationContext = createContext<LocationContextType>({
    locationName: null,
    locationEnabled: false,
    locationAsked: false,
    locationHydrated: false,
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

// How far (in metres) user must move before we re-geocode
const MIN_DISTANCE_METRES = 300;

function distanceMetres(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6_371_000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function LocationProvider({ children }: { children: React.ReactNode }) {
    const [locationName, setLocationName] = useState<string | null>(null);
    const [locationEnabled, setLocationEnabled] = useState(false);
    const [locationAsked, setLocationAsked] = useState(false);
    const [locationHydrated, setLocationHydrated] = useState(false);

    // Track last geocoded coords to avoid spamming the API
    const lastCoordsRef = useRef<{ lat: number; lon: number } | null>(null);
    // Store the watchPosition id so we can clear it on disable
    const watchIdRef = useRef<number | null>(null);

    // ─── Restore from localStorage on mount ─────────────────────────────────
    useEffect(() => {
        const asked = localStorage.getItem('location_asked') === 'true';
        const enabled = localStorage.getItem('location_enabled') === 'true';
        const cached = localStorage.getItem('location_name');
        setLocationAsked(asked);
        if (enabled && cached) {
            setLocationEnabled(true);
            setLocationName(cached);
        }
        // Signal that localStorage has been read — modal gate can now decide
        setLocationHydrated(true);
    }, []);

    // ─── Start live watching once location is enabled ─────────────────────────
    useEffect(() => {
        if (!locationEnabled) return;

        const telegram = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : null;

        // ── Path A: Telegram LocationManager (preferred — no repeated native prompts) ──
        if (telegram?.LocationManager) {
            const lm = telegram.LocationManager;

            const fetchViaLM = () => {
                if (!lm.isLocationAvailable) return;
                lm.getLocation(async (data: any) => {
                    if (!data?.latitude || !data?.longitude) return;
                    const { latitude: lat, longitude: lon } = data;
                    const last = lastCoordsRef.current;
                    if (last && distanceMetres(last.lat, last.lon, lat, lon) < MIN_DISTANCE_METRES) return;
                    lastCoordsRef.current = { lat, lon };
                    const name = await reverseGeocode(lat, lon);
                    setLocationName(name);
                    localStorage.setItem('location_name', name);
                });
            };

            // Kick off first fetch once LM is ready
            if (lm.isInited) {
                fetchViaLM();
            } else {
                lm.init(() => fetchViaLM());
            }

            // Refresh every 90 seconds (no permission prompt)
            const interval = window.setInterval(fetchViaLM, 90_000);
            return () => clearInterval(interval);
        }

        // ── Path B: Standard Geolocation API (browser / non-Telegram fallback) ──
        if (typeof navigator === 'undefined' || !navigator.geolocation) return;

        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
        }

        const id = navigator.geolocation.watchPosition(
            async (pos) => {
                const { latitude: lat, longitude: lon } = pos.coords;
                const last = lastCoordsRef.current;
                if (last && distanceMetres(last.lat, last.lon, lat, lon) < MIN_DISTANCE_METRES) return;
                lastCoordsRef.current = { lat, lon };
                const name = await reverseGeocode(lat, lon);
                setLocationName(name);
                localStorage.setItem('location_name', name);
            },
            () => { /* silently ignore watch errors */ },
            { enableHighAccuracy: false, timeout: 10_000, maximumAge: 30_000 }
        );

        watchIdRef.current = id;
        return () => {
            navigator.geolocation.clearWatch(id);
            watchIdRef.current = null;
        };
    }, [locationEnabled]);

    // ─── enableLocation (called once when user grants permission) ────────────
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
                            lastCoordsRef.current = { lat: data.latitude, lon: data.longitude };
                            setLocationName(name);
                            setLocationEnabled(true);
                            localStorage.setItem('location_enabled', 'true');
                            localStorage.setItem('location_name', name);
                        } catch {
                            setLocationEnabled(false);
                        }
                    } else {
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

        // Fallback: standard Geolocation API initial fetch
        // Use a cached position (up to 2 min old) for a near-instant response;
        // the live watcher below will update it if the user has moved.
        try {
            const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: false,
                    timeout: 5000,
                    maximumAge: 120_000,   // accept up to 2-min-old cached fix → instant
                })
            );
            const { latitude: lat, longitude: lon } = pos.coords;
            const name = await reverseGeocode(lat, lon);
            lastCoordsRef.current = { lat, lon };
            setLocationName(name);
            setLocationEnabled(true);
            localStorage.setItem('location_enabled', 'true');
            localStorage.setItem('location_name', name);
        } catch {
            setLocationEnabled(false);
        }
    }, []);

    // ─── disableLocation ─────────────────────────────────────────────────────
    const disableLocation = useCallback(() => {
        setLocationEnabled(false);
        localStorage.setItem('location_enabled', 'false');
        if (watchIdRef.current !== null && navigator.geolocation) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
    }, []);

    const markAsked = useCallback(() => {
        setLocationAsked(true);
        localStorage.setItem('location_asked', 'true');
    }, []);

    return (
        <LocationContext.Provider
            value={{ locationName, locationEnabled, locationAsked, locationHydrated, enableLocation, disableLocation, markAsked }}
        >
            {children}
        </LocationContext.Provider>
    );
}

export function useLocation() {
    return useContext(LocationContext);
}
