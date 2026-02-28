
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { supabase } from '@/utils/supabase/client';
import { useAdmin } from '@/context/AdminContext';
import { useQueryClient } from '@tanstack/react-query';


const DRAFT_KEY = 'admin_product_draft';
const GENDERS = ['Men', 'Women', 'Unisex', 'Accessories'];
const CATEGORIES = ['Men', 'women', 'accessories'];

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

type Product = {
    id: string;
    name: string;
    price: number;
    category: string | null;
    gender: string | null;
    description: string | null;
    image_url: string | null;
    created_at: string;
};

interface ProductManageItemProps {
    product: Product;
    onUpdate: (id: string, updates: Partial<Product>) => Promise<void>;
    onDelete: (id: string, imageUrl: string | null) => Promise<void>;
    onChangeImage: (id: string) => void;
}

function ProductManageItem({ product, onUpdate, onDelete, onChangeImage }: ProductManageItemProps) {
    const [localName, setLocalName] = useState(product.name);
    const [localPrice, setLocalPrice] = useState(product.price.toString());
    const [localCategory, setLocalCategory] = useState(product.category || '');
    const [localGender, setLocalGender] = useState(product.gender || '');
    const [localDescription, setLocalDescription] = useState(product.description || '');
    const [isSaving, setIsSaving] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isCustomCategory, setIsCustomCategory] = useState(false);
    const [descModalOpen, setDescModalOpen] = useState(false);
    const [modalDraft, setModalDraft] = useState('');

    // Track if there are unsaved changes
    const hasChanges =
        localName !== product.name ||
        localPrice !== product.price.toString() ||
        localCategory !== (product.category || '') ||
        localGender !== (product.gender || '') ||
        localDescription !== (product.description || '');

    // Keep local state in sync if product changes externally (e.g. image update)
    useEffect(() => {
        setLocalName(product.name);
        setLocalPrice(product.price.toString());
        setLocalCategory(product.category || '');
        setLocalGender(product.gender || '');
        setLocalDescription(product.description || '');
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

    return (
        <>
            {/* Description Modal */}
            {descModalOpen && (
                <div
                    className="fixed inset-0 z-[200] flex items-end justify-center bg-black/70 backdrop-blur-sm"
                    onClick={() => setDescModalOpen(false)}
                >
                    <div
                        className="w-full max-w-lg bg-white dark:bg-[#1c1c1e] rounded-t-2xl p-5 pb-8 border-t border-gray-200 dark:border-[#3a3a3a] flex flex-col gap-3"
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
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-2 p-2 bg-white dark:bg-[#1c1c1e] rounded-xl border border-gray-200 dark:border-[#2a2a2a] shadow-sm">
                <div className={`flex items-center gap-2 transition-opacity ${showDeleteConfirm ? 'opacity-20 pointer-events-none' : ''}`}>
                    <div
                        className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-[#111111] cursor-pointer group"
                        onClick={() => onChangeImage(product.id)}
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
                            onChange={setLocalGender}
                        />

                        {isCustomCategory ? (
                            <div className="flex flex-col gap-1.5">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Category Detail</span>
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
                                options={CATEGORIES}
                                selected={localCategory}
                                onChange={setLocalCategory}
                                onAddNew={() => setIsCustomCategory(true)}
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
    fileName: string;
}

interface SerializedItem {
    base64: string;
    title: string;
    price: string;
    category: string;
    gender: string;
    description: string;
    fileName: string;
}

interface UploadItemRowProps {
    item: ImageItem;
    index: number;
    updateItem: (index: number, field: 'title' | 'price' | 'category' | 'gender' | 'description', value: string) => void;
    removeItem: (index: number) => void;
    onPublish: (index: number) => Promise<void>;
}

function UploadItemRow({ item, index, updateItem, removeItem, onPublish }: UploadItemRowProps) {
    const [localTitle, setLocalTitle] = useState(item.title);
    const [localPrice, setLocalPrice] = useState(item.price);
    const [localCategory, setLocalCategory] = useState(item.category);
    const [localGender, setLocalGender] = useState(item.gender);
    const [localDescription, setLocalDescription] = useState(item.description);
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
    }, [item.title, item.price, item.category, item.gender, item.description]);

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
            setLocalError('Select Gender');
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

    return (
        <>
            {/* Description Modal */}
            {descModalOpen && (
                <div
                    className="fixed inset-0 z-[200] flex items-end justify-center bg-black/70 backdrop-blur-sm"
                    onClick={() => setDescModalOpen(false)}
                >
                    <div
                        className="w-full max-w-lg bg-white dark:bg-[#1c1c1e] rounded-t-2xl p-5 pb-8 border-t border-gray-200 dark:border-[#3a3a3a] flex flex-col gap-3"
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
                        }}
                    />

                    {isCustomCategory ? (
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
                            options={CATEGORIES}
                            selected={localCategory}
                            onChange={(val) => {
                                setLocalCategory(val);
                                updateItem(index, 'category', val);
                            }}
                            onAddNew={() => setIsCustomCategory(true)}
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
    const fileInputRef = useRef<HTMLInputElement>(null);
    const editFileInputRef = useRef<HTMLInputElement>(null);
    const [editingProductId, setEditingProductId] = useState<string | null>(null);
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
                fileName: s.fileName,
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
            fileName: item.fileName,
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
                const base64 = await fileToBase64(file);
                return {
                    file,
                    preview: base64,
                    base64,
                    title: '',
                    price: '',
                    category: '',
                    gender: '',
                    description: '',
                    fileName: file.name,
                };
            })
        );
        setImages((prev) => [...prev, ...newItems]);
        // reset input so the same file can be re-selected if removed
        e.target.value = '';
    }, []);

    const updateItem = (index: number, field: 'title' | 'price' | 'category' | 'gender' | 'description', value: string) => {
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
                image_url: urlData.publicUrl,
            };

            const { error: insertError } = await supabase.from('products').insert([productData]);
            if (insertError) throw insertError;

            // Update local state
            const updatedImages = images.filter((_, i) => i !== index);
            setImages(updatedImages);

            // Update draft
            if (updatedImages.length > 0) {
                const serialized = updatedImages.map(img => ({
                    base64: img.base64,
                    title: img.title,
                    price: img.price,
                    category: img.category,
                    gender: img.gender,
                    description: img.description,
                    fileName: img.fileName,
                }));
                localStorage.setItem(DRAFT_KEY, JSON.stringify(serialized));
            } else {
                localStorage.removeItem(DRAFT_KEY);
            }

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
                        image_url: urlData.publicUrl,
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
        } catch (err: any) {
            setUploadStatus(`❌ Error: ${err.message}`);
        } finally {
            setIsUploading(false);
        }
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
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#0a0a0a]">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <img src="https://img.icons8.com/ios-filled/50/cba153/manager.png" alt="admin" className="w-5 h-5" />
                        <h2 className="text-lg font-bold text-[#cba153]">Store Admin</h2>
                        {draftRestored && view === 'upload' && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#cba153]/20 text-[#cba153] animate-pulse">
                                Draft restored
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setView(view === 'upload' ? 'manage' : 'upload')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${view === 'manage'
                            ? 'bg-[#cba153]/20 text-[#cba153] border border-[#cba153]/30'
                            : 'bg-gray-100 dark:bg-[#1c1c1e] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-[#2a2a2a]'
                            }`}
                    >
                        <img
                            src={view === 'upload' ? "https://img.icons8.com/ios-filled/50/cba153/settings.png" : "https://img.icons8.com/ios-filled/50/cba153/plus-math.png"}
                            alt="icon"
                            className="w-4 h-4"
                        />
                        {view === 'upload' ? 'Manage' : 'Upload'}
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

                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Batch Upload Products</h3>

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

                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Active Products</h3>
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
                images.length > 0 && view === 'upload' && (
                    <div className="p-4 border-t border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#0a0a0a] pb-safe">
                        <button
                            onClick={handlePublish}
                            disabled={isUploading}
                            className={`w-full py-3.5 px-4 rounded-xl font-extrabold text-black transition-all ${isUploading ? 'bg-gray-600 cursor-not-allowed' : 'bg-[#cba153] hover:bg-[#b8860b] active:scale-[0.98] shadow-[0_4px_20px_rgba(203,161,83,0.3)]'}`}
                        >
                            {isUploading ? 'Publishing...' : `PUBLISH ${images.length} PRODUCT${images.length > 1 ? 'S' : ''}`}
                        </button>
                    </div>
                )
            }
        </div >
    );
}
