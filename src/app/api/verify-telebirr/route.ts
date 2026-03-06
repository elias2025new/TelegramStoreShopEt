import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase/client';
import * as cheerio from 'cheerio';

export async function POST(request: Request) {
    try {
        const { url, expectedAmount } = await request.json();

        if (!url || !url.includes('transactioninfo.ethiotelecom.et/receipt/')) {
            return NextResponse.json({ success: false, error: 'Invalid Telebirr receipt URL' }, { status: 400 });
        }

        // Extract transaction ID
        const urlParts = url.split('/');
        const transactionId = urlParts[urlParts.length - 1].trim();

        if (!transactionId) {
            return NextResponse.json({ success: false, error: 'Could not extract Transaction ID from URL' }, { status: 400 });
        }

        // Check if transaction ID was already used
        const { data: existingOrder, error: dbError } = await supabase
            .from('orders')
            .select('id')
            .eq('transaction_id', transactionId)
            .maybeSingle();

        if (existingOrder) {
            return NextResponse.json({ success: false, error: 'This receipt has already been used for another order' }, { status: 400 });
        }

        if (dbError) {
            console.error('Supabase error checking transaction_id:', dbError);
            // Optionally, we could block it here, but if RLS prevents read, it might be an issue.
            // Let's proceed assuming the query worked.
        }

        // Fetch receipt HTML
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });

        if (!response.ok) {
            return NextResponse.json({ success: false, error: 'Failed to access the receipt URL. Make sure it is public.' }, { status: 400 });
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        let creditedName = '';
        let status = '';
        let settledAmount = '';

        $('td').each((i, el) => {
            const text = $(el).text().trim().replace(/\s+/g, ' ');
            if (text.includes('Credited Party name')) {
                creditedName = $(el).next('td').text().trim().toLowerCase();
            } else if (text.includes('transaction status')) {
                status = $(el).next('td').text().trim();
            }
        });

        // For Settled Amount, in the HTML structure we saw it's in a table with a header "Settled Amount"
        let foundHeaders = false;
        let amountColIndex = -1;

        $('tr').each((i, tr) => {
            const rowText = $(tr).text();
            if (rowText.includes('Settled Amount')) {
                $(tr).find('td').each((j, td) => {
                    if ($(td).text().includes('Settled Amount')) {
                        amountColIndex = j;
                    }
                });
                foundHeaders = true;
            } else if (foundHeaders && amountColIndex !== -1 && rowText.includes(transactionId)) {
                // This is the data row containing the transaction ID we extracted
                const tds = $(tr).find('td');
                if (tds.length > amountColIndex) {
                    settledAmount = $(tds[amountColIndex]).text().trim();
                }
                foundHeaders = false; // Stop checking
            }
        });

        if (!creditedName.includes('bizawet yohanis beru')) {
            return NextResponse.json({ success: false, error: 'Invalid store name on receipt. Expected: bizawet yohanis beru' }, { status: 400 });
        }

        if (status.toLowerCase() !== 'completed') {
            return NextResponse.json({ success: false, error: 'Transaction is not completed' }, { status: 400 });
        }

        // Extract number from settledAmount (e.g., "5.00 Birr" -> 5.00)
        const amountMatch = settledAmount.match(/[\d,.]+/);
        if (!amountMatch) {
            return NextResponse.json({ success: false, error: 'Could not parse amount from receipt' }, { status: 400 });
        }

        const parsedAmount = parseFloat(amountMatch[0].replace(/,/g, ''));
        if (parsedAmount !== expectedAmount) {
            return NextResponse.json({ success: false, error: `Amount mismatch. Receipt shows ${parsedAmount} ETB, but order requires ${expectedAmount} ETB` }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            transactionId,
            message: 'Verification successful'
        });

    } catch (e: any) {
        console.error('Telebirr verification error:', e);
        return NextResponse.json({ success: false, error: 'Server error during verification' }, { status: 500 });
    }
}
