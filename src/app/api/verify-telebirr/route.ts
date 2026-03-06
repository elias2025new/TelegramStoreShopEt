import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase/client';

export async function POST(request: Request) {
    try {
        const { smsText, expectedAmount } = await request.json();

        if (!smsText || typeof smsText !== 'string' || smsText.length < 30) {
            return NextResponse.json({ success: false, error: 'Invalid SMS text. Please paste the full message.' }, { status: 400 });
        }

        const normalizedText = smsText.toLowerCase().replace(/\s+/g, ' ');

        // 1. Verify it was sent to the correct store
        // Telebirr P2P SMS masks the number like: 2519****8123
        // So we check for the name "bizawet yohanis" or the unmasked digits "8123"
        if (!normalizedText.includes('bizawet yohanis') && !normalizedText.includes('8123')) {
            return NextResponse.json({
                success: false,
                error: 'Payment does not appear to be sent to the correct store (bizawet yohanis / ****8123).'
            }, { status: 400 });
        }

        // 2. Extract the Transaction ID
        // Often looks like: "Your telebirr transaction number is DC55GJFDK7"
        // Or could be "transaction ID: DC55GJFDK7"
        const txnMatch = smsText.match(/transaction (number|id) (is )?([A-Z0-9]+)/i);
        let transactionId = txnMatch ? txnMatch[3] : null;

        if (!transactionId) {
            // Fallback: look for any 10+ character alphanumeric string that might be the ID
            const fallbackMatch = smsText.match(/\b([A-Z0-9]{10,})\b/);
            if (fallbackMatch && !fallbackMatch[1].match(/^\d+$/)) { // don't grab phone numbers
                transactionId = fallbackMatch[1];
            }
        }

        if (!transactionId) {
            return NextResponse.json({ success: false, error: 'Could not find a valid Transaction ID in the SMS text.' }, { status: 400 });
        }

        // 3. Extract the Amount
        // Often looks like: "You have transferred ETB 5.00 successfully"
        const amountMatch = smsText.match(/ETB\s*([\d,]+\.?\d*)/i);
        if (!amountMatch) {
            return NextResponse.json({ success: false, error: 'Could not find the ETB amount in the SMS text.' }, { status: 400 });
        }

        const parsedAmount = parseFloat(amountMatch[1].replace(/,/g, ''));

        if (parsedAmount !== expectedAmount) {
            return NextResponse.json({
                success: false,
                error: `Amount mismatch. SMS shows ${parsedAmount} ETB, but order total is ${expectedAmount} ETB.`
            }, { status: 400 });
        }

        // 4. Check for duplicate transaction ID in Database
        try {
            const { data: existingOrder, error: dbErr } = await supabase
                .from('orders')
                .select('id')
                .eq('transaction_id', transactionId)
                .maybeSingle();

            if (dbErr) {
                console.error('Supabase query error:', dbErr);
                // We shouldn't fail the checkout if the DB check itself errors out (e.g. column missing temporarily)
                // But we log it.
            } else if (existingOrder) {
                return NextResponse.json({
                    success: false,
                    error: `This transaction ID (${transactionId}) has already been used for another order.`
                }, { status: 400 });
            }
        } catch (dbErr) {
            console.warn('Could not check duplicate transaction_id:', dbErr);
        }

        // If everything passes, return success!
        return NextResponse.json({
            success: true,
            transactionId,
            message: 'Verification successful'
        });

    } catch (e: any) {
        console.error('Telebirr verify error:', e?.message || e);
        return NextResponse.json({ success: false, error: `Verification failed: ${e?.message || 'Unknown server error'}` }, { status: 500 });
    }
}
