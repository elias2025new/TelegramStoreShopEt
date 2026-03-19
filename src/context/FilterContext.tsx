'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type SortOption = 'newest' | 'price-low' | 'price-high' | 'popular';

interface FilterState {
    minPrice: number;
    maxPrice: number;
    selectedSizes: string[];
    gender: string;
    category: string;
    subSubCategory: string;
    hideOutOfStock: boolean;
    onlyNewArrivals: boolean;
    sortBy: SortOption;
}

interface FilterContextType {
    filters: FilterState;
    tempFilters: FilterState;
    setTempFilters: React.Dispatch<React.SetStateAction<FilterState>>;
    applyFilters: () => void;
    resetFilters: () => void;
    isDrawerOpen: boolean;
    setDrawerOpen: (open: boolean) => void;
}

const initialFilterState: FilterState = {
    minPrice: 0,
    maxPrice: 10000,
    selectedSizes: [],
    gender: '',
    category: '',
    subSubCategory: '',
    hideOutOfStock: false,
    onlyNewArrivals: false,
    sortBy: 'newest',
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
    const [filters, setFilters] = useState<FilterState>(initialFilterState);
    const [tempFilters, setTempFilters] = useState<FilterState>(initialFilterState);
    const [isDrawerOpen, setDrawerOpen] = useState(false);

    const applyFilters = () => {
        setFilters(tempFilters);
        setDrawerOpen(false);
    };

    const resetFilters = () => {
        setFilters(initialFilterState);
        setTempFilters(initialFilterState);
    };

    return (
        <FilterContext.Provider value={{ 
            filters, 
            tempFilters, 
            setTempFilters, 
            applyFilters, 
            resetFilters, 
            isDrawerOpen, 
            setDrawerOpen 
        }}>
            {children}
        </FilterContext.Provider>
    );
}

export function useFilters() {
    const context = useContext(FilterContext);
    if (context === undefined) {
        throw new Error('useFilters must be used within a FilterProvider');
    }
    return context;
}
