import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AlertCircle, Clock, DollarSign, Download, Edit3, Eye, Plus, Search, TrendingDown, TrendingUp, X } from 'lucide-react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { useEffect, useState } from 'react';
import EmailService from '../../../../services/emailService';
import { supabase } from '../../../../shared/lib/supabase';
import { renderEmailTemplate } from '../../../../shared/utils/emailTemplates';
import logoImage from '/images/Brand.png';
const humanPlanType = (p) => {
    switch (p) {
        case 'monthly': return 'Monthly Subscription';
        case 'crash_course': return 'Crash Course';
        default: return 'One Time';
    }
};
const TransactionManagement = () => {
    const [currentUser] = useState({ role: 'super_admin' });
    const [transactions, setTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [dateRange, setDateRange] = useState('all');
    const [showAddTransaction, setShowAddTransaction] = useState(false);
    const [newTx, setNewTx] = useState({
        userEmail: '',
        user_name: '',
        amount: 0,
        currency: 'INR',
        description: '',
        payment_method: 'manual',
        category: 'class_booking',
        billing_plan_type: 'one_time', // one_time | monthly | crash_course
        billing_period_month: '', // YYYY-MM when monthly
        gst_rate: '0'
    });
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [businessConfig, setBusinessConfig] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        const loadBusinessSettings = async () => {
            try {
                const { data, error } = await supabase
                    .from('business_settings')
                    .select('key,value')
                    .in('key', ['business_profile', 'business_contact', 'invoice_preferences']);
                if (!error && data) {
                    const map = data.reduce((acc, row) => {
                        acc[row.key] = row.value;
                        return acc;
                    }, {});
                    setBusinessConfig({
                        profile: map.business_profile || {},
                        contact: map.business_contact || {},
                        invoice: map.invoice_preferences || {}
                    });
                }
            }
            catch (e) {
                console.warn('Failed to load business settings', e);
            }
        };
        loadBusinessSettings();
    }, []);
    const hasAccess = ['super_admin', 'super_user', 'energy_exchange_lead'].includes(currentUser.role);
    const canEdit = ['super_admin', 'super_user', 'energy_exchange_lead'].includes(currentUser.role);
    // Fetch transactions from DB (requires a view or RPC exposing user email/full name)
    const fetchTransactions = async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const { data, error } = await supabase
                .from('transactions_with_user')
                .select('id,user_id,subscription_id,amount,currency,status,payment_method,description,created_at,updated_at,billing_plan_type,billing_period_month,user_email,user_full_name')
                .order('created_at', { ascending: false })
                .limit(500);
            if (error)
                throw error;
            const rows = (data || []).map((r) => ({
                ...r,
                user_name: r.user_full_name || r.user_email || 'Unknown',
                type: r.amount >= 0 ? 'income' : 'expense',
                category: r.category || 'class_booking'
            }));
            setTransactions(rows);
        }
        catch (e) {
            console.error('Failed to load transactions', e);
            setLoadError(e.message || 'Failed to load');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchTransactions();
        // Real-time updates
        const channel = supabase
            .channel('public:transactions')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
            fetchTransactions();
        })
            .subscribe();
        return () => {
            supabase.removeChannel(channel);
        };
    }, []);
    useEffect(() => {
        let filtered = transactions;
        if (searchTerm) {
            filtered = filtered.filter(t => t.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.description?.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        if (filterStatus !== 'all')
            filtered = filtered.filter(t => t.status === filterStatus);
        if (filterType !== 'all')
            filtered = filtered.filter(t => t.type === filterType);
        setFilteredTransactions(filtered);
        setCurrentPage(1);
    }, [searchTerm, filterStatus, filterType, transactions]);
    const totalIncome = transactions.filter(t => t.type === 'income' && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = Math.abs(transactions.filter(t => t.type === 'expense' && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0));
    const netProfit = totalIncome - totalExpense;
    const pendingTransactions = transactions.filter(t => t.status === 'pending').length;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'failed': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    const getCategoryColor = (category) => {
        switch (category) {
            case 'class_booking': return 'bg-blue-100 text-blue-800';
            case 'subscription': return 'bg-purple-100 text-purple-800';
            case 'instructor_payment': return 'bg-orange-100 text-orange-800';
            case 'maintenance': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    const formatCurrency = (amount, currency = 'INR', useCode = false) => {
        const opts = useCode
            ? { style: 'currency', currency, currencyDisplay: 'code' }
            : { style: 'currency', currency };
        return new Intl.NumberFormat('en-IN', opts).format(Math.abs(amount));
    };
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    const formatBillingMonth = (val) => {
        if (!val)
            return '';
        // Accept 'YYYY-MM' or a full date
        let year, month;
        if (/^\d{4}-\d{2}$/.test(val)) {
            [year, month] = val.split('-');
        }
        else {
            const d = new Date(val);
            if (isNaN(d.getTime()))
                return val;
            year = String(d.getUTCFullYear());
            month = String(d.getUTCMonth() + 1).padStart(2, '0');
        }
        const dateForName = new Date(`${year}-${month}-01T00:00:00Z`);
        const monthName = dateForName.toLocaleDateString('en-IN', { month: 'short' });
        return `${monthName} ${year}`;
    };
    const generateProfessionalInvoiceNumber = (rawId) => {
        const prefix = (businessConfig?.invoice?.invoice_number_prefix || 'YG').toUpperCase();
        const now = new Date();
        const yyyymm = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
        const numeric = (rawId.match(/\d+/g) || ['0000']).join('');
        const last4 = numeric.slice(-4).padStart(4, '0');
        return `${prefix}-${yyyymm}-${last4}`;
    };
    const paymentMethodOptions = [
        { value: 'upi', label: 'UPI' },
        { value: 'neft', label: 'NEFT' },
        { value: 'net_banking', label: 'Net Banking' },
        { value: 'credit_card', label: 'Credit Card' },
        { value: 'debit_card', label: 'Debit Card' },
        { value: 'cheque', label: 'Cheque' },
        { value: 'demand_draft', label: 'Demand Draft' },
        { value: 'cash', label: 'Cash' },
        { value: 'bank_transfer', label: 'Bank Transfer' },
        { value: 'manual', label: 'Manual' }
    ];
    const buildPendingTx = () => {
        return {
            id: Date.now().toString(),
            user_id: null,
            user_name: newTx.user_name || newTx.userEmail,
            amount: Number(newTx.amount),
            currency: newTx.currency || 'INR',
            status: 'completed',
            type: 'income',
            category: newTx.category || 'class_booking',
            payment_method: newTx.payment_method || 'manual',
            description: newTx.description || 'Manual payment',
            billing_plan_type: newTx.billing_plan_type,
            billing_period_month: newTx.billing_plan_type === 'monthly' && newTx.billing_period_month
                ? newTx.billing_period_month
                : null,
            gst_rate: newTx.gst_rate,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
    };
    const handleInitiateSave = () => {
        setShowConfirm(true);
    };
    const handleConfirmSaveTransaction = async () => {
        const tx = buildPendingTx();
        setSaving(true);
        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const jwt = sessionData?.session?.access_token;
            const { data: inserted, error: dbErr } = await supabase.functions.invoke('record-transaction', {
                body: {
                    user_id: null,
                    subscription_id: null,
                    amount: tx.amount,
                    currency: tx.currency,
                    status: 'completed',
                    payment_method: tx.payment_method,
                    stripe_payment_intent_id: null,
                    description: tx.description,
                    // After DB & function updated you may pass:
                    // billing_plan_type: tx.billing_plan_type,
                    // billing_period_month: tx.billing_period_month
                },
                headers: jwt ? { Authorization: `Bearer ${jwt}` } : undefined
            });
            if (dbErr) {
                console.warn('DB insert failed (RLS/policy?):', dbErr);
            }
            else if (inserted) {
                tx.id = inserted.id || tx.id;
                tx.created_at = inserted.created_at || tx.created_at;
                tx.updated_at = inserted.updated_at || tx.updated_at;
            }
            setTransactions(prev => [tx, ...prev]);
            const generateInvoicePdfBase64 = async () => {
                const pdfDoc = await PDFDocument.create();
                const page = pdfDoc.addPage([595.28, 841.89]); // A4
                const { width, height } = page.getSize();
                const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
                const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
                // Palette derived strictly from DB (business_settings.invoice_preferences). No forced fallback colors.
                // If a value is absent, sections will render with neutral defaults below.
                const primaryHex = businessConfig?.invoice?.color_primary;
                const accentHex = businessConfig?.invoice?.color_accent;
                const hexToRgbNorm = (hex) => {
                    const h = hex.replace('#', '');
                    const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
                    const intVal = parseInt(full, 16);
                    const r = (intVal >> 16) & 255;
                    const g = (intVal >> 8) & 255;
                    const b = intVal & 255;
                    return rgb(r / 255, g / 255, b / 255);
                };
                const primaryColor = primaryHex ? hexToRgbNorm(primaryHex) : rgb(0.97, 0.97, 0.97); // light neutral fallback (avoid pure white so logo/text visible)
                const accentColor = accentHex ? hexToRgbNorm(accentHex) : primaryColor; // reuse primary if accent absent
                const darkGray = rgb(0.2, 0.2, 0.2);
                const lightGray = rgb(0.985, 0.972, 0.952);
                const white = rgb(1, 1, 1);
                const black = rgb(0, 0, 0);
                // Determine readable header text color (contrast-based) so header never becomes "all white".
                const getHexRgb = (hex) => {
                    const h = hex.replace('#', '');
                    const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
                    return [
                        parseInt(full.slice(0, 2), 16),
                        parseInt(full.slice(2, 4), 16),
                        parseInt(full.slice(4, 6), 16)
                    ];
                };
                const [pr, pg, pb] = primaryHex ? getHexRgb(primaryHex) : [247, 247, 247];
                const luminance = (0.299 * pr + 0.587 * pg + 0.114 * pb) / 255;
                const headerTextColor = luminance > 0.6 ? darkGray : white;
                let currentY = height - 40;
                // Header band
                page.drawRectangle({
                    x: 0,
                    y: height - 140,
                    width,
                    height: 140,
                    color: primaryColor
                });
                // Logo
                let logoMetrics = { x: 20, y: 0, width: 0, height: 0 };
                try {
                    const normalize = (c) => {
                        if (!c)
                            return null;
                        if (c.startsWith('data:'))
                            return c;
                        if (c.startsWith('http'))
                            return c;
                        if (c.startsWith('/'))
                            return window.location.origin + c;
                        return window.location.origin + (c.startsWith('images') ? '/' + c : '/' + c);
                    };
                    const baseUrl = import.meta?.env?.BASE_URL || '/';
                    const rawCandidates = [
                        businessConfig?.profile?.logo_url,
                        import.meta?.env?.VITE_INVOICE_LOGO_URL,
                        logoImage,
                        `${baseUrl}images/Brand.png`,
                        '/images/Brand.png',
                        '/dist/images/Brand.png'
                    ].filter(Boolean);
                    const logoCandidates = rawCandidates.map(normalize).filter(Boolean);
                    let imgBytes = null;
                    const logoFetchAttempts = [];
                    for (const candidate of logoCandidates) {
                        try {
                            if (candidate.startsWith('data:')) {
                                const base64 = candidate.split(',')[1];
                                imgBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0)).buffer;
                                logoFetchAttempts.push({ url: candidate, ok: true, status: 200 });
                                break;
                            }
                            const r = await fetch(candidate);
                            logoFetchAttempts.push({ url: candidate, ok: r.ok, status: r.status });
                            if (r.ok) {
                                imgBytes = await r.arrayBuffer();
                                break;
                            }
                        }
                        catch {
                            logoFetchAttempts.push({ url: candidate, ok: false });
                        }
                    }
                    // Canvas fallback (handles scenarios where fetch is blocked / CORS)
                    if (!imgBytes && logoImage) {
                        try {
                            const imgEl = new Image();
                            imgEl.crossOrigin = 'anonymous';
                            imgEl.src = normalize(logoImage);
                            await new Promise((res, rej) => {
                                imgEl.onload = res;
                                imgEl.onerror = rej;
                            });
                            const canvas = document.createElement('canvas');
                            canvas.width = imgEl.naturalWidth;
                            canvas.height = imgEl.naturalHeight;
                            const ctx = canvas.getContext('2d');
                            if (ctx) {
                                ctx.drawImage(imgEl, 0, 0);
                                const dataUrl = canvas.toDataURL('image/png');
                                const base64 = dataUrl.split(',')[1];
                                imgBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0)).buffer;
                                logoFetchAttempts.push({ url: 'canvas-fallback', ok: true, status: 200 });
                            }
                        }
                        catch {
                            logoFetchAttempts.push({ url: 'canvas-fallback', ok: false });
                        }
                    }
                    console.log('Invoice PDF logo attempts:', logoFetchAttempts);
                    if (!imgBytes) {
                        try {
                            const forced = normalize('/images/Brand.png');
                            if (forced) {
                                const r = await fetch(forced);
                                if (r.ok) {
                                    imgBytes = await r.arrayBuffer();
                                    logoFetchAttempts.push({ url: forced + ' (forced)', ok: true, status: 200 });
                                    console.log('Forced invoice logo loaded:', forced);
                                }
                                else {
                                    logoFetchAttempts.push({ url: forced + ' (forced)', ok: false, status: r.status });
                                }
                            }
                        }
                        catch (e) {
                            console.warn('Forced logo fetch failed', e);
                        }
                    }
                    if (!imgBytes) {
                        try {
                            // As a last resort embed a 1x1 transparent pixel to avoid errors (placeholder)
                            const transparentPixel = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';
                            imgBytes = Uint8Array.from(atob(transparentPixel), c => c.charCodeAt(0)).buffer;
                            logoFetchAttempts.push({ url: 'transparent-pixel', ok: true, status: 200 });
                        }
                        catch { /* ignore */ }
                    }
                    console.log('Final invoice logo decision bytesLength=', imgBytes ? imgBytes.byteLength : 0);
                    if (imgBytes) {
                        let img;
                        try {
                            img = await pdfDoc.embedPng(imgBytes);
                        }
                        catch {
                            img = await pdfDoc.embedJpg(imgBytes);
                        }
                        // Enhanced logo sizing (further reduced) & positioning.
                        const headerBandHeight = 140;
                        const headerBandBottomY = height - headerBandHeight;
                        const maxW = 110;
                        const maxH = 55;
                        const minH = 32; // further reduced for smaller appearance
                        const minW = 32;
                        const { width: rawW, height: rawH } = img;
                        let scale = Math.min(maxW / rawW, maxH / rawH, 1);
                        let drawW = rawW * scale;
                        let drawH = rawH * scale;
                        // Enforce minimum dimensions for visibility
                        if (drawH < minH || drawW < minW) {
                            const boost = Math.max(minH / drawH, minW / drawW);
                            scale *= boost;
                            drawW = rawW * scale;
                            drawH = rawH * scale;
                            // Cap again at max
                            if (drawW > maxW) {
                                const adjust = maxW / drawW;
                                drawW *= adjust;
                                drawH *= adjust;
                            }
                            if (drawH > maxH) {
                                const adjust = maxH / drawH;
                                drawW *= adjust;
                                drawH *= adjust;
                            }
                        }
                        const centeredY = headerBandBottomY + (headerBandHeight - drawH) / 2;
                        page.drawImage(img, {
                            x: 20,
                            y: centeredY,
                            width: drawW,
                            height: drawH
                        });
                        logoMetrics.x = 20;
                        logoMetrics.y = centeredY;
                        logoMetrics.width = drawW;
                        logoMetrics.height = drawH;
                    }
                    else {
                        console.warn('Invoice PDF: no logo loaded from candidates', logoCandidates);
                        // Visible placeholder so issue is obvious in PDF
                        page.drawText('LOGO', {
                            x: 50,
                            y: height - 110,
                            size: 28,
                            font: boldFont,
                            color: darkGray
                        });
                    }
                }
                catch { /* ignore */ }
                // Brand text (dynamically positioned next to logo)
                {
                    const gap = 4; // tighter gap to sit closer to logo
                    const brandFontSize = 14;
                    const computedX = (logoMetrics.width ? (logoMetrics.x + logoMetrics.width + gap) : 64);
                    // Vertically align brand name to visual mid-line of logo if we have metrics
                    const brandNameY = (logoMetrics.height
                        ? (logoMetrics.y + (logoMetrics.height / 2) + (brandFontSize / 3))
                        : (height - 82));
                    const brandName = businessConfig?.profile?.name || 'Yogodyaan';
                    page.drawText(brandName, {
                        x: computedX,
                        y: brandNameY,
                        size: brandFontSize,
                        font: boldFont,
                        color: headerTextColor
                    });
                    const tagline = businessConfig?.profile?.tagline || 'Holistic Health • Movement • Mindfulness';
                    const taglineY = brandNameY - (brandFontSize + 4);
                    page.drawText(tagline, {
                        x: computedX,
                        y: taglineY,
                        size: 8,
                        font,
                        color: headerTextColor
                    });
                }
                // Address
                const addressLines = businessConfig?.contact?.address_lines || [
                    'Yoga Studio & Wellness Center',
                    'Mumbai, Maharashtra, India'
                ];
                const address = [
                    ...addressLines,
                    `Phone: ${businessConfig?.contact?.phone || '+91 98765 43210'}`,
                    `Email: ${businessConfig?.contact?.email || 'info@yogodyaan.site'}`
                ];
                address.forEach((line, i) => {
                    page.drawText(line, {
                        x: width - 180,
                        y: height - 60 - (i * 15),
                        size: 10,
                        font,
                        color: headerTextColor
                    });
                });
                currentY = height - 200;
                // Title
                page.drawText('INVOICE', {
                    x: 40,
                    y: currentY,
                    size: 24,
                    font: boldFont,
                    color: darkGray
                });
                currentY -= 40;
                // Professional Invoice Number
                const displayNumber = generateProfessionalInvoiceNumber(String(tx.id));
                const invoiceDetails = [
                    ['Invoice No:', displayNumber],
                    ['Issue Date:', formatDate(tx.created_at)],
                    ['Plan Type:', humanPlanType(tx.billing_plan_type)]
                ];
                if (tx.billing_plan_type === 'monthly' && tx.billing_period_month) {
                    invoiceDetails.push(['Billing Month:', formatBillingMonth(tx.billing_period_month)]);
                }
                invoiceDetails.push(['Payment Method:', (tx.payment_method || 'manual').replace('_', ' ').toUpperCase()]);
                invoiceDetails.push(['Status:', 'PAID']);
                const infoBoxHeight = invoiceDetails.length * 18 + 30;
                page.drawRectangle({
                    x: 40,
                    y: currentY - infoBoxHeight,
                    width: 290,
                    height: infoBoxHeight,
                    color: lightGray
                });
                invoiceDetails.forEach(([label, value], idx) => {
                    const yPos = currentY - 20 - (idx * 18);
                    page.drawText(label, {
                        x: 50,
                        y: yPos,
                        size: 10,
                        font: boldFont,
                        color: darkGray
                    });
                    page.drawText(value, {
                        x: 190,
                        y: yPos,
                        size: 10,
                        font,
                        color: black
                    });
                });
                // Bill To
                page.drawText('BILL TO:', {
                    x: width - 180,
                    y: currentY,
                    size: 12,
                    font: boldFont,
                    color: darkGray
                });
                const billToInfo = [
                    tx.user_name || newTx.userEmail || 'Customer',
                    newTx.userEmail || '-'
                ].filter(Boolean);
                billToInfo.forEach((line, i) => {
                    page.drawText(line, {
                        x: width - 180,
                        y: currentY - 25 - (i * 15),
                        size: 11,
                        font,
                        color: black
                    });
                });
                currentY -= 160;
                // Services Section
                page.drawText('DESCRIPTION OF SERVICES', {
                    x: 40,
                    y: currentY,
                    size: 14,
                    font: boldFont,
                    color: darkGray
                });
                currentY -= 30;
                const tableStartY = currentY;
                const rowHeight = 35;
                const headers = ['Description', 'Qty', 'Rate', 'Amount'];
                const colStartX = [40, 290, 370, 450];
                page.drawRectangle({
                    x: 40,
                    y: tableStartY - rowHeight,
                    width: width - 80,
                    height: rowHeight,
                    color: primaryColor
                });
                headers.forEach((h, i) => {
                    page.drawText(h, {
                        x: colStartX[i] + 10,
                        y: tableStartY - 22,
                        size: 11,
                        font: boldFont,
                        color: white
                    });
                });
                const tableHeight = rowHeight * 2;
                [40, 290, 370, 450, width - 40].forEach(x => {
                    page.drawLine({
                        start: { x, y: tableStartY },
                        end: { x, y: tableStartY - tableHeight },
                        thickness: 1,
                        color: darkGray
                    });
                });
                [tableStartY, tableStartY - rowHeight, tableStartY - tableHeight].forEach(y => {
                    page.drawLine({
                        start: { x: 40, y },
                        end: { x: width - 40, y },
                        thickness: 1,
                        color: darkGray
                    });
                });
                const serviceRowY = tableStartY - rowHeight;
                const descRaw = tx.description || 'Yoga Session Payment';
                const description = descRaw.length > 50 ? descRaw.slice(0, 49) + '…' : descRaw;
                const quantity = '1';
                const rate = formatCurrency(tx.amount, tx.currency, true);
                const amount = formatCurrency(tx.amount, tx.currency, true);
                const serviceData = [description, quantity, rate, amount];
                serviceData.forEach((d, i) => {
                    page.drawText(d, {
                        x: colStartX[i] + 10,
                        y: serviceRowY - 22,
                        size: 10,
                        font,
                        color: black
                    });
                });
                currentY = tableStartY - tableHeight - 30;
                const invoiceTaxRate = Number(newTx.gst_rate || businessConfig?.invoice?.tax_rate || 0);
                const taxAmount = tx.amount * (invoiceTaxRate / 100);
                const grandTotal = tx.amount + taxAmount;
                const totalBoxHeight = 110;
                const totalBoxWidth = 240;
                const totalBoxX = width - (totalBoxWidth + 40);
                page.drawRectangle({
                    x: totalBoxX,
                    y: currentY - totalBoxHeight,
                    width: totalBoxWidth,
                    height: totalBoxHeight,
                    color: lightGray
                });
                const totals = [
                    ['Subtotal:', formatCurrency(tx.amount, tx.currency, true)],
                    [`GST (${invoiceTaxRate.toFixed(2)}%):`, formatCurrency(taxAmount, tx.currency, true)],
                    ['Plan Type:', humanPlanType(tx.billing_plan_type)],
                ];
                if (tx.billing_plan_type === 'monthly' && tx.billing_period_month) {
                    totals.push(['Billing Month:', formatBillingMonth(tx.billing_period_month)]);
                }
                totals.push(['TOTAL:', formatCurrency(grandTotal, tx.currency, true)]);
                totals.forEach(([label, value], idx) => {
                    const isTotal = label === 'TOTAL:';
                    const yPos = currentY - 20 - (idx * 18);
                    page.drawText(label, {
                        x: totalBoxX + 10,
                        y: yPos,
                        size: isTotal ? 12 : 10,
                        font: isTotal ? boldFont : font,
                        color: darkGray
                    });
                    page.drawText(value, {
                        x: totalBoxX + totalBoxWidth - 110,
                        y: yPos,
                        size: isTotal ? 12 : 10,
                        font: isTotal ? boldFont : font,
                        color: isTotal ? accentColor : black
                    });
                });
                currentY -= (totalBoxHeight + 40);
                // Payment Information (reordered & dynamically positioned to avoid footer overlap)
                // Split long date into two lines to avoid horizontal overlap with totals box.
                const dateLocalUTC = (() => {
                    const d = new Date(tx.created_at);
                    const tz = businessConfig?.invoice?.time_zone || 'Asia/Kolkata';
                    let localPart;
                    try {
                        localPart = new Intl.DateTimeFormat('en-IN', {
                            timeZone: tz,
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        }).format(d) + ` (${tz})`;
                    }
                    catch {
                        localPart = formatDate(tx.created_at) + ` (${tz})`;
                    }
                    const utcPart = new Intl.DateTimeFormat('en-IN', {
                        timeZone: 'UTC',
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    }).format(d) + ' UTC';
                    return { localPart, utcPart };
                })();
                const paymentInfo = [
                    `Payment Status: COMPLETED`,
                    `Payment Date (Local): ${dateLocalUTC.localPart}`,
                    `Payment Date (UTC): ${dateLocalUTC.utcPart}`,
                    `Payment Method: ${(tx.payment_method || 'manual').replace('_', ' ').toUpperCase()}`,
                    `Plan Type: ${humanPlanType(tx.billing_plan_type)}`
                ];
                if (tx.billing_plan_type === 'monthly' && tx.billing_period_month) {
                    paymentInfo.push(`Billing Month: ${formatBillingMonth(tx.billing_period_month)}`);
                }
                paymentInfo.push(`Transaction ID: ${tx.id}`);
                const paymentInfoBlockHeight = 25 + paymentInfo.length * 15 + 40; // heading gap + lines + bottom spacer
                // Ensure at least 110pt remains above footer (80 footer + 30 breathing room)
                if (currentY - paymentInfoBlockHeight < 110) {
                    currentY = 110 + paymentInfoBlockHeight;
                }
                page.drawText('PAYMENT INFORMATION', {
                    x: 40,
                    y: currentY,
                    size: 12,
                    font: boldFont,
                    color: darkGray
                });
                paymentInfo.forEach((info, idx) => {
                    page.drawText(info, {
                        x: 40,
                        y: currentY - 25 - (idx * 15),
                        size: 10,
                        font,
                        color: black
                    });
                });
                currentY -= (25 + paymentInfo.length * 15 + 40);
                // Footer
                page.drawRectangle({
                    x: 0,
                    y: 0,
                    width,
                    height: 80,
                    color: primaryColor
                });
                const footerName = businessConfig?.profile?.name || 'Yogodyaan';
                // Force .site domain even if business settings still have .com
                let hostDomainRaw = businessConfig?.profile?.website_url || 'https://www.yogodyaan.site';
                hostDomainRaw = hostDomainRaw.replace(/yogodyaan\.com/gi, 'yogodyaan.site');
                const hostDomain = hostDomainRaw.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
                const footerEmail = businessConfig?.contact?.email || `contact@${hostDomain}`;
                const footerPhone = businessConfig?.contact?.phone || '+91 98765 43210';
                const footerWebsite = hostDomain;
                const footerTerms = businessConfig?.invoice?.terms || 'Thank you for supporting your holistic health journey with us.';
                page.drawText(footerTerms, {
                    x: 40,
                    y: 50,
                    size: 12,
                    font: boldFont,
                    color: white
                });
                page.drawText(`Questions? Contact ${footerName} at ${footerEmail} or ${footerPhone}`, {
                    x: 40,
                    y: 30,
                    size: 9,
                    font,
                    color: white
                });
                page.drawText(footerWebsite, {
                    x: width - 160,
                    y: 40,
                    size: 10,
                    font: boldFont,
                    color: white
                });
                const base64 = await pdfDoc.saveAsBase64({ dataUri: false });
                return base64;
            };
            const pdfBase64 = await generateInvoicePdfBase64();
            // Email template colors strictly from DB (no forced fallback). If undefined, template defaults apply.
            const primaryHex = businessConfig?.invoice?.color_primary;
            const accentHex = businessConfig?.invoice?.color_accent;
            const companyName = businessConfig?.profile?.name || 'Yogodyaan';
            const companyAddress = (businessConfig?.contact?.address_lines || []).join(', ');
            // GST / Total calculations for email body
            const taxRateDisplay = Number(newTx.gst_rate || businessConfig?.invoice?.tax_rate || 0);
            const taxAmountDisplay = tx.amount * (taxRateDisplay / 100);
            const grandTotalDisplay = tx.amount + taxAmountDisplay;
            const html = renderEmailTemplate('corporate-professional', {
                title: 'Payment Invoice',
                headerTitle: 'Invoice',
                content: `
          <p>Hi ${tx.user_name || ''},</p>
          <p>Thanks for your payment. Your invoice is attached as a PDF.</p>
          <p>
            <strong>Subtotal:</strong> ${formatCurrency(tx.amount, tx.currency)}<br/>
            ${taxRateDisplay > 0 ? `<strong>GST (${taxRateDisplay.toFixed(2)}%):</strong> ${formatCurrency(taxAmountDisplay, tx.currency)}<br/>` : ''}
            <strong>Total:</strong> ${formatCurrency(grandTotalDisplay, tx.currency)}<br/>
            <strong>Invoice ID:</strong> ${generateProfessionalInvoiceNumber(String(tx.id))}<br/>
            <strong>Date:</strong> ${formatDate(tx.created_at)}<br/>
            <strong>Plan Type:</strong> ${humanPlanType(tx.billing_plan_type)}${tx.billing_plan_type === 'monthly' && tx.billing_period_month ? `<br/><strong>Billing Month:</strong> ${formatBillingMonth(tx.billing_period_month)}` : ''}
          </p>
        `,
                primaryColor: primaryHex || '#2563eb',
                secondaryColor: accentHex || primaryHex || '#1d4ed8',
                backgroundColor: '#ffffff',
                fontFamily: 'Arial, sans-serif',
                companyName,
                companyAddress,
                // Intentionally omit logoUrl so logo not shown in email body
                unsubscribeUrl: `${window.location.origin}/unsubscribe`
            });
            const res = await EmailService.sendTransactionalEmail(newTx.userEmail, 'Your Yogodyaan Invoice', html, [
                {
                    filename: `invoice-${tx.id}.pdf`,
                    content: pdfBase64,
                    contentType: 'application/pdf'
                }
            ]);
            if (!res.ok) {
                throw new Error('Transactional email failed');
            }
            alert(res.simulated ? 'Invoice sent (simulated - no provider configured)' : 'Invoice sent');
        }
        catch (e) {
            console.error(e);
            alert('Failed to save or send invoice');
        }
        finally {
            setSaving(false);
            setShowConfirm(false);
            setShowAddTransaction(false);
            setNewTx({
                userEmail: '',
                user_name: '',
                amount: 0,
                currency: 'INR',
                description: '',
                payment_method: 'manual',
                category: 'class_booking',
                billing_plan_type: 'one_time',
                billing_period_month: '',
                gst_rate: '0'
            });
        }
    };
    if (!hasAccess) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx(AlertCircle, { className: "mx-auto h-12 w-12 text-red-500 mb-4" }), _jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-2", children: "Access Denied" }), _jsx("p", { className: "text-gray-600", children: "You don't have permission to view this page." })] }) }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx("div", { className: "bg-white shadow-sm border-b border-gray-200", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "flex justify-between items-center py-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Transaction Management" }), _jsx("p", { className: "text-sm text-gray-600", children: "Manage all financial transactions" })] }), _jsxs("div", { className: "flex space-x-3", children: [_jsxs("button", { className: "bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center space-x-2", children: [_jsx(Download, { className: "h-4 w-4" }), _jsx("span", { children: "Export" })] }), canEdit && (_jsxs("button", { onClick: () => setShowAddTransaction(true), className: "bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2", children: [_jsx(Plus, { className: "h-4 w-4" }), _jsx("span", { children: "Add Transaction" })] }))] })] }) }) }), _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6", children: [_jsx("div", { className: "bg-white rounded-lg shadow p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Total Income" }), _jsx("p", { className: "text-2xl font-bold text-green-600", children: formatCurrency(totalIncome) })] }), _jsx(TrendingUp, { className: "h-8 w-8 text-green-500" })] }) }), _jsx("div", { className: "bg-white rounded-lg shadow p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Total Expenses" }), _jsx("p", { className: "text-2xl font-bold text-red-600", children: formatCurrency(totalExpense) })] }), _jsx(TrendingDown, { className: "h-8 w-8 text-red-500" })] }) }), _jsx("div", { className: "bg-white rounded-lg shadow p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Net Profit" }), _jsx("p", { className: `text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`, children: formatCurrency(netProfit) })] }), _jsx(DollarSign, { className: "h-8 w-8 text-blue-500" })] }) }), _jsx("div", { className: "bg-white rounded-lg shadow p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Pending" }), _jsx("p", { className: "text-2xl font-bold text-yellow-600", children: pendingTransactions })] }), _jsx(Clock, { className: "h-8 w-8 text-yellow-500" })] }) })] }), _jsx("div", { className: "bg-white rounded-lg shadow p-6 mb-6", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Search" }), _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-3 h-4 w-4 text-gray-400" }), _jsx("input", { type: "text", placeholder: "Search transactions...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Status" }), _jsxs("select", { value: filterStatus, onChange: (e) => setFilterStatus(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500", children: [_jsx("option", { value: "all", children: "All Status" }), _jsx("option", { value: "completed", children: "Completed" }), _jsx("option", { value: "pending", children: "Pending" }), _jsx("option", { value: "failed", children: "Failed" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Type" }), _jsxs("select", { value: filterType, onChange: (e) => setFilterType(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500", children: [_jsx("option", { value: "all", children: "All Types" }), _jsx("option", { value: "income", children: "Income" }), _jsx("option", { value: "expense", children: "Expense" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Date Range" }), _jsxs("select", { value: dateRange, onChange: (e) => setDateRange(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500", children: [_jsx("option", { value: "all", children: "All Time" }), _jsx("option", { value: "today", children: "Today" }), _jsx("option", { value: "week", children: "This Week" }), _jsx("option", { value: "month", children: "This Month" }), _jsx("option", { value: "quarter", children: "This Quarter" })] })] })] }) }), loadError && _jsxs("div", { className: "mb-4 text-sm text-red-600", children: ["Error loading transactions: ", loadError] }), loading && _jsx("div", { className: "mb-4 text-sm text-gray-600", children: "Loading transactions..." }), _jsxs("div", { className: "bg-white rounded-lg shadow overflow-hidden", children: [_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "User/Vendor" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Amount" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Category" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Payment Method" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Date" }), _jsx("th", { className: "px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Actions" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: currentItems.map((transaction) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium text-gray-900", children: transaction.user_name }), _jsxs("div", { className: "text-xs text-gray-500", children: [humanPlanType(transaction.billing_plan_type), transaction.billing_plan_type === 'monthly' && transaction.billing_period_month ? ` • ${formatBillingMonth(transaction.billing_period_month)}` : ''] }), _jsx("div", { className: "text-sm text-gray-500", children: transaction.description })] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { className: `text-sm font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`, children: [transaction.type === 'income' ? '+' : '-', formatCurrency(transaction.amount, transaction.currency)] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`, children: transaction.status }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(transaction.category)}`, children: transaction.category.replace('_', ' ') }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: transaction.payment_method.replace('_', ' ') }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: formatDate(transaction.created_at) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-right text-sm font-medium", children: _jsxs("div", { className: "flex justify-end space-x-2", children: [_jsx("button", { onClick: () => setSelectedTransaction(transaction), className: "text-blue-600 hover:text-blue-900", children: _jsx(Eye, { className: "h-4 w-4" }) }), canEdit && (_jsx("button", { className: "text-green-600 hover:text-green-900", children: _jsx(Edit3, { className: "h-4 w-4" }) }))] }) })] }, transaction.id))) })] }) }), _jsxs("div", { className: "bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6", children: [_jsxs("div", { className: "flex-1 flex justify-between sm:hidden", children: [_jsx("button", { onClick: () => setCurrentPage(Math.max(1, currentPage - 1)), disabled: currentPage === 1, className: "relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50", children: "Previous" }), _jsx("button", { onClick: () => setCurrentPage(Math.min(totalPages, currentPage + 1)), disabled: currentPage === totalPages, className: "ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50", children: "Next" })] }), _jsxs("div", { className: "hidden sm:flex-1 sm:flex sm:items-center sm:justify-between", children: [_jsx("div", { children: _jsxs("p", { className: "text-sm text-gray-700", children: ["Showing ", _jsx("span", { className: "font-medium", children: indexOfFirstItem + 1 }), " to", ' ', _jsx("span", { className: "font-medium", children: Math.min(indexOfLastItem, filteredTransactions.length) }), " of", ' ', _jsx("span", { className: "font-medium", children: filteredTransactions.length }), " results"] }) }), _jsx("div", { children: _jsx("nav", { className: "relative z-0 inline-flex rounded-md shadow-sm -space-x-px", children: [...Array(totalPages)].map((_, i) => (_jsx("button", { onClick: () => setCurrentPage(i + 1), className: `relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === i + 1
                                                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`, children: i + 1 }, i + 1))) }) })] })] })] })] }), showAddTransaction && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50", children: _jsx("div", { className: "bg-white rounded-lg w-full max-w-lg", children: _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h2", { className: "text-xl font-bold text-gray-900", children: "Add Manual Transaction" }), _jsx("button", { onClick: () => setShowAddTransaction(false), className: "text-gray-400 hover:text-gray-600", children: _jsx(X, { className: "h-6 w-6" }) })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "User Email" }), _jsx("input", { type: "email", value: newTx.userEmail, onChange: (e) => setNewTx({ ...newTx, userEmail: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "User Name" }), _jsx("input", { type: "text", value: newTx.user_name, onChange: (e) => setNewTx({ ...newTx, user_name: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Amount" }), _jsx("input", { type: "number", value: newTx.amount, onChange: (e) => setNewTx({ ...newTx, amount: Number(e.target.value) }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Currency" }), _jsxs("select", { value: newTx.currency, onChange: (e) => setNewTx({ ...newTx, currency: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500", children: [_jsx("option", { value: "INR", children: "INR" }), _jsx("option", { value: "USD", children: "USD" })] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Description" }), _jsx("input", { type: "text", value: newTx.description, onChange: (e) => setNewTx({ ...newTx, description: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Payment Method" }), _jsx("select", { value: newTx.payment_method, onChange: (e) => setNewTx({ ...newTx, payment_method: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500", children: paymentMethodOptions.map(pm => (_jsx("option", { value: pm.value, children: pm.label }, pm.value))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "GST %" }), _jsx("select", { value: newTx.gst_rate, onChange: (e) => setNewTx({ ...newTx, gst_rate: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500", children: ['0', '5', '10', '18', '28'].map(r => _jsxs("option", { value: r, children: [r, "%"] }, r)) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Billing Type" }), _jsxs("select", { value: newTx.billing_plan_type, onChange: (e) => {
                                                    const val = e.target.value;
                                                    setNewTx({
                                                        ...newTx,
                                                        billing_plan_type: val,
                                                        billing_period_month: val === 'monthly' ? newTx.billing_period_month : ''
                                                    });
                                                }, className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500", children: [_jsx("option", { value: "one_time", children: "One Time" }), _jsx("option", { value: "monthly", children: "Monthly Subscription" }), _jsx("option", { value: "crash_course", children: "Crash Course" })] })] }), newTx.billing_plan_type === 'monthly' && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Billing Month" }), _jsx("input", { type: "month", value: newTx.billing_period_month, onChange: (e) => setNewTx({ ...newTx, billing_period_month: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" })] }))] }), _jsxs("div", { className: "mt-6 flex justify-end space-x-2", children: [_jsx("button", { onClick: () => setShowAddTransaction(false), className: "px-4 py-2 rounded-lg border", children: "Cancel" }), _jsx("button", { onClick: handleInitiateSave, className: "px-4 py-2 rounded-lg bg-blue-600 text-white", children: "Review & Send Invoice" })] })] }) }) })), showConfirm && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50", children: _jsx("div", { className: "bg-white rounded-lg w-full max-w-lg", children: _jsxs("div", { className: "p-6 space-y-4", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h2", { className: "text-xl font-bold text-gray-900", children: "Confirm Transaction" }), _jsx("button", { onClick: () => setShowConfirm(false), className: "text-gray-400 hover:text-gray-600", children: _jsx(X, { className: "h-6 w-6" }) })] }), _jsx("p", { className: "text-sm text-gray-600", children: "Please review the details before saving & sending the invoice." }), _jsxs("div", { className: "divide-y text-sm", children: [_jsxs("div", { className: "py-2 flex justify-between", children: [_jsx("span", { className: "text-gray-500", children: "User Email" }), _jsx("span", { children: newTx.userEmail || '-' })] }), _jsxs("div", { className: "py-2 flex justify-between", children: [_jsx("span", { className: "text-gray-500", children: "User Name" }), _jsx("span", { children: newTx.user_name || newTx.userEmail || '-' })] }), _jsxs("div", { className: "py-2 flex justify-between", children: [_jsx("span", { className: "text-gray-500", children: "Amount" }), _jsxs("span", { children: [newTx.amount, " ", newTx.currency] })] }), _jsxs("div", { className: "py-2 flex justify-between", children: [_jsx("span", { className: "text-gray-500", children: "Currency" }), _jsx("span", { children: newTx.currency })] }), _jsxs("div", { className: "py-2 flex justify-between", children: [_jsx("span", { className: "text-gray-500", children: "GST %" }), _jsx("span", { children: newTx.gst_rate })] }), _jsxs("div", { className: "py-2 flex justify-between", children: [_jsx("span", { className: "text-gray-500", children: "Payment Method" }), _jsx("span", { children: newTx.payment_method.replace('_', ' ') })] }), _jsxs("div", { className: "py-2 flex justify-between", children: [_jsx("span", { className: "text-gray-500", children: "Billing Type" }), _jsx("span", { children: humanPlanType(newTx.billing_plan_type) })] }), newTx.billing_plan_type === 'monthly' && (_jsxs("div", { className: "py-2 flex justify-between", children: [_jsx("span", { className: "text-gray-500", children: "Billing Month" }), _jsx("span", { children: newTx.billing_period_month || '-' })] })), _jsxs("div", { className: "py-2 flex justify-between", children: [_jsx("span", { className: "text-gray-500", children: "Description" }), _jsx("span", { className: "max-w-[60%] text-right", children: newTx.description || '-' })] })] }), _jsxs("div", { className: "flex justify-end space-x-2 pt-2", children: [_jsx("button", { onClick: () => setShowConfirm(false), className: "px-4 py-2 rounded-lg border", disabled: saving, children: "Edit" }), _jsx("button", { onClick: handleConfirmSaveTransaction, disabled: saving, className: "px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-60", children: saving ? 'Saving...' : 'Confirm & Send' })] })] }) }) })), selectedTransaction && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50", children: _jsx("div", { className: "bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto", children: _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h2", { className: "text-xl font-bold text-gray-900", children: "Transaction Details" }), _jsx("button", { onClick: () => setSelectedTransaction(null), className: "text-gray-400 hover:text-gray-600", children: _jsx(X, { className: "h-6 w-6" }) })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Transaction ID" }), _jsx("p", { className: "text-sm text-gray-900", children: selectedTransaction.id })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "User/Vendor" }), _jsx("p", { className: "text-sm text-gray-900", children: selectedTransaction.user_name })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Amount" }), _jsxs("p", { className: `text-sm font-medium ${selectedTransaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`, children: [selectedTransaction.type === 'income' ? '+' : '-', formatCurrency(selectedTransaction.amount, selectedTransaction.currency)] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Status" }), _jsx("span", { className: `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedTransaction.status)}`, children: selectedTransaction.status })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Category" }), _jsx("span", { className: `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(selectedTransaction.category)}`, children: selectedTransaction.category.replace('_', ' ') })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Payment Method" }), _jsx("p", { className: "text-sm text-gray-900", children: selectedTransaction.payment_method.replace('_', ' ') })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Created Date" }), _jsx("p", { className: "text-sm text-gray-900", children: formatDate(selectedTransaction.created_at) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Updated Date" }), _jsx("p", { className: "text-sm text-gray-900", children: formatDate(selectedTransaction.updated_at) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Plan Type" }), _jsx("p", { className: "text-sm text-gray-900", children: humanPlanType(selectedTransaction.billing_plan_type) })] }), selectedTransaction.billing_plan_type === 'monthly' && selectedTransaction.billing_period_month && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Billing Month" }), _jsx("p", { className: "text-sm text-gray-900", children: formatBillingMonth(selectedTransaction.billing_period_month) })] }))] }), _jsxs("div", { className: "mt-4", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Description" }), _jsx("p", { className: "text-sm text-gray-900", children: selectedTransaction.description })] })] }) }) }))] }));
};
export default TransactionManagement;
