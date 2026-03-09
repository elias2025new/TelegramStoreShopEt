'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useLocation } from '@/context/LocationContext';
import { supabase } from '@/utils/supabase/client';
import Image from 'next/image';
import Link from 'next/link';
import PageTransition from '@/components/PageTransition';
import { motion, AnimatePresence } from 'framer-motion';
import { sendTelegramNotification, formatOrderMessage } from '@/utils/telegram';
import {
    ChevronLeft,
    ChevronRight,
    MapPin,
    Phone,
    User,
    CreditCard,
    CheckCircle2,
    Loader2,
    AlertCircle
} from 'lucide-react';

type Step = 'details' | 'payment' | 'summary' | 'success';

interface FormData {
    fullName: string;
    phoneNumber: string;
    address: string;
    paymentMethod: 'cash_on_delivery' | 'bank_transfer';
    bankMethod: 'cbe' | 'telebirr' | null;
    telebirrSmsText: string;
}

export default function CheckoutPage() {
    const router = useRouter();
    const { items, totalPrice, clearCart } = useCart();
    const { locationName, locationEnabled, enableLocation } = useLocation();

    const [currentStep, setCurrentStep] = useState<Step>('details');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderId, setOrderId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<FormData>({
        fullName: '',
        phoneNumber: '',
        address: '',
        paymentMethod: 'cash_on_delivery',
        bankMethod: null,
        telebirrSmsText: '',
    });

    // Auto-fill from Telegram if available
    useEffect(() => {
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            const user = window.Telegram.WebApp.initDataUnsafe?.user;
            if (user) {
                setFormData(prev => ({
                    ...prev,
                    fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
                }));
            }
        }
    }, []);

    // Sync location name to address if user enables location
    useEffect(() => {
        if (locationEnabled && locationName && !formData.address) {
            setFormData(prev => ({ ...prev, address: locationName }));
        }
    }, [locationEnabled, locationName]);

    if (items.length === 0 && currentStep !== 'success') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-950 p-4 text-center">
                <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Your Cart is Empty</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Redirecting you back to shop...</p>
                <Link href="/" className="bg-[#cba153] text-black px-6 py-3 rounded-xl font-bold">
                    Go Back
                </Link>
            </div>
        );
    }

    const stepsArray: Step[] = ['details', 'payment', 'summary'];
    const currentStepIndex = stepsArray.indexOf(currentStep);

    const handleNext = () => {
        if (currentStep === 'details') {
            if (!formData.fullName || !formData.phoneNumber) {
                setError('Please fill in your contact details');
                return;
            }

            // Ethiopian Phone Validation
            // Standard: +2517..., +2519..., 07..., 09...
            const ethioPhoneRegex = /^(\+251|0)(9|7)\d{8}$/;
            if (!ethioPhoneRegex.test(formData.phoneNumber.replace(/\s/g, ''))) {
                setError('Please enter a valid Ethiopian phone number (Ethio Telecom or Safaricom)');
                return;
            }

            if (!formData.address) {
                setError('Please provide a shipping address');
                return;
            }
        } else if (currentStep === 'payment') {
            if (formData.paymentMethod === 'bank_transfer' && !formData.bankMethod) {
                setError('Please choose a payment method (CBE or Telebirr)');
                return;
            }
            if (formData.paymentMethod === 'bank_transfer' && formData.bankMethod === 'telebirr') {
                if (!formData.telebirrSmsText || formData.telebirrSmsText.length < 30) {
                    setError('Please paste the FULL SMS message from Telebirr to proceed');
                    return;
                }
            }
        }

        setError(null);
        const nextIndex = currentStepIndex + 1;
        if (nextIndex < stepsArray.length) {
            setCurrentStep(stepsArray[nextIndex]);
            if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
                window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
            }
        }
    };

    const handleBack = () => {
        setError(null);
        if (currentStep === 'details') {
            router.back();
            return;
        }
        const prevIndex = currentStepIndex - 1;
        if (prevIndex >= 0) {
            setCurrentStep(stepsArray[prevIndex]);
        }
    };

    const handleSubmitOrder = async () => {
        setIsSubmitting(true);
        setError(null);

        try {
            let transactionId = null;

            if (formData.paymentMethod === 'bank_transfer' && formData.bankMethod === 'telebirr') {
                const verifyRes = await fetch('/api/verify-telebirr', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        smsText: formData.telebirrSmsText,
                        expectedAmount: totalPrice
                    })
                });

                const verifyData = await verifyRes.json();

                if (!verifyRes.ok || !verifyData.success) {
                    throw new Error(verifyData.error || 'Payment verification failed. Please check your receipt link.');
                }

                transactionId = verifyData.transactionId;
            }

            const telegramUser = typeof window !== 'undefined' ? window.Telegram?.WebApp?.initDataUnsafe?.user : null;
            const telegramUserId = telegramUser?.id?.toString() || 'anonymous';

            // 1. Create the order
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert([{
                    telegram_user_id: telegramUserId,
                    full_name: formData.fullName,
                    phone_number: formData.phoneNumber,
                    shipping_address: formData.address,
                    total_price: totalPrice,
                    payment_method: formData.paymentMethod,
                    status: formData.paymentMethod === 'bank_transfer' && formData.bankMethod === 'telebirr' ? 'paid' : 'pending',
                    transaction_id: transactionId
                }])
                .select()
                .single();

            if (orderError) throw orderError;

            // 2. Create order items
            const orderItems = items.map(item => ({
                order_id: orderData.id,
                product_id: item.product.id,
                quantity: item.quantity,
                unit_price: item.product.price,
                selected_size: item.selectedSize || null
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) throw itemsError;

            // Success
            setOrderId(orderData.id.split('-')[0].toUpperCase()); // Short version for display
            setCurrentStep('success');
            clearCart();

            if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
                window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
            }

            // 3. Send Telegram Notification to Owner
            const imageUrls = items
                .map(item => item.product.image_url)
                .filter((url): url is string => !!url);

            const ownerMessage = formatOrderMessage(orderData, items, totalPrice);
            await sendTelegramNotification(ownerMessage, imageUrls);
        } catch (err: any) {
            console.error('Checkout error:', err);
            setError(err.message || 'Failed to place order. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const requestTelegramContact = () => {
        // Note: This requires the Main Button or Keyboard Button in a real environment
        // For Mini Apps, we usually just ask them to type or use standard browser autocomplete
        // But we can add a haptic feedback for the button
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
            // Telegram WebApp doesn't have a direct "requestContact" JS API that works inside the webview 
            // like a bot keyboard does, unless using specific features. 
            // We'll stick to manual entry for reliability but keeping the UI premium.
        }
    };

    return (
        <PageTransition>
            <main className="min-h-screen bg-[#f8f9fa] dark:bg-black flex flex-col">
                {/* Header */}
                <header className="sticky top-0 z-50 bg-white/90 dark:bg-black/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 py-4 flex items-center justify-between">
                    <button
                        onClick={handleBack}
                        className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6 text-gray-700 dark:text-gray-200" />
                    </button>
                    <div className="flex flex-col items-center">
                        <h1 className="text-base font-bold text-gray-900 dark:text-white">
                            {currentStep === 'success' ? 'Order Placed' : 'Checkout'}
                        </h1>
                        {currentStep !== 'success' && (
                            <div className="flex gap-1.5 mt-1">
                                {stepsArray.map((s, i) => (
                                    <div
                                        key={s}
                                        className={`h-1 rounded-full transition-all duration-300 ${i <= currentStepIndex ? 'w-4 bg-[#cba153]' : 'w-2 bg-gray-200 dark:bg-gray-800'
                                            }`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="w-10" /> {/* Spacer */}
                </header>

                <div className="flex-1 overflow-y-auto p-4 pb-32">
                    <AnimatePresence mode="wait">
                        {currentStep === 'details' && (
                            <motion.div
                                key="details"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="space-y-4">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Delivery Details</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Please provide your contact and shipping information.</p>
                                </div>

                                <div className="space-y-4">
                                    {/* Contact Section */}
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                                <User className="w-3 h-3" /> Full Name
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.fullName}
                                                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                                                placeholder="Enter your name"
                                                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-[#cba153]/20 focus:border-[#cba153] outline-none transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                                <Phone className="w-3 h-3" /> Phone Number
                                            </label>
                                            <input
                                                type="tel"
                                                value={formData.phoneNumber}
                                                onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                                                placeholder="+251 ..."
                                                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-[#cba153]/20 focus:border-[#cba153] outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div className="h-px w-full bg-gray-100 dark:bg-gray-800 my-2"></div>

                                    {/* Shipping Section */}
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                                    <MapPin className="w-3 h-3" /> Address Details
                                                </label>
                                                <button
                                                    onClick={() => {
                                                        if (!locationEnabled) enableLocation();
                                                    }}
                                                    className="text-[10px] font-bold text-[#cba153] hover:underline flex items-center gap-1"
                                                >
                                                    <MapPin className="w-3 h-3" /> {locationEnabled ? 'Location Ready' : 'Share Location'}
                                                </button>
                                            </div>
                                            <textarea
                                                rows={4}
                                                value={formData.address}
                                                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                                placeholder="House No, Street, Landmark..."
                                                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-[#cba153]/20 focus:border-[#cba153] outline-none transition-all"
                                            />
                                        </div>
                                        {locationName && (
                                            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-lg flex gap-3 border border-blue-100 dark:border-blue-500/20">
                                                <MapPin className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-tight">Detected Location</p>
                                                    <p className="text-[11px] text-blue-600 dark:text-blue-300 mt-0.5">{locationName}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {currentStep === 'payment' && (
                            <motion.div
                                key="payment"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="space-y-4">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Payment Method</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Choose how you want to pay.</p>
                                </div>

                                <div className="space-y-3">
                                    <label className={`
                                        flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer
                                        ${formData.paymentMethod === 'cash_on_delivery'
                                            ? 'border-[#cba153] bg-[#cba153]/5'
                                            : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'}
                                    `}>
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-lg ${formData.paymentMethod === 'cash_on_delivery' ? 'bg-[#cba153] text-black' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                                                <CreditCard className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white">Cash on Delivery</p>
                                                <p className="text-xs text-gray-500">Pay when you receive items</p>
                                            </div>
                                        </div>
                                        <input
                                            type="radio"
                                            className="accent-[#cba153] w-5 h-5"
                                            checked={formData.paymentMethod === 'cash_on_delivery'}
                                            onChange={() => setFormData(prev => ({ ...prev, paymentMethod: 'cash_on_delivery', bankMethod: null }))}
                                        />
                                    </label>

                                    <label className={`
                                        flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer
                                        ${formData.paymentMethod === 'bank_transfer'
                                            ? 'border-[#cba153] bg-[#cba153]/5'
                                            : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'}
                                    `}>
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-lg ${formData.paymentMethod === 'bank_transfer' ? 'bg-[#cba153] text-black' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                                                <CreditCard className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white">Bank Transfer</p>
                                                <p className="text-xs text-gray-500">Pay via CBE or Telebirr</p>
                                            </div>
                                        </div>
                                        <input
                                            type="radio"
                                            className="accent-[#cba153] w-5 h-5"
                                            checked={formData.paymentMethod === 'bank_transfer'}
                                            onChange={() => setFormData(prev => ({ ...prev, paymentMethod: 'bank_transfer' }))}
                                        />
                                    </label>

                                    <AnimatePresence>
                                        {formData.paymentMethod === 'bank_transfer' && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="grid grid-cols-2 gap-3 pt-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({ ...prev, bankMethod: 'cbe' }))}
                                                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all group scale-95 ${formData.bankMethod === 'cbe'
                                                            ? 'border-[#cba153] bg-[#cba153]/10 ring-1 ring-[#cba153]'
                                                            : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-[#cba153]/50'}`}
                                                    >
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-colors ${formData.bankMethod === 'cbe' ? 'bg-[#cba153] text-black' : 'bg-[#6f2b91]/10 group-hover:bg-[#6f2b91]/20'}`}>
                                                            <img
                                                                src="https://raw.githubusercontent.com/Chapa-Et/ethiopianlogos/main/logos/commercial_bank_of_ethiopia/commercial_bank_of_ethiopia.png"
                                                                alt="CBE"
                                                                className={`w-10 h-10 object-contain ${formData.bankMethod === 'cbe' ? 'brightness-0' : ''}`}
                                                                onError={(e) => {
                                                                    const target = e.target as HTMLImageElement;
                                                                    target.src = "https://upload.wikimedia.org/wikipedia/commons/2/21/CBE_Logo2.png";
                                                                }}
                                                            />
                                                        </div>
                                                        <span className={`text-[10px] font-black uppercase tracking-wider ${formData.bankMethod === 'cbe' ? 'text-[#cba153]' : 'text-gray-900 dark:text-white'}`}>CBE Birr</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({ ...prev, bankMethod: 'telebirr' }))}
                                                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all group scale-95 ${formData.bankMethod === 'telebirr'
                                                            ? 'border-[#cba153] bg-[#cba153]/10 ring-1 ring-[#cba153]'
                                                            : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-[#cba153]/50'}`}
                                                    >
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-colors ${formData.bankMethod === 'telebirr' ? 'bg-[#cba153] text-black' : 'bg-blue-500/10 group-hover:bg-blue-500/20'}`}>
                                                            <img
                                                                src="https://raw.githubusercontent.com/Chapa-Et/ethiopianlogos/main/logos/tele_birr/tele_birr.png"
                                                                alt="Telebirr"
                                                                className={`w-12 h-12 object-contain scale-110 ${formData.bankMethod === 'telebirr' ? 'brightness-0' : ''}`}
                                                                onError={(e) => {
                                                                    const target = e.target as HTMLImageElement;
                                                                    target.src = "https://www.telebirr.com.et/wp-content/uploads/2021/04/telebirr-logo.png";
                                                                }}
                                                            />
                                                        </div>
                                                        <span className={`text-[10px] font-black uppercase tracking-wider ${formData.bankMethod === 'telebirr' ? 'text-[#cba153]' : 'text-gray-900 dark:text-white'}`}>Telebirr</span>
                                                    </button>
                                                </div>

                                                <AnimatePresence>
                                                    {formData.bankMethod === 'telebirr' && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden mt-3"
                                                        >
                                                            <div className="p-4 bg-white dark:bg-gray-900 border border-[#cba153]/30 rounded-2xl space-y-4 shadow-sm shadow-[#cba153]/5">
                                                                <div className="space-y-1">
                                                                    <p className="text-xs font-bold text-gray-900 dark:text-white">Step 1: Send Payment</p>
                                                                    <p className="text-[11px] text-gray-500">Send <span className="font-bold text-[#cba153]">{new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(totalPrice)}</span> to the following number:</p>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            navigator.clipboard.writeText('0963138123');
                                                                            if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
                                                                                window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
                                                                            }
                                                                        }}
                                                                        className="mt-2 w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                                                    >
                                                                        <span className="font-mono font-bold text-lg tracking-widest text-[#cba153]">09 63 13 81 23</span>
                                                                        <span className="text-[10px] font-bold text-gray-400 bg-white dark:bg-gray-900 px-2 py-1 rounded shadow-sm">COPY</span>
                                                                    </button>
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <p className="text-xs font-bold text-gray-900 dark:text-white">Step 2: Paste SMS</p>
                                                                    <p className="text-[11px] text-gray-500">Paste the FULL SMS message you received from Telebirr here:</p>
                                                                    <textarea
                                                                        rows={4}
                                                                        value={formData.telebirrSmsText}
                                                                        onChange={(e) => setFormData(prev => ({ ...prev, telebirrSmsText: e.target.value }))}
                                                                        placeholder="Dear TSegalem You have transferred ETB..."
                                                                        className="w-full bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-[#cba153] rounded-xl px-4 py-3 text-sm transition resize-none"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                {error && error.includes('payment method') && (
                                                    <motion.p
                                                        initial={{ opacity: 0, y: -5 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="text-[10px] font-bold text-red-500 mt-2 px-2 flex items-center gap-1"
                                                    >
                                                        <AlertCircle className="w-3 h-3" /> {error}
                                                    </motion.p>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        )}

                        {currentStep === 'summary' && (
                            <motion.div
                                key="summary"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="space-y-4">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Order Summary</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Review your details before placing the order.</p>
                                </div>

                                <div className="space-y-4">
                                    {/* Items Preview */}
                                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 space-y-3">
                                        {items.map(item => (
                                            <div key={item.id} className="flex justify-between text-sm">
                                                <span className="text-gray-600 dark:text-gray-300">
                                                    {item.quantity}x {item.product.name}
                                                    {item.selectedSize && <span className="text-[10px] ml-2 px-1 bg-[#cba153]/20 text-[#cba153] rounded uppercase">{item.selectedSize}</span>}
                                                </span>
                                                <span className="font-bold text-gray-900 dark:text-white">
                                                    {new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(item.product.price * item.quantity)}
                                                </span>
                                            </div>
                                        ))}
                                        <div className="pt-3 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center text-lg font-black">
                                            <span className="text-gray-900 dark:text-white uppercase tracking-wider">Total</span>
                                            <span className="text-[#cba153]">
                                                {new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(totalPrice)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Info Review */}
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="p-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl space-y-1">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Delivery To</p>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">{formData.fullName}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{formData.phoneNumber}</p>
                                        </div>
                                        <div className="p-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl space-y-1">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Shipping Address</p>
                                            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-medium">{formData.address}</p>
                                        </div>
                                        <div className="p-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl space-y-1">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Payment</p>
                                            <p className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-tight">
                                                {formData.paymentMethod === 'cash_on_delivery'
                                                    ? 'Cash on Delivery'
                                                    : `Bank Transfer (${formData.bankMethod === 'cbe' ? 'CBE Birr' : 'Telebirr'})`}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {currentStep === 'success' && (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center text-center py-12 space-y-6"
                            >
                                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/20">
                                    <CheckCircle2 className="w-12 h-12 text-white" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Order Success!</h2>
                                    <p className="text-gray-500 dark:text-gray-400">Order #{orderId} has been placed.</p>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                                    Thank you for shopping with us. We will contact you shortly to confirm your delivery.
                                </p>

                                <Link
                                    href="/"
                                    className={`w-full bg-[#cba153] text-black font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-transform flex items-center justify-center mt-6`}
                                >
                                    BACK TO HOME
                                </Link>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl flex gap-3 text-red-600 dark:text-red-400 items-center"
                        >
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <p className="text-xs font-medium">{error}</p>
                        </motion.div>
                    )}
                </div>

                {/* Footer Buttons */}
                {currentStep !== 'success' && (
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-black/80 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 max-w-md mx-auto">
                        <button
                            disabled={isSubmitting}
                            onClick={currentStep === 'summary' ? handleSubmitOrder : handleNext}
                            className={`
                                w-full flex items-center justify-center gap-2 font-black py-4 rounded-2xl transition-all active:scale-[0.98]
                                ${isSubmitting ? 'bg-gray-200 dark:bg-gray-800 text-gray-400' : 'bg-[#cba153] text-black shadow-lg shadow-[#cba153]/20'}
                            `}
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    {currentStep === 'summary' ? 'PLACE ORDER' : 'CONTINUE'}
                                    <ChevronRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </div>
                )}
            </main>
        </PageTransition>
    );
}
