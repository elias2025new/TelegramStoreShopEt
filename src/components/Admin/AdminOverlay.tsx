
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { supabase } from '@/utils/supabase/client';
import { useAdmin } from '@/context/AdminContext';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import AdminConfirmModal from './AdminConfirmModal';


const DRAFT_KEY = 'admin_product_draft';
const GENDERS = ['Men', 'Women', 'Unisex', 'Accessories'];

const CATEGORY_SUBCATEGORIES: Record<string, string[]> = {
    'Men': ['Shoes', 'Jackets & Coats', 'T-shirts', 'Trousers'],
    'Women': ['Dresses', 'Tops', 'Shoes', 'Bags'],
    'Unisex': ['Shoes', 'T-shirts', 'Trousers'],
    'Accessories': ['Watches', 'Sunglasses', 'Belts', 'Jewelry']
};

const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const SHOE_SIZES = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'];
const PRODUCT_SIZES = [...CLOTHING_SIZES, ...SHOE_SIZES];

interface ChoiceChipGroupProps {
    options: string[];
    selected: string;
    onChange: (value: string) => void;
    label?: string;
    onAddNew?: () => void;
}

function ChoiceChipGroup({ options, selected, onChange, label, onAddNew }: ChoiceChipGroupProps) {
    return (
        <div className="flex flex-col gap-1">
            {label && <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>}
            <div className="flex flex-wrap gap-1.5">
                {options.map((opt) => (
                    <button
                        key={opt}
                        type="button"
                        onClick={() => onChange(opt)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all duration-200 ${selected === opt
                            ? 'bg-yellow-500 text-black border-yellow-500 shadow-sm'
                            : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500'
                            }`}
                    >
                        {opt}
                    </button>
                ))}
                {onAddNew && (
                    <button
                        type="button"
                        onClick={onAddNew}
                        className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-800 text-yellow-500 border border-gray-700 hover:border-yellow-500 flex items-center justify-center p-0"
                    >
                        +
                    </button>
                )}
            </div>
        </div>
    );
}

interface MultiChoiceChipGroupProps {
    options: string[];
    selected: string[];
    onChange: (value: string[]) => void;
    stockValues?: Record<string, string>;
    onStockChange?: (size: string, value: string) => void;
    onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
    label?: string;
}

function MultiChoiceChipGroup({ options, selected, onChange, stockValues, onStockChange, onFocus, label }: MultiChoiceChipGroupProps) {
    const toggleOption = (opt: string) => {
        if (selected.includes(opt)) {
            onChange(selected.filter((s) => s !== opt));
        } else {
            onChange([...selected, opt]);
        }
    };

    return (
        <div className="flex flex-col gap-1">
            {label && <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>}
            <div className="flex flex-wrap gap-2">
                {options.map((opt) => {
                    const isSelected = selected.includes(opt);
                    return (
                        <div key={opt} className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => toggleOption(opt)}
                                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all duration-200 ${isSelected
                                    ? 'bg-yellow-500 text-black border-yellow-500 shadow-sm'
                                    : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500'
                                    }`}
                            >
                                {opt}
                            </button>
                            {isSelected && onStockChange && (
                                <input
                                    type="number"
                                    placeholder="Qty"
                                    maxLength={4}
                                    value={stockValues?.[opt] || ''}
                                    onChange={(e) => {
                                        if (e.target.value.length <= 4) {
                                            onStockChange(opt, e.target.value);
                                        }
                                    }}
                                    onFocus={onFocus}
                                    className="w-10 h-6 bg-gray-900 border border-gray-700 rounded text-[10px] text-white text-center focus:outline-none focus:border-yellow-500"
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

type Product = {
    id: string;
    name: string;
    price: number;
    category: string | null;
    gender: string | null;
    description: string | null;
    sizes: string[] | null;
    image_url: string | null;
    stock: Record<string, number> | null;
    created_at: string;
    additional_images?: string[] | null;
};

type Announcement = {
    title: string;
    content: string;
    type: 'announcement' | 'news' | 'vlog';
    media_url?: string;
};

interface ProductManageItemProps {
    product: Product;
    onUpdate: (id: string, updates: Partial<Product>) => Promise<void>;
    onDelete: (id: string, imageUrl: string | null) => Promise<void>;
    onChangeImage: (id: string) => void;
    isSelectMode?: boolean;
    isSelected?: boolean;
    onToggleSelect?: (id: string) => void;
}

function ProductManageItem({
    product,
    onUpdate,
    onDelete,
    onChangeImage,
    isSelectMode = false,
    isSelected = false,
    onToggleSelect
}: ProductManageItemProps) {
    const [localName, setLocalName] = useState(product.name);
    const [localPrice, setLocalPrice] = useState(product.price.toString());
    const [localCategory, setLocalCategory] = useState(product.category || '');
    const [localGender, setLocalGender] = useState(product.gender || '');
    const [localDescription, setLocalDescription] = useState(product.description || '');
    const [localSizes, setLocalSizes] = useState<string[]>(product.sizes || []);
    const [localStock, setLocalStock] = useState<Record<string, string>>(() => {
        const initialStock: Record<string, string> = {};
        if (product.stock) {
            Object.entries(product.stock).forEach(([k, v]) => {
                initialStock[k] = v.toString();
            });
        }
        return initialStock;
    });
    const [isSaving, setIsSaving] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isCustomCategory, setIsCustomCategory] = useState(false);
    const [descModalOpen, setDescModalOpen] = useState(false);
    const [modalDraft, setModalDraft] = useState('');
    const [localAdditionalImages, setLocalAdditionalImages] = useState<string[]>(product.additional_images || []);
    const [isUploadingAdditional, setIsUploadingAdditional] = useState(false);
    const additionalImagesInputRef = useRef<HTMLInputElement>(null);

    // Helper to get a clean stock object (numbers only) for comparison and saving
    const getCleanStock = (stockMap: Record<string, string>, activeSizes: string[]) => {
        const cleaned: Record<string, number> = {};
        Object.entries(stockMap).forEach(([k, v]) => {
            if (activeSizes.includes(k) && v !== '') {
                cleaned[k] = parseInt(v);
            }
        });
        return cleaned;
    };

    // Track if there are unsaved changes
    const currentCleanStock = getCleanStock(localStock, localSizes);
    const hasChanges =
        localName !== product.name ||
        localPrice !== product.price.toString() ||
        localCategory !== (product.category || '') ||
        localGender !== (product.gender || '') ||
        localDescription !== (product.description || '') ||
        JSON.stringify(currentCleanStock) !== JSON.stringify(product.stock || {}) ||
        JSON.stringify([...localSizes].sort()) !== JSON.stringify([...(product.sizes || [])].sort()) ||
        JSON.stringify(localAdditionalImages) !== JSON.stringify(product.additional_images || []);

    // Keep local state in sync if product changes externally (e.g. image update)
    useEffect(() => {
        setLocalName(product.name);
        setLocalPrice(product.price.toString());
        setLocalCategory(product.category || '');
        setLocalGender(product.gender || '');
        setLocalDescription(product.description || '');
        setLocalSizes(product.sizes || []);
        const initialStock: Record<string, string> = {};
        if (product.stock) {
            Object.entries(product.stock).forEach(([k, v]) => {
                initialStock[k] = v.toString();
            });
        }
        setLocalStock(initialStock);
        setLocalAdditionalImages(product.additional_images || []);
    }, [product]);

    const handleSave = async () => {
        const priceNum = parseFloat(localPrice);
        if (isNaN(priceNum)) {
            alert('Please enter a valid price');
            return;
        }

        setIsSaving(true);
        try {
            await onUpdate(product.id, {
                name: localName.trim(),
                price: priceNum,
                category: localCategory.trim(),
                gender: localGender,
                description: localDescription.trim() || null,
                sizes: localSizes,
                stock: Object.keys(currentCleanStock).length > 0 ? currentCleanStock : null,
                additional_images: localAdditionalImages,
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleFocus = (e: React.FocusEvent<HTMLElement>) => {
        const target = e.target as HTMLElement;
        setTimeout(() => {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
    };

    const openDescModal = () => {
        setModalDraft(localDescription);
        setDescModalOpen(true);
    };

    const saveDesc = () => {
        setLocalDescription(modalDraft);
        setDescModalOpen(false);
    };

    const handleAdditionalImagesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        if (localAdditionalImages.length + files.length > 5) {
            alert('Maximum 5 additional images allowed');
            return;
        }

        setIsUploadingAdditional(true);
        try {
            const newImages: string[] = [];
            for (const file of files) {
                // Compress and convert to base64 for preview/storage
                const base64 = await fileToBase64(file);
                const compressed = await compressImage(base64);

                // Upload to Supabase Storage
                const fileName = `${product.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
                const { data, error } = await supabase.storage
                    .from('products')
                    .upload(fileName, file);

                if (error) throw error;

                const { data: { publicUrl } } = supabase.storage
                    .from('products')
                    .getPublicUrl(fileName);

                newImages.push(publicUrl);
            }
            setLocalAdditionalImages(prev => [...prev, ...newImages]);
        } catch (err: any) {
            alert('Upload failed: ' + err.message);
        } finally {
            setIsUploadingAdditional(false);
            if (additionalImagesInputRef.current) additionalImagesInputRef.current.value = '';
        }
    };

    const removeAdditionalImage = (url: string) => {
        setLocalAdditionalImages(prev => prev.filter(img => img !== url));
    };

    const isShoes = localCategory.toLowerCase().includes('shoes');

    return (
        <>
            {/* Description Modal */}
            {descModalOpen && (
                <div
                    className="fixed inset-0 z-[200] flex items-end justify-center bg-black/70 backdrop-blur-sm p-4"
                    onClick={() => setDescModalOpen(false)}
                >
                    <div
                        className="w-full max-w-lg bg-white dark:bg-[#1c1c1e] rounded-2xl p-5 pb-8 border-t border-gray-200 dark:border-[#3a3a3a] flex flex-col gap-3 max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">Edit Description</span>
                            <button onClick={() => setDescModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                                </svg>
                            </button>
                        </div>
                        <textarea
                            autoFocus
                            value={modalDraft}
                            onChange={(e) => setModalDraft(e.target.value)}
                            placeholder="Enter a product description..."
                            rows={5}
                            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-[#3a3a3a] rounded-lg bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white focus:ring-1 focus:ring-[#cba153] focus:border-[#cba153] focus:outline-none placeholder-gray-400 dark:placeholder-gray-600 resize-none"
                        />
                        <button
                            onClick={saveDesc}
                            className="w-full py-2.5 rounded-xl font-bold text-sm text-black bg-[#cba153] hover:bg-[#b8860b] active:scale-95 transition-all"
                        >
                            Confirm Description
                        </button>

                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-[#2a2a2a]">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Additional Images ({localAdditionalImages.length}/5)</span>
                                {localAdditionalImages.length < 5 && (
                                    <button
                                        onClick={() => additionalImagesInputRef.current?.click()}
                                        disabled={isUploadingAdditional}
                                        className="text-[10px] font-black text-[#cba153] uppercase border border-[#cba153]/30 px-2 py-1 rounded-lg hover:bg-[#cba153]/10 transition-colors"
                                    >
                                        {isUploadingAdditional ? 'Uploading...' : '+ Add'}
                                    </button>
                                )}
                            </div>

                            <input
                                type="file"
                                ref={additionalImagesInputRef}
                                className="hidden"
                                accept="image/*"
                                multiple
                                onChange={handleAdditionalImagesSelect}
                            />

                            <div className="grid grid-cols-5 gap-2">
                                {localAdditionalImages.map((url, i) => (
                                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-black group">
                                        <img src={url} alt={`extra-${i}`} className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => removeAdditionalImage(url)}
                                            className="absolute top-0.5 right-0.5 p-1 bg-red-600/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                                {Array.from({ length: Math.max(0, 5 - localAdditionalImages.length) }).map((_, i) => (
                                    <div key={`empty-${i}`} className="aspect-square rounded-lg border-2 border-dashed border-gray-200 dark:border-[#2a2a2a] flex items-center justify-center">
                                        <span className="text-xs text-gray-400">+</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div
                className={`flex flex-col gap-2 p-2 bg-white dark:bg-[#1c1c1e] rounded-xl border transition-all ${isSelected ? 'border-[#cba153] shadow-md scale-[1.01]' : 'border-gray-200 dark:border-[#2a2a2a] shadow-sm'
                    } ${isSelectMode ? 'cursor-pointer active:scale-95' : ''}`}
                onClick={() => isSelectMode && onToggleSelect?.(product.id)}
            >
                <div className={`flex items-center gap-2 transition-opacity ${showDeleteConfirm && !isSelectMode ? 'opacity-20 pointer-events-none' : ''}`}>
                    {isSelectMode && (
                        <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-[#cba153] border-[#cba153]' : 'border-gray-300 dark:border-[#444]'
                                }`}>
                                {isSelected && (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                )}
                            </div>
                        </div>
                    )}
                    <div
                        className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-[#111111] cursor-pointer group"
                        onClick={(e) => {
                            if (isSelectMode) return;
                            e.stopPropagation();
                            onChangeImage(product.id);
                        }}
                    >
                        <img src={product.image_url || ''} alt={product.name} className="w-full h-full object-cover group-hover:opacity-75 transition-opacity" />
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col">
                        <input
                            type="text"
                            value={localName}
                            onChange={(e) => setLocalName(e.target.value)}
                            onFocus={handleFocus}
                            className="w-full bg-transparent border-none p-0 text-sm font-bold text-gray-900 dark:text-white focus:ring-0 truncate"
                        />
                        <div className="flex items-center gap-1">
                            <span className="text-xs text-[#cba153] font-bold">ETB</span>
                            <input
                                type="number"
                                value={localPrice}
                                onChange={(e) => setLocalPrice(e.target.value)}
                                onFocus={handleFocus}
                                className="bg-transparent border-none p-0 text-sm font-mono font-bold text-gray-500 dark:text-gray-400 focus:ring-0 w-24"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={openDescModal}
                            className={`p-1.5 rounded-lg transition-colors ${localDescription ? 'text-[#cba153] bg-[#cba153]/10' : 'text-gray-400 bg-gray-100 dark:bg-[#2a2a2a]'}`}
                            title="Edit Description"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                <line x1="9" x2="15" y1="10" y2="10" />
                                <line x1="9" x2="15" y1="14" y2="14" />
                            </svg>
                        </button>
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            </svg>
                        </button>
                    </div>
                </div>

                {!showDeleteConfirm && (
                    <div className="flex flex-col gap-3 mt-1 pt-2 border-t border-gray-100 dark:border-[#2a2a2a]">
                        <ChoiceChipGroup
                            label="Primary Category"
                            options={GENDERS}
                            selected={localGender}
                            onChange={(val) => {
                                setLocalGender(val);
                                setLocalCategory('');
                                setLocalSizes([]);
                            }}
                        />

                        {localGender && (
                            isCustomCategory ? (
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sub Category</span>
                                        <button onClick={() => setIsCustomCategory(false)} className="text-[10px] text-yellow-500 font-bold">Back</button>
                                    </div>
                                    <input
                                        type="text"
                                        value={localCategory}
                                        onChange={(e) => setLocalCategory(e.target.value)}
                                        placeholder="Type category..."
                                        className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-[#2a2a2a] rounded-lg bg-gray-50 dark:bg-[#0a0a0a] text-white focus:ring-1 focus:ring-yellow-500 focus:outline-none"
                                    />
                                </div>
                            ) : (
                                <ChoiceChipGroup
                                    label="Sub Category"
                                    options={CATEGORY_SUBCATEGORIES[localGender] || []}
                                    selected={localCategory}
                                    onChange={(val) => {
                                        setLocalCategory(val);
                                        setLocalSizes([]);
                                    }}
                                    onAddNew={() => setIsCustomCategory(true)}
                                />
                            )
                        )}

                        {localCategory && localGender !== 'Accessories' && (
                            <MultiChoiceChipGroup
                                label="Available Sizes & Stock"
                                options={isShoes ? SHOE_SIZES : CLOTHING_SIZES}
                                selected={localSizes}
                                onChange={(newSizes) => {
                                    setLocalSizes(newSizes);
                                    // Clean up stock values for sizes that were removed
                                    setLocalStock(prev => {
                                        const next = { ...prev };
                                        Object.keys(next).forEach(k => {
                                            if (!newSizes.includes(k)) delete next[k];
                                        });
                                        return next;
                                    });
                                }}
                                stockValues={localStock}
                                onStockChange={(size, val) => {
                                    setLocalStock(prev => ({ ...prev, [size]: val }));
                                }}
                                onFocus={handleFocus}
                            />
                        )}

                        {hasChanges && (
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className={`w-full py-1.5 rounded-lg text-[11px] font-bold text-black transition-all ${isSaving ? 'bg-gray-600' : 'bg-[#cba153] hover:bg-[#b8860b]'}`}
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        )}
                    </div>
                )}

                {showDeleteConfirm && (
                    <div className="flex items-center justify-between p-3 bg-red-900/10 rounded-xl border border-red-900/20">
                        <span className="text-sm font-bold text-red-500">Delete?</span>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-gray-100 dark:bg-[#1c1c1e] text-gray-500 border border-gray-300 dark:border-gray-700"
                            >
                                No
                            </button>
                            <button
                                onClick={() => onDelete(product.id, product.image_url)}
                                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-red-600 text-white border border-red-700 shadow-lg shadow-red-900/20"
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

interface ImageItem {
    file: File;
    preview: string;   // object URL or base64 data URL
    base64: string;    // data URL — used for serialisation
    title: string;
    price: string;
    category: string;
    gender: string;
    description: string;
    sizes: string[];
    stock: Record<string, string>;
    fileName: string;
    additionalImages: string[];
}

interface SerializedItem {
    base64: string;
    title: string;
    price: string;
    category: string;
    gender: string;
    description: string;
    sizes: string[];
    stock: Record<string, string>;
    fileName: string;
    additionalImages: string[];
}

interface UploadItemRowProps {
    item: ImageItem;
    index: number;
    updateItem: (index: number, field: 'title' | 'price' | 'category' | 'gender' | 'description' | 'sizes' | 'stock' | 'additionalImages', value: any) => void;
    removeItem: (index: number) => void;
    onPublish: (index: number) => Promise<void>;
}

function UploadItemRow({ item, index, updateItem, removeItem, onPublish }: UploadItemRowProps) {
    const [localTitle, setLocalTitle] = useState(item.title);
    const [localPrice, setLocalPrice] = useState(item.price);
    const [localCategory, setLocalCategory] = useState(item.category);
    const [localGender, setLocalGender] = useState(item.gender);
    const [localDescription, setLocalDescription] = useState(item.description);
    const [localSizes, setLocalSizes] = useState<string[]>(item.sizes || []);
    const [localStock, setLocalStock] = useState<Record<string, string>>(item.stock || {});
    const [localAdditionalImages, setLocalAdditionalImages] = useState<string[]>(item.additionalImages || []);
    const [isProcessingImages, setIsProcessingImages] = useState(false);
    const additionalImagesInputRef = useRef<HTMLInputElement>(null);
    const [isCustomCategory, setIsCustomCategory] = useState(false);
    const [descModalOpen, setDescModalOpen] = useState(false);
    const [modalDraft, setModalDraft] = useState('');
    const [isPushing, setIsPushing] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    useEffect(() => {
        setLocalTitle(item.title);
        setLocalPrice(item.price);
        setLocalCategory(item.category);
        setLocalGender(item.gender);
        setLocalDescription(item.description);
        setLocalSizes(item.sizes || []);
        setLocalStock(item.stock || {});
        setLocalAdditionalImages(item.additionalImages || []);
    }, [item.title, item.price, item.category, item.gender, item.description, item.sizes, item.stock, item.additionalImages]);

    const handleFocus = (e: React.FocusEvent<HTMLElement>) => {
        const target = e.target as HTMLElement;
        setTimeout(() => {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
    };

    const openDescModal = () => {
        setModalDraft(localDescription);
        setDescModalOpen(true);
    };

    const saveDesc = () => {
        setLocalDescription(modalDraft);
        updateItem(index, 'description', modalDraft);
        setDescModalOpen(false);
    };

    const handleAdditionalImagesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        if (localAdditionalImages.length + files.length > 5) {
            alert('Maximum 5 additional images allowed');
            return;
        }

        setIsProcessingImages(true);
        try {
            const newImages: string[] = [];
            for (const file of files) {
                const base64 = await fileToBase64(file);
                const compressed = await compressImage(base64);
                newImages.push(compressed);
            }
            const updated = [...localAdditionalImages, ...newImages];
            setLocalAdditionalImages(updated);
            updateItem(index, 'additionalImages', updated);
        } catch (err: any) {
            alert('Image processing failed: ' + err.message);
        } finally {
            setIsProcessingImages(false);
            if (additionalImagesInputRef.current) additionalImagesInputRef.current.value = '';
        }
    };

    const removeAdditionalImage = (imgBase64: string) => {
        const updated = localAdditionalImages.filter(img => img !== imgBase64);
        setLocalAdditionalImages(updated);
        updateItem(index, 'additionalImages', updated);
    };

    const handlePush = async () => {
        if (!localTitle.trim()) {
            setLocalError('Title required');
            setTimeout(() => setLocalError(null), 3000);
            return;
        }
        if (!localPrice || parseFloat(localPrice) <= 0) {
            setLocalError('Price required');
            setTimeout(() => setLocalError(null), 3000);
            return;
        }
        if (!localGender) {
            setLocalError('Select Category');
            setTimeout(() => setLocalError(null), 3000);
            return;
        }

        setIsPushing(true);
        try {
            await onPublish(index);
        } catch (err: any) {
            setLocalError(err.message || 'Push failed');
            setTimeout(() => setLocalError(null), 4000);
        } finally {
            setIsPushing(false);
        }
    };

    const isShoes = localCategory.toLowerCase().includes('shoes');

    return (
        <>
            {/* Description Modal */}
            {descModalOpen && (
                <div
                    className="fixed inset-0 z-[200] flex items-end justify-center bg-black/70 backdrop-blur-sm p-4"
                    onClick={() => setDescModalOpen(false)}
                >
                    <div
                        className="w-full max-w-lg bg-white dark:bg-[#1c1c1e] rounded-2xl p-5 pb-8 border-t border-gray-200 dark:border-[#3a3a3a] flex flex-col gap-3 max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">Description</span>
                            <button onClick={() => setDescModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                                </svg>
                            </button>
                        </div>
                        <textarea
                            autoFocus
                            value={modalDraft}
                            onChange={(e) => setModalDraft(e.target.value)}
                            placeholder="Enter a product description..."
                            rows={5}
                            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-[#3a3a3a] rounded-lg bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white focus:ring-1 focus:ring-[#cba153] focus:border-[#cba153] focus:outline-none placeholder-gray-400 dark:placeholder-gray-600 resize-none"
                        />
                        <button
                            onClick={saveDesc}
                            className="w-full py-2.5 rounded-xl font-bold text-sm text-black bg-[#cba153] hover:bg-[#b8860b] active:scale-95 transition-all"
                        >
                            Save Description
                        </button>

                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-[#2a2a2a]">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Additional Images ({localAdditionalImages.length}/5)</span>
                                {localAdditionalImages.length < 5 && (
                                    <button
                                        onClick={() => additionalImagesInputRef.current?.click()}
                                        disabled={isProcessingImages}
                                        className="text-[10px] font-black text-[#cba153] uppercase border border-[#cba153]/30 px-2 py-1 rounded-lg hover:bg-[#cba153]/10 transition-colors"
                                    >
                                        {isProcessingImages ? 'Processing...' : '+ Add'}
                                    </button>
                                )}
                            </div>

                            <input
                                type="file"
                                ref={additionalImagesInputRef}
                                className="hidden"
                                accept="image/*"
                                multiple
                                onChange={handleAdditionalImagesSelect}
                            />

                            <div className="grid grid-cols-5 gap-2">
                                {localAdditionalImages.map((base64, i) => (
                                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-black group">
                                        <img src={base64} alt={`extra-${i}`} className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => removeAdditionalImage(base64)}
                                            className="absolute top-0.5 right-0.5 p-1 bg-red-600/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                                {Array.from({ length: Math.max(0, 5 - localAdditionalImages.length) }).map((_, i) => (
                                    <div key={`empty-${i}`} className="aspect-square rounded-lg border-2 border-dashed border-gray-200 dark:border-[#2a2a2a] flex items-center justify-center">
                                        <span className="text-xs text-gray-400">+</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className={`flex flex-col gap-2 p-2 bg-white dark:bg-[#1c1c1e] rounded-xl border border-gray-200 dark:border-[#2a2a2a] shadow-sm transition-opacity ${isPushing ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex items-center gap-2">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-[#0a0a0a]">
                        <img src={item.preview} alt="preview" className="w-full h-full object-cover" />
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col">
                        <input
                            type="text"
                            placeholder="Title/brand"
                            value={localTitle}
                            onChange={(e) => {
                                setLocalTitle(e.target.value);
                                updateItem(index, 'title', e.target.value);
                            }}
                            onFocus={handleFocus}
                            className="w-full bg-transparent border-none p-0 text-sm font-bold text-gray-900 dark:text-white focus:ring-0 truncate"
                        />
                        <div className="flex items-center gap-1">
                            <span className="text-xs text-[#cba153] font-bold">ETB</span>
                            <input
                                type="number"
                                placeholder="0"
                                value={localPrice}
                                onChange={(e) => {
                                    setLocalPrice(e.target.value);
                                    updateItem(index, 'price', e.target.value);
                                }}
                                onFocus={handleFocus}
                                className="bg-transparent border-none p-0 text-sm font-mono font-bold text-gray-500 dark:text-gray-400 focus:ring-0 w-24"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={openDescModal}
                            title="Edit Description"
                            className={`p-1.5 rounded-lg transition-colors ${localDescription ? 'text-[#cba153] bg-[#cba153]/10' : 'text-gray-400 bg-gray-100 dark:bg-[#2a2a2a]'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                <line x1="9" x2="15" y1="10" y2="10" />
                                <line x1="9" x2="15" y1="14" y2="14" />
                            </svg>
                        </button>
                        <button
                            onClick={handlePush}
                            disabled={isPushing}
                            className="relative px-3 py-1.5 bg-[#cba153] text-black text-[11px] font-bold rounded-lg hover:bg-[#b8860b] active:scale-95 transition-all shadow-sm"
                        >
                            {isPushing ? '...' : 'Push'}
                            {localError && (
                                <div className="absolute bottom-full mb-2 right-0 bg-red-600 text-white text-[9px] px-2 py-1 rounded shadow-lg whitespace-nowrap animate-bounce z-10">
                                    {localError}
                                    <div className="absolute top-full right-4 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-red-600"></div>
                                </div>
                            )}
                        </button>
                        <button
                            onClick={() => removeItem(index)}
                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-3 mt-1 pt-2 border-t border-gray-100 dark:border-[#2a2a2a]">
                    <ChoiceChipGroup
                        label="Primary Category"
                        options={GENDERS}
                        selected={localGender}
                        onChange={(val) => {
                            setLocalGender(val);
                            updateItem(index, 'gender', val);
                            // Reset subcategory and sizes
                            setLocalCategory('');
                            updateItem(index, 'category', '');
                            setLocalSizes([]);
                            updateItem(index, 'sizes', []);
                        }}
                    />

                    {localGender && (
                        isCustomCategory ? (
                            <div className="flex flex-col gap-1.5">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Sub Category</span>
                                    <button
                                        onClick={() => setIsCustomCategory(false)}
                                        className="text-[10px] text-yellow-500 font-bold"
                                    >
                                        Back
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    value={localCategory}
                                    onChange={(e) => {
                                        setLocalCategory(e.target.value);
                                        updateItem(index, 'category', e.target.value);
                                    }}
                                    placeholder="Type category..."
                                    className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-[#2a2a2a] rounded-lg bg-gray-50 dark:bg-[#0a0a0a] text-white focus:ring-1 focus:ring-yellow-500 focus:outline-none"
                                />
                            </div>
                        ) : (
                            <ChoiceChipGroup
                                label="What is it?"
                                options={CATEGORY_SUBCATEGORIES[localGender] || []}
                                selected={localCategory}
                                onChange={(val) => {
                                    setLocalCategory(val);
                                    updateItem(index, 'category', val);
                                    // Reset sizes
                                    setLocalSizes([]);
                                    updateItem(index, 'sizes', []);
                                }}
                                onAddNew={() => setIsCustomCategory(true)}
                            />
                        )
                    )}

                    {localCategory && localGender !== 'Accessories' && (
                        <MultiChoiceChipGroup
                            label="Available Sizes & Stock"
                            options={isShoes ? SHOE_SIZES : CLOTHING_SIZES}
                            selected={localSizes}
                            onChange={(val) => {
                                setLocalSizes(val);
                                updateItem(index, 'sizes', val);
                                // Clean up stock values
                                const nextStock = { ...localStock };
                                Object.keys(nextStock).forEach(k => {
                                    if (!val.includes(k)) delete nextStock[k];
                                });
                                setLocalStock(nextStock);
                                updateItem(index, 'stock', nextStock);
                            }}
                            stockValues={localStock}
                            onStockChange={(size, val) => {
                                const nextStock = { ...localStock, [size]: val };
                                setLocalStock(nextStock);
                                updateItem(index, 'stock', nextStock);
                            }}
                            onFocus={handleFocus}
                        />
                    )}
                </div>
            </div>
        </>
    );
}

interface AdminOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

/** Convert a File to a base64 data-URL string */
function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/** Re-create a File from a base64 data-URL */
function base64ToFile(dataUrl: string, fileName: string): File {
    const [header, data] = dataUrl.split(',');
    const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new File([bytes], fileName, { type: mime });
}

/** Compress a base64 image for localStorage (Draft) */
function compressImage(base64: string, maxWidth = 300, quality = 0.6): Promise<string> {
    return new Promise((resolve) => {
        const img = new window.Image();
        img.src = base64;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
    });
}

export default function AdminOverlay({ isOpen, onClose }: AdminOverlayProps) {
    const { storeId } = useAdmin();
    const queryClient = useQueryClient();
    const [view, setView] = useState<'upload' | 'manage'>('upload');
    const [images, setImages] = useState<ImageItem[]>([]);
    const [existingProducts, setExistingProducts] = useState<Product[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');
    const [draftRestored, setDraftRestored] = useState(false);
    const [stats, setStats] = useState({ today: 0, week: 0, totalProducts: 0 });
    const [isLoadingStats, setIsLoadingStats] = useState(true);

    const [announceModalOpen, setAnnounceModalOpen] = useState(false);
    const [announceForm, setAnnounceForm] = useState<Announcement>({
        title: '',
        content: '',
        type: 'announcement',
        media_url: '',
    });
    const [announceError, setAnnounceError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const editFileInputRef = useRef<HTMLInputElement>(null);
    const [editingProductId, setEditingProductId] = useState<string | null>(null);
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
    const [isDeletingBulk, setIsDeletingBulk] = useState(false);
    const [deleteMenuOpen, setDeleteMenuOpen] = useState(false);
    const [isConfirmingDraftClear, setIsConfirmingDraftClear] = useState(false);
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        confirmText: string;
        onConfirm: () => void;
        variant: 'danger' | 'warning';
    }>({
        isOpen: false,
        title: '',
        description: '',
        confirmText: '',
        onConfirm: () => { },
        variant: 'danger'
    });
    const hasRestoredRef = useRef(false); // prevent double-restore on re-renders

    // ── Restore draft on first open ─────────────────────────────────────────
    useEffect(() => {
        if (!isOpen || hasRestoredRef.current) return;
        hasRestoredRef.current = true;

        try {
            const raw = localStorage.getItem(DRAFT_KEY);
            if (!raw) return;
            const saved: SerializedItem[] = JSON.parse(raw);
            if (!Array.isArray(saved) || saved.length === 0) return;

            const restored: ImageItem[] = saved.map((s) => ({
                file: base64ToFile(s.base64, s.fileName),
                preview: s.base64,   // use base64 directly as img src — works fine
                base64: s.base64,
                title: s.title || '',
                price: s.price,
                category: s.category || '',
                gender: s.gender || '',
                description: s.description || '',
                sizes: s.sizes || [],
                stock: s.stock || {},
                fileName: s.fileName,
                additionalImages: s.additionalImages || [],
            }));

            setImages(restored);
            setDraftRestored(true);
            // Hide the "Draft restored" badge after 3 s
            setTimeout(() => setDraftRestored(false), 3000);
        } catch {
            // Corrupt data — wipe it
            localStorage.removeItem(DRAFT_KEY);
        }
    }, [isOpen]);

    // ── Persist draft whenever images change ────────────────────────────────
    useEffect(() => {
        if (images.length === 0) return; // don't overwrite with empty (let publish clear it)
        const serialized: SerializedItem[] = images.map((item) => ({
            base64: item.base64,
            title: item.title,
            price: item.price,
            category: item.category,
            gender: item.gender,
            description: item.description,
            sizes: item.sizes,
            stock: item.stock,
            fileName: item.fileName,
            additionalImages: item.additionalImages || [],
        }));
        try {
            localStorage.setItem(DRAFT_KEY, JSON.stringify(serialized));
        } catch {
            // Storage quota exceeded — silently ignore
        }
    }, [images]);

    // ── File select ─────────────────────────────────────────────────────────
    const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const newItems: ImageItem[] = await Promise.all(
            files.map(async (file) => {
                const fullResBase64 = await fileToBase64(file);
                const compressedBase64 = await compressImage(fullResBase64);
                return {
                    file,
                    preview: fullResBase64,
                    base64: compressedBase64, // specifically for the draft storage
                    title: '',
                    price: '',
                    category: '',
                    gender: '',
                    description: '',
                    sizes: [],
                    stock: {},
                    fileName: file.name,
                    additionalImages: [],
                };
            })
        );
        setImages((prev) => [...prev, ...newItems]);
        // reset input so the same file can be re-selected if removed
        e.target.value = '';
    }, []);

    const updateItem = (index: number, field: 'title' | 'price' | 'category' | 'gender' | 'description' | 'sizes' | 'stock' | 'additionalImages', value: any) => {
        setImages((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
    };

    const removeItem = (index: number) => {
        setImages((prev) => {
            const next = prev.filter((_, i) => i !== index);
            // If all items removed, clear draft immediately
            if (next.length === 0) localStorage.removeItem(DRAFT_KEY);
            return next;
        });
    };

    // ── Fetch products when manage view is active ──────────────────────────
    const fetchProducts = useCallback(async () => {
        setIsLoadingProducts(true);
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setExistingProducts(data || []);
        } catch (err: any) {
            console.error('Error fetching products:', err.message);
        } finally {
            setIsLoadingProducts(false);
        }
    }, []);

    // ── Fetch Analytics Stats ──────────────────────────────────────────────
    const fetchStats = useCallback(async () => {
        if (!storeId) return;
        setIsLoadingStats(true);
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayStr = today.toISOString();

            const lastWeek = new Date();
            lastWeek.setDate(lastWeek.getDate() - 7);
            const lastWeekStr = lastWeek.toISOString();

            const [todayCount, weekCount, productsCount] = await Promise.all([
                supabase.from('store_visits')
                    .select('*', { count: 'exact', head: true })
                    .eq('store_id', storeId)
                    .gte('visited_at', todayStr),
                supabase.from('store_visits')
                    .select('*', { count: 'exact', head: true })
                    .eq('store_id', storeId)
                    .gte('visited_at', lastWeekStr),
                supabase.from('products')
                    .select('*', { count: 'exact', head: true })
            ]);

            setStats({
                today: todayCount.count || 0,
                week: weekCount.count || 0,
                totalProducts: productsCount.count || 0
            });
        } catch (err) {
            console.error('Stats fetch failed:', err);
        } finally {
            setIsLoadingStats(false);
        }
    }, [storeId]);

    useEffect(() => {
        if (isOpen && storeId) {
            fetchStats();
        }
    }, [isOpen, storeId, fetchStats]);

    useEffect(() => {
        if (view === 'manage' && isOpen) {
            fetchProducts();
        }
    }, [view, isOpen, fetchProducts]);

    // ── Manage Existing Products ──────────────────────────────────────────
    const handleUpdateProduct = async (id: string, updates: Partial<Product>) => {
        try {
            const { error, count } = await supabase
                .from('products')
                .update(updates)
                .eq('id', id);

            if (error) throw error;

            // Check if the update actually happened (RLS might block it silently)
            if (count === 0) {
                throw new Error('Update failed: You might not have permission to edit this product.');
            }

            // Aggressively reset React Query cache to sync storefront immediately
            queryClient.resetQueries({ queryKey: ['products'] });

            setExistingProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
            setUploadStatus('✅ Product updated successfully!');

            if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
                window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
            }

            setTimeout(() => setUploadStatus(''), 3000);
        } catch (err: any) {
            setUploadStatus(`❌ Error updating: ${err.message}`);
        }
    };

    const handleDeleteProduct = async (id: string, imageUrl: string | null) => {
        try {
            // Delete from database
            const { error: dbError, count } = await supabase
                .from('products')
                .delete()
                .eq('id', id);

            if (dbError) throw dbError;

            if (count === 0) {
                throw new Error('Delete failed: You might not have permission to delete this product.');
            }

            // Aggressively reset React Query cache to sync storefront immediately
            queryClient.resetQueries({ queryKey: ['products'] });

            // Optional: Delete from storage if you want to keep bucket clean
            if (imageUrl) {
                const fileName = imageUrl.split('/').pop();
                if (fileName) {
                    await supabase.storage.from('products').remove([`products/${fileName}`]);
                }
            }

            setExistingProducts((prev) => prev.filter((p) => p.id !== id));
            setUploadStatus('✅ Product deleted.');

            if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
                window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
            }

            setTimeout(() => setUploadStatus(''), 3000);
        } catch (err: any) {
            setUploadStatus(`❌ Error deleting: ${err.message}`);
        }
    };

    const handleChangeProductImage = async (productId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setUploadStatus('Updating image...');

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
            const filePath = `products/${fileName}`;

            const { error: storageError } = await supabase.storage
                .from('products')
                .upload(filePath, file);

            if (storageError) throw storageError;

            const { data: urlData } = supabase.storage.from('products').getPublicUrl(filePath);

            await handleUpdateProduct(productId, { image_url: urlData.publicUrl });
        } catch (err: any) {
            setUploadStatus(`❌ Error: ${err.message}`);
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const handleIndividualPublish = async (index: number) => {
        const item = images[index];
        if (!item) return;

        try {
            const fileExt = item.fileName.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
            const filePath = `products/${fileName}`;

            const { error: storageError } = await supabase.storage
                .from('products')
                .upload(filePath, item.file);

            if (storageError) throw storageError;

            const { data: urlData } = supabase.storage.from('products').getPublicUrl(filePath);

            const productData = {
                name: item.title.trim(),
                price: parseFloat(item.price),
                category: item.category?.trim() || null,
                gender: item.gender,
                description: item.description || null,
                sizes: item.sizes || [],
                stock: (() => {
                    const cleanedStock: Record<string, number> = {};
                    if (item.stock) {
                        Object.entries(item.stock).forEach(([k, v]) => {
                            if (item.sizes.includes(k) && v !== '') {
                                cleanedStock[k] = parseInt(v);
                            }
                        });
                    }
                    return Object.keys(cleanedStock).length > 0 ? cleanedStock : null;
                })(),
                image_url: urlData.publicUrl,
                additional_images: await (async () => {
                    const extraUrls: string[] = [];
                    if (item.additionalImages && item.additionalImages.length > 0) {
                        for (let i = 0; i < item.additionalImages.length; i++) {
                            const b64 = item.additionalImages[i];
                            const file = base64ToFile(b64, `extra-${i}.jpg`);
                            const extraPath = `products/${Date.now()}-extra-${i}-${Math.random().toString(36).slice(2)}.jpg`;
                            const { error: err } = await supabase.storage.from('products').upload(extraPath, file);
                            if (!err) {
                                const { data } = supabase.storage.from('products').getPublicUrl(extraPath);
                                extraUrls.push(data.publicUrl);
                            }
                        }
                    }
                    return extraUrls;
                })(),
            };

            const { error: insertError } = await supabase.from('products').insert([productData]);
            if (insertError) throw insertError;

            // Update local state
            const updatedImages = images.filter((_, i) => i !== index);
            setImages(updatedImages);

            // Draft is automatically updated via useEffect on 'images'

            queryClient.resetQueries({ queryKey: ['products'] });
            setUploadStatus('✅ PRODUCT PUBLISHED: ' + item.title);

            if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
                window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
            }

            setTimeout(() => setUploadStatus(''), 3000);
        } catch (err: any) {
            setUploadStatus('ERROR: ' + err.message);
            throw err;
        }
    };

    const handleSaveAnnouncement = async () => {
        setAnnounceError(null);
        if (!announceForm.title.trim() || !announceForm.content.trim()) {
            setAnnounceError('Title and Content are required');
            return;
        }

        setIsUploading(true);
        setUploadStatus('Broadcasting announcement...');

        try {
            // Check if storeId exists
            if (!storeId) throw new Error('Store ID not found. Are you an admin?');

            const { error } = await supabase.from('announcements').insert([{
                title: announceForm.title.trim(),
                content: announceForm.content.trim(),
                type: announceForm.type,
                media_url: announceForm.media_url?.trim() || null,
                store_id: storeId
            }]);

            if (error) throw error;

            setAnnounceModalOpen(false);
            setAnnounceForm({ title: '', content: '', type: 'announcement', media_url: '' });
            setUploadStatus('SUCCESS: ANNOUNCEMENT BROADCAST SUCCESSFUL!');
            if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
                window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
            }
            setTimeout(() => setUploadStatus(''), 4000);
        } catch (err: any) {
            setAnnounceError('Broadcast failed: ' + err.message);
            setUploadStatus('ERROR: ' + err.message);
            setTimeout(() => setUploadStatus(''), 4000);
        } finally {
            setIsUploading(false);
        }
    };

    const handlePublish = async () => {
        if (images.length === 0) return;
        const invalid = images.find((img) => !img.price || parseFloat(img.price) <= 0 || !img.title.trim() || !img.gender);
        if (invalid) {
            setUploadStatus('ERROR: Title, price, and primary category are required.');
            setTimeout(() => setUploadStatus(''), 4000);
            return;
        }

        setIsUploading(true);
        setUploadStatus('Pushing all products...');

        try {
            const results = await Promise.all(
                images.map(async (item) => {
                    const fileExt = item.fileName.split('.').pop();
                    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
                    const filePath = `products/${fileName}`;

                    const { error: storageError } = await supabase.storage
                        .from('products')
                        .upload(filePath, item.file);

                    if (storageError) throw storageError;

                    const { data: urlData } = supabase.storage.from('products').getPublicUrl(filePath);

                    return {
                        name: item.title.trim(),
                        price: parseFloat(item.price),
                        category: item.category?.trim() || null,
                        gender: item.gender,
                        description: item.description || null,
                        sizes: item.sizes || [],
                        stock: (() => {
                            const cleanedStock: Record<string, number> = {};
                            if (item.stock) {
                                Object.entries(item.stock).forEach(([k, v]) => {
                                    if (item.sizes.includes(k) && v !== '') {
                                        cleanedStock[k] = parseInt(v);
                                    }
                                });
                            }
                            return Object.keys(cleanedStock).length > 0 ? cleanedStock : null;
                        })(),
                        image_url: urlData.publicUrl,
                        additional_images: await (async () => {
                            const extraUrls: string[] = [];
                            if (item.additionalImages && item.additionalImages.length > 0) {
                                for (let i = 0; i < item.additionalImages.length; i++) {
                                    const b64 = item.additionalImages[i];
                                    const file = base64ToFile(b64, `extra-${i}.jpg`);
                                    const extraPath = `products/${Date.now()}-extra-${i}-${Math.random().toString(36).slice(2)}.jpg`;
                                    const { error: err } = await supabase.storage.from('products').upload(extraPath, file);
                                    if (!err) {
                                        const { data } = supabase.storage.from('products').getPublicUrl(extraPath);
                                        extraUrls.push(data.publicUrl);
                                    }
                                }
                            }
                            return extraUrls;
                        })(),
                    };
                })
            );

            const { error: insertError } = await supabase.from('products').insert(results);
            if (insertError) throw insertError;

            // Aggressively reset React Query cache to sync storefront immediately
            queryClient.resetQueries({ queryKey: ['products'] });

            // ✅ Clear draft on success
            localStorage.removeItem(DRAFT_KEY);
            hasRestoredRef.current = false; // allow fresh restore next time
            setImages([]);
            setUploadStatus(`✅ ${results.length} product(s) published!`);
            if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
                window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
            }
        } finally {
            setIsUploading(false);
        }
    };
    const handleBulkDeleteAll = async () => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete All Products?',
            description: 'This action cannot be undone. All products and their images will be permanently removed from the store.',
            confirmText: 'Yes, Delete Everything',
            variant: 'danger',
            onConfirm: async () => {
                setIsDeletingBulk(true);
                setUploadStatus('Deleting all products...');
                try {
                    const { error } = await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                    if (error) throw error;

                    setUploadStatus('SUCCESS: ALL PRODUCTS DELETED');
                    queryClient.resetQueries({ queryKey: ['products'] });
                    fetchProducts();
                } catch (err: any) {
                    setUploadStatus('ERROR: ' + err.message);
                } finally {
                    setIsDeletingBulk(false);
                    setTimeout(() => setUploadStatus(''), 4000);
                }
            }
        });
    };

    const handleDeleteSelected = async () => {
        if (selectedProductIds.size === 0) return;

        setConfirmModal({
            isOpen: true,
            title: `Delete ${selectedProductIds.size} Products?`,
            description: `You are about to delete ${selectedProductIds.size} selected items. This action is permanent and will remove them from the store.`,
            confirmText: 'Delete Selected',
            variant: 'danger',
            onConfirm: async () => {
                setIsDeletingBulk(true);
                setUploadStatus(`Deleting ${selectedProductIds.size} products...`);
                try {
                    const ids = Array.from(selectedProductIds);
                    const { error } = await supabase.from('products').delete().in('id', ids);
                    if (error) throw error;

                    setUploadStatus(`SUCCESS: ${ids.length} PRODUCTS DELETED`);
                    setIsSelectMode(false);
                    setSelectedProductIds(new Set());
                    queryClient.resetQueries({ queryKey: ['products'] });
                    fetchProducts();
                } catch (err: any) {
                    setUploadStatus('ERROR: ' + err.message);
                } finally {
                    setIsDeletingBulk(false);
                    setTimeout(() => setUploadStatus(''), 4000);
                }
            }
        });
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex flex-col bg-gray-50 dark:bg-[#0a0a0a]"
            style={{
                paddingTop: 'calc(var(--tg-safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px))',
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between gap-1.5 px-3 py-2 border-b border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#0a0a0a]">
                <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                    <img src="https://img.icons8.com/ios-filled/50/cba153/manager.png" alt="admin" className="w-4 h-4 flex-shrink-0" />
                    <h2 className="text-sm font-black text-[#cba153] truncate">Admin</h2>
                    {draftRestored && view === 'upload' && (
                        <span className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#cba153]/20 text-[#cba153] animate-pulse">
                            Draft
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                        onClick={() => setView(view === 'upload' ? 'manage' : 'upload')}
                        className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${view === 'manage'
                            ? 'bg-[#cba153]/20 text-[#cba153] border border-[#cba153]/30'
                            : 'bg-gray-100 dark:bg-[#1c1c1e] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-[#2a2a2a]'
                            }`}
                    >
                        <img
                            src={view === 'upload' ? "https://img.icons8.com/ios-filled/50/cba153/settings.png" : "https://img.icons8.com/ios-filled/50/cba153/plus-math.png"}
                            alt="icon"
                            className="w-3.5 h-3.5"
                        />
                        <span>{view === 'upload' ? 'Manage' : 'Add'}</span>
                    </button>
                    <button
                        onClick={() => setAnnounceModalOpen(true)}
                        className="px-2 py-1 rounded-lg text-xs font-bold bg-[#cba153]/10 text-[#cba153] border border-[#cba153]/30 transition-all flex items-center gap-1.5"
                    >
                        <img
                            src="https://img.icons8.com/ios-filled/50/cba153/megaphone.png"
                            alt="icon"
                            className="w-3.5 h-3.5"
                        />
                        <span>Broadcast</span>
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#1c1c1e] transition-colors text-gray-700 dark:text-white"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Content Body - Flexible area preventing button pushout */}
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 scroll-smooth transform-gpu">
                {/* Store Analytics Section */}
                {view === 'upload' && (
                    <div className="mb-6 space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900 dark:text-white uppercase text-[11px] tracking-wider flex items-center gap-1.5 font-sans">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                Store Analytics
                            </h3>
                            <button
                                onClick={fetchStats}
                                className="text-[10px] font-bold text-[#cba153] hover:underline"
                            >
                                Refresh
                            </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2.5">
                            {/* KPI Card 1: Today */}
                            <div className="bg-[#1a1a1a] border border-white/[0.05] p-3 rounded-2xl shadow-xl shadow-black/20 group hover:border-blue-500/30 transition-all duration-300">
                                <div className="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-tighter">Visitors (Today)</div>
                                <div className="text-xl font-black text-white group-hover:text-blue-400 transition-colors flex items-center gap-1">
                                    {isLoadingStats ? '...' : stats.today.toLocaleString()}
                                    <span className="text-[10px] font-normal text-blue-500/50">👀</span>
                                </div>
                            </div>

                            {/* KPI Card 2: Week */}
                            <div className="bg-[#1a1a1a] border border-white/[0.05] p-3 rounded-2xl shadow-xl shadow-black/20 group hover:border-[#cba153]/30 transition-all duration-300">
                                <div className="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-tighter">Visitors (Week)</div>
                                <div className="text-xl font-black text-white group-hover:text-[#cba153] transition-colors flex items-center gap-1">
                                    {isLoadingStats ? '...' : stats.week.toLocaleString()}
                                    <span className="text-[10px] font-normal text-[#cba153]/50">📈</span>
                                </div>
                            </div>

                            {/* KPI Card 3: Products */}
                            <div className="bg-[#1a1a1a] border border-white/[0.05] p-3 rounded-2xl shadow-xl shadow-black/20 group hover:border-emerald-500/30 transition-all duration-300">
                                <div className="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-tighter">Total Items</div>
                                <div className="text-xl font-black text-white group-hover:text-emerald-400 transition-colors flex items-center gap-1">
                                    {isLoadingStats ? '...' : stats.totalProducts.toLocaleString()}
                                    <span className="text-[10px] font-normal text-emerald-500/50">🛍️</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {view === 'upload' ? (
                    <>
                        {/* Status Message rendered inline */}
                        {uploadStatus && (
                            <div className={`p-3 rounded-lg text-sm mb-4 border flex items-center gap-2 ${uploadStatus.startsWith('SUCCESS') ? 'bg-green-900/20 text-green-400 border-green-900/50' : uploadStatus.startsWith('ERROR') ? 'bg-red-900/20 text-red-400 border-red-900/50' : 'bg-[#cba153]/10 text-[#cba153] border-[#cba153]/30'}`}>
                                <img
                                    src={uploadStatus.startsWith('SUCCESS') ? "https://img.icons8.com/ios-filled/50/2ecc71/checkmark.png" : uploadStatus.startsWith('ERROR') ? "https://img.icons8.com/ios-filled/50/ff4d4d/cancel.png" : "https://img.icons8.com/ios-filled/50/cba153/warning-shield.png"}
                                    alt="status"
                                    className="w-4 h-4"
                                />
                                {uploadStatus.replace('SUCCESS: ', '').replace('ERROR: ', '')}
                            </div>
                        )}

                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-gray-900 dark:text-white uppercase text-[11px] tracking-wider">Batch Upload Products</h3>
                            {images.length > 0 && (
                                !isConfirmingDraftClear ? (
                                    <button
                                        onClick={() => {
                                            if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
                                                window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
                                            }
                                            setIsConfirmingDraftClear(true);
                                        }}
                                        className="text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-500/10 px-2 py-1 rounded-md hover:bg-red-500/20 transition-colors flex items-center gap-1"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                        </svg>
                                        Clear All
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Clear?</span>
                                        <button
                                            onClick={() => {
                                                setImages([]);
                                                localStorage.removeItem(DRAFT_KEY);
                                                setIsConfirmingDraftClear(false);
                                                if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
                                                    window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
                                                }
                                            }}
                                            className="text-[9px] font-black bg-red-500 text-white px-2 py-1 rounded shadow-lg shadow-red-500/10 active:scale-90 transition-transform"
                                        >
                                            YES
                                        </button>
                                        <button
                                            onClick={() => setIsConfirmingDraftClear(false)}
                                            className="text-[9px] font-black bg-gray-100 dark:bg-[#1c1c1e] text-gray-500 dark:text-gray-400 px-2 py-1 rounded active:scale-90 transition-transform"
                                        >
                                            NO
                                        </button>
                                    </div>
                                )
                            )}
                        </div>

                        {/* Image Picker */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full border-2 border-dashed border-gray-300 dark:border-[#444] rounded-xl p-6 flex flex-col items-center gap-2 text-[#cba153] hover:bg-gray-100 dark:hover:bg-[#111111] hover:border-[#cba153] transition-colors mb-4"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                                <circle cx="9" cy="9" r="2" />
                                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                            </svg>
                            <span className="text-sm font-medium">Select Photos from Gallery</span>
                            <span className="text-xs text-gray-500">Tap to select multiple images</span>
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleFileSelect}
                        />

                        {/* Image List */}
                        {images.length > 0 && (
                            <div className="flex flex-col gap-4 mb-4">
                                {images.map((item, index) => (
                                    <UploadItemRow
                                        key={index}
                                        item={item}
                                        index={index}
                                        updateItem={updateItem}
                                        removeItem={removeItem}
                                        onPublish={handleIndividualPublish}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Keyboard spacer */}
                        <div className="h-48 w-full opacity-0 pointer-events-none"></div>
                    </>
                ) : (
                    <>
                        {/* Status Message rendered inline */}
                        {uploadStatus && (
                            <div className={`p-3 rounded-lg text-sm mb-4 border flex items-center gap-2 ${uploadStatus.startsWith('SUCCESS') ? 'bg-green-900/20 text-green-400 border-green-900/50' : uploadStatus.startsWith('ERROR') ? 'bg-red-900/20 text-red-400 border-red-900/50' : 'bg-[#cba153]/10 text-[#cba153] border-[#cba153]/30'}`}>
                                <img
                                    src={uploadStatus.startsWith('SUCCESS') ? "https://img.icons8.com/ios-filled/50/2ecc71/checkmark.png" : uploadStatus.startsWith('ERROR') ? "https://img.icons8.com/ios-filled/50/ff4d4d/cancel.png" : "https://img.icons8.com/ios-filled/50/cba153/warning-shield.png"}
                                    alt="status"
                                    className="w-4 h-4"
                                />
                                {uploadStatus.replace('SUCCESS: ', '').replace('ERROR: ', '')}
                            </div>
                        )}

                        <div className="flex items-center justify-between mb-3 relative">
                            <h3 className="font-semibold text-gray-900 dark:text-white uppercase text-[11px] tracking-wider">
                                {isSelectMode ? `Selected (${selectedProductIds.size})` : 'Active Products'}
                            </h3>
                            <div className="flex items-center gap-2">
                                {isSelectMode ? (
                                    <button
                                        onClick={() => {
                                            setIsSelectMode(false);
                                            setSelectedProductIds(new Set());
                                        }}
                                        className="text-[10px] font-black text-gray-500 uppercase tracking-widest bg-gray-100 dark:bg-[#2a2a2a] px-2 py-1 rounded-md"
                                    >
                                        Cancel
                                    </button>
                                ) : (
                                    existingProducts.length > 0 && (
                                        <div className="relative">
                                            <button
                                                onClick={() => setDeleteMenuOpen(!deleteMenuOpen)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                                </svg>
                                            </button>
                                            <AnimatePresence>
                                                {deleteMenuOpen && (
                                                    <>
                                                        <div className="fixed inset-0 z-[110]" onClick={() => setDeleteMenuOpen(false)}></div>
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                            className="absolute right-0 top-full mt-2 w-32 bg-white dark:bg-[#2a2a2a] rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 py-1 z-[120] overflow-hidden"
                                                        >
                                                            <button
                                                                onClick={() => {
                                                                    setDeleteMenuOpen(false);
                                                                    handleBulkDeleteAll();
                                                                }}
                                                                className="w-full px-4 py-2 text-left text-[11px] font-bold text-red-500 hover:bg-red-500/10 transition-colors"
                                                            >
                                                                DELETE ALL
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setDeleteMenuOpen(false);
                                                                    setIsSelectMode(true);
                                                                }}
                                                                className="w-full px-4 py-2 text-left text-[11px] font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors border-t border-gray-50 dark:border-gray-800"
                                                            >
                                                                SELECT
                                                            </button>
                                                        </motion.div>
                                                    </>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                        {isLoadingProducts ? (
                            <div className="flex justify-center py-10">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#cba153]"></div>
                            </div>
                        ) : existingProducts.length === 0 ? (
                            <div className="text-center py-10 text-gray-500">No products found.</div>
                        ) : (
                            <div className="flex flex-col gap-4 mb-4">
                                {existingProducts.map((product) => (
                                    <ProductManageItem
                                        key={product.id}
                                        product={product}
                                        onUpdate={handleUpdateProduct}
                                        onDelete={handleDeleteProduct}
                                        onChangeImage={(id) => {
                                            setEditingProductId(id);
                                            editFileInputRef.current?.click();
                                        }}
                                        isSelectMode={isSelectMode}
                                        isSelected={selectedProductIds.has(product.id)}
                                        onToggleSelect={(id) => {
                                            const next = new Set(selectedProductIds);
                                            if (next.has(id)) next.delete(id);
                                            else next.add(id);
                                            setSelectedProductIds(next);
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                        <input
                            ref={editFileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => editingProductId && handleChangeProductImage(editingProductId, e)}
                        />
                    </>
                )}
            </div>

            {/* Footer - Fixed at bottom below the scrollable area */}
            {
                (images.length > 0 && view === 'upload' || (isSelectMode && selectedProductIds.size > 0)) && (
                    <div className="p-4 border-t border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#0a0a0a] pb-safe">
                        {view === 'upload' ? (
                            <button
                                onClick={handlePublish}
                                disabled={isUploading}
                                className={`w-full py-3.5 px-4 rounded-xl font-extrabold text-black transition-all ${isUploading ? 'bg-gray-600 cursor-not-allowed' : 'bg-[#cba153] hover:bg-[#b8860b] active:scale-[0.98] shadow-[0_4px_20px_rgba(203,161,83,0.3)]'}`}
                            >
                                {isUploading ? 'Publishing...' : `PUBLISH ${images.length} PRODUCT${images.length > 1 ? 'S' : ''}`}
                            </button>
                        ) : (
                            <button
                                onClick={handleDeleteSelected}
                                disabled={isDeletingBulk}
                                className={`w-full py-3.5 px-4 rounded-xl font-extrabold text-white transition-all ${isDeletingBulk ? 'bg-gray-600 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600 active:scale-[0.98] shadow-[0_4px_20px_rgba(239,68,68,0.3)]'}`}
                            >
                                {isDeletingBulk ? 'Deleting...' : `DELETE SELECTED (${selectedProductIds.size})`}
                            </button>
                        )}
                    </div>
                )
            }
            {/* Announcement Modal */}
            <AnimatePresence>
                {announceModalOpen && (
                    <div
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                        onClick={() => setAnnounceModalOpen(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-lg bg-white dark:bg-[#1c1c1e] rounded-2xl p-6 border border-gray-200 dark:border-[#3a3a3a] flex flex-col gap-4 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                                <h3 className="text-lg font-bold text-[#cba153] flex items-center gap-2">
                                    <img src="https://img.icons8.com/ios-filled/50/cba153/megaphone.png" alt="icon" className="w-5 h-5" />
                                    New Broadcast
                                </h3>
                                <button onClick={() => setAnnounceModalOpen(false)} className="text-gray-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Type</label>
                                    <div className="flex gap-2">
                                        {(['announcement', 'news', 'vlog'] as const).map((t) => (
                                            <button
                                                key={t}
                                                onClick={() => setAnnounceForm({ ...announceForm, type: t })}
                                                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${announceForm.type === t ? 'bg-[#cba153] text-black border-[#cba153]' : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-500 border-transparent'}`}
                                            >
                                                {t.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Title</label>
                                    <input
                                        type="text"
                                        value={announceForm.title}
                                        onChange={(e) => setAnnounceForm({ ...announceForm, title: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-[#2a2a2a] border border-gray-100 dark:border-gray-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#cba153] text-gray-800 dark:text-white"
                                        placeholder="Headline for your update..."
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Message</label>
                                    <textarea
                                        rows={4}
                                        value={announceForm.content}
                                        onChange={(e) => setAnnounceForm({ ...announceForm, content: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-[#2a2a2a] border border-gray-100 dark:border-gray-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#cba153] text-gray-800 dark:text-white resize-none"
                                        placeholder="What's the update?"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Link / Media URL (Optional)</label>
                                    <input
                                        type="text"
                                        value={announceForm.media_url}
                                        onChange={(e) => setAnnounceForm({ ...announceForm, media_url: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-[#2a2a2a] border border-gray-100 dark:border-gray-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#cba153] text-gray-800 dark:text-white"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>

                            {announceError && (
                                <div className="p-3 rounded-xl bg-red-900/10 border border-red-900/20 text-red-500 text-xs font-bold animate-shake">
                                    {announceError}
                                </div>
                            )}

                            <button
                                onClick={handleSaveAnnouncement}
                                disabled={isUploading}
                                className={`w-full py-4 mt-2 rounded-xl font-black text-black transition-all ${isUploading ? 'bg-gray-400' : 'bg-[#cba153] hover:bg-[#b8860b] shadow-lg shadow-[#cba153]/20'}`}
                            >
                                {isUploading ? 'BROADCASTING...' : 'SEND ANNOUNCEMENT'}
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Admin Confirmation Modal */}
            <AdminConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                description={confirmModal.description}
                confirmText={confirmModal.confirmText}
                variant={confirmModal.variant}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />
        </div >
    );
}
