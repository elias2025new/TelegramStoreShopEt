import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase/client';
import * as cheerio from 'cheerio';
import https from 'https';

// Uses native Node https to bypass SSL cert issues from Vercel -> Ethiopian servers
function fetchHtml(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const agent = new https.Agent({ rejectUnauthorized: false });
        const req = https.get(url, {
            agent, headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            }
        }, (res) => {
            if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                // Handle redirects
                fetchHtml(res.headers.location).then(resolve).catch(reject);
                return;
            }
            let data = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => resolve(data));
        });
        req.setTimeout(15000, () => {
            req.destroy();
            reject(new Error('Request timed out after 15 seconds'));
        });
        req.on('error', reject);
    });
}

export async function POST(request: Request) {
    try {
        const { url, expectedAmount } = await request.json();

        if (!url || !url.includes('transactioninfo.ethiotelecom.et/receipt/')) {
            return NextResponse.json({ success: false, error: 'Invalid Telebirr receipt URL' }, { status: 400 });
        }

        // Extract transaction ID from URL
        const urlParts = url.split('/');
        const transactionId = urlParts[urlParts.length - 1].trim();

        if (!transactionId) {
            return NextResponse.json({ success: false, error: 'Could not extract Transaction ID from URL' }, { status: 400 });
        }

        // Step 1: Fetch receipt HTML using native https (bypasses SSL issues)
        let html = '';
        try {
            html = await fetchHtml(url.trim());
        } catch (fetchErr: any) {
            return NextResponse.json({
                success: false,
                error: `Could not load receipt: ${fetchErr?.message || 'Network error'}. Please check your link.`
            }, { status: 400 });
        }

        if (!html || html.length < 100) {
            return NextResponse.json({ success: false, error: 'Receipt page returned empty content' }, { status: 400 });
        }

        const $ = cheerio.load(html);

        let creditedName = '';
        let status = '';
        let settledAmount = '';

        // Scrape credited party name and transaction status
        $('td').each((i, el) => {
            const text = $(el).text().trim().replace(/\s+/g, ' ');
            if (text.includes('Credited Party name')) {
                creditedName = $(el).next('td').text().trim().toLowerCase();
            } else if (text.includes('transaction status')) {
                status = $(el).next('td').text().trim();
            }
        });

        // Scrape settled amount from the invoice table
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
                const tds = $(tr).find('td');
                if (tds.length > amountColIndex) {
                    settledAmount = $(tds[amountColIndex]).text().trim();
                }
                foundHeaders = false;
            }
        });

        // Step 2: Validate scraped values
        if (!creditedName.includes('bizawet yohanis beru')) {
            return NextResponse.json({
                success: false,
                error: `Payment was not sent to the correct store. Found: "${creditedName || 'unknown'}"`
            }, { status: 400 });
        }

        if (status.toLowerCase() !== 'completed') {
            return NextResponse.json({ success: false, error: 'Transaction is not completed' }, { status: 400 });
        }

        const amountMatch = settledAmount.match(/[\d,.]+/);
        if (!amountMatch) {
            return NextResponse.json({ success: false, error: 'Could not read amount from receipt' }, { status: 400 });
        }

        const parsedAmount = parseFloat(amountMatch[0].replace(/,/g, ''));
        if (parsedAmount !== expectedAmount) {
            return NextResponse.json({
                success: false,
                error: `Amount mismatch. Receipt shows ${parsedAmount} ETB, but order total is ${expectedAmount} ETB`
            }, { status: 400 });
        }

        // Step 3: Check for duplicate transaction ID in DB
        try {
            const { data: existingOrder } = await supabase
                .from('orders')
                .select('id')
                .eq('transaction_id', transactionId)
                .maybeSingle();

            if (existingOrder) {
                return NextResponse.json({ success: false, error: 'This receipt has already been used for another order' }, { status: 400 });
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
        console.error('Telebirr verification error:', e?.message || e);
        return NextResponse.json({ success: false, error: `Verification failed: ${e?.message || 'Unknown server error'}` }, { status: 500 });
    }
}
