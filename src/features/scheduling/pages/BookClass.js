import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { ChevronLeft, ChevronRight, Clock, Search, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../../shared/components/ui/Button';
import { supabase } from '../../../shared/lib/supabase';
import { useAuth } from '../../auth/contexts/AuthContext';
export function BookClass() {
    const { user } = useAuth();
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [classTypes, setClassTypes] = useState([]);
    const [loadingClassTypes, setLoadingClassTypes] = useState(true);
    const [classTypeSearch, setClassTypeSearch] = useState('');
    const [selectedClassType, setSelectedClassType] = useState(null);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        country: '',
        classType: '',
        groupSize: '',
        message: ''
    });
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
    // Fetch class types from database
    useEffect(() => {
        fetchClassTypes();
    }, []);
    const fetchClassTypes = async () => {
        try {
            setLoadingClassTypes(true);
            const { data, error } = await supabase
                .from('class_types')
                .select('*')
                .eq('is_active', true)
                .eq('is_archived', false)
                .order('name');
            if (error) {
                throw error;
            }
            setClassTypes(data || []);
        }
        catch (error) {
            console.error('Error fetching class types:', error);
            setErrors({ classTypes: 'Failed to load class types. Please refresh the page.' });
        }
        finally {
            setLoadingClassTypes(false);
        }
    };
    // Filter class types based on search
    const filteredClassTypes = classTypes.filter(classType => classType.name.toLowerCase().includes(classTypeSearch.toLowerCase()) ||
        (classType.description && classType.description.toLowerCase().includes(classTypeSearch.toLowerCase())));
    const getDifficultyColor = (level) => {
        switch (level?.toLowerCase()) {
            case 'beginner':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'intermediate':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'advanced':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:text-white border-gray-200 dark:border-slate-600';
        }
    };
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
    const handleClassTypeSelect = (classType) => {
        setSelectedClassType(classType);
        setFormData(prev => ({ ...prev, classType: classType.name }));
        if (errors.classType) {
            setErrors((prev) => ({ ...prev, classType: '' }));
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
        if (!formData.groupSize)
            newErrors.groupSize = 'Group size is required';
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
            const bookingData = {
                user_id: user?.id || null,
                class_name: 'Private Group Class',
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
                status: 'confirmed',
                class_type_id: selectedClassType?.id || null
            };
            const { data: bookingResult, error } = await supabase
                .from('bookings')
                .insert([bookingData])
                .select('booking_id');
            if (error) {
                throw error;
            }
            const bookingId = bookingResult?.[0]?.booking_id || 'N/A';
            // Reset form and show success
            setFormData({
                fullName: '',
                email: '',
                country: '',
                classType: '',
                groupSize: '',
                message: ''
            });
            setSelectedDate('');
            setSelectedTime('');
            setSelectedClassType(null);
            setShowBookingForm(false);
            alert(`Booking confirmed! You will receive a confirmation email shortly.\n\nYour Booking ID: ${bookingId}\n\nPlease save this ID for your records.`);
        }
        catch (error) {
            setErrors({ general: error.message || 'An error occurred while booking your class.' });
        }
        finally {
            setLoading(false);
        }
    };
    const canProceedToBooking = selectedDate && selectedTime;
    return (_jsxs("div", { className: "min-h-screen bg-gray-50 dark:bg-slate-700 dark:bg-slate-900", children: [_jsx("section", { className: "bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 py-20", children: _jsxs("div", { className: "max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8", children: [_jsx("h1", { className: "text-5xl font-bold text-gray-900 dark:text-white mb-6", children: "Book Your Private Group Class" }), _jsx("p", { className: "text-xl text-gray-600 dark:text-white leading-relaxed mb-8", children: "Create a memorable yoga experience for your group! Whether it's for your team, family, friends, or special occasion, we'll design a personalized session that brings everyone together in wellness and mindfulness." }), _jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mx-auto max-w-2xl border-l-4 border-blue-500 dark:border-blue-400", children: [_jsxs("div", { className: "flex items-center justify-center mb-4", children: [_jsx(Users, { className: "w-8 h-8 text-blue-500 mr-3" }), _jsx("h3", { className: "text-xl font-semibold text-gray-900 dark:text-white", children: "Strengthen Bonds Through Yoga" })] }), _jsx("p", { className: "text-gray-600 dark:text-white leading-relaxed", children: "Whether it's team building, celebrating a special occasion, or simply sharing mindfulness with loved ones, our private group sessions create lasting memories while nurturing wellness together." })] })] }) }), _jsx("div", { className: "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12", children: !showBookingForm ? (_jsxs("div", { className: "space-y-12", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-3xl font-bold text-gray-900 dark:text-white mb-8", children: "Select Date" }), _jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h3", { className: "text-xl font-semibold text-gray-900 dark:text-white", children: currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) }), _jsxs("div", { className: "flex space-x-2", children: [_jsx("button", { onClick: () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)), className: "p-2 rounded-lg hover:bg-gray-100 transition-colors", children: _jsx(ChevronLeft, { className: "w-5 h-5" }) }), _jsx("button", { onClick: () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)), className: "p-2 rounded-lg hover:bg-gray-100 transition-colors", children: _jsx(ChevronRight, { className: "w-5 h-5" }) })] })] }), _jsx("div", { className: "grid grid-cols-7 gap-2 mb-4", children: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (_jsx("div", { className: "text-center text-sm font-medium text-gray-500 dark:text-gray-300 py-2", children: day }, day))) }), _jsx("div", { className: "grid grid-cols-7 gap-2", children: getDaysInMonth(currentMonth).map((date, index) => (_jsx("div", { className: "aspect-square", children: date && (_jsx("button", { onClick: () => isDateAvailable(date) && setSelectedDate(formatDate(date)), disabled: !isDateAvailable(date), className: `w-full h-full rounded-lg text-sm font-medium transition-all duration-200 ${selectedDate === formatDate(date)
                                                        ? 'bg-blue-500 dark:bg-blue-600 text-white shadow-lg'
                                                        : isDateAvailable(date)
                                                            ? 'hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-900 dark:text-white'
                                                            : 'text-gray-300 dark:text-gray-500 cursor-not-allowed'}`, children: date.getDate() })) }, index))) })] })] }), _jsxs("div", { children: [_jsx("h2", { className: "text-3xl font-bold text-gray-900 dark:text-white mb-8", children: "Select Time" }), _jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6", children: [_jsx("div", { className: "grid grid-cols-3 md:grid-cols-5 gap-3", children: timeSlots.map((time) => (_jsx("button", { onClick: () => setSelectedTime(time), className: `p-3 rounded-lg text-sm font-medium transition-all duration-200 ${selectedTime === time
                                                    ? 'bg-blue-500 dark:bg-blue-600 text-white shadow-lg'
                                                    : 'bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-200 dark:border-slate-600'}`, children: time }, time))) }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-300 mt-4", children: "* All times are in your local timezone. We'll coordinate the actual session time based on your location." })] })] }), _jsx("div", { className: "text-center", children: _jsx(Button, { onClick: () => setShowBookingForm(true), disabled: !canProceedToBooking, className: `px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-300 ${canProceedToBooking
                                    ? 'bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 text-white hover:scale-105'
                                    : 'bg-gray-300 text-gray-500 dark:text-gray-300 cursor-not-allowed'}`, children: "Proceed to Booking Details" }) })] })) : (
                /* Booking Form */
                _jsx("div", { className: "max-w-2xl mx-auto", children: _jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8", children: [_jsxs("div", { className: "flex items-center mb-8", children: [_jsxs("button", { onClick: () => setShowBookingForm(false), className: "flex items-center text-blue-600 hover:text-blue-700 transition-colors mr-4", children: [_jsx(ChevronLeft, { className: "w-5 h-5 mr-1" }), "Back"] }), _jsx("h2", { className: "text-3xl font-bold text-gray-900 dark:text-white", children: "Confirm Booking" })] }), _jsxs("div", { className: "bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mb-8", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4", children: "Booking Summary" }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600 dark:text-white", children: "Service:" }), _jsx("span", { className: "font-medium", children: "Private Group Class" })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600 dark:text-white", children: "Date:" }), _jsx("span", { className: "font-medium", children: new Date(selectedDate).toLocaleDateString() })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600 dark:text-white", children: "Time:" }), _jsx("span", { className: "font-medium", children: selectedTime })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600 dark:text-white", children: "Duration:" }), _jsx("span", { className: "font-medium", children: selectedClassType?.duration_minutes
                                                            ? `${selectedClassType.duration_minutes} minutes`
                                                            : '60-90 minutes' })] }), selectedClassType && (_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600 dark:text-white", children: "Class Type:" }), _jsx("span", { className: "font-medium", children: selectedClassType.name })] }))] })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [errors.general && (_jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-3", children: _jsx("p", { className: "text-red-600 text-sm", children: errors.general }) })), errors.classTypes && (_jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-3", children: _jsx("p", { className: "text-red-600 text-sm", children: errors.classTypes }) })), _jsxs("div", { children: [_jsx("label", { htmlFor: "groupSize", className: "block text-sm font-medium text-gray-700 dark:text-white mb-1", children: "Group Size *" }), _jsxs("select", { id: "groupSize", name: "groupSize", value: formData.groupSize, onChange: handleInputChange, className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.groupSize ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}`, children: [_jsx("option", { value: "", children: "Select group size" }), _jsx("option", { value: "2-5", children: "2-5 people" }), _jsx("option", { value: "6-10", children: "6-10 people" }), _jsx("option", { value: "11-15", children: "11-15 people" }), _jsx("option", { value: "16-20", children: "16-20 people" }), _jsx("option", { value: "20+", children: "20+ people" })] }), errors.groupSize && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.groupSize })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "fullName", className: "block text-sm font-medium text-gray-700 dark:text-white mb-1", children: "Full Name *" }), _jsx("input", { type: "text", id: "fullName", name: "fullName", value: formData.fullName, onChange: handleInputChange, className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.fullName ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}`, placeholder: "Enter your full name" }), errors.fullName && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.fullName })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-gray-700 dark:text-white mb-1", children: "Email Address *" }), _jsx("input", { type: "email", id: "email", name: "email", value: formData.email, onChange: handleInputChange, className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}`, placeholder: "Enter your email address" }), errors.email && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.email })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "country", className: "block text-sm font-medium text-gray-700 dark:text-white mb-1", children: "Country *" }), _jsxs("select", { id: "country", name: "country", value: formData.country, onChange: handleInputChange, className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.country ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}`, children: [_jsx("option", { value: "", children: "Select your country" }), countries.map(country => (_jsx("option", { value: country, children: country }, country)))] }), errors.country && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.country })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-white mb-3", children: "Preferred Class Type *" }), loadingClassTypes ? (_jsxs("div", { className: "flex items-center justify-center py-8", children: [_jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-blue-400" }), _jsx("span", { className: "ml-2 text-gray-600 dark:text-white", children: "Loading class types..." })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "relative mb-4", children: [_jsx(Search, { className: "absolute left-3 top-3 h-4 w-4 text-gray-400" }), _jsx("input", { type: "text", placeholder: "Search class types...", value: classTypeSearch, onChange: (e) => setClassTypeSearch(e.target.value), className: "w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400" })] }), _jsx("div", { className: "grid gap-3 max-h-80 overflow-y-auto", children: filteredClassTypes.length === 0 ? (_jsx("div", { className: "text-center py-8 text-gray-500 dark:text-gray-300", children: classTypeSearch ? 'No class types found matching your search.' : 'No class types available.' })) : (filteredClassTypes.map((classType) => (_jsx("div", { onClick: () => handleClassTypeSelect(classType), className: `p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${selectedClassType?.id === classType.id
                                                                ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                                                                : 'border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:border-blue-500'}`, children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h4", { className: "font-semibold text-gray-900 dark:text-white mb-1", children: classType.name }), classType.description && (_jsx("p", { className: "text-sm text-gray-600 dark:text-white mb-2", children: classType.description })), _jsxs("div", { className: "flex flex-wrap gap-2 items-center", children: [classType.difficulty_level && (_jsx("span", { className: `px-2 py-1 text-xs font-medium rounded-full border ${getDifficultyColor(classType.difficulty_level)}`, children: classType.difficulty_level })), classType.duration_minutes && (_jsxs("span", { className: "flex items-center text-xs text-gray-500 dark:text-gray-300", children: [_jsx(Clock, { className: "w-3 h-3 mr-1" }), classType.duration_minutes, " min"] })), classType.max_participants && (_jsxs("span", { className: "flex items-center text-xs text-gray-500 dark:text-gray-300", children: [_jsx(Users, { className: "w-3 h-3 mr-1" }), "Max ", classType.max_participants] })), classType.price && (_jsxs("span", { className: "text-sm font-semibold text-green-600", children: ["$", classType.price] }))] })] }), selectedClassType?.id === classType.id && (_jsx("div", { className: "ml-3", children: _jsx("div", { className: "w-5 h-5 bg-blue-50 dark:bg-blue-900/200 rounded-full flex items-center justify-center", children: _jsx("div", { className: "w-2 h-2 bg-white dark:bg-slate-800 rounded-full" }) }) }))] }) }, classType.id)))) })] })), errors.classType && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.classType })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "message", className: "block text-sm font-medium text-gray-700 dark:text-white mb-1", children: "Special Requirements & Goals" }), _jsx("textarea", { id: "message", name: "message", rows: 4, value: formData.message, onChange: handleInputChange, placeholder: "Tell us about your group's experience level, specific goals, occasion details, or any special requirements...", className: "w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400" })] }), _jsx(Button, { type: "submit", loading: loading, className: "w-full bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-all duration-300", children: loading ? 'Confirming Booking...' : 'Confirm Booking' })] })] }) })) })] }));
}
