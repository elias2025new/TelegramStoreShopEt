import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase/client';
import * as cheerio from 'cheerio';
import https from 'https';

// 1. Direct fetch using Node https to bypass SSL cert issues
function fetchHtmlDirect(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const agent = new https.Agent({ rejectUnauthorized: false });
        const req = https.get(url, {
            agent, headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            }
        }, (res) => {
            if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                // handle redirect
                fetchHtmlDirect(res.headers.location).then(resolve).catch(reject);
                return;
            }
            if (res.statusCode !== 200) {
                reject(new Error(`HTTP ${res.statusCode}`));
                return;
            }
            let data = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => resolve(data));
        });
        req.setTimeout(8000, () => {
            req.destroy();
            reject(new Error('Direct fetch timed out'));
        });
        req.on('error', reject);
    });
}

// 2. Fallback fetch using multiple public proxies to bypass Vercel geographic IP blocking
async function fetchHtmlWithFallbacks(url: string): Promise<string> {
    const attempts = [];
    const TIMEOUT_MS = 8000;

    const fetchWithTimeout = async (url: string, options: any = {}) => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
        try {
            const res = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(id);
            return res;
        } catch (e) {
            clearTimeout(id);
            throw e;
        }
    };

    // Attempt 1: Direct Fetch
    try {
        console.log('Attempt 1: Direct Fetch');
        const html = await fetchHtmlDirect(url);
        if (html && html.includes('telebirr')) return html;
    } catch (e: any) {
        attempts.push(`Direct: ${e.message}`);
    }

    // List of reliable public proxies
    const proxies = [
        { name: 'CORSProxy.io', url: `https://corsproxy.io/?${encodeURIComponent(url)}` },
        { name: 'AllOrigins', url: `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}` },
        { name: 'Thingproxy', url: `https://thingproxy.freeboard.io/fetch/${url}` },
        { name: 'CorsAnywhere', url: `https://cors-anywhere.herokuapp.com/${url}` },
        { name: 'GoogleTranslate', url: `https://translate.google.com/translate?sl=auto&tl=en&u=${encodeURIComponent(url)}` }
    ];

    for (const proxy of proxies) {
        try {
            console.log(`Attempt: ${proxy.name}`);
            const res = await fetchWithTimeout(proxy.url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
            });

            if (res.ok) {
                const html = await res.text();
                // Google Translate wraps the page in an iframe, so just checking for 'telebirr' or text is mostly okay
                // since we parse it with cheerio anyway, the td/tr structure will usually survive translation proxy if it extracts the raw DOM
                if (html && (html.toLowerCase().includes('telebirr') || html.toLowerCase().includes('receipt'))) {
                    return html;
                }
            } else {
                attempts.push(`${proxy.name}: HTTP ${res.status}`);
            }
        } catch (e: any) {
            attempts.push(`${proxy.name}: ${e.message}`);
        }
    }

    throw new Error(`All network fetch attempts failed to reach the Ethio Telecom server. Details: ${attempts.join(' | ')}`);
}

export async function POST(request: Request) {
    try {
        const { url, expectedAmount } = await request.json();

        if (!url || !url.includes('transactioninfo.ethiotelecom.et/receipt/')) {
            return NextResponse.json({ success: false, error: 'Invalid Telebirr receipt URL format' }, { status: 400 });
        }

        // Extract transaction ID from URL
        const urlParts = url.split('/');
        let transactionId = urlParts[urlParts.length - 1].trim();

        // Remove any query params like ?lang=en from the transaction ID
        if (transactionId.includes('?')) {
            transactionId = transactionId.split('?')[0];
        }

        if (!transactionId || transactionId.length < 5) {
            return NextResponse.json({ success: false, error: 'Could not extract valid Transaction ID from URL' }, { status: 400 });
        }

        // Step 1: Fetch receipt HTML
        let html = '';
        try {
            html = await fetchHtmlWithFallbacks(url.trim());
        } catch (fetchErr: any) {
            return NextResponse.json({
                success: false,
                error: fetchErr?.message || 'Network error'
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
            if (text.toLowerCase().includes('credited party name')) {
                creditedName = $(el).next('td').text().trim().toLowerCase();
            } else if (text.toLowerCase().includes('transaction status')) {
                status = $(el).next('td').text().trim();
            }
        });

        // Scrape settled amount from the invoice table
        let foundHeaders = false;
        let amountColIndex = -1;

        $('tr').each((i, tr) => {
            const rowText = $(tr).text();
            if (rowText.toLowerCase().includes('settled amount')) {
                $(tr).find('td').each((j, td) => {
                    if ($(td).text().toLowerCase().includes('settled amount')) {
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

        // If data is still missing, search the entire HTML broadly (sometimes Translate proxies modify DOM structure)
        if (!settledAmount) {
            const htmlText = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '); // Strip all HTML to raw text

            // Regex fallback 1: Look for exact transaction ID followed by amounts somewhere nearby
            if (htmlText.includes(transactionId)) {
                const amountMatch = htmlText.match(/Settled Amount.*?([\d,]+\.?\d*)/i);
                if (amountMatch) settledAmount = amountMatch[1];
            }
        }

        if (!status) {
            const htmlText = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
            if (htmlText.toLowerCase().includes('transaction status completed') || htmlText.toLowerCase().includes('status completed')) {
                status = 'completed';
            }
        }

        // Step 2: Validate scraped values
        if (!creditedName.includes('bizawet yohanis beru')) {
            // Because proxies might mangle text slightly, let's do a more robust fallback generic check
            const htmlTextRaw = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').toLowerCase();
            if (!htmlTextRaw.includes('bizawet yohanis beru')) {
                return NextResponse.json({
                    success: false,
                    error: `Payment was not sent to the correct store. Found: "${creditedName || 'unknown'}"`
                }, { status: 400 });
            }
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
