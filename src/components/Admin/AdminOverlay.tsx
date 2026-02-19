
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { supabase } from '@/utils/supabase/client';
import { useAdmin } from '@/context/AdminContext';

const DRAFT_KEY = 'admin_product_draft';
const CATEGORIES = ['Electronics', 'Fashion', 'Home', 'Beauty', 'Food & Drink', 'Other'];

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
    const [images, setImages] = useState<ImageItem[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');
    const [draftRestored, setDraftRestored] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
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

    // ── Publish ─────────────────────────────────────────────────────────────
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
        <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-gray-950">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">⚡ Manage Store</h2>
                    {draftRestored && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 animate-pulse">
                            Draft restored
                        </span>
                    )}
                </div>
                <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                    </svg>
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">Batch Upload Products</h3>

                {/* Image Picker */}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-xl p-6 flex flex-col items-center gap-2 text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors mb-4"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                        <circle cx="9" cy="9" r="2" />
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                    </svg>
                    <span className="text-sm font-medium">Select Photos from Gallery</span>
                    <span className="text-xs text-gray-400">Tap to select multiple images</span>
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
                            <div key={index} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                                <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-800">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={item.preview} alt="preview" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 flex flex-col gap-2">
                                    <input
                                        type="text"
                                        placeholder="Title / Brand Name"
                                        value={item.title}
                                        onChange={(e) => updateItem(index, 'title', e.target.value)}
                                        className="w-full px-2 py-1.5 text-sm font-semibold border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            placeholder="Price (ETB)"
                                            value={item.price}
                                            onChange={(e) => updateItem(index, 'price', e.target.value)}
                                            className="flex-1 px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        />
                                        <select
                                            value={item.category}
                                            onChange={(e) => updateItem(index, 'category', e.target.value)}
                                            className="w-1/3 px-1 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        >
                                            {CATEGORIES.map((cat) => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate mt-0.5">{item.fileName}</p>
                                </div>
                                <button
                                    onClick={() => removeItem(index)}
                                    className="self-start p-1 text-red-400 hover:text-red-600"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {uploadStatus && (
                    <div className={`p-3 rounded-lg text-sm mb-4 ${uploadStatus.startsWith('✅') ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : uploadStatus.startsWith('❌') ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                        {uploadStatus}
                    </div>
                )}
            </div>

            {/* Footer */}
            {images.length > 0 && (
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
                    <button
                        onClick={handlePublish}
                        disabled={isUploading}
                        className={`w-full py-3.5 px-4 rounded-xl font-bold text-white transition-all ${isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98] shadow-lg shadow-blue-500/30'}`}
                    >
                        {isUploading ? 'Publishing...' : `Publish ${images.length} Product${images.length > 1 ? 's' : ''}`}
                    </button>
                </div>
            )}
        </div>
    );
}
