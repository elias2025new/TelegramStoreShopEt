
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Database } from '@/types/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Package, Clock, CheckCircle2, XCircle, Truck, MapPin, Phone, User, Calendar, CreditCard } from 'lucide-react';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderItem = Database['public']['Tables']['order_items']['Row'] & {
    product: Database['public']['Tables']['products']['Row']
};

const STATUS_COLORS: Record<string, string> = {
    pending: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
    paid: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    shipped: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    delivered: 'text-green-500 bg-green-500/10 border-green-500/20',
    cancelled: 'text-red-500 bg-red-500/10 border-red-500/20',
};

const STATUS_ICONS: Record<string, any> = {
    pending: Clock,
    paid: CreditCard,
    shipped: Truck,
    delivered: CheckCircle2,
    cancelled: XCircle,
};

export default function AdminOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
    const [orderDetails, setOrderDetails] = useState<Record<string, OrderItem[]>>({});
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [timers, setTimers] = useState<Record<string, NodeJS.Timeout>>({});
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
    const [deleteMenuOpen, setDeleteMenuOpen] = useState(false);
    const [isDeletingBulk, setIsDeletingBulk] = useState(false);

    const DELETE_AFTER_MS = 5 * 60 * 1000; // 5 minutes

    const deleteOrder = async (orderId: string) => {
        try {
            const { error } = await supabase
                .from('orders')
                .delete()
                .eq('id', orderId);

            if (error) throw error;
            setOrders(prev => prev.filter(o => o.id !== orderId));
            setOrderDetails(prev => {
                const next = { ...prev };
                delete next[orderId];
                return next;
            });
        } catch (err) {
            console.error('Error deleting order:', err);
        }
    };

    const startDeletionTimer = (orderId: string, deliveredAt: string) => {
        const timeElapsed = Date.now() - new Date(deliveredAt).getTime();
        const timeLeft = Math.max(0, DELETE_AFTER_MS - timeElapsed);

        // Clear existing timer if any
        if (timers[orderId]) clearTimeout(timers[orderId]);

        const timerId = setTimeout(() => {
            deleteOrder(orderId);
            setTimers(prev => {
                const next = { ...prev };
                delete next[orderId];
                return next;
            });
        }, timeLeft);

        setTimers(prev => ({ ...prev, [orderId]: timerId }));
    };

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const fetchedOrders = data || [];
            const now = Date.now();

            const expiredIds: string[] = [];
            const validOrders: Order[] = [];

            for (const order of fetchedOrders) {
                if (order.status === 'delivered' && order.delivered_at) {
                    const deliveredTime = new Date(order.delivered_at).getTime();
                    if (now - deliveredTime >= DELETE_AFTER_MS) {
                        expiredIds.push(order.id);
                        continue;
                    } else {
                        startDeletionTimer(order.id, order.delivered_at);
                    }
                }
                validOrders.push(order);
            }

            if (expiredIds.length > 0) {
                await supabase.from('orders').delete().in('id', expiredIds);
            }

            setOrders(validOrders);
        } catch (err) {
            console.error('Error fetching orders:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        return () => {
            // Cleanup timers on unmount
            Object.values(timers).forEach(timerId => clearTimeout(timerId));
        };
    }, []);

    const fetchOrderItems = async (orderId: string) => {
        if (orderDetails[orderId]) return;

        try {
            const { data, error } = await supabase
                .from('order_items')
                .select('*, product:products(*)')
                .eq('order_id', orderId);

            if (error) throw error;
            setOrderDetails(prev => ({ ...prev, [orderId]: data as OrderItem[] }));
        } catch (err) {
            console.error('Error fetching order items:', err);
        }
    };

    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        setIsUpdating(orderId);
        try {
            const deliveredAt = newStatus === 'delivered' ? new Date().toISOString() : null;

            const { error } = await supabase
                .from('orders')
                .update({
                    status: newStatus,
                    delivered_at: deliveredAt
                })
                .eq('id', orderId);

            if (error) throw error;

            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus, delivered_at: deliveredAt } : o));

            if (newStatus === 'delivered' && deliveredAt) {
                startDeletionTimer(orderId, deliveredAt);
            } else if (timers[orderId]) {
                // If status changed from delivered to something else, cancel timer
                clearTimeout(timers[orderId]);
                setTimers(prev => {
                    const next = { ...prev };
                    delete next[orderId];
                    return next;
                });
            }

            if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
                window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
            }
        } catch (err) {
            console.error('Error updating status:', err);
        } finally {
            setIsUpdating(null);
        }
    };

    const toggleExpand = (orderId: string) => {
        if (expandedOrder === orderId) {
            setExpandedOrder(null);
        } else {
            setExpandedOrder(orderId);
            fetchOrderItems(orderId);
        }
    };

    const handleDeleteAll = async () => {
        if (!confirm('Delete ALL orders? This cannot be undone.')) return;
        setIsDeletingBulk(true);
        try {
            const ids = orders.map(o => o.id);
            await supabase.from('orders').delete().in('id', ids);
            setOrders([]);
            setOrderDetails({});
        } catch (err) {
            console.error('Error deleting all orders:', err);
        } finally {
            setIsDeletingBulk(false);
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedOrderIds.size === 0) return;
        setIsDeletingBulk(true);
        try {
            const ids = Array.from(selectedOrderIds);
            await supabase.from('orders').delete().in('id', ids);
            setOrders(prev => prev.filter(o => !selectedOrderIds.has(o.id)));
            setOrderDetails(prev => {
                const next = { ...prev };
                ids.forEach(id => delete next[id]);
                return next;
            });
            setSelectedOrderIds(new Set());
            setIsSelectMode(false);
        } catch (err) {
            console.error('Error deleting selected orders:', err);
        } finally {
            setIsDeletingBulk(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#cba153]"></div>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="text-center py-20 bg-white/5 rounded-2xl border border-dashed border-white/10 mx-4 mt-4">
                <Package className="w-12 h-12 text-gray-600 mx-auto mb-4 opacity-20" />
                <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">No orders yet</p>
                <p className="text-gray-600 text-[10px] mt-1">Orders will appear here once customers checkout.</p>
            </div>
        );
    }

    return (
        <div className="pb-28 px-4 pt-2">
            {/* Header with delete controls */}
            <div className="flex items-center justify-between mb-4 relative">
                <h3 className="font-semibold text-gray-900 dark:text-white uppercase text-[11px] tracking-wider">
                    {isSelectMode ? `Selected (${selectedOrderIds.size})` : `Orders (${orders.length})`}
                </h3>
                <div className="flex items-center gap-2">
                    {isSelectMode ? (
                        <button
                            onClick={() => { setIsSelectMode(false); setSelectedOrderIds(new Set()); }}
                            className="text-[10px] font-black text-gray-500 uppercase tracking-widest bg-gray-100 dark:bg-[#2a2a2a] px-2 py-1 rounded-md"
                        >
                            Cancel
                        </button>
                    ) : (
                        <div className="relative">
                            <button
                                onClick={() => setDeleteMenuOpen(v => !v)}
                                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                </svg>
                            </button>
                            <AnimatePresence>
                                {deleteMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-[110]" onClick={() => setDeleteMenuOpen(false)} />
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                            className="absolute right-0 top-full mt-2 w-36 bg-white dark:bg-[#2a2a2a] rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 py-1 z-[120] overflow-hidden"
                                        >
                                            <button
                                                onClick={() => { setDeleteMenuOpen(false); handleDeleteAll(); }}
                                                className="w-full px-4 py-2 text-left text-[11px] font-bold text-red-500 hover:bg-red-500/10 transition-colors"
                                            >
                                                DELETE ALL
                                            </button>
                                            <button
                                                onClick={() => { setDeleteMenuOpen(false); setIsSelectMode(true); }}
                                                className="w-full px-4 py-2 text-left text-[11px] font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors border-t border-gray-50 dark:border-gray-800"
                                            >
                                                SELECT
                                            </button>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                {orders.map((order) => {
                    const StatusIcon = STATUS_ICONS[order.status] || Clock;
                    const isExpanded = expandedOrder === order.id;

                    return (
                        <motion.div
                            key={order.id}
                            layout
                            className={`relative bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/5 rounded-2xl overflow-hidden transition-all duration-300 ${isExpanded ? 'ring-1 ring-[#cba153]/30 shadow-xl shadow-black/20' : ''} ${isSelectMode && selectedOrderIds.has(order.id) ? 'ring-2 ring-[#cba153]' : ''}`}
                        >
                            {/* Order Summary Header */}
                            <div
                                onClick={() => toggleExpand(order.id)}
                                className="p-4 cursor-pointer active:bg-gray-50 dark:active:bg-white/5 transition-colors"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-[#cba153] uppercase tracking-tighter">#{order.id.split('-')[0]}</span>
                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest flex items-center gap-1 ${STATUS_COLORS[order.status]}`}>
                                                <StatusIcon className="w-2.5 h-2.5" />
                                                {order.status}
                                            </span>
                                        </div>
                                        <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                                            <User className="w-3.5 h-3.5 text-gray-400" />
                                            {order.full_name}
                                        </h4>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-black text-gray-900 dark:text-white">
                                            {new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(order.total_price)}
                                        </div>
                                        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter flex items-center justify-end gap-1 mt-1">
                                            <Calendar className="w-2.5 h-2.5" />
                                            {new Date(order.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-auto">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1 text-[10px] text-gray-500 font-bold uppercase">
                                            <CreditCard className="w-3 h-3" />
                                            {order.payment_method.replace(/_/g, ' ')}
                                        </div>
                                        <div className={`flex items-center gap-1 text-[10px] font-bold uppercase transition-colors ${isExpanded ? 'text-[#cba153]' : 'text-gray-500'}`}>
                                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                            {isExpanded ? 'HIDE DETAILS' : 'VIEW DETAILS'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-gray-100 dark:border-white/5"
                                    >
                                        <div className="p-4 space-y-5">
                                            {/* Contact & Shipping */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <h5 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Contact</h5>
                                                    <a href={`tel:${order.phone_number}`} className="flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-white hover:text-[#cba153] transition-colors">
                                                        <div className="w-6 h-6 rounded-full bg-[#cba153]/10 flex items-center justify-center">
                                                            <Phone className="w-3 h-3 text-[#cba153]" />
                                                        </div>
                                                        {order.phone_number}
                                                    </a>
                                                </div>
                                                <div className="space-y-2">
                                                    <h5 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Address</h5>
                                                    <div className="flex items-start gap-2 text-xs font-bold text-gray-900 dark:text-white">
                                                        <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                                                            <MapPin className="w-3 h-3 text-blue-500" />
                                                        </div>
                                                        <span className="leading-relaxed">{order.shipping_address}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Items */}
                                            <div className="space-y-3">
                                                <h5 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Items Ordered</h5>
                                                <div className="space-y-2">
                                                    {orderDetails[order.id]?.map((item) => (
                                                        <div key={item.id} className="flex items-center gap-3 bg-gray-50 dark:bg-white/[0.03] p-2 rounded-xl">
                                                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 shrink-0">
                                                                <img src={item.product.image_url || ''} alt={item.product.name} className="w-full h-full object-cover" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-[12px] font-bold text-gray-900 dark:text-white truncate">{item.product.name}</p>
                                                                <p className="text-[10px] text-gray-500 font-bold uppercase">
                                                                    {item.selected_size ? `Size: ${item.selected_size}` : 'Standard'} • Qty: {item.quantity}
                                                                </p>
                                                            </div>
                                                            <div className="text-[11px] font-black text-gray-900 dark:text-white">
                                                                {new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(item.price_at_time * item.quantity)}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {!orderDetails[order.id] && (
                                                        <div className="flex justify-center py-4">
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#cba153]"></div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="space-y-3 pt-2">
                                                <h5 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Update Order Status</h5>
                                                <div className="flex flex-wrap gap-2">
                                                    {['pending', 'paid', 'shipped', 'delivered', 'cancelled'].map((status) => (
                                                        <button
                                                            key={status}
                                                            disabled={isUpdating === order.id}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                updateOrderStatus(order.id, status);
                                                            }}
                                                            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${order.status === status
                                                                ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#1a1a1a] ring-[#cba153] bg-[#cba153] text-black shadow-lg shadow-[#cba153]/20'
                                                                : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
                                                                }`}
                                                        >
                                                            {status}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Select Mode Checkbox Overlay */}
                            {isSelectMode && (
                                <div
                                    className="absolute inset-0 z-10 cursor-pointer flex items-start justify-end p-4"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const next = new Set(selectedOrderIds);
                                        if (next.has(order.id)) next.delete(order.id);
                                        else next.add(order.id);
                                        setSelectedOrderIds(next);
                                    }}
                                >
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedOrderIds.has(order.id) ? 'bg-[#cba153] border-[#cba153]' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1a1a1a]'}`}>
                                        {selectedOrderIds.has(order.id) && (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                                        )}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* Sticky Footer – Delete Selected */}
            <AnimatePresence>
                {isSelectMode && selectedOrderIds.size > 0 && (
                    <motion.div
                        initial={{ y: 80, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 80, opacity: 0 }}
                        className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white dark:bg-[#0a0a0a] border-t border-gray-200 dark:border-[#2a2a2a] pb-safe"
                    >
                        <button
                            onClick={handleDeleteSelected}
                            disabled={isDeletingBulk}
                            className={`w-full py-3.5 px-4 rounded-xl font-extrabold text-white transition-all ${isDeletingBulk ? 'bg-gray-600 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600 active:scale-[0.98] shadow-[0_4px_20px_rgba(239,68,68,0.3)]'}`}
                        >
                            {isDeletingBulk ? 'Deleting...' : `DELETE SELECTED (${selectedOrderIds.size})`}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
