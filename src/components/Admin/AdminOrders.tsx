
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

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (err) {
            console.error('Error fetching orders:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
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
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId);

            if (error) throw error;

            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

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
        <div className="space-y-4 pb-20 px-4 pt-2">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white uppercase text-[11px] tracking-wider">Order Management</h3>
                <span className="text-[10px] font-bold text-gray-500 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full">{orders.length} TOTAL</span>
            </div>

            {orders.map((order) => {
                const StatusIcon = STATUS_ICONS[order.status] || Clock;
                const isExpanded = expandedOrder === order.id;

                return (
                    <motion.div
                        key={order.id}
                        layout
                        className={`bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/5 rounded-2xl overflow-hidden transition-all duration-300 ${isExpanded ? 'ring-1 ring-[#cba153]/30 shadow-xl shadow-black/20' : ''}`}
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
                    </motion.div>
                );
            })}
        </div>
    );
}
