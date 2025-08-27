import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { InstructorRateForm } from '../components/InstructorRateForm';
import { useInstructorRates } from '../hooks/useInstructorRates';
const InstructorRatesPage = () => {
    const { user } = useAuth();
    const { rates, loading, error, addRate, updateRate, deleteRate } = useInstructorRates(user?.id);
    const [editingRate, setEditingRate] = useState(undefined);
    const handleSubmit = async (rateData) => {
        if (!user) {
            alert("You must be logged in to manage rates.");
            return;
        }
        if (editingRate) {
            await updateRate(editingRate.id, rateData);
        }
        else {
            await addRate(rateData);
        }
        setEditingRate(undefined);
    };
    if (loading)
        return _jsx("div", { children: "Loading..." });
    if (error)
        return _jsxs("div", { children: ["Error: ", error.message] });
    return (_jsxs("div", { className: "p-6 bg-gradient-to-b from-blue-50 to-white rounded-lg shadow-lg", children: [_jsx("h1", { className: "text-3xl font-extrabold text-blue-800 mb-4", children: "Manage Standard Rates" }), _jsx("p", { className: "text-gray-700 mb-6", children: "Set generic rates by schedule type and category that can be applied to any instructor during class assignment." }), _jsxs("div", { className: "mb-8 bg-white p-4 rounded-lg shadow-md", children: [_jsx("h2", { className: "text-2xl font-semibold text-indigo-700 mb-4", children: editingRate ? 'Edit Rate' : 'Add New Rate' }), _jsx(InstructorRateForm, { onSubmit: handleSubmit, existingRate: editingRate })] }), _jsxs("div", { className: "bg-white p-4 rounded-lg shadow-md", children: [_jsx("h2", { className: "text-2xl font-semibold text-indigo-700 mb-4", children: "Current Standard Rates" }), _jsxs("div", { className: "grid gap-6", children: [rates.map((rate) => (_jsxs("div", { className: "p-6 border border-gray-200 rounded-lg flex justify-between items-center bg-gray-50 hover:shadow-lg transition-shadow", children: [_jsxs("div", { children: [_jsxs("p", { className: "font-bold text-lg text-gray-800", children: [rate.class_types ? `${rate.class_types.name} (${rate.class_types.difficulty_level})` :
                                                        rate.class_packages ? `${rate.class_packages.name} (${rate.class_packages.type})` : 'Generic', " - ", ' ', rate.schedule_type, " - ", ' ', rate.category === 'individual' ? 'Individual' :
                                                        rate.category === 'corporate' ? 'Corporate' :
                                                            rate.category === 'private_group' ? 'Private Group' :
                                                                rate.category === 'public_group' ? 'Public Group' : rate.category] }), _jsxs("p", { className: "text-gray-700 text-lg", children: ["INR \u20B9", rate.rate_amount, " ", rate.rate_amount_usd ? `/ USD $${rate.rate_amount_usd}` : ''] }), _jsxs("p", { className: "text-sm text-gray-600", children: ["Effective from ", new Date(rate.effective_from).toLocaleDateString(), rate.effective_until ? ` to ${new Date(rate.effective_until).toLocaleDateString()}` : ' (No end date)', rate.is_active ? ' • Active' : ' • Inactive'] })] }), _jsxs("div", { className: "space-x-2", children: [_jsx("button", { onClick: () => setEditingRate(rate), className: "px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md", children: "Edit" }), _jsx("button", { onClick: () => deleteRate(rate.id), className: "px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-md", children: "Delete" })] })] }, rate.id))), rates.length === 0 && (_jsx("div", { className: "text-center py-8 text-gray-500", children: "No rates configured yet. Add your first standard rate above." }))] })] })] }));
};
export default InstructorRatesPage;
