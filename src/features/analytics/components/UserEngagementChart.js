import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { TrendingDown, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { LoadingSpinner } from '../../../shared/components/ui/LoadingSpinner';
import { supabase } from '../../../shared/lib/supabase';
export function UserEngagementChart() {
    const [engagementData, setEngagementData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        fetchEngagementData();
    }, []);
    const fetchEngagementData = async () => {
        try {
            setLoading(true);
            setError(null);
            const { data, error: fetchError } = await supabase
                .from('user_engagement_metrics')
                .select('*')
                .order('total_bookings', { ascending: false })
                .limit(10);
            if (fetchError)
                throw fetchError;
            setEngagementData(data || []);
        }
        catch (err) {
            console.error('Error fetching engagement data:', err);
            setError(err.message);
        }
        finally {
            setLoading(false);
        }
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'inactive':
                return 'bg-yellow-100 text-yellow-800';
            case 'dormant':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };
    const getStatusIcon = (status) => {
        switch (status) {
            case 'active':
                return _jsx(TrendingUp, { className: "w-4 h-4" });
            case 'inactive':
                return _jsx(TrendingDown, { className: "w-4 h-4" });
            case 'dormant':
                return _jsx(TrendingDown, { className: "w-4 h-4" });
            default:
                return _jsx(Users, { className: "w-4 h-4" });
        }
    };
    const formatLastActivity = (dateString) => {
        if (!dateString)
            return 'Never';
        const date = new Date(dateString);
        const now = new Date();
        const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (diffInDays === 0)
            return 'Today';
        if (diffInDays === 1)
            return 'Yesterday';
        if (diffInDays < 7)
            return `${diffInDays} days ago`;
        if (diffInDays < 30)
            return `${Math.floor(diffInDays / 7)} weeks ago`;
        return `${Math.floor(diffInDays / 30)} months ago`;
    };
    if (loading) {
        return (_jsxs("div", { className: "bg-white rounded-xl shadow-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "User Engagement" }), _jsx("div", { className: "flex justify-center py-8", children: _jsx(LoadingSpinner, { size: "md" }) })] }));
    }
    if (error) {
        return (_jsxs("div", { className: "bg-white rounded-xl shadow-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "User Engagement" }), _jsxs("div", { className: "text-center py-8", children: [_jsxs("p", { className: "text-red-600 mb-4", children: ["Error loading engagement data: ", error] }), _jsx("button", { onClick: fetchEngagementData, className: "px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600", children: "Retry" })] })] }));
    }
    return (_jsxs("div", { className: "bg-white rounded-xl shadow-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Top Engaged Users" }), _jsx("div", { className: "space-y-4", children: engagementData.length > 0 ? (engagementData.map((user) => (_jsxs("div", { className: "flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("div", { className: "w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center", children: _jsx("span", { className: "text-blue-600 font-semibold", children: (user.full_name || user.email || 'U').charAt(0).toUpperCase() }) }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: user.full_name || 'No name' }), _jsx("p", { className: "text-sm text-gray-600", children: user.email }), _jsxs("p", { className: "text-xs text-gray-500", children: ["Last active: ", formatLastActivity(user.last_activity)] })] })] }), _jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("div", { className: "text-right", children: [_jsxs("p", { className: "text-sm font-medium text-gray-900", children: [user.total_bookings || 0, " bookings"] }), _jsxs("p", { className: "text-xs text-gray-600", children: [user.attended_classes || 0, " attended"] }), _jsxs("p", { className: "text-xs text-gray-600", children: [user.articles_viewed || 0, " articles viewed"] })] }), _jsxs("span", { className: `px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(user.engagement_status)}`, children: [getStatusIcon(user.engagement_status), _jsx("span", { className: "capitalize", children: user.engagement_status })] })] })] }, user.user_id)))) : (_jsxs("div", { className: "text-center py-8", children: [_jsx(Users, { className: "w-12 h-12 text-gray-400 mx-auto mb-4" }), _jsx("p", { className: "text-gray-600", children: "No engagement data available" }), _jsx("p", { className: "text-sm text-gray-500 mt-2", children: "Data will appear here once users start interacting with the platform" })] })) })] }));
}
