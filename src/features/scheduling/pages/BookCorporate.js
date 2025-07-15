import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Building, Calendar, Mail, Phone, Star, Users } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../../shared/components/ui/Button';
import { LoadingSpinner } from '../../../shared/components/ui/LoadingSpinner';
import { supabase } from '../../../shared/lib/supabase';
import { useAuth } from '../../auth/contexts/AuthContext';
export function BookCorporate() {
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({
        // Company Info
        companyName: '',
        industry: '',
        companySize: '',
        contactName: '',
        position: '',
        email: user?.email || '',
        phone: '',
        // Program Details
        programType: '',
        participantCount: '',
        frequency: '',
        duration: '',
        objectives: '',
        // Schedule & Logistics
        preferredDays: [],
        preferredTimes: [],
        timezone: '',
        startDate: '',
        location: '',
        // Budget & Requirements
        budget: '',
        specialRequests: '',
        hasWellnessProgram: '',
        previousExperience: ''
    });
    const programTypes = [
        {
            id: 'desk-yoga',
            name: 'Desk Yoga Sessions',
            description: 'Chair-based yoga perfect for office environments',
            duration: '15-30 min',
            minParticipants: 5,
            maxParticipants: 50,
            price: 150
        },
        {
            id: 'stress-relief',
            name: 'Stress Relief Workshop',
            description: 'Comprehensive stress management through yoga and meditation',
            duration: '45-60 min',
            minParticipants: 10,
            maxParticipants: 30,
            price: 300
        },
        {
            id: 'team-building',
            name: 'Team Building Yoga',
            description: 'Interactive sessions designed to build team cohesion',
            duration: '60-90 min',
            minParticipants: 8,
            maxParticipants: 25,
            price: 400
        },
        {
            id: 'wellness-series',
            name: 'Corporate Wellness Series',
            description: 'Multi-week program for comprehensive employee wellness',
            duration: '4-12 weeks',
            minParticipants: 15,
            maxParticipants: 100,
            price: 2000
        },
        {
            id: 'lunch-learn',
            name: 'Lunch & Learn Sessions',
            description: 'Educational workshops during lunch breaks',
            duration: '30-45 min',
            minParticipants: 10,
            maxParticipants: 40,
            price: 200
        },
        {
            id: 'executive',
            name: 'Executive Wellness Program',
            description: 'Premium wellness program for leadership teams',
            duration: '60 min',
            minParticipants: 3,
            maxParticipants: 15,
            price: 500
        }
    ];
    const industries = [
        'Technology', 'Finance', 'Healthcare', 'Education', 'Manufacturing',
        'Retail', 'Consulting', 'Legal', 'Marketing', 'Real Estate', 'Other'
    ];
    const companySizes = [
        '1-10 employees', '11-50 employees', '51-200 employees',
        '201-500 employees', '501-1000 employees', '1000+ employees'
    ];
    const frequencies = [
        { id: 'one-time', name: 'One-time Session', multiplier: 1 },
        { id: 'weekly', name: 'Weekly Sessions', multiplier: 4 },
        { id: 'bi-weekly', name: 'Bi-weekly Sessions', multiplier: 2 },
        { id: 'monthly', name: 'Monthly Sessions', multiplier: 1 },
        { id: 'quarterly', name: 'Quarterly Sessions', multiplier: 0.25 }
    ];
    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const timeSlots = [
        '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
        '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'
    ];
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
                if (!formData.companyName.trim())
                    newErrors.companyName = 'Company name is required';
                if (!formData.industry)
                    newErrors.industry = 'Industry is required';
                if (!formData.companySize)
                    newErrors.companySize = 'Company size is required';
                if (!formData.contactName.trim())
                    newErrors.contactName = 'Contact name is required';
                if (!formData.position.trim())
                    newErrors.position = 'Position is required';
                if (!formData.email.trim())
                    newErrors.email = 'Email is required';
                if (!formData.phone.trim())
                    newErrors.phone = 'Phone number is required';
                break;
            case 2:
                if (!formData.programType)
                    newErrors.programType = 'Please select a program type';
                if (!formData.participantCount)
                    newErrors.participantCount = 'Number of participants is required';
                if (!formData.frequency)
                    newErrors.frequency = 'Please select frequency';
                if (!formData.objectives.trim())
                    newErrors.objectives = 'Please describe your objectives';
                break;
            case 3:
                if (formData.preferredDays.length === 0)
                    newErrors.preferredDays = 'Please select at least one preferred day';
                if (formData.preferredTimes.length === 0)
                    newErrors.preferredTimes = 'Please select at least one preferred time';
                if (!formData.timezone)
                    newErrors.timezone = 'Timezone is required';
                if (!formData.startDate)
                    newErrors.startDate = 'Start date is required';
                if (!formData.location)
                    newErrors.location = 'Please specify location preference';
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
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateStep(3))
            return;
        try {
            setLoading(true);
            const selectedProgram = programTypes.find(p => p.id === formData.programType);
            const bookingData = {
                user_id: user?.id || null,
                class_name: `Corporate: ${selectedProgram?.name}`,
                instructor: 'Yogodaan Corporate Team',
                class_date: formData.startDate,
                class_time: formData.preferredTimes[0],
                first_name: formData.contactName.split(' ')[0] || '',
                last_name: formData.contactName.split(' ').slice(1).join(' ') || '',
                email: formData.email,
                phone: formData.phone,
                experience_level: 'corporate',
                special_requests: formData.specialRequests,
                status: 'pending',
                booking_type: 'corporate',
                company_name: formData.companyName,
                job_title: formData.position,
                industry: formData.industry,
                participants_count: parseInt(formData.participantCount),
                work_location: formData.location,
                preferred_days: formData.preferredDays,
                preferred_times: formData.preferredTimes,
                session_frequency: formData.frequency,
                goals: formData.objectives,
                current_wellness_programs: formData.hasWellnessProgram,
                timezone: formData.timezone,
                emergency_contact: formData.contactName,
                emergency_phone: formData.phone
            };
            const { error } = await supabase
                .from('bookings')
                .insert([bookingData]);
            if (error)
                throw error;
            setStep(4); // Success step
        }
        catch (error) {
            setErrors({ general: error.message || 'An error occurred while submitting your request.' });
        }
        finally {
            setLoading(false);
        }
    };
    const calculateEstimatedPrice = () => {
        const selectedProgram = programTypes.find(p => p.id === formData.programType);
        const selectedFrequency = frequencies.find(f => f.id === formData.frequency);
        if (!selectedProgram || !selectedFrequency || !formData.participantCount)
            return 0;
        const basePrice = selectedProgram.price;
        const participantMultiplier = Math.max(1, parseInt(formData.participantCount) / 20);
        const monthlyPrice = basePrice * participantMultiplier * selectedFrequency.multiplier;
        return Math.round(monthlyPrice);
    };
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50", children: [_jsx("div", { className: "bg-white shadow-sm", children: _jsxs("div", { className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6", children: [_jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Corporate Wellness Program" }), _jsx("p", { className: "text-gray-600 mt-2", children: "Transform your workplace with customized yoga and wellness solutions" })] }), _jsxs("div", { className: "mt-8", children: [_jsx("div", { className: "flex items-center justify-center space-x-4", children: [1, 2, 3, 4].map((stepNumber) => (_jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: `w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= stepNumber
                                                    ? 'bg-purple-600 text-white'
                                                    : 'bg-gray-200 text-gray-600'}`, children: step > stepNumber ? '✓' : stepNumber }), stepNumber < 4 && (_jsx("div", { className: `w-16 h-1 mx-2 ${step > stepNumber ? 'bg-purple-600' : 'bg-gray-200'}` }))] }, stepNumber))) }), _jsxs("div", { className: "flex justify-center space-x-20 mt-2", children: [_jsx("span", { className: "text-xs text-gray-500", children: "Company Info" }), _jsx("span", { className: "text-xs text-gray-500", children: "Program Details" }), _jsx("span", { className: "text-xs text-gray-500", children: "Schedule" }), _jsx("span", { className: "text-xs text-gray-500", children: "Confirmation" })] })] })] }) }), _jsxs("div", { className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [errors.general && (_jsx("div", { className: "mb-6 bg-red-50 border border-red-200 rounded-lg p-4", children: _jsx("p", { className: "text-red-600 text-sm", children: errors.general }) })), _jsxs("form", { onSubmit: handleSubmit, children: [step === 1 && (_jsxs("div", { className: "bg-white rounded-xl shadow-lg p-8", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx(Building, { className: "w-12 h-12 text-purple-600 mx-auto mb-4" }), _jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Company Information" }), _jsx("p", { className: "text-gray-600", children: "Tell us about your organization" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "md:col-span-2", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Company Name *" }), _jsx("input", { type: "text", name: "companyName", value: formData.companyName, onChange: handleInputChange, className: `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.companyName ? 'border-red-300' : 'border-gray-300'}`, placeholder: "Enter your company name" }), errors.companyName && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.companyName })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Industry *" }), _jsxs("select", { name: "industry", value: formData.industry, onChange: handleInputChange, className: `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.industry ? 'border-red-300' : 'border-gray-300'}`, children: [_jsx("option", { value: "", children: "Select industry" }), industries.map(industry => (_jsx("option", { value: industry, children: industry }, industry)))] }), errors.industry && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.industry })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Company Size *" }), _jsxs("select", { name: "companySize", value: formData.companySize, onChange: handleInputChange, className: `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.companySize ? 'border-red-300' : 'border-gray-300'}`, children: [_jsx("option", { value: "", children: "Select company size" }), companySizes.map(size => (_jsx("option", { value: size, children: size }, size)))] }), errors.companySize && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.companySize })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Contact Person *" }), _jsx("input", { type: "text", name: "contactName", value: formData.contactName, onChange: handleInputChange, className: `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.contactName ? 'border-red-300' : 'border-gray-300'}`, placeholder: "Full name" }), errors.contactName && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.contactName })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Position/Title *" }), _jsx("input", { type: "text", name: "position", value: formData.position, onChange: handleInputChange, className: `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.position ? 'border-red-300' : 'border-gray-300'}`, placeholder: "Your position/title" }), errors.position && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.position })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Email *" }), _jsx("input", { type: "email", name: "email", value: formData.email, onChange: handleInputChange, className: `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.email ? 'border-red-300' : 'border-gray-300'}`, placeholder: "Email address" }), errors.email && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.email })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Phone Number *" }), _jsx("input", { type: "tel", name: "phone", value: formData.phone, onChange: handleInputChange, className: `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.phone ? 'border-red-300' : 'border-gray-300'}`, placeholder: "Phone number" }), errors.phone && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.phone })] })] }), _jsx("div", { className: "flex justify-end mt-8", children: _jsx(Button, { onClick: handleNext, className: "px-8 py-3 bg-purple-600 hover:bg-purple-700", children: "Next Step" }) })] })), step === 2 && (_jsxs("div", { className: "bg-white rounded-xl shadow-lg p-8", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx(Star, { className: "w-12 h-12 text-purple-600 mx-auto mb-4" }), _jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Program Details" }), _jsx("p", { className: "text-gray-600", children: "Choose the perfect program for your team" })] }), _jsxs("div", { className: "mb-8", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-4", children: "Program Type *" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: programTypes.map((program) => (_jsxs("div", { onClick: () => setFormData(prev => ({ ...prev, programType: program.id })), className: `p-6 border-2 rounded-lg cursor-pointer transition-all ${formData.programType === program.id
                                                        ? 'border-purple-500 bg-purple-50'
                                                        : 'border-gray-200 hover:border-gray-300'}`, children: [_jsxs("div", { className: "flex justify-between items-start mb-2", children: [_jsx("h3", { className: "font-semibold text-gray-900", children: program.name }), _jsxs("span", { className: "text-purple-600 font-bold", children: ["From $", program.price] })] }), _jsx("p", { className: "text-gray-600 text-sm mb-3", children: program.description }), _jsxs("div", { className: "text-xs text-gray-500 space-y-1", children: [_jsxs("div", { children: ["Duration: ", program.duration] }), _jsxs("div", { children: ["Participants: ", program.minParticipants, "-", program.maxParticipants] })] })] }, program.id))) }), errors.programType && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.programType })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6 mb-8", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Expected Number of Participants *" }), _jsx("input", { type: "number", name: "participantCount", value: formData.participantCount, onChange: handleInputChange, min: "1", max: "500", className: `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.participantCount ? 'border-red-300' : 'border-gray-300'}`, placeholder: "Number of participants" }), errors.participantCount && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.participantCount })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Session Frequency *" }), _jsxs("select", { name: "frequency", value: formData.frequency, onChange: handleInputChange, className: `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.frequency ? 'border-red-300' : 'border-gray-300'}`, children: [_jsx("option", { value: "", children: "Select frequency" }), frequencies.map(freq => (_jsx("option", { value: freq.id, children: freq.name }, freq.id)))] }), errors.frequency && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.frequency })] })] }), _jsxs("div", { className: "mb-8", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Program Objectives *" }), _jsx("textarea", { name: "objectives", value: formData.objectives, onChange: handleInputChange, rows: 4, className: `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.objectives ? 'border-red-300' : 'border-gray-300'}`, placeholder: "What do you hope to achieve with this program? (e.g., reduce stress, improve team bonding, enhance productivity...)" }), errors.objectives && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.objectives })] }), _jsxs("div", { className: "mb-8", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Does your company currently have a wellness program?" }), _jsxs("div", { className: "flex space-x-4", children: [_jsxs("label", { className: "flex items-center", children: [_jsx("input", { type: "radio", name: "hasWellnessProgram", value: "yes", checked: formData.hasWellnessProgram === 'yes', onChange: handleInputChange, className: "mr-2" }), "Yes"] }), _jsxs("label", { className: "flex items-center", children: [_jsx("input", { type: "radio", name: "hasWellnessProgram", value: "no", checked: formData.hasWellnessProgram === 'no', onChange: handleInputChange, className: "mr-2" }), "No"] })] })] }), _jsxs("div", { className: "mb-8", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Previous Yoga/Wellness Experience" }), _jsx("textarea", { name: "previousExperience", value: formData.previousExperience, onChange: handleInputChange, rows: 3, className: "w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500", placeholder: "Tell us about any previous yoga or wellness programs your team has participated in..." })] }), _jsxs("div", { className: "flex justify-between mt-8", children: [_jsx(Button, { variant: "outline", onClick: () => setStep(1), children: "Previous" }), _jsx(Button, { onClick: handleNext, className: "bg-purple-600 hover:bg-purple-700", children: "Next Step" })] })] })), step === 3 && (_jsxs("div", { className: "bg-white rounded-xl shadow-lg p-8", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx(Calendar, { className: "w-12 h-12 text-purple-600 mx-auto mb-4" }), _jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Schedule & Logistics" }), _jsx("p", { className: "text-gray-600", children: "Set up your program schedule" })] }), _jsxs("div", { className: "mb-8", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-4", children: "Preferred Days *" }), _jsx("div", { className: "grid grid-cols-5 gap-3", children: weekDays.map((day) => (_jsx("button", { type: "button", onClick: () => handleArrayToggle('preferredDays', day), className: `p-3 text-sm font-medium rounded-lg border-2 transition-all ${formData.preferredDays.includes(day)
                                                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                                                        : 'border-gray-200 text-gray-700 hover:border-gray-300'}`, children: day.slice(0, 3) }, day))) }), errors.preferredDays && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.preferredDays })] }), _jsxs("div", { className: "mb-8", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-4", children: "Preferred Times *" }), _jsx("div", { className: "grid grid-cols-3 md:grid-cols-4 gap-3", children: timeSlots.map((time) => (_jsx("button", { type: "button", onClick: () => handleArrayToggle('preferredTimes', time), className: `p-3 text-sm font-medium rounded-lg border-2 transition-all ${formData.preferredTimes.includes(time)
                                                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                                                        : 'border-gray-200 text-gray-700 hover:border-gray-300'}`, children: time }, time))) }), errors.preferredTimes && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.preferredTimes })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6 mb-8", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Timezone *" }), _jsxs("select", { name: "timezone", value: formData.timezone, onChange: handleInputChange, className: `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.timezone ? 'border-red-300' : 'border-gray-300'}`, children: [_jsx("option", { value: "", children: "Select timezone" }), _jsx("option", { value: "UTC-8", children: "Pacific Time (UTC-8)" }), _jsx("option", { value: "UTC-7", children: "Mountain Time (UTC-7)" }), _jsx("option", { value: "UTC-6", children: "Central Time (UTC-6)" }), _jsx("option", { value: "UTC-5", children: "Eastern Time (UTC-5)" }), _jsx("option", { value: "UTC+0", children: "GMT (UTC+0)" }), _jsx("option", { value: "UTC+1", children: "Central European Time (UTC+1)" }), _jsx("option", { value: "UTC+5:30", children: "India Standard Time (UTC+5:30)" }), _jsx("option", { value: "UTC+8", children: "Singapore Time (UTC+8)" }), _jsx("option", { value: "UTC+9", children: "Japan Time (UTC+9)" })] }), errors.timezone && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.timezone })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Preferred Start Date *" }), _jsx("input", { type: "date", name: "startDate", value: formData.startDate, onChange: handleInputChange, min: new Date().toISOString().split('T')[0], className: `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.startDate ? 'border-red-300' : 'border-gray-300'}` }), errors.startDate && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.startDate })] })] }), _jsxs("div", { className: "mb-8", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Session Location *" }), _jsxs("select", { name: "location", value: formData.location, onChange: handleInputChange, className: `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.location ? 'border-red-300' : 'border-gray-300'}`, children: [_jsx("option", { value: "", children: "Select location preference" }), _jsx("option", { value: "on-site", children: "On-site at our office" }), _jsx("option", { value: "virtual", children: "Virtual/Online sessions" }), _jsx("option", { value: "hybrid", children: "Hybrid (mix of on-site and virtual)" }), _jsx("option", { value: "external", children: "External venue (we'll arrange)" })] }), errors.location && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.location })] }), _jsxs("div", { className: "mb-8", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Budget Range (Monthly)" }), _jsxs("select", { name: "budget", value: formData.budget, onChange: handleInputChange, className: "w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500", children: [_jsx("option", { value: "", children: "Select budget range" }), _jsx("option", { value: "under-500", children: "Under $500" }), _jsx("option", { value: "500-1000", children: "$500 - $1,000" }), _jsx("option", { value: "1000-2500", children: "$1,000 - $2,500" }), _jsx("option", { value: "2500-5000", children: "$2,500 - $5,000" }), _jsx("option", { value: "5000-10000", children: "$5,000 - $10,000" }), _jsx("option", { value: "over-10000", children: "Over $10,000" }), _jsx("option", { value: "flexible", children: "Flexible/To be discussed" })] })] }), _jsxs("div", { className: "mb-8", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Special Requirements or Requests" }), _jsx("textarea", { name: "specialRequests", value: formData.specialRequests, onChange: handleInputChange, rows: 4, className: "w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500", placeholder: "Any specific requirements, equipment needs, accessibility considerations, or special requests..." })] }), formData.programType && formData.participantCount && formData.frequency && (_jsxs("div", { className: "bg-purple-50 rounded-lg p-6 mb-8", children: [_jsx("h3", { className: "font-semibold text-gray-900 mb-4", children: "Estimated Investment" }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Program:" }), _jsx("span", { children: programTypes.find(p => p.id === formData.programType)?.name })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Participants:" }), _jsx("span", { children: formData.participantCount })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Frequency:" }), _jsx("span", { children: frequencies.find(f => f.id === formData.frequency)?.name })] }), _jsxs("div", { className: "border-t pt-2 mt-2", children: [_jsxs("div", { className: "flex justify-between font-semibold text-lg", children: [_jsx("span", { children: "Estimated Monthly Cost:" }), _jsxs("span", { className: "text-purple-600", children: ["$", calculateEstimatedPrice()] })] }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "*Final pricing will be customized based on your specific requirements" })] })] })] })), _jsxs("div", { className: "flex justify-between mt-8", children: [_jsx(Button, { variant: "outline", onClick: () => setStep(2), children: "Previous" }), _jsx(Button, { type: "submit", className: "bg-purple-600 hover:bg-purple-700", children: "Submit Request" })] })] })), step === 4 && !loading && (_jsxs("div", { className: "bg-white rounded-xl shadow-lg p-8 text-center", children: [_jsx("div", { className: "w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6", children: _jsx("svg", { className: "w-8 h-8 text-green-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" }) }) }), _jsx("h2", { className: "text-3xl font-bold text-gray-900 mb-4", children: "Request Submitted Successfully!" }), _jsx("p", { className: "text-gray-600 mb-8", children: "Thank you for your interest in our Corporate Wellness Program! Our team will review your requirements and get back to you within 1 business day with a customized proposal." }), _jsxs("div", { className: "bg-purple-50 rounded-lg p-6 mb-8", children: [_jsx("h3", { className: "font-semibold text-gray-900 mb-4", children: "What Happens Next?" }), _jsxs("div", { className: "space-y-3 text-sm text-gray-700 text-left", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Users, { className: "w-4 h-4 text-purple-600 mr-2" }), _jsx("span", { children: "Our corporate wellness specialist will review your requirements" })] }), _jsxs("div", { className: "flex items-center", children: [_jsx(Mail, { className: "w-4 h-4 text-purple-600 mr-2" }), _jsx("span", { children: "You'll receive a detailed proposal within 1 business day" })] }), _jsxs("div", { className: "flex items-center", children: [_jsx(Phone, { className: "w-4 h-4 text-purple-600 mr-2" }), _jsx("span", { children: "We'll schedule a consultation call to discuss your program" })] }), _jsxs("div", { className: "flex items-center", children: [_jsx(Calendar, { className: "w-4 h-4 text-purple-600 mr-2" }), _jsx("span", { children: "Once approved, we'll coordinate the program schedule" })] })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsx(Button, { onClick: () => window.location.href = '/', className: "bg-purple-600 hover:bg-purple-700 mr-4", children: "Return to Home" }), _jsx(Button, { variant: "outline", onClick: () => window.location.href = '/contact', children: "Contact Us Directly" })] })] })), loading && (_jsxs("div", { className: "bg-white rounded-xl shadow-lg p-8 text-center", children: [_jsx(LoadingSpinner, { size: "lg" }), _jsx("p", { className: "text-gray-600 mt-4", children: "Submitting your corporate wellness request..." })] }))] })] })] }));
}
