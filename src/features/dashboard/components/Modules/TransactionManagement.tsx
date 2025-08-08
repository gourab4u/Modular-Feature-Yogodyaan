import {
  AlertCircle,
  Clock,
  DollarSign,
  Download,
  Edit3,
  Eye,
  Plus,
  Search,
  TrendingDown,
  TrendingUp,
  X
} from 'lucide-react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { useEffect, useState } from 'react';
import EmailService from '../../../../services/emailService';
import { supabase } from '../../../../shared/lib/supabase';
import { renderEmailTemplate } from '../../../../shared/utils/emailTemplates';

const TransactionManagement = () => {
  const [currentUser] = useState({ role: 'super_admin' }); // Change to 'energy_exchange_lead' or 'user' to test
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
    category: 'class_booking'
  });
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Check permissions
  const hasAccess = ['super_admin', 'super_user', 'energy_exchange_lead'].includes(currentUser.role);
  const canEdit = ['super_admin', 'super_user', 'energy_exchange_lead'].includes(currentUser.role);

  // Sample transaction data
  const sampleTransactions = [
    {
      id: '1',
      user_id: 'user-1',
      user_name: 'Priya Sharma',
      amount: 1500,
      currency: 'INR',
      status: 'completed',
      type: 'income',
      category: 'class_booking',
      payment_method: 'upi',
      description: 'Monthly Yoga Package',
      created_at: '2024-07-08T10:30:00Z',
      updated_at: '2024-07-08T10:30:00Z'
    },
    {
      id: '2',
      user_id: 'instructor-1',
      user_name: 'Ravi Kumar',
      amount: -800,
      currency: 'INR',
      status: 'completed',
      type: 'expense',
      category: 'instructor_payment',
      payment_method: 'bank_transfer',
      description: 'Instructor payment for July classes',
      created_at: '2024-07-07T15:45:00Z',
      updated_at: '2024-07-07T15:45:00Z'
    },
    {
      id: '3',
      user_id: 'user-2',
      user_name: 'Anita Patel',
      amount: 2000,
      currency: 'INR',
      status: 'pending',
      type: 'income',
      category: 'subscription',
      payment_method: 'credit_card',
      description: 'Premium Subscription',
      created_at: '2024-07-06T09:20:00Z',
      updated_at: '2024-07-06T09:20:00Z'
    },
    {
      id: '4',
      user_id: 'vendor-1',
      user_name: 'Studio Maintenance Co.',
      amount: -500,
      currency: 'INR',
      status: 'completed',
      type: 'expense',
      category: 'maintenance',
      payment_method: 'cash',
      description: 'Studio cleaning and maintenance',
      created_at: '2024-07-05T14:15:00Z',
      updated_at: '2024-07-05T14:15:00Z'
    },
    {
      id: '5',
      user_id: 'user-3',
      user_name: 'Vikram Singh',
      amount: 1200,
      currency: 'INR',
      status: 'failed',
      type: 'income',
      category: 'class_booking',
      payment_method: 'upi',
      description: 'Weekend Workshop',
      created_at: '2024-07-04T11:30:00Z',
      updated_at: '2024-07-04T11:30:00Z'
    }
  ];

  useEffect(() => {
    setTransactions(sampleTransactions);
    setFilteredTransactions(sampleTransactions);
  }, []);

  // Filter transactions
  useEffect(() => {
    let filtered = transactions;

    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(t => t.status === filterStatus);
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }

    setFilteredTransactions(filtered);
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterType, transactions]);

  // Calculate summary statistics
  const totalIncome = transactions.filter(t => t.type === 'income' && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = Math.abs(transactions.filter(t => t.type === 'expense' && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0));
  const netProfit = totalIncome - totalExpense;
  const pendingTransactions = transactions.filter(t => t.status === 'pending').length;

  // Pagination
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

  const formatCurrency = (amount: number, currency = 'INR', useCode = false) => {
    const opts: Intl.NumberFormatOptions = useCode
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

  // Save manual transaction (DB) and send invoice with PDF attachment
  const handleSaveTransaction = async () => {
    // Build UI transaction object (includes UI-only fields)
    const tx = {
      id: Date.now().toString(),
      user_id: null,
      user_name: newTx.user_name || newTx.userEmail,
      amount: Number(newTx.amount),
      currency: newTx.currency || 'INR',
      status: 'completed',
      type: 'income', // UI-only
      category: newTx.category || 'class_booking', // UI-only
      payment_method: newTx.payment_method || 'manual',
      description: newTx.description || 'Manual payment',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      // 1) Persist to DB (transactions table)
      // Only insert columns that exist in the provided schema
      // Ensure Authorization header is present to satisfy CORS/preflight and RLS checks
      const { data: sessionData } = await supabase.auth.getSession();
      const jwt = sessionData?.session?.access_token;

      const { data: inserted, error: dbErr } = await supabase.functions.invoke('record-transaction', {
        body: {
          user_id: null, // could be looked up by email if needed
          subscription_id: null,
          amount: tx.amount,
          currency: tx.currency,
          status: 'completed',
          payment_method: tx.payment_method,
          stripe_payment_intent_id: null,
          description: tx.description
        },
        headers: jwt ? { Authorization: `Bearer ${jwt}` } : undefined
      });

      if (dbErr) {
        console.warn('DB insert failed (RLS/policy?):', dbErr);
      } else if (inserted) {
        tx.id = inserted.id || tx.id;
        tx.created_at = inserted.created_at || tx.created_at;
        tx.updated_at = inserted.updated_at || tx.updated_at;
      }

      // Optimistically update UI list
      setTransactions(prev => [tx, ...prev]);

      // 2) Generate a professional branded PDF invoice
      const generateInvoicePdfBase64 = async () => {
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points
        const { width, height } = page.getSize();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        // Colors
        const primaryColor = rgb(0.063, 0.722, 0.380); // #10B981 emerald
        const darkGray = rgb(0.2, 0.2, 0.2);
        const lightGray = rgb(0.9, 0.9, 0.9);
        const white = rgb(1, 1, 1);
        const black = rgb(0, 0, 0);

        let currentY = height - 40;

        // Company Header Section
        page.drawRectangle({
          x: 0,
          y: height - 140,
          width,
          height: 140,
          color: primaryColor
        });

        // Company Logo (embedded image if available)
        try {
          const logoUrl = (import.meta as any)?.env?.VITE_INVOICE_LOGO_URL || '/images/newcartoon-modified.png';
          const resp = await fetch(logoUrl);
          if (resp.ok) {
            const bytes = await resp.arrayBuffer();
            let img;
            try {
              img = await pdfDoc.embedPng(bytes);
            } catch {
              img = await pdfDoc.embedJpg(bytes);
            }
            const imgDims = img.scale(0.15);
            page.drawImage(img, {
              x: 40,
              y: height - 110,
              width: imgDims.width,
              height: imgDims.height
            });
          }
        } catch { /* ignore logo errors */ }

        // Company Name
        page.drawText('Yogodyaan', {
          x: 100,
          y: height - 70,
          size: 32,
          font: boldFont,
          color: white
        });

        // Company Tagline
        page.drawText('Wellness Through Movement', {
          x: 100,
          y: height - 95,
          size: 12,
          font,
          color: white
        });

        // Company Address
        const address = [
          'Yoga Studio & Wellness Center',
          'Mumbai, Maharashtra, India',
          'Phone: +91 98765 43210',
          'Email: info@yogodyaan.com'
        ];

        address.forEach((line, index) => {
          page.drawText(line, {
            x: width - 250,
            y: height - 60 - (index * 15),
            size: 10,
            font,
            color: white
          });
        });

        currentY = height - 160;

        // Invoice Title
        page.drawText('INVOICE', {
          x: 40,
          y: currentY,
          size: 24,
          font: boldFont,
          color: darkGray
        });

        currentY -= 40;

        // Invoice Details Table
        const invoiceDetails = [
          ['Invoice Number:', `#${String(tx.id).padStart(6, '0')}`],
          ['Issue Date:', formatDate(tx.created_at)],
          ['Payment Method:', (tx.payment_method || 'manual').replace('_', ' ').toUpperCase()],
          ['Status:', 'PAID']
        ];

        // Draw invoice info box
        page.drawRectangle({
          x: 40,
          y: currentY - 80,
          width: 200,
          height: 80,
          color: lightGray
        });

        invoiceDetails.forEach(([label, value], index) => {
          const yPos = currentY - 20 - (index * 18);
          page.drawText(label, {
            x: 50,
            y: yPos,
            size: 10,
            font: boldFont,
            color: darkGray
          });
          page.drawText(value, {
            x: 160,
            y: yPos,
            size: 10,
            font,
            color: black
          });
        });

        // Bill To Section
        page.drawText('BILL TO:', {
          x: width - 250,
          y: currentY,
          size: 12,
          font: boldFont,
          color: darkGray
        });

        const billToInfo = [
          tx.user_name || newTx.userEmail || 'Customer',
          newTx.userEmail || '-',
          '',  // Additional address line if needed
        ].filter(Boolean);

        billToInfo.forEach((line, index) => {
          page.drawText(line, {
            x: width - 250,
            y: currentY - 25 - (index * 15),
            size: 11,
            font,
            color: black
          });
        });

        currentY -= 120;

        // Services Table Header
        page.drawText('DESCRIPTION OF SERVICES', {
          x: 40,
          y: currentY,
          size: 14,
          font: boldFont,
          color: darkGray
        });

        currentY -= 30;

        // Table Header
        const tableStartY = currentY;
        const rowHeight = 35;
        const colStartX = [40, 290, 370, 450];
        const headers = ['Description', 'Qty', 'Rate', 'Amount'];

        // Draw table header background
        page.drawRectangle({
          x: 40,
          y: tableStartY - rowHeight,
          width: width - 80,
          height: rowHeight,
          color: primaryColor
        });

        // Draw header text
        headers.forEach((header, index) => {
          page.drawText(header, {
            x: colStartX[index] + 10,
            y: tableStartY - 22,
            size: 11,
            font: boldFont,
            color: white
          });
        });

        // Draw table borders
        const tableHeight = rowHeight * 2; // Header + one data row

        // Vertical lines
        [40, 290, 370, 450, width - 40].forEach(x => {
          page.drawLine({
            start: { x, y: tableStartY },
            end: { x, y: tableStartY - tableHeight },
            thickness: 1,
            color: darkGray
          });
        });

        // Horizontal lines
        [tableStartY, tableStartY - rowHeight, tableStartY - tableHeight].forEach(y => {
          page.drawLine({
            start: { x: 40, y },
            end: { x: width - 40, y },
            thickness: 1,
            color: darkGray
          });
        });

        // Service row data
        const serviceRow = tableStartY - rowHeight;
        const description = tx.description || 'Yoga Session Payment';
        const quantity = '1';
        const rate = formatCurrency(tx.amount, tx.currency, true);
        const amount = formatCurrency(tx.amount, tx.currency, true);

        const serviceData = [description, quantity, rate, amount];

        serviceData.forEach((data, index) => {
          page.drawText(data, {
            x: colStartX[index] + 10,
            y: serviceRow - 22,
            size: 10,
            font,
            color: black
          });
        });

        currentY = tableStartY - tableHeight - 30;

        // Total Section
        const totalBoxHeight = 60;
        page.drawRectangle({
          x: width - 200,
          y: currentY - totalBoxHeight,
          width: 160,
          height: totalBoxHeight,
          color: lightGray
        });

        // Total labels and values
        const totals = [
          ['Subtotal:', formatCurrency(tx.amount, tx.currency, true)],
          ['Tax (0%):', formatCurrency(0, tx.currency, true)],
          ['TOTAL:', formatCurrency(tx.amount, tx.currency, true)]
        ];

        totals.forEach(([label, value], index) => {
          const isTotal = index === totals.length - 1;
          const yPos = currentY - 20 - (index * 18);

          page.drawText(label, {
            x: width - 190,
            y: yPos,
            size: isTotal ? 12 : 10,
            font: isTotal ? boldFont : font,
            color: darkGray
          });

          page.drawText(value, {
            x: width - 100,
            y: yPos,
            size: isTotal ? 12 : 10,
            font: isTotal ? boldFont : font,
            color: isTotal ? primaryColor : black
          });
        });

        currentY -= 100;

        // Payment Information
        page.drawText('PAYMENT INFORMATION', {
          x: 40,
          y: currentY,
          size: 12,
          font: boldFont,
          color: darkGray
        });

        const paymentInfo = [
          `Payment Status: COMPLETED`,
          `Payment Date: ${formatDate(tx.created_at)}`,
          `Payment Method: ${(tx.payment_method || 'manual').replace('_', ' ').toUpperCase()}`,
          `Transaction ID: ${tx.id}`
        ];

        paymentInfo.forEach((info, index) => {
          page.drawText(info, {
            x: 40,
            y: currentY - 25 - (index * 15),
            size: 10,
            font,
            color: black
          });
        });

        currentY -= 120;

        // Footer Section
        page.drawRectangle({
          x: 0,
          y: 0,
          width,
          height: 80,
          color: primaryColor
        });

        // Footer text
        page.drawText('Thank you for choosing Yogodyaan!', {
          x: 40,
          y: 50,
          size: 14,
          font: boldFont,
          color: white
        });

        page.drawText('Questions? Contact us at info@yogodyaan.com or +91 98765 43210', {
          x: 40,
          y: 30,
          size: 10,
          font,
          color: white
        });

        page.drawText('www.yogodyaan.com', {
          x: width - 150,
          y: 40,
          size: 11,
          font: boldFont,
          color: white
        });

        // Generate base64
        const base64 = await pdfDoc.saveAsBase64({ dataUri: false });
        return base64;
      };

      const pdfBase64 = await generateInvoicePdfBase64();

      // 3) Compose HTML email using a professional template
      const html = renderEmailTemplate('corporate-professional', {
        title: 'Payment Invoice',
        content: `
          <p>Hi ${tx.user_name || ''},</p>
          <p>Thanks for your payment. Your invoice is attached as a PDF.</p>
          <p>
            <strong>Amount:</strong> ${formatCurrency(tx.amount, tx.currency)}<br/>
            <strong>Invoice ID:</strong> ${tx.id}<br/>
            <strong>Date:</strong> ${formatDate(tx.created_at)}
          </p>
        `,
        primaryColor: '#10B981',
        secondaryColor: '#059669',
        backgroundColor: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        companyName: 'Yogodyaan',
        companyAddress: '',
        unsubscribeUrl: `${window.location.origin}/unsubscribe`
      });

      // 4) Send via Edge Function with PDF attachment
      const res = await EmailService.sendTransactionalEmail(
        newTx.userEmail,
        'Your Yogodyaan Invoice',
        html,
        [
          {
            filename: `invoice-${tx.id}.pdf`,
            content: pdfBase64,
            contentType: 'application/pdf'
          }
        ]
      );

      if (!res.ok) {
        throw new Error('Transactional email failed');
      }

      alert(res.simulated ? 'Invoice sent (simulated - no email provider configured)' : 'Invoice sent via provider');
    } catch (e) {
      console.error(e);
      alert('Failed to save or send invoice');
    } finally {
      setShowAddTransaction(false);
      setNewTx({
        userEmail: '',
        user_name: '',
        amount: 0,
        currency: 'INR',
        description: '',
        payment_method: 'manual',
        category: 'class_booking'
      });
    }
  };

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Transaction Management</h1>
              <p className="text-sm text-gray-600">Manage all financial transactions</p>
            </div>
            <div className="flex space-x-3">
              <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
              {canEdit && (
                <button
                  onClick={() => setShowAddTransaction(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Transaction</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Income</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpense)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Profit</p>
                <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(netProfit)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingTransactions}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User/Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentItems.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{transaction.user_name}</div>
                        <div className="text-sm text-gray-500">{transaction.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount, transaction.currency)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(transaction.category)}`}>
                        {transaction.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.payment_method.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(transaction.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => setSelectedTransaction(transaction)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {canEdit && (
                          <button className="text-green-600 hover:text-green-900">
                            <Edit3 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(indexOfLastItem, filteredTransactions.length)}</span> of{' '}
                  <span className="font-medium">{filteredTransactions.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === i + 1
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showAddTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-lg">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Add Manual Transaction</h2>
                <button
                  onClick={() => setShowAddTransaction(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User Email</label>
                  <input
                    type="email"
                    value={newTx.userEmail}
                    onChange={(e) => setNewTx({ ...newTx, userEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User Name</label>
                  <input
                    type="text"
                    value={newTx.user_name}
                    onChange={(e) => setNewTx({ ...newTx, user_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                    <input
                      type="number"
                      value={newTx.amount}
                      onChange={(e) => setNewTx({ ...newTx, amount: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                    <select
                      value={newTx.currency}
                      onChange={(e) => setNewTx({ ...newTx, currency: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="INR">INR</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={newTx.description}
                    onChange={(e) => setNewTx({ ...newTx, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-2">
                <button
                  onClick={() => setShowAddTransaction(false)}
                  className="px-4 py-2 rounded-lg border"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTransaction}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white"
                >
                  Save & Send Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Transaction Details</h2>
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
                  <p className="text-sm text-gray-900">{selectedTransaction.id}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User/Vendor</label>
                  <p className="text-sm text-gray-900">{selectedTransaction.user_name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <p className={`text-sm font-medium ${selectedTransaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedTransaction.type === 'income' ? '+' : '-'}{formatCurrency(selectedTransaction.amount, selectedTransaction.currency)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedTransaction.status)}`}>
                    {selectedTransaction.status}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(selectedTransaction.category)}`}>
                    {selectedTransaction.category.replace('_', ' ')}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <p className="text-sm text-gray-900">{selectedTransaction.payment_method.replace('_', ' ')}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created Date</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedTransaction.created_at)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Updated Date</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedTransaction.updated_at)}</p>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <p className="text-sm text-gray-900">{selectedTransaction.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionManagement;
