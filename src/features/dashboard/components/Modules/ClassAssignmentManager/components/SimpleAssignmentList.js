import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { supabase } from '../../../../../../shared/lib/supabase';
export function SimpleAssignmentList() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const fetchSimple = async () => {
        try {
            setLoading(true);
            setError(null);
            const { data, error } = await supabase
                .from('class_assignments')
                .select('*')
                .order('assigned_at', { ascending: false })
                .limit(100);
            if (error)
                throw error;
            console.log('SimpleAssignmentList fetched:', data?.length || 0, 'assignments');
            if (data?.length && data.length > 0) {
                console.log('First simple assignment:', data[0]);
            }
            setRows(data || []);
        }
        catch (e) {
            setError(e.message || String(e));
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => { fetchSimple(); }, []);
    if (loading) {
        return (_jsx("div", { className: "p-6 text-sm text-gray-600", children: "Loading assignments\u2026" }));
    }
    if (error) {
        return (_jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "text-sm text-red-600 mb-3", children: ["Failed to load: ", error] }), _jsx("button", { onClick: fetchSimple, className: "px-3 py-1.5 text-sm rounded bg-blue-600 text-white", children: "Retry" })] }));
    }
    if (!rows.length) {
        return (_jsx("div", { className: "p-6 text-sm text-gray-600", children: "No assignments found." }));
    }
    const fmt = (v) => v ?? '—';
    const fmtAmt = (v) => {
        const n = (typeof v === 'number') ? v : Number.parseFloat(v);
        return Number.isFinite(n) ? n.toFixed(2) : '—';
    };
    return (_jsxs("div", { className: "p-4", children: [_jsxs("div", { className: "mb-3 flex items-center justify-between", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Assignments (simple view)" }), _jsx("button", { onClick: fetchSimple, className: "px-3 py-1.5 text-sm rounded border bg-white hover:bg-gray-50", children: "Refresh" })] }), _jsx("div", { className: "overflow-auto border rounded-lg", children: _jsxs("table", { className: "min-w-full text-sm", children: [_jsx("thead", { className: "bg-gray-50 text-gray-700", children: _jsxs("tr", { children: [_jsx("th", { className: "px-3 py-2 text-left", children: "Date" }), _jsx("th", { className: "px-3 py-2 text-left", children: "Time" }), _jsx("th", { className: "px-3 py-2 text-left", children: "Schedule" }), _jsx("th", { className: "px-3 py-2 text-left", children: "Instructor" }), _jsx("th", { className: "px-3 py-2 text-left", children: "Payment" }), _jsx("th", { className: "px-3 py-2 text-left", children: "Status" }), _jsx("th", { className: "px-3 py-2 text-left", children: "Notes" })] }) }), _jsx("tbody", { className: "divide-y", children: rows.map(r => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-3 py-2", children: fmt(r.date) }), _jsxs("td", { className: "px-3 py-2", children: [fmt(r.start_time), r.end_time ? ` - ${r.end_time}` : ''] }), _jsx("td", { className: "px-3 py-2", children: fmt(r.schedule_type) }), _jsx("td", { className: "px-3 py-2", children: fmt(r.instructor_id) }), _jsxs("td", { className: "px-3 py-2", children: ["\u20B9", fmtAmt(r.payment_amount), " (", fmt(r.payment_status), ")"] }), _jsx("td", { className: "px-3 py-2", children: fmt(r.class_status) }), _jsx("td", { className: "px-3 py-2 max-w-[360px] truncate", title: r.notes || '', children: fmt(r.notes) })] }, r.id))) })] }) })] }));
}
export default SimpleAssignmentList;
