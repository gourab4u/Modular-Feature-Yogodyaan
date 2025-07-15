import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Clock, Globe, Mail, Phone, Save, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../../../shared/components/ui/Button';
import { LoadingSpinner } from '../../../../shared/components/ui/LoadingSpinner';
import { supabase } from '../../../../shared/lib/supabase';
export function BusinessSettings() {
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    useEffect(() => {
        fetchSettings();
    }, []);
    const fetchSettings = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('business_settings')
                .select('*');
            if (error)
                throw error;
            const settingsMap = data.reduce((acc, setting) => {
                acc[setting.key] = setting.value;
                return acc;
            }, {});
            setSettings(settingsMap);
        }
        catch (error) {
            console.error('Error fetching settings:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleInputChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        if (errors[key]) {
            setErrors((prev) => ({ ...prev, [key]: '' }));
        }
    };
    const handleNestedChange = (key, nestedKey, value) => {
        setSettings(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                [nestedKey]: value
            }
        }));
    };
    const validateSettings = () => {
        const newErrors = {};
        if (!settings.site_name?.trim())
            newErrors.site_name = 'Site name is required';
        if (!settings.contact_email?.trim())
            newErrors.contact_email = 'Contact email is required';
        else if (!/\S+@\S+\.\S+/.test(settings.contact_email))
            newErrors.contact_email = 'Invalid email format';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSave = async () => {
        if (!validateSettings())
            return;
        try {
            setSaving(true);
            // Update each setting
            for (const [key, value] of Object.entries(settings)) {
                const { error } = await supabase
                    .from('business_settings')
                    .upsert({
                    key,
                    value: JSON.stringify(value),
                    updated_by: (await supabase.auth.getUser()).data.user?.id
                });
                if (error)
                    throw error;
            }
            alert('Settings saved successfully!');
        }
        catch (error) {
            console.error('Error saving settings:', error);
            alert('Failed to save settings');
        }
        finally {
            setSaving(false);
        }
    };
    if (loading) {
        return (_jsx("div", { className: "flex justify-center py-12", children: _jsx(LoadingSpinner, { size: "lg" }) }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("h2", { className: "text-2xl font-bold text-gray-900 flex items-center", children: [_jsx(Settings, { className: "w-6 h-6 mr-2" }), "Business Settings"] }), _jsxs(Button, { onClick: handleSave, loading: saving, className: "flex items-center", children: [_jsx(Save, { className: "w-4 h-4 mr-2" }), "Save Settings"] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8", children: [_jsxs("div", { className: "bg-white rounded-xl shadow-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Basic Information" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Site Name" }), _jsx("input", { type: "text", value: settings.site_name || '', onChange: (e) => handleInputChange('site_name', e.target.value), className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.site_name ? 'border-red-500' : 'border-gray-300'}`, placeholder: "Your business name" }), errors.site_name && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.site_name })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: [_jsx(Mail, { className: "w-4 h-4 inline mr-1" }), "Contact Email"] }), _jsx("input", { type: "email", value: settings.contact_email || '', onChange: (e) => handleInputChange('contact_email', e.target.value), className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.contact_email ? 'border-red-500' : 'border-gray-300'}`, placeholder: "contact@example.com" }), errors.contact_email && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.contact_email })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: [_jsx(Phone, { className: "w-4 h-4 inline mr-1" }), "Contact Phone"] }), _jsx("input", { type: "tel", value: settings.contact_phone || '', onChange: (e) => handleInputChange('contact_phone', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "+1 (555) 123-4567" })] })] })] }), _jsxs("div", { className: "bg-white rounded-xl shadow-lg p-6", children: [_jsxs("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: [_jsx(Globe, { className: "w-5 h-5 inline mr-2" }), "Social Media"] }), _jsx("div", { className: "space-y-4", children: ['facebook', 'instagram', 'twitter', 'youtube'].map((platform) => (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1 capitalize", children: platform }), _jsx("input", { type: "url", value: settings.social_media?.[platform] || '', onChange: (e) => handleNestedChange('social_media', platform, e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: `https://${platform}.com/yourpage` })] }, platform))) })] }), _jsxs("div", { className: "bg-white rounded-xl shadow-lg p-6", children: [_jsxs("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: [_jsx(Clock, { className: "w-5 h-5 inline mr-2" }), "Business Hours"] }), _jsx("div", { className: "space-y-3", children: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("label", { className: "w-20 text-sm font-medium text-gray-700 capitalize", children: day }), _jsx("input", { type: "text", value: settings.business_hours?.[day] || '', onChange: (e) => handleNestedChange('business_hours', day, e.target.value), className: "flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "9:00 AM - 5:00 PM" })] }, day))) })] }), _jsxs("div", { className: "bg-white rounded-xl shadow-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Booking Settings" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Advance Booking Days" }), _jsx("input", { type: "number", value: settings.booking_settings?.advance_booking_days || 30, onChange: (e) => handleNestedChange('booking_settings', 'advance_booking_days', parseInt(e.target.value)), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", min: "1", max: "365" }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: "How many days in advance can users book classes" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Cancellation Hours" }), _jsx("input", { type: "number", value: settings.booking_settings?.cancellation_hours || 2, onChange: (e) => handleNestedChange('booking_settings', 'cancellation_hours', parseInt(e.target.value)), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", min: "1", max: "48" }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: "Minimum hours before class to allow cancellation" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Default Max Participants" }), _jsx("input", { type: "number", value: settings.booking_settings?.max_participants_default || 20, onChange: (e) => handleNestedChange('booking_settings', 'max_participants_default', parseInt(e.target.value)), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", min: "1", max: "100" }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: "Default maximum participants for new classes" })] })] })] })] })] }));
}
export default BusinessSettings;
