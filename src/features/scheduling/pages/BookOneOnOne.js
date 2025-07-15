import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Calendar, Mail, Phone, Star, User, Video } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../../shared/components/ui/Button';
import { LoadingSpinner } from '../../../shared/components/ui/LoadingSpinner';
import { supabase } from '../../../shared/lib/supabase';
import { useAuth } from '../../auth/contexts/AuthContext';
export function BookOneOnOne() {
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({
        // Personal Info
        firstName: '',
        lastName: '',
        email: user?.email || '',
        phone: '',
        timezone: '',
        // Session Details
        sessionType: '',
        experienceLevel: '',
        goals: '',
        healthConditions: '',
        preferredDays: [],
        preferredTimes: [],
        // Package Selection
        packageType: '',
        startDate: '',
        // Special Requirements
        specialRequests: '',
        emergencyContact: '',
        emergencyPhone: ''
    });
    const sessionTypes = [
        {
            id: 'hatha',
            name: 'Hatha Yoga',
            description: 'Gentle, slow-paced practice focusing on basic postures',
            duration: '60 min',
            price: 75
        },
        {
            id: 'vinyasa',
            name: 'Vinyasa Flow',
            description: 'Dynamic practice connecting breath with movement',
            duration: '60 min',
            price: 85
        },
        {
            id: 'meditation',
            name: 'Meditation & Breathwork',
            description: 'Focused session on mindfulness and breathing techniques',
            duration: '45 min',
            price: 65
        },
        {
            id: 'therapeutic',
            name: 'Therapeutic Yoga',
            description: 'Customized practice for specific health concerns',
            duration: '75 min',
            price: 95
        }
    ];
    const packages = [
        {
            id: 'single',
            name: 'Single Session',
            sessions: 1,
            discount: 0,
            description: 'Perfect for trying out our service'
        },
        {
            id: 'package4',
            name: '4-Session Package',
            sessions: 4,
            discount: 10,
            description: 'Great for building consistency',
            popular: true
        },
        {
            id: 'package8',
            name: '8-Session Package',
            sessions: 8,
            discount: 15,
            description: 'Best value for long-term practice'
        },
        {
            id: 'monthly',
            name: 'Monthly Unlimited',
            sessions: 'unlimited',
            discount: 20,
            description: 'Maximum flexibility and support'
        }
    ];
    const timeSlots = [
        '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM',
        '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM',
        '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM'
    ];
    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };
    const handleArrayToggle = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].includes(value)
                ? prev[field].filter(item => item !== value)
                : [...prev[field], value]
        }));
    };
    const validateStep = (stepNumber) => {
        const newErrors = {};
        switch (stepNumber) {
            case 1:
                if (!formData.firstName.trim())
                    newErrors.firstName = 'First name is required';
                if (!formData.lastName.trim())
                    newErrors.lastName = 'Last name is required';
                if (!formData.email.trim())
                    newErrors.email = 'Email is required';
                if (!formData.phone.trim())
                    newErrors.phone = 'Phone number is required';
                if (!formData.timezone.trim())
                    newErrors.timezone = 'Timezone is required';
                break;
            case 2:
                if (!formData.sessionType)
                    newErrors.sessionType = 'Please select a session type';
                if (!formData.experienceLevel)
                    newErrors.experienceLevel = 'Please select your experience level';
                if (!formData.goals.trim())
                    newErrors.goals = 'Please share your goals';
                break;
            case 3:
                if (formData.preferredDays.length === 0)
                    newErrors.preferredDays = 'Please select at least one preferred day';
                if (formData.preferredTimes.length === 0)
                    newErrors.preferredTimes = 'Please select at least one preferred time';
                if (!formData.packageType)
                    newErrors.packageType = 'Please select a package';
                if (!formData.startDate)
                    newErrors.startDate = 'Please select a start date';
                break;
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleNext = () => {
        if (validateStep(step)) {
            setStep(prev => prev + 1);
        }
    };
    // Update the handleSubmit function with more debugging:
    const handleSubmit = async (e) => {
        console.log('handleSubmit called!'); // Debug log
        e.preventDefault();
        console.log('Form submission prevented, validating step 3...'); // Debug log
        if (!validateStep(3)) {
            console.log('Validation failed!'); // Debug log
            return;
        }
        console.log('Validation passed, proceeding with submission...'); // Debug log
        try {
            setLoading(true);
            console.log('Loading set to true'); // Debug log
            const selectedSession = sessionTypes.find(s => s.id === formData.sessionType);
            const selectedPackage = packages.find(p => p.id === formData.packageType);
            console.log('Selected session:', selectedSession); // Debug log
            console.log('Selected package:', selectedPackage); // Debug log
            console.log('Form data:', formData); // Debug log
            const bookingData = {
                // Required fields from your schema
                user_id: user?.id || null,
                class_name: `1-on-1 ${selectedSession?.name}`,
                instructor: 'Yogodaan Instructor',
                class_date: formData.startDate,
                class_time: formData.preferredTimes[0],
                first_name: formData.firstName,
                last_name: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                experience_level: formData.experienceLevel,
                status: 'pending',
                booking_type: 'individual',
                // Emergency contact fields - now nullable
                emergency_contact: formData.emergencyContact || null,
                emergency_phone: formData.emergencyPhone || null,
                // Optional fields that match your schema
                special_requests: formData.specialRequests || null,
                package_type: formData.packageType,
                goals: formData.goals || null,
                preferred_days: formData.preferredDays,
                preferred_times: formData.preferredTimes,
                timezone: formData.timezone || null,
                price: calculatePrice(),
                session_duration: selectedSession?.duration === '60 min' ? 60 : selectedSession?.duration === '75 min' ? 75 : 45,
                participants_count: 1,
                equipment_needed: false,
                // Store health conditions in booking_notes
                booking_notes: formData.healthConditions ? `Health Conditions: ${formData.healthConditions}` : null
            };
            console.log('Submitting booking data:', bookingData); // Debug log
            const { data, error } = await supabase
                .from('bookings')
                .insert([bookingData])
                .select();
            if (error) {
                console.error('Supabase error:', error); // Debug log
                throw error;
            }
            console.log('Successfully inserted:', data); // Debug log
            setStep(4); // Success step
        }
        catch (error) {
            console.error('Full error:', error); // Debug log
            setErrors({ general: error.message || 'An error occurred while booking your session.' });
        }
        finally {
            setLoading(false);
            console.log('Loading set to false'); // Debug log
        }
    };
    const calculatePrice = () => {
        const selectedSession = sessionTypes.find(s => s.id === formData.sessionType);
        const selectedPackage = packages.find(p => p.id === formData.packageType);
        if (!selectedSession || !selectedPackage)
            return 0;
        if (selectedPackage.id === 'monthly')
            return 299;
        const basePrice = selectedSession.price * selectedPackage.sessions;
        const discount = basePrice * (selectedPackage.discount / 100);
        return basePrice - discount;
    };
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50", children: [_jsx("div", { className: "bg-white shadow-sm", children: _jsxs("div", { className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6", children: [_jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Book Your Personal Yoga Session" }), _jsx("p", { className: "text-gray-600 mt-2", children: "Personalized guidance tailored to your needs" })] }), _jsxs("div", { className: "mt-8", children: [_jsx("div", { className: "flex items-center justify-center space-x-4", children: [1, 2, 3, 4].map((stepNumber) => (_jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: `w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= stepNumber
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-200 text-gray-600'}`, children: step > stepNumber ? '✓' : stepNumber }), stepNumber < 4 && (_jsx("div", { className: `w-16 h-1 mx-2 ${step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'}` }))] }, stepNumber))) }), _jsxs("div", { className: "flex justify-center space-x-20 mt-2", children: [_jsx("span", { className: "text-xs text-gray-500", children: "Personal Info" }), _jsx("span", { className: "text-xs text-gray-500", children: "Session Type" }), _jsx("span", { className: "text-xs text-gray-500", children: "Schedule" }), _jsx("span", { className: "text-xs text-gray-500", children: "Confirmation" })] })] })] }) }), _jsxs("div", { className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [errors.general && (_jsx("div", { className: "mb-6 bg-red-50 border border-red-200 rounded-lg p-4", children: _jsx("p", { className: "text-red-600 text-sm", children: errors.general }) })), _jsxs("form", { onSubmit: handleSubmit, children: [step === 1 && (_jsxs("div", { className: "bg-white rounded-xl shadow-lg p-8", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx(User, { className: "w-12 h-12 text-blue-600 mx-auto mb-4" }), _jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Personal Information" }), _jsx("p", { className: "text-gray-600", children: "Tell us about yourself" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "First Name *" }), _jsx("input", { type: "text", name: "firstName", value: formData.firstName, onChange: handleInputChange, className: `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.firstName ? 'border-red-300' : 'border-gray-300'}`, placeholder: "Enter your first name" }), errors.firstName && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.firstName })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Last Name *" }), _jsx("input", { type: "text", name: "lastName", value: formData.lastName, onChange: handleInputChange, className: `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.lastName ? 'border-red-300' : 'border-gray-300'}`, placeholder: "Enter your last name" }), errors.lastName && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.lastName })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Email *" }), _jsx("input", { type: "email", name: "email", value: formData.email, onChange: handleInputChange, className: `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-300' : 'border-gray-300'}`, placeholder: "Enter your email" }), errors.email && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.email })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Phone Number *" }), _jsx("input", { type: "tel", name: "phone", value: formData.phone, onChange: handleInputChange, className: `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.phone ? 'border-red-300' : 'border-gray-300'}`, placeholder: "Enter your phone number" }), errors.phone && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.phone })] }), _jsxs("div", { className: "md:col-span-2", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Timezone *" }), _jsxs("select", { name: "timezone", value: formData.timezone, onChange: handleInputChange, className: `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.timezone ? 'border-red-300' : 'border-gray-300'}`, children: [_jsx("option", { value: "", children: "Select your timezone" }), _jsx("option", { value: "UTC-8", children: "Pacific Time (UTC-8)" }), _jsx("option", { value: "UTC-7", children: "Mountain Time (UTC-7)" }), _jsx("option", { value: "UTC-6", children: "Central Time (UTC-6)" }), _jsx("option", { value: "UTC-5", children: "Eastern Time (UTC-5)" }), _jsx("option", { value: "UTC+0", children: "GMT (UTC+0)" }), _jsx("option", { value: "UTC+1", children: "Central European Time (UTC+1)" }), _jsx("option", { value: "UTC+5:30", children: "India Standard Time (UTC+5:30)" }), _jsx("option", { value: "UTC+8", children: "Singapore Time (UTC+8)" }), _jsx("option", { value: "UTC+9", children: "Japan Time (UTC+9)" })] }), errors.timezone && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.timezone })] })] }), _jsx("div", { className: "flex justify-end mt-8", children: _jsx(Button, { onClick: handleNext, className: "px-8 py-3", children: "Next Step" }) })] })), step === 2 && (_jsxs("div", { className: "bg-white rounded-xl shadow-lg p-8", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx(Star, { className: "w-12 h-12 text-blue-600 mx-auto mb-4" }), _jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Session Details" }), _jsx("p", { className: "text-gray-600", children: "Choose your preferred session type" })] }), _jsxs("div", { className: "mb-8", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-4", children: "Session Type *" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: sessionTypes.map((session) => (_jsxs("div", { onClick: () => setFormData(prev => ({ ...prev, sessionType: session.id })), className: `p-6 border-2 rounded-lg cursor-pointer transition-all ${formData.sessionType === session.id
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-gray-200 hover:border-gray-300'}`, children: [_jsxs("div", { className: "flex justify-between items-start mb-2", children: [_jsx("h3", { className: "font-semibold text-gray-900", children: session.name }), _jsxs("span", { className: "text-blue-600 font-bold", children: ["$", session.price] })] }), _jsx("p", { className: "text-gray-600 text-sm mb-2", children: session.description }), _jsx("p", { className: "text-gray-500 text-xs", children: session.duration })] }, session.id))) }), errors.sessionType && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.sessionType })] }), _jsxs("div", { className: "mb-8", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Experience Level *" }), _jsxs("select", { name: "experienceLevel", value: formData.experienceLevel, onChange: handleInputChange, className: `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.experienceLevel ? 'border-red-300' : 'border-gray-300'}`, children: [_jsx("option", { value: "", children: "Select your experience level" }), _jsx("option", { value: "beginner", children: "Beginner (0-6 months)" }), _jsx("option", { value: "intermediate", children: "Intermediate (6 months - 2 years)" }), _jsx("option", { value: "advanced", children: "Advanced (2+ years)" }), _jsx("option", { value: "expert", children: "Expert/Teacher" })] }), errors.experienceLevel && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.experienceLevel })] }), _jsxs("div", { className: "mb-8", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "What are your goals? *" }), _jsx("textarea", { name: "goals", value: formData.goals, onChange: handleInputChange, rows: 4, className: `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.goals ? 'border-red-300' : 'border-gray-300'}`, placeholder: "Tell us about your yoga goals, what you hope to achieve..." }), errors.goals && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.goals })] }), _jsxs("div", { className: "mb-8", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Health Conditions or Injuries" }), _jsx("textarea", { name: "healthConditions", value: formData.healthConditions, onChange: handleInputChange, rows: 3, className: "w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "Please mention any health conditions, injuries, or physical limitations we should be aware of..." })] }), _jsxs("div", { className: "flex justify-between mt-8", children: [_jsx(Button, { variant: "outline", onClick: () => setStep(1), children: "Previous" }), _jsx(Button, { onClick: handleNext, children: "Next Step" })] })] })), step === 3 && (_jsxs("div", { className: "bg-white rounded-xl shadow-lg p-8", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx(Calendar, { className: "w-12 h-12 text-blue-600 mx-auto mb-4" }), _jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Schedule & Package" }), _jsx("p", { className: "text-gray-600", children: "Choose your preferred schedule and package" })] }), _jsxs("div", { className: "mb-8", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-4", children: "Preferred Days *" }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: weekDays.map((day) => (_jsx("button", { type: "button", onClick: () => handleArrayToggle('preferredDays', day), className: `p-3 text-sm font-medium rounded-lg border-2 transition-all ${formData.preferredDays.includes(day)
                                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                        : 'border-gray-200 text-gray-700 hover:border-gray-300'}`, children: day.slice(0, 3) }, day))) }), errors.preferredDays && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.preferredDays })] }), _jsxs("div", { className: "mb-8", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-4", children: "Preferred Times *" }), _jsx("div", { className: "grid grid-cols-3 md:grid-cols-5 gap-3 max-h-40 overflow-y-auto", children: timeSlots.map((time) => (_jsx("button", { type: "button", onClick: () => handleArrayToggle('preferredTimes', time), className: `p-2 text-sm font-medium rounded-lg border-2 transition-all ${formData.preferredTimes.includes(time)
                                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                        : 'border-gray-200 text-gray-700 hover:border-gray-300'}`, children: time }, time))) }), errors.preferredTimes && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.preferredTimes })] }), _jsxs("div", { className: "mb-8", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-4", children: "Choose Package *" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: packages.map((pkg) => (_jsxs("div", { onClick: () => setFormData(prev => ({ ...prev, packageType: pkg.id })), className: `relative p-6 border-2 rounded-lg cursor-pointer transition-all ${formData.packageType === pkg.id
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-gray-200 hover:border-gray-300'}`, children: [pkg.popular && (_jsx("div", { className: "absolute -top-2 left-1/2 transform -translate-x-1/2", children: _jsx("span", { className: "bg-blue-600 text-white px-3 py-1 text-xs font-medium rounded-full", children: "Most Popular" }) })), _jsx("h3", { className: "font-semibold text-gray-900 mb-2", children: pkg.name }), _jsx("p", { className: "text-gray-600 text-sm mb-2", children: pkg.description }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("span", { className: "text-gray-500 text-sm", children: [pkg.sessions, " session", pkg.sessions !== 1 && pkg.sessions !== 'unlimited' ? 's' : ''] }), pkg.discount > 0 && (_jsxs("span", { className: "text-green-600 font-medium text-sm", children: [pkg.discount, "% off"] }))] })] }, pkg.id))) }), errors.packageType && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.packageType })] }), _jsxs("div", { className: "mb-8", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Preferred Start Date *" }), _jsx("input", { type: "date", name: "startDate", value: formData.startDate, onChange: handleInputChange, min: new Date().toISOString().split('T')[0], className: `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.startDate ? 'border-red-300' : 'border-gray-300'}` }), errors.startDate && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.startDate })] }), _jsxs("div", { className: "mb-8", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Special Requests" }), _jsx("textarea", { name: "specialRequests", value: formData.specialRequests, onChange: handleInputChange, rows: 3, className: "w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "Any special requests or preferences..." })] }), formData.sessionType && formData.packageType && (_jsxs("div", { className: "bg-gray-50 rounded-lg p-6 mb-8", children: [_jsx("h3", { className: "font-semibold text-gray-900 mb-4", children: "Price Summary" }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Session Type:" }), _jsx("span", { children: sessionTypes.find(s => s.id === formData.sessionType)?.name })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Package:" }), _jsx("span", { children: packages.find(p => p.id === formData.packageType)?.name })] }), _jsx("div", { className: "border-t pt-2 mt-2", children: _jsxs("div", { className: "flex justify-between font-semibold text-lg", children: [_jsx("span", { children: "Total:" }), _jsxs("span", { className: "text-blue-600", children: ["$", calculatePrice()] })] }) })] })] })), _jsxs("div", { className: "flex justify-between mt-8", children: [_jsx(Button, { variant: "outline", onClick: () => setStep(2), children: "Previous" }), _jsx(Button, { type: "submit", className: "bg-blue-600 hover:bg-blue-700", children: "Submit Booking" })] })] })), step === 4 && !loading && (_jsxs("div", { className: "bg-white rounded-xl shadow-lg p-8 text-center", children: [_jsx("div", { className: "w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6", children: _jsx("svg", { className: "w-8 h-8 text-green-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" }) }) }), _jsx("h2", { className: "text-3xl font-bold text-gray-900 mb-4", children: "Booking Submitted!" }), _jsx("p", { className: "text-gray-600 mb-8", children: "Thank you for booking with us! We'll review your request and send you a confirmation email within 24 hours with your session details and payment instructions." }), _jsxs("div", { className: "bg-blue-50 rounded-lg p-6 mb-8", children: [_jsx("h3", { className: "font-semibold text-gray-900 mb-4", children: "What's Next?" }), _jsxs("div", { className: "space-y-3 text-sm text-gray-700 text-left", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Mail, { className: "w-4 h-4 text-blue-600 mr-2" }), _jsx("span", { children: "You'll receive a confirmation email within 24 hours" })] }), _jsxs("div", { className: "flex items-center", children: [_jsx(Video, { className: "w-4 h-4 text-blue-600 mr-2" }), _jsx("span", { children: "We'll send you the video call link before your session" })] }), _jsxs("div", { className: "flex items-center", children: [_jsx(Phone, { className: "w-4 h-4 text-blue-600 mr-2" }), _jsx("span", { children: "Our team may call to discuss your specific needs" })] })] })] }), _jsx(Button, { onClick: () => window.location.href = '/', children: "Return to Home" })] })), loading && (_jsxs("div", { className: "bg-white rounded-xl shadow-lg p-8 text-center", children: [_jsx(LoadingSpinner, { size: "lg" }), _jsx("p", { className: "text-gray-600 mt-4", children: "Submitting your booking..." })] }))] })] })] }));
}
