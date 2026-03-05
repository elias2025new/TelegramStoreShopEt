export const OWNER_ID = '5908397596';
export const OWNER_USERNAME = 'gamfis';
const BOT_TOKEN = process.env.NEXT_PUBLIC_BOT_TOKEN;

export async function sendTelegramNotification(message: string) {
    if (!BOT_TOKEN) {
        console.error('Telegram Bot Token is missing');
        return;
    }

    try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: OWNER_ID,
                text: message,
                parse_mode: 'HTML',
            }),
        });

        const result = await response.json();
        if (!result.ok) {
            console.error('Telegram notification failed:', result.description);
        }
    } catch (error) {
        console.error('Error sending Telegram notification:', error);
    }
}

export function formatOrderMessage(orderData: any, items: any[], totalPrice: number) {
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

export function getDirectMessageLink(orderData: any, items: any[], totalPrice: number) {
    const text = formatOrderMessage(orderData, items, totalPrice);
    // Remove HTML tags for the text parameter in URL
    const plainText = text.replace(/<[^>]*>/g, '');
    return `https://t.me/${OWNER_USERNAME}?text=${encodeURIComponent(plainText)}`;
}
