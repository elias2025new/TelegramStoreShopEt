import { CartItem } from '@/context/CartContext';

export const OWNER_ID = '5908397596';
export const OWNER_USERNAME = 'gamfis';
const BOT_TOKEN = process.env.NEXT_PUBLIC_BOT_TOKEN;

export async function sendTelegramNotification(message: string, imageUrls: string[] = []) {
    if (!BOT_TOKEN) {
        console.error('Telegram Bot Token is missing');
        return;
    }

    try {
        if (imageUrls.length === 0) {
            // Send as text only
            const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: OWNER_ID,
                    text: message,
                    parse_mode: 'HTML',
                }),
            });
            const result = await response.json();
            if (!result.ok) console.error('Telegram notification failed:', result.description);
        } else if (imageUrls.length === 1) {
            // Send as photo with caption
            const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: OWNER_ID,
                    photo: imageUrls[0],
                    caption: message,
                    parse_mode: 'HTML',
                }),
            });
            const result = await response.json();
            if (!result.ok) console.error('Telegram photo notification failed:', result.description);
        } else {
            // Send as media group (up to 10)
            const media = imageUrls.slice(0, 10).map((url, index) => ({
                type: 'photo',
                media: url,
                caption: index === 0 ? message : '',
                parse_mode: 'HTML'
            }));

            const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMediaGroup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: OWNER_ID,
                    media: media
                }),
            });
            const result = await response.json();
            if (!result.ok) console.error('Telegram media group notification failed:', result.description);
        }
    } catch (error) {
        console.error('Error sending Telegram notification:', error);
    }
}

interface OrderData {
    id: string;
    full_name: string;
    phone_number: string;
    shipping_address: string;
    total_price: number;
    payment_method: string;
    status: string;
    transaction_id?: string | null;
}

export function formatOrderMessage(orderData: OrderData, items: CartItem[], totalPrice: number) {
    const itemsList = items.map(item =>
        `• ${item.product.name}${item.selectedSize ? ` (Size: ${item.selectedSize})` : ''} x ${item.quantity} - ${new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(item.product.price * item.quantity)}`
    ).join('\n');

    return `
<b>🛍 NEW ORDER RECEIVED!</b>

<b>Order ID:</b> #${orderData.id.split('-')[0].toUpperCase()}
<b>Customer:</b> ${orderData.full_name}
<b>Phone:</b> ${orderData.phone_number}
<b>Status:</b> ${orderData.status.toUpperCase()}

<b>📦 ITEMS:</b>
${itemsList}

<b>💰 TOTAL:</b> ${new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(totalPrice)}
<b>💳 PAYMENT:</b> ${orderData.payment_method.replace(/_/g, ' ').toUpperCase()}

<b>📍 ADDRESS:</b>
${orderData.shipping_address}

<i>Check the admin panel for more details.</i>
`.trim();
}

export function getDirectMessageLink(orderData: OrderData, items: CartItem[], totalPrice: number) {
    const text = formatOrderMessage(orderData, items, totalPrice);
    // Remove HTML tags for the text parameter in URL
    const plainText = text.replace(/<[^>]*>/g, '');
    return `https://t.me/${OWNER_USERNAME}?text=${encodeURIComponent(plainText)}`;
}

export async function broadcastTelegramMessage(
    chatIds: string[],
    message: string,
    imageUrl: string | null = null,
    onProgress?: (sent: number, total: number) => void
) {
    if (!BOT_TOKEN) {
        console.error('Telegram Bot Token is missing');
        return;
    }

    let sentCount = 0;
    const total = chatIds.length;

    for (const chatId of chatIds) {
        try {
            const body: any = {
                chat_id: chatId,
                parse_mode: 'HTML',
            };

            let endpoint = 'sendMessage';
            if (imageUrl) {
                endpoint = 'sendPhoto';
                body.photo = imageUrl;
                body.caption = message;
            } else {
                body.text = message;
            }

            const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const result = await response.json();
            if (result.ok) {
                sentCount++;
                if (onProgress) onProgress(sentCount, total);
            } else {
                console.warn(`Failed to send broadcast to ${chatId}:`, result.description);
                // If the user blocked the bot, we just continue
            }

            // Simple rate limiting: 50ms delay between messages
            // Telegram allows 30 msg/sec, so 50ms = 20 msg/sec is safe
            await new Promise(resolve => setTimeout(resolve, 50));
        } catch (error) {
            console.error(`Error broadcasting to ${chatId}:`, error);
        }
    }

    return sentCount;
}
