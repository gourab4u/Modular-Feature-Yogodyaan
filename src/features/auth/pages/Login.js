import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../../shared/components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
export function Login() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const { signIn, signUp, user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirectTo = searchParams.get('redirect') || '/';
    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            navigate(redirectTo);
        }
    }, [user, navigate, redirectTo]);
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
        else if (formData.password.length < 6)
            newErrors.password = 'Password must be at least 6 characters';
        if (isSignUp && formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm())
            return;
        setLoading(true);
        try {
            if (isSignUp) {
                await signUp(formData.email, formData.password);
                alert('Account created successfully! Please check your email for verification.');
            }
            else {
                await signIn(formData.email, formData.password);
                navigate(redirectTo);
            }
        }
        catch (error) {
            setErrors({ general: error.message });
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "max-w-md w-full space-y-8", children: [_jsxs("div", { className: "text-center", children: [_jsxs(Link, { to: "/", className: "flex items-center justify-center space-x-2 mb-8", children: [_jsx("div", { className: "w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center", children: _jsx("span", { className: "text-white font-bold text-xl", children: "Y" }) }), _jsx("span", { className: "text-3xl font-bold text-gradient", children: "Yogodyaan" })] }), _jsx("h2", { className: "text-3xl font-bold text-gray-900", children: isSignUp ? 'Create your account' : 'Sign in to your account' }), _jsx("p", { className: "mt-2 text-gray-600", children: isSignUp ? 'Join our yoga community today' : 'Welcome back to your practice' }), redirectTo !== '/' && (_jsx("div", { className: "mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg", children: _jsx("p", { className: "text-blue-800 text-sm", children: "Please sign in to continue booking your class" }) }))] }), _jsxs("div", { className: "card p-8", children: [_jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [errors.general && (_jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-3", children: _jsx("p", { className: "text-red-600 text-sm", children: errors.general }) })), _jsxs("div", { children: [_jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-gray-700 mb-1", children: "Email Address" }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" }), _jsx("input", { type: "email", id: "email", name: "email", value: formData.email, onChange: handleInputChange, className: `w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`, placeholder: "Enter your email" })] }), errors.email && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.email })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "password", className: "block text-sm font-medium text-gray-700 mb-1", children: "Password" }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" }), _jsx("input", { type: showPassword ? 'text' : 'password', id: "password", name: "password", value: formData.password, onChange: handleInputChange, className: `w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.password ? 'border-red-500' : 'border-gray-300'}`, placeholder: "Enter your password" }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600", children: showPassword ? _jsx(EyeOff, { className: "w-5 h-5" }) : _jsx(Eye, { className: "w-5 h-5" }) })] }), errors.password && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.password })] }), isSignUp && (_jsxs("div", { children: [_jsx("label", { htmlFor: "confirmPassword", className: "block text-sm font-medium text-gray-700 mb-1", children: "Confirm Password" }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" }), _jsx("input", { type: showPassword ? 'text' : 'password', id: "confirmPassword", name: "confirmPassword", value: formData.confirmPassword, onChange: handleInputChange, className: `w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`, placeholder: "Confirm your password" })] }), errors.confirmPassword && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.confirmPassword })] })), _jsx(Button, { type: "submit", loading: loading, className: "w-full", children: loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In') })] }), _jsx("div", { className: "mt-6 text-center", children: _jsxs("p", { className: "text-gray-600", children: [isSignUp ? 'Already have an account?' : "Don't have an account?", ' ', _jsx("button", { onClick: () => {
                                            setIsSignUp(!isSignUp);
                                            setErrors({});
                                            setFormData({ email: '', password: '', confirmPassword: '' });
                                        }, className: "text-emerald-600 hover:text-emerald-700 font-medium", children: isSignUp ? 'Sign in' : 'Sign up' })] }) })] }), _jsx("div", { className: "text-center", children: _jsx(Link, { to: "/", className: "text-emerald-600 hover:text-emerald-700 font-medium", children: "\u2190 Back to Home" }) })] }) }));
}
