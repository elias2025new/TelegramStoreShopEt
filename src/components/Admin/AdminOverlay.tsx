
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { supabase } from '@/utils/supabase/client';
import { useAdmin } from '@/context/AdminContext';
import { useQueryClient } from '@tanstack/react-query';


const DRAFT_KEY = 'admin_product_draft';
const CATEGORIES = ['Electronics', 'Fashion', 'Home', 'Beauty', 'Food & Drink', 'Other'];

type Product = {
    id: string;
    name: string;
    price: number;
    category: string | null;
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
    const [localCategory, setLocalCategory] = useState(product.category || 'Other');
    const [isSaving, setIsSaving] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Track if there are unsaved changes
    const hasChanges =
        localName !== product.name ||
        localPrice !== product.price.toString() ||
        localCategory !== (product.category || 'Other');

    // Keep local state in sync if product changes externally (e.g. image update)
    useEffect(() => {
        setLocalName(product.name);
        setLocalPrice(product.price.toString());
        setLocalCategory(product.category || 'Other');
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
                category: localCategory,
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

    return (
        <div className="flex flex-col gap-3 p-3 bg-[#1c1c1e] rounded-xl border border-[#2a2a2a]">
            <div className={`flex gap-3 transition-opacity ${showDeleteConfirm ? 'opacity-20 pointer-events-none' : ''}`}>
                <div
                    className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-[#111111] cursor-pointer group"
                    onClick={() => onChangeImage(product.id)}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={product.image_url || ''} alt={product.name} className="w-full h-full object-cover group-hover:opacity-75 transition-opacity" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#cba153" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                    </div>
                </div>
                <div className="flex-1 flex flex-col gap-2">
                    <input
                        type="text"
                        value={localName}
                        onChange={(e) => setLocalName(e.target.value)}
                        onFocus={handleFocus}
                        placeholder="Product Name"
                        className="w-full px-2 py-1.5 text-sm font-semibold border border-[#2a2a2a] rounded-lg bg-[#0a0a0a] text-white focus:ring-1 focus:ring-[#cba153] focus:border-[#cba153] focus:outline-none transition-all placeholder-gray-500"
                    />
                    <div className="flex gap-1.5">
                        <div className="flex-[1.4] relative">
                            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-[#cba153] font-bold pointer-events-none">ETB</span>
                            <input
                                type="number"
                                value={localPrice}
                                onChange={(e) => setLocalPrice(e.target.value)}
                                onFocus={handleFocus}
                                className="w-full pl-8 pr-1 py-1.5 text-sm font-bold border border-[#2a2a2a] rounded-lg bg-[#0a0a0a] text-white focus:ring-1 focus:ring-[#cba153] focus:border-[#cba153] focus:outline-none transition-all placeholder-gray-500"
                            />
                        </div>
                        <select
                            value={localCategory}
                            onChange={(e) => setLocalCategory(e.target.value)}
                            onFocus={handleFocus}
                            className="flex-1 min-w-[80px] px-1 py-1.5 text-[11px] border border-[#2a2a2a] rounded-lg bg-[#0a0a0a] text-white focus:ring-1 focus:ring-[#cba153] focus:border-[#cba153] focus:outline-none transition-all"
                        >
                            {CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="self-start p-2 text-gray-500 hover:text-red-500 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" />
                    </svg>
                </button>
            </div>

            {hasChanges && !showDeleteConfirm && (
                <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5">
                        <img src="https://img.icons8.com/ios-filled/50/cba153/warning-shield.png" alt="warning" className="w-3 h-3" />
                        <span className="text-[11px] text-[#cba153] font-medium">Unsaved changes</span>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold text-black transition-all ${isSaving ? 'bg-gray-600' : 'bg-[#cba153] hover:bg-[#b8860b] active:scale-95 shadow-[0_2px_10px_rgba(203,161,83,0.2)]'
                            }`}
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            )}

            {showDeleteConfirm && (
                <div className="flex flex-col gap-2 pt-1 border-t border-red-900/30">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-red-500">Delete this product?</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#2a2a2a] hover:bg-[#333333] text-white transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => onDelete(product.id, product.image_url)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm active:scale-95 transition-all"
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
}

interface ImageItem {
    file: File;
    preview: string;   // object URL or base64 data URL
    base64: string;    // data URL — used for serialisation
    title: string;
    price: string;
    category: string;
    fileName: string;
}

interface SerializedItem {
    base64: string;
    title: string;
    price: string;
    category: string;
    fileName: string;
}

interface UploadItemRowProps {
    item: ImageItem;
    index: number;
    updateItem: (index: number, field: 'title' | 'price' | 'category', value: string) => void;
    removeItem: (index: number) => void;
}

function UploadItemRow({ item, index, updateItem, removeItem }: UploadItemRowProps) {
    const [localTitle, setLocalTitle] = useState(item.title);
    const [localPrice, setLocalPrice] = useState(item.price);
    const [localCategory, setLocalCategory] = useState(item.category);

    useEffect(() => {
        setLocalTitle(item.title);
        setLocalPrice(item.price);
        setLocalCategory(item.category);
    }, [item.title, item.price, item.category]);

    const handleFocus = (e: React.FocusEvent<HTMLElement>) => {
        const target = e.target as HTMLElement;
        setTimeout(() => {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
    };

    return (
        <div className="flex flex-col gap-2 p-3 bg-[#1c1c1e] rounded-xl border border-[#2a2a2a]">
            {/* Top row: image + delete */}
            <div className="flex items-center justify-between gap-3">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-[#0a0a0a]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.preview} alt="preview" className="w-full h-full object-cover" />
                </div>
                <p className="flex-1 text-[10px] text-gray-400 truncate font-mono">{item.fileName}</p>
                <button
                    onClick={() => removeItem(index)}
                    className="p-1 text-gray-500 hover:text-red-500 flex-shrink-0 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                    </svg>
                </button>
            </div>
            {/* Fields — 2-col grid */}
            <div className="grid grid-cols-2 gap-2">
                <input
                    type="text"
                    placeholder="Title / Brand Name"
                    value={localTitle}
                    onChange={(e) => setLocalTitle(e.target.value)}
                    onBlur={() => updateItem(index, 'title', localTitle)}
                    onFocus={handleFocus}
                    className="col-span-2 px-3 py-2 text-sm font-semibold border border-[#2a2a2a] rounded-lg bg-[#0a0a0a] text-white focus:ring-1 focus:ring-[#cba153] focus:border-[#cba153] focus:outline-none placeholder-gray-600"
                />
                <input
                    type="number"
                    placeholder="Price (ETB)"
                    value={localPrice}
                    onChange={(e) => setLocalPrice(e.target.value)}
                    onBlur={() => updateItem(index, 'price', localPrice)}
                    onFocus={handleFocus}
                    className="px-3 py-2 text-sm border border-[#2a2a2a] rounded-lg bg-[#0a0a0a] text-white focus:ring-1 focus:ring-[#cba153] focus:border-[#cba153] focus:outline-none placeholder-gray-600 font-mono"
                />
                <select
                    value={localCategory}
                    onChange={(e) => {
                        setLocalCategory(e.target.value);
                        updateItem(index, 'category', e.target.value);
                    }}
                    onFocus={handleFocus}
                    className="px-3 py-2 text-sm border border-[#2a2a2a] rounded-lg bg-[#0a0a0a] text-white focus:ring-1 focus:ring-[#cba153] focus:border-[#cba153] focus:outline-none"
                >
                    {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>
        </div>
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
                category: s.category,
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
                    title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
                    price: '',
                    category: 'Other',
                    fileName: file.name,
                };
            })
        );
        setImages((prev) => [...prev, ...newItems]);
        // reset input so the same file can be re-selected if removed
        e.target.value = '';
    }, []);

    const updateItem = (index: number, field: 'title' | 'price' | 'category', value: string) => {
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

    const handlePublish = async () => {
        if (images.length === 0) return;
        const invalid = images.find((img) => !img.price || parseFloat(img.price) <= 0 || !img.title.trim());
        if (invalid) {
            setUploadStatus('Please enter a valid title and price for all items.');
            return;
        }

        setIsUploading(true);
        setUploadStatus('Uploading...');

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
                        category: item.category,
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
            className="fixed inset-0 z-[100] flex flex-col bg-[#0a0a0a]"
            style={{
                paddingTop: 'calc(var(--tg-safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px))',
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a] bg-[#0a0a0a]">
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
                            : 'bg-[#1c1c1e] text-gray-300 border border-[#2a2a2a]'
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
                        className="p-2 rounded-full hover:bg-[#1c1c1e] transition-colors text-white"
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

                        <h3 className="font-semibold text-white mb-3">Batch Upload Products</h3>

                        {/* Image Picker */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full border-2 border-dashed border-[#444] rounded-xl p-6 flex flex-col items-center gap-2 text-[#cba153] hover:bg-[#111111] hover:border-[#cba153] transition-colors mb-4"
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

                        <h3 className="font-semibold text-white mb-3">Active Products</h3>
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
                    <div className="p-4 border-t border-[#2a2a2a] bg-[#0a0a0a] pb-safe">
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
