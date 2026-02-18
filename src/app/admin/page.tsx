
'use client';

import { useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import Link from 'next/link';
import { Database } from '@/types/supabase';

type ProductInsert = Database['public']['Tables']['products']['Insert'];

export default function AdminPage() {
    const [jsonInput, setJsonInput] = useState('');
    const [status, setStatus] = useState<{ type: 'success' | 'error' | 'idle'; message: string }>({ type: 'idle', message: '' });
    const [isUploading, setIsUploading] = useState(false);

    const handleUpload = async () => {
        setIsUploading(true);
        setStatus({ type: 'idle', message: '' });

        try {
            let products: ProductInsert[];
            try {
                products = JSON.parse(jsonInput);
                if (!Array.isArray(products)) {
                    throw new Error('Input must be a JSON array of products.');
                }
            } catch (e) {
                throw new Error('Invalid JSON format. Please check your syntax.');
            }

            const { data, error } = await supabase
                .from('products')
                .insert(products)
                .select();

            if (error) {
                throw new Error(error.message);
            }

            setStatus({ type: 'success', message: `Successfully uploaded ${data.length} products!` });
            setJsonInput('');
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message || 'An unknown error occurred.' });
        } finally {
            setIsUploading(false);
        }
    };

    const loadSample = () => {
        const sampleData = [
            {
                name: "Premium Coffee Beans",
                description: "Organic Ethiopian Yirgacheffe coffee beans, 500g.",
                price: 450,
                category: "Food & Drink",
                image_url: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&q=80&w=1000"
            },
            {
                name: "Leather Wallet",
                description: "Handcrafted genuine leather wallet with multiple card slots.",
                price: 1200,
                category: "Fashion",
                image_url: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=1000"
            },
            {
                name: "Wireless Earbuds",
                description: "High-quality sound with noise cancellation functionality.",
                price: 3500,
                category: "Electronics",
                image_url: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&q=80&w=1000"
            }
        ];
        setJsonInput(JSON.stringify(sampleData, null, 2));
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 font-sans">
            <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Bulk Upload</h1>
                    <Link href="/" className="text-blue-600 hover:underline text-sm">Return to Store</Link>
                </div>

                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                    <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Instructions</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-200 mb-2">
                        1. Paste your product data as a JSON array below.
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-200">
                        2. <strong>Important:</strong> Ensure your Supabase <code>products</code> table has an INSERT policy enabled for public/anon users (for this MVP) or use authenticated role.
                    </p>
                </div>

                <div className="mb-4">
                    <div className="flex justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Product JSON</label>
                        <button onClick={loadSample} className="text-xs text-blue-600 hover:underline">Load Sample Data</button>
                    </div>
                    <textarea
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        className="w-full h-64 p-3 border border-gray-300 dark:border-gray-700 rounded-lg font-mono text-sm bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder='[{"name": "Item 1", "price": 100, ...}]'
                    />
                </div>

                {status.message && (
                    <div className={`p-4 rounded-lg mb-4 ${status.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
                        {status.message}
                    </div>
                )}

                <button
                    onClick={handleUpload}
                    disabled={isUploading || !jsonInput}
                    className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-colors ${isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                    {isUploading ? 'Uploading...' : 'Upload Products'}
                </button>
            </div>
        </div>
    );
}
