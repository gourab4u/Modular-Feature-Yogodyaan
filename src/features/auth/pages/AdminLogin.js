import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Eye, EyeOff, Lock, Mail, Shield } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../../shared/components/ui/Button';
import { useAdmin } from '../../admin/contexts/AdminContext';
export function AdminLogin() {
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const { signInAdmin } = useAdmin();
    const navigate = useNavigate();
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };
    const validateForm = () => {
        const newErrors = {};
        if (!formData.email.trim())
            newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email))
            newErrors.email = 'Email is invalid';
        if (!formData.password)
            newErrors.password = 'Password is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm())
            return;
        setLoading(true);
        try {
            await signInAdmin(formData.email, formData.password);
            navigate('/admin/dashboard');
        }
        catch (error) {
            setErrors({ general: error.message });
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "max-w-md w-full space-y-8", children: [_jsxs("div", { className: "text-center", children: [_jsxs(Link, { to: "/", className: "flex items-center justify-center space-x-2 mb-8", children: [_jsx("div", { className: "w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center", children: _jsx("span", { className: "text-white font-bold text-xl", children: "Y" }) }), _jsx("span", { className: "text-3xl font-bold text-gradient", children: "Yogodyaan" })] }), _jsxs("div", { className: "flex items-center justify-center mb-4", children: [_jsx(Shield, { className: "w-8 h-8 text-emerald-600 mr-2" }), _jsx("h2", { className: "text-3xl font-bold text-gray-900", children: "Admin Access" })] }), _jsx("p", { className: "mt-2 text-gray-600", children: "Sign in to access the admin dashboard" })] }), _jsxs("div", { className: "card p-8", children: [_jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [errors.general && (_jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-3", children: _jsx("p", { className: "text-red-600 text-sm", children: errors.general }) })), _jsxs("div", { children: [_jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-gray-700 mb-1", children: "Admin Email" }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" }), _jsx("input", { type: "email", id: "email", name: "email", value: formData.email, onChange: handleInputChange, className: `w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`, placeholder: "Enter admin email" })] }), errors.email && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.email })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "password", className: "block text-sm font-medium text-gray-700 mb-1", children: "Password" }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" }), _jsx("input", { type: showPassword ? 'text' : 'password', id: "password", name: "password", value: formData.password, onChange: handleInputChange, className: `w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.password ? 'border-red-500' : 'border-gray-300'}`, placeholder: "Enter password" }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600", children: showPassword ? _jsx(EyeOff, { className: "w-5 h-5" }) : _jsx(Eye, { className: "w-5 h-5" }) })] }), errors.password && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.password })] }), _jsx(Button, { type: "submit", loading: loading, className: "w-full", children: loading ? 'Signing in...' : 'Sign In to Admin' })] }), _jsxs("div", { className: "mt-6 p-4 bg-emerald-50 rounded-lg", children: [_jsx("h3", { className: "text-sm font-semibold text-emerald-800 mb-2", children: "How to become an admin:" }), _jsxs("ol", { className: "text-sm text-emerald-700 space-y-1", children: [_jsx("li", { children: "1. Create a regular user account first" }), _jsx("li", { children: "2. Contact the super admin to add your email to the admin_users table" }), _jsx("li", { children: "3. Or have a super admin add you through the Supabase dashboard" })] })] })] }), _jsx("div", { className: "text-center", children: _jsx(Link, { to: "/", className: "text-emerald-600 hover:text-emerald-700 font-medium", children: "\u2190 Back to Home" }) })] }) }));
}
