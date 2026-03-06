import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase/client';

// Store owner's telebirr numbers (all valid formats)
const STORE_NUMBERS = ['251963138123', '0963138123', '963138123'];

export async function POST(request: Request) {
    try {
        const { smsText, expectedAmount } = await request.json();

        if (!smsText || typeof smsText !== 'string' || smsText.length < 30) {
            return NextResponse.json({ success: false, error: 'Please paste the full SMS message from Telebirr' }, { status: 400 });
        }

        const text = smsText.trim();

        // Check it looks like a Telebirr SMS
        if (!text.toLowerCase().includes('telebirr') && !text.toLowerCase().includes('ethio telecom')) {
            return NextResponse.json({ success: false, error: 'This does not look like a Telebirr SMS message' }, { status: 400 });
        }

        // Extract Transaction ID
        const txMatch = text.match(/telebirr transaction number is ([A-Z0-9]+)/i);
        if (!txMatch) {
            return NextResponse.json({ success: false, error: 'Could not find Telebirr transaction number in the SMS' }, { status: 400 });
        }
        const transactionId = txMatch[1].trim();

        // Extract Amount (first ETB amount in the "transferred" sentence)
        const amountMatch = text.match(/transferred\s+ETB\s+([\d,]+\.?\d*)/i);
        if (!amountMatch) {
            return NextResponse.json({ success: false, error: 'Could not find transferred amount in the SMS' }, { status: 400 });
        }
        const parsedAmount = parseFloat(amountMatch[1].replace(/,/g, ''));

        // Check recipient account is the store owner's number
        const recipientIsStore = STORE_NUMBERS.some(num => text.includes(num));
        if (!recipientIsStore) {
            return NextResponse.json({
                success: false,
                error: 'This payment was not sent to our store number (0963138123). Please make sure you sent payment to the correct number.'
            }, { status: 400 });
        }

        // Validate amount matches order total
        if (parsedAmount !== expectedAmount) {
            return NextResponse.json({
                success: false,
                error: `Amount mismatch. SMS shows ${parsedAmount} ETB, but order total is ${expectedAmount} ETB`
            }, { status: 400 });
        }

        // Check for duplicate transaction ID
        try {
            const { data: existingOrder } = await supabase
                .from('orders')
                .select('id')
                .eq('transaction_id', transactionId)
                .maybeSingle();

            if (existingOrder) {
                return NextResponse.json({ success: false, error: 'This receipt has already been used for a previous order' }, { status: 400 });
            }
        } catch (dbErr) {
            console.warn('Could not check duplicate transaction_id:', dbErr);
        }

        return NextResponse.json({
            success: true,
            transactionId,
            message: 'Verification successful'
        });

    } catch (e: any) {
        console.error('Telebirr SMS verification error:', e?.message || e);
        return NextResponse.json({ success: false, error: `Verification failed: ${e?.message || 'Unknown error'}` }, { status: 500 });
    }
}
