import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Eye, Mail, Plus, Send, Trash2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../../../shared/components/ui/Button';
import { LoadingSpinner } from '../../../../shared/components/ui/LoadingSpinner';
import { supabase } from '../../../../shared/lib/supabase';
export function NewsletterManagement() {
    const [newsletters, setNewsletters] = useState([]);
    const [subscribers, setSubscribers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('newsletters');
    useEffect(() => {
        fetchData();
    }, []);
    const fetchData = async () => {
        try {
            setLoading(true);
            const [newslettersRes, subscribersRes] = await Promise.all([
                supabase.from('newsletters').select('*').order('created_at', { ascending: false }),
                supabase.from('newsletter_subscribers').select('*').order('subscribed_at', { ascending: false })
            ]);
            if (newslettersRes.error)
                throw newslettersRes.error;
            if (subscribersRes.error)
                throw subscribersRes.error;
            setNewsletters(newslettersRes.data || []);
            setSubscribers(subscribersRes.data || []);
        }
        catch (error) {
            console.error('Error fetching data:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleDeleteNewsletter = async (id) => {
        if (!confirm('Are you sure you want to delete this newsletter?'))
            return;
        try {
            const { error } = await supabase
                .from('newsletters')
                .delete()
                .eq('id', id);
            if (error)
                throw error;
            await fetchData();
        }
        catch (error) {
            console.error('Error deleting newsletter:', error);
        }
    };
    const handleCreateNewsletter = () => {
        // TODO: Implement newsletter creation form/modal
        console.log('Create newsletter clicked - form/modal to be implemented');
    };
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };
    const activeSubscribers = subscribers.filter(s => s.status === 'active');
    if (loading) {
        return (_jsx("div", { className: "flex justify-center py-12", children: _jsx(LoadingSpinner, { size: "lg" }) }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("h2", { className: "text-2xl font-bold text-gray-900 flex items-center", children: [_jsx(Mail, { className: "w-6 h-6 mr-2" }), "Newsletter Management"] }), activeTab === 'newsletters' && (_jsxs(Button, { onClick: handleCreateNewsletter, className: "flex items-center", children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "Create Newsletter"] }))] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [_jsx("div", { className: "bg-white rounded-xl shadow-lg p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Total Subscribers" }), _jsx("p", { className: "text-3xl font-bold text-gray-900", children: subscribers.length })] }), _jsx(Users, { className: "w-8 h-8 text-blue-600" })] }) }), _jsx("div", { className: "bg-white rounded-xl shadow-lg p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Active Subscribers" }), _jsx("p", { className: "text-3xl font-bold text-gray-900", children: activeSubscribers.length })] }), _jsx(Mail, { className: "w-8 h-8 text-green-600" })] }) }), _jsx("div", { className: "bg-white rounded-xl shadow-lg p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Newsletters Sent" }), _jsx("p", { className: "text-3xl font-bold text-gray-900", children: newsletters.filter(n => n.status === 'sent').length })] }), _jsx(Send, { className: "w-8 h-8 text-purple-600" })] }) })] }), _jsxs("div", { className: "bg-white rounded-xl shadow-lg", children: [_jsx("div", { className: "border-b border-gray-200", children: _jsxs("nav", { className: "flex space-x-8 px-6", children: [_jsxs("button", { onClick: () => setActiveTab('newsletters'), className: `py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'newsletters'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'}`, children: ["Newsletters (", newsletters.length, ")"] }), _jsxs("button", { onClick: () => setActiveTab('subscribers'), className: `py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'subscribers'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'}`, children: ["Subscribers (", subscribers.length, ")"] })] }) }), _jsx("div", { className: "p-6", children: activeTab === 'newsletters' ? (_jsx("div", { className: "space-y-4", children: newsletters.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx(Mail, { className: "w-16 h-16 text-gray-400 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: "No newsletters yet" }), _jsx("p", { className: "text-gray-600 mb-4", children: "Create your first newsletter to get started." })] })) : (newsletters.map((newsletter) => (_jsx("div", { className: "border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow", children: _jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: newsletter.title }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: newsletter.subject }), _jsxs("div", { className: "flex items-center space-x-4 mt-2 text-sm text-gray-500", children: [_jsxs("span", { children: ["Created: ", formatDate(newsletter.created_at)] }), newsletter.sent_at && (_jsxs("span", { children: ["Sent: ", formatDate(newsletter.sent_at)] })), _jsx("span", { className: `px-2 py-1 rounded-full text-xs ${newsletter.status === 'sent'
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-yellow-100 text-yellow-800'}`, children: newsletter.status })] })] }), _jsxs("div", { className: "flex space-x-2", children: [_jsx("button", { onClick: () => console.log('Edit newsletter:', newsletter.id), className: "text-blue-600 hover:text-blue-900", children: _jsx(Eye, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => handleDeleteNewsletter(newsletter.id), className: "text-red-600 hover:text-red-900", children: _jsx(Trash2, { className: "w-4 h-4" }) })] })] }) }, newsletter.id)))) })) : (_jsx("div", { className: "space-y-4", children: subscribers.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx(Users, { className: "w-16 h-16 text-gray-400 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: "No subscribers yet" }), _jsx("p", { className: "text-gray-600", children: "Subscribers will appear here when they sign up for your newsletter." })] })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Subscriber" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Subscribed" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: subscribers.map((subscriber) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4", children: _jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium text-gray-900", children: subscriber.name || 'No name' }), _jsx("div", { className: "text-sm text-gray-500", children: subscriber.email })] }) }), _jsx("td", { className: "px-6 py-4", children: _jsx("span", { className: `px-2 py-1 text-xs rounded-full ${subscriber.status === 'active'
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'}`, children: subscriber.status }) }), _jsx("td", { className: "px-6 py-4 text-sm text-gray-500", children: formatDate(subscriber.subscribed_at) })] }, subscriber.id))) })] }) })) })) })] })] }));
}
export default NewsletterManagement;
