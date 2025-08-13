import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const STATUS_STYLE = {
    paid: {
        label: 'Paid',
        desc: 'Payment processed and remitted.',
        classes: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
    },
    pending: {
        label: 'Pending',
        desc: 'Awaiting processing / cutoff not reached.',
        classes: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700'
    },
    approved: {
        label: 'Approved',
        desc: 'Approved for payout; will move to Paid in next cycle.',
        classes: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700'
    },
    withheld: {
        label: 'Withheld',
        desc: 'Temporarily withheld (review / adjustment).',
        classes: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700'
    },
    reversed: {
        label: 'Reversed',
        desc: 'Previously paid or approved amount reversed.',
        classes: 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700'
    }
};
export const PaymentStatusBadge = ({ status, amount, showAmount = false, className = '', compact = false, titleSuffix }) => {
    if (!status) {
        return (_jsx("span", { className: `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 border-gray-300 dark:border-slate-600 ${className}`, title: "No payment status available", children: "N/A" }));
    }
    const meta = STATUS_STYLE[status];
    const padding = compact ? 'px-2 py-0.5' : 'px-2.5 py-1';
    return (_jsxs("span", { className: `inline-flex items-center gap-1 rounded-full text-xs font-medium border ${padding} ${meta.classes} ${className}`, title: `${meta.desc}${titleSuffix ? ' - ' + titleSuffix : ''}`, "data-payment-status": status, children: [meta.label, showAmount && typeof amount === 'number' && (_jsxs("span", { className: "font-semibold tabular-nums", children: ["\u20B9", amount.toFixed(2)] }))] }));
};
