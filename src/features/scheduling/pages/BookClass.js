import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ChevronLeft, ChevronRight, Globe, MapPin, Users } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../../shared/components/ui/Button';
import { supabase } from '../../../shared/lib/supabase';
import { useAuth } from '../../auth/contexts/AuthContext';
export function BookClass() {
    const { user } = useAuth();
    const [selectedService, setSelectedService] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        country: '',
        classType: '',
        message: ''
    });
    const services = [
        {
            id: '1on1',
            name: '1-on-1 Coaching',
            description: 'Personalized sessions tailored to your needs',
            price: 'From $75',
            duration: '60 minutes',
            icon: _jsx(Users, { className: "w-6 h-6" })
        },
        {
            id: 'group',
            name: 'Group Classes',
            description: 'Small group sessions with like-minded professionals',
            price: 'From $25',
            duration: '45-60 minutes',
            icon: _jsx(Globe, { className: "w-6 h-6" })
        },
        {
            id: 'corporate',
            name: 'Corporate Programs',
            description: 'Workplace wellness solutions for teams',
            price: 'Custom pricing',
            duration: '30-90 minutes',
            icon: _jsx(MapPin, { className: "w-6 h-6" })
        }
    ];
    const timeSlots = [
        '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM',
        '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM',
        '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM'
    ];
    const countries = [
        'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany',
        'France', 'India', 'Singapore', 'Japan', 'Brazil', 'Mexico',
        'South Africa', 'Nigeria', 'Other'
    ];
    const classTypes = [
        'Hatha Yoga', 'Vinyasa Flow', 'Power Yoga', 'Restorative Yoga',
        'Meditation', 'Breathwork', 'Corporate Wellness', 'Beginner Friendly'
    ];
    // Calendar functionality
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        const days = [];
        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }
        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }
        return days;
    };
    const formatDate = (date) => {
        return date.toISOString().split('T')[0];
    };
    const isDateAvailable = (date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date >= today;
    };
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };
    const validateForm = () => {
        const newErrors = {};
        if (!formData.fullName.trim())
            newErrors.fullName = 'Full name is required';
        if (!formData.email.trim())
            newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email))
            newErrors.email = 'Email is invalid';
        if (!formData.country)
            newErrors.country = 'Country is required';
        if (!formData.classType)
            newErrors.classType = 'Class type is required';
        if (!selectedService)
            newErrors.service = 'Please select a service';
        if (!selectedDate)
            newErrors.date = 'Please select a date';
        if (!selectedTime)
            newErrors.time = 'Please select a time';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm())
            return;
        setLoading(true);
        try {
            const selectedServiceData = services.find(s => s.id === selectedService);
            const bookingData = {
                user_id: user?.id || null,
                class_name: selectedServiceData?.name || '',
                instructor: 'Yogodaan Instructor',
                class_date: selectedDate,
                class_time: selectedTime,
                first_name: formData.fullName.split(' ')[0] || '',
                last_name: formData.fullName.split(' ').slice(1).join(' ') || '',
                email: formData.email,
                phone: '', // We'll add this field if needed
                experience_level: 'beginner',
                special_requests: formData.message,
                emergency_contact: '',
                emergency_phone: '',
                status: 'confirmed'
            };
            const { error } = await supabase
                .from('bookings')
                .insert([bookingData]);
            if (error) {
                throw error;
            }
            // Reset form and show success
            setFormData({
                fullName: '',
                email: '',
                country: '',
                classType: '',
                message: ''
            });
            setSelectedService('');
            setSelectedDate('');
            setSelectedTime('');
            setShowBookingForm(false);
            alert('Booking confirmed! You will receive a confirmation email shortly.');
        }
        catch (error) {
            setErrors({ general: error.message || 'An error occurred while booking your class.' });
        }
        finally {
            setLoading(false);
        }
    };
    const canProceedToBooking = selectedService && selectedDate && selectedTime;
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx("section", { className: "bg-gradient-to-br from-blue-50 via-white to-green-50 py-20", children: _jsxs("div", { className: "max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8", children: [_jsx("h1", { className: "text-5xl font-bold text-gray-900 mb-6", children: "Book Your Yoga Class" }), _jsx("p", { className: "text-xl text-gray-600 leading-relaxed", children: "Schedule your personalized yoga session with our expert instructor. Choose your preferred service, date, and time to begin your wellness journey." })] }) }), _jsx("div", { className: "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12", children: !showBookingForm ? (_jsxs("div", { className: "space-y-12", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-3xl font-bold text-gray-900 mb-8", children: "Choose Your Service" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: services.map((service) => (_jsxs("div", { onClick: () => setSelectedService(service.id), className: `p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 ${selectedService === service.id
                                            ? 'border-blue-500 bg-blue-50 shadow-lg'
                                            : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'}`, children: [_jsxs("div", { className: "flex items-center mb-4", children: [_jsx("div", { className: `p-2 rounded-lg mr-3 ${selectedService === service.id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`, children: service.icon }), _jsx("h3", { className: "text-xl font-semibold text-gray-900", children: service.name })] }), _jsx("p", { className: "text-gray-600 mb-4", children: service.description }), _jsxs("div", { className: "flex justify-between items-center text-sm", children: [_jsx("span", { className: "font-semibold text-blue-600", children: service.price }), _jsx("span", { className: "text-gray-500", children: service.duration })] })] }, service.id))) })] }), _jsxs("div", { children: [_jsx("h2", { className: "text-3xl font-bold text-gray-900 mb-8", children: "Select Date" }), _jsxs("div", { className: "bg-white rounded-xl shadow-lg p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h3", { className: "text-xl font-semibold text-gray-900", children: currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) }), _jsxs("div", { className: "flex space-x-2", children: [_jsx("button", { onClick: () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)), className: "p-2 rounded-lg hover:bg-gray-100 transition-colors", children: _jsx(ChevronLeft, { className: "w-5 h-5" }) }), _jsx("button", { onClick: () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)), className: "p-2 rounded-lg hover:bg-gray-100 transition-colors", children: _jsx(ChevronRight, { className: "w-5 h-5" }) })] })] }), _jsx("div", { className: "grid grid-cols-7 gap-2 mb-4", children: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (_jsx("div", { className: "text-center text-sm font-medium text-gray-500 py-2", children: day }, day))) }), _jsx("div", { className: "grid grid-cols-7 gap-2", children: getDaysInMonth(currentMonth).map((date, index) => (_jsx("div", { className: "aspect-square", children: date && (_jsx("button", { onClick: () => isDateAvailable(date) && setSelectedDate(formatDate(date)), disabled: !isDateAvailable(date), className: `w-full h-full rounded-lg text-sm font-medium transition-all duration-200 ${selectedDate === formatDate(date)
                                                        ? 'bg-blue-500 text-white shadow-lg'
                                                        : isDateAvailable(date)
                                                            ? 'hover:bg-blue-50 text-gray-900'
                                                            : 'text-gray-300 cursor-not-allowed'}`, children: date.getDate() })) }, index))) })] })] }), _jsxs("div", { children: [_jsx("h2", { className: "text-3xl font-bold text-gray-900 mb-8", children: "Select Time" }), _jsxs("div", { className: "bg-white rounded-xl shadow-lg p-6", children: [_jsx("div", { className: "grid grid-cols-3 md:grid-cols-5 gap-3", children: timeSlots.map((time) => (_jsx("button", { onClick: () => setSelectedTime(time), className: `p-3 rounded-lg text-sm font-medium transition-all duration-200 ${selectedTime === time
                                                    ? 'bg-blue-500 text-white shadow-lg'
                                                    : 'bg-gray-50 text-gray-900 hover:bg-blue-50 border border-gray-200'}`, children: time }, time))) }), _jsx("p", { className: "text-sm text-gray-500 mt-4", children: "* All times are in your local timezone. We'll coordinate the actual session time based on your location." })] })] }), _jsx("div", { className: "text-center", children: _jsx(Button, { onClick: () => setShowBookingForm(true), disabled: !canProceedToBooking, className: `px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-300 ${canProceedToBooking
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`, children: "Proceed to Booking Details" }) })] })) : (
                /* Booking Form */
                _jsx("div", { className: "max-w-2xl mx-auto", children: _jsxs("div", { className: "bg-white rounded-xl shadow-lg p-8", children: [_jsxs("div", { className: "flex items-center mb-8", children: [_jsxs("button", { onClick: () => setShowBookingForm(false), className: "flex items-center text-blue-600 hover:text-blue-700 transition-colors mr-4", children: [_jsx(ChevronLeft, { className: "w-5 h-5 mr-1" }), "Back"] }), _jsx("h2", { className: "text-3xl font-bold text-gray-900", children: "Confirm Booking" })] }), _jsxs("div", { className: "bg-blue-50 rounded-lg p-6 mb-8", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Booking Summary" }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "Service:" }), _jsx("span", { className: "font-medium", children: services.find(s => s.id === selectedService)?.name })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "Date:" }), _jsx("span", { className: "font-medium", children: new Date(selectedDate).toLocaleDateString() })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "Time:" }), _jsx("span", { className: "font-medium", children: selectedTime })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "Duration:" }), _jsx("span", { className: "font-medium", children: services.find(s => s.id === selectedService)?.duration })] })] })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [errors.general && (_jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-3", children: _jsx("p", { className: "text-red-600 text-sm", children: errors.general }) })), _jsxs("div", { children: [_jsx("label", { htmlFor: "fullName", className: "block text-sm font-medium text-gray-700 mb-1", children: "Full Name *" }), _jsx("input", { type: "text", id: "fullName", name: "fullName", value: formData.fullName, onChange: handleInputChange, className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.fullName ? 'border-red-500' : 'border-gray-300'}`, placeholder: "Enter your full name" }), errors.fullName && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.fullName })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-gray-700 mb-1", children: "Email Address *" }), _jsx("input", { type: "email", id: "email", name: "email", value: formData.email, onChange: handleInputChange, className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`, placeholder: "Enter your email address" }), errors.email && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.email })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "country", className: "block text-sm font-medium text-gray-700 mb-1", children: "Country *" }), _jsxs("select", { id: "country", name: "country", value: formData.country, onChange: handleInputChange, className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.country ? 'border-red-500' : 'border-gray-300'}`, children: [_jsx("option", { value: "", children: "Select your country" }), countries.map(country => (_jsx("option", { value: country, children: country }, country)))] }), errors.country && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.country })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "classType", className: "block text-sm font-medium text-gray-700 mb-1", children: "Preferred Class Type *" }), _jsxs("select", { id: "classType", name: "classType", value: formData.classType, onChange: handleInputChange, className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.classType ? 'border-red-500' : 'border-gray-300'}`, children: [_jsx("option", { value: "", children: "Select class type" }), classTypes.map(type => (_jsx("option", { value: type, children: type }, type)))] }), errors.classType && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.classType })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "message", className: "block text-sm font-medium text-gray-700 mb-1", children: "Optional Message" }), _jsx("textarea", { id: "message", name: "message", rows: 4, value: formData.message, onChange: handleInputChange, placeholder: "Tell us about your goals, experience level, or any special requirements...", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsx(Button, { type: "submit", loading: loading, className: "w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-all duration-300", children: loading ? 'Confirming Booking...' : 'Confirm Booking' })] })] }) })) })] }));
}
