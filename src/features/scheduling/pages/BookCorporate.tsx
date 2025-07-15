import { Building, Calendar, Mail, Phone, Star, Users } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../../shared/components/ui/Button'
import { LoadingSpinner } from '../../../shared/components/ui/LoadingSpinner'
import { supabase } from '../../../shared/lib/supabase'
import { useAuth } from '../../auth/contexts/AuthContext'

export function BookCorporate() {
    const { user } = useAuth()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})

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
        preferredDays: [] as string[],
        preferredTimes: [] as string[],
        timezone: '',
        startDate: '',
        location: '',

        // Budget & Requirements
        budget: '',
        specialRequests: '',
        hasWellnessProgram: '',
        previousExperience: ''
    })

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
    ]

    const industries = [
        'Technology', 'Finance', 'Healthcare', 'Education', 'Manufacturing',
        'Retail', 'Consulting', 'Legal', 'Marketing', 'Real Estate', 'Other'
    ]

    const companySizes = [
        '1-10 employees', '11-50 employees', '51-200 employees',
        '201-500 employees', '501-1000 employees', '1000+ employees'
    ]

    const frequencies = [
        { id: 'one-time', name: 'One-time Session', multiplier: 1 },
        { id: 'weekly', name: 'Weekly Sessions', multiplier: 4 },
        { id: 'bi-weekly', name: 'Bi-weekly Sessions', multiplier: 2 },
        { id: 'monthly', name: 'Monthly Sessions', multiplier: 1 },
        { id: 'quarterly', name: 'Quarterly Sessions', multiplier: 0.25 }
    ]

    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

    const timeSlots = [
        '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
        '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'
    ]

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }))
        }
    }

    const handleArrayToggle = (field: 'preferredDays' | 'preferredTimes', value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].includes(value)
                ? prev[field].filter(item => item !== value)
                : [...prev[field], value]
        }))
    }

    const validateStep = (stepNumber: number): boolean => {
        const newErrors: Record<string, string> = {}

        switch (stepNumber) {
            case 1:
                if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required'
                if (!formData.industry) newErrors.industry = 'Industry is required'
                if (!formData.companySize) newErrors.companySize = 'Company size is required'
                if (!formData.contactName.trim()) newErrors.contactName = 'Contact name is required'
                if (!formData.position.trim()) newErrors.position = 'Position is required'
                if (!formData.email.trim()) newErrors.email = 'Email is required'
                if (!formData.phone.trim()) newErrors.phone = 'Phone number is required'
                break
            case 2:
                if (!formData.programType) newErrors.programType = 'Please select a program type'
                if (!formData.participantCount) newErrors.participantCount = 'Number of participants is required'
                if (!formData.frequency) newErrors.frequency = 'Please select frequency'
                if (!formData.objectives.trim()) newErrors.objectives = 'Please describe your objectives'
                break
            case 3:
                if (formData.preferredDays.length === 0) newErrors.preferredDays = 'Please select at least one preferred day'
                if (formData.preferredTimes.length === 0) newErrors.preferredTimes = 'Please select at least one preferred time'
                if (!formData.timezone) newErrors.timezone = 'Timezone is required'
                if (!formData.startDate) newErrors.startDate = 'Start date is required'
                if (!formData.location) newErrors.location = 'Please specify location preference'
                break
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleNext = () => {
        if (validateStep(step)) {
            setStep(prev => prev + 1)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateStep(3)) return

        try {
            setLoading(true)

            const selectedProgram = programTypes.find(p => p.id === formData.programType)

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
            }

            const { error } = await supabase
                .from('bookings')
                .insert([bookingData])

            if (error) throw error

            setStep(4) // Success step
        } catch (error: any) {
            setErrors({ general: error.message || 'An error occurred while submitting your request.' })
        } finally {
            setLoading(false)
        }
    }

    const calculateEstimatedPrice = () => {
        const selectedProgram = programTypes.find(p => p.id === formData.programType)
        const selectedFrequency = frequencies.find(f => f.id === formData.frequency)

        if (!selectedProgram || !selectedFrequency || !formData.participantCount) return 0

        const basePrice = selectedProgram.price
        const participantMultiplier = Math.max(1, parseInt(formData.participantCount) / 20)
        const monthlyPrice = basePrice * participantMultiplier * selectedFrequency.multiplier

        return Math.round(monthlyPrice)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
            {/* Header */}
            <div className="bg-white shadow-sm">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-gray-900">Corporate Wellness Program</h1>
                        <p className="text-gray-600 mt-2">Transform your workplace with customized yoga and wellness solutions</p>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-8">
                        <div className="flex items-center justify-center space-x-4">
                            {[1, 2, 3, 4].map((stepNumber) => (
                                <div key={stepNumber} className="flex items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= stepNumber
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-gray-200 text-gray-600'
                                        }`}>
                                        {step > stepNumber ? '✓' : stepNumber}
                                    </div>
                                    {stepNumber < 4 && (
                                        <div className={`w-16 h-1 mx-2 ${step > stepNumber ? 'bg-purple-600' : 'bg-gray-200'
                                            }`} />
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-center space-x-20 mt-2">
                            <span className="text-xs text-gray-500">Company Info</span>
                            <span className="text-xs text-gray-500">Program Details</span>
                            <span className="text-xs text-gray-500">Schedule</span>
                            <span className="text-xs text-gray-500">Confirmation</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {errors.general && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-600 text-sm">{errors.general}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Step 1: Company Information */}
                    {step === 1 && (
                        <div className="bg-white rounded-xl shadow-lg p-8">
                            <div className="text-center mb-8">
                                <Building className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                                <h2 className="text-2xl font-bold text-gray-900">Company Information</h2>
                                <p className="text-gray-600">Tell us about your organization</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Company Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="companyName"
                                        value={formData.companyName}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.companyName ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                        placeholder="Enter your company name"
                                    />
                                    {errors.companyName && <p className="text-red-500 text-sm mt-1">{errors.companyName}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Industry *
                                    </label>
                                    <select
                                        name="industry"
                                        value={formData.industry}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.industry ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                    >
                                        <option value="">Select industry</option>
                                        {industries.map(industry => (
                                            <option key={industry} value={industry}>{industry}</option>
                                        ))}
                                    </select>
                                    {errors.industry && <p className="text-red-500 text-sm mt-1">{errors.industry}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Company Size *
                                    </label>
                                    <select
                                        name="companySize"
                                        value={formData.companySize}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.companySize ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                    >
                                        <option value="">Select company size</option>
                                        {companySizes.map(size => (
                                            <option key={size} value={size}>{size}</option>
                                        ))}
                                    </select>
                                    {errors.companySize && <p className="text-red-500 text-sm mt-1">{errors.companySize}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Contact Person *
                                    </label>
                                    <input
                                        type="text"
                                        name="contactName"
                                        value={formData.contactName}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.contactName ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                        placeholder="Full name"
                                    />
                                    {errors.contactName && <p className="text-red-500 text-sm mt-1">{errors.contactName}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Position/Title *
                                    </label>
                                    <input
                                        type="text"
                                        name="position"
                                        value={formData.position}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.position ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                        placeholder="Your position/title"
                                    />
                                    {errors.position && <p className="text-red-500 text-sm mt-1">{errors.position}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.email ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                        placeholder="Email address"
                                    />
                                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Phone Number *
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.phone ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                        placeholder="Phone number"
                                    />
                                    {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                                </div>
                            </div>

                            <div className="flex justify-end mt-8">
                                <Button onClick={handleNext} className="px-8 py-3 bg-purple-600 hover:bg-purple-700">
                                    Next Step
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Program Details */}
                    {step === 2 && (
                        <div className="bg-white rounded-xl shadow-lg p-8">
                            <div className="text-center mb-8">
                                <Star className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                                <h2 className="text-2xl font-bold text-gray-900">Program Details</h2>
                                <p className="text-gray-600">Choose the perfect program for your team</p>
                            </div>

                            {/* Program Type Selection */}
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-gray-700 mb-4">
                                    Program Type *
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {programTypes.map((program) => (
                                        <div
                                            key={program.id}
                                            onClick={() => setFormData(prev => ({ ...prev, programType: program.id }))}
                                            className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${formData.programType === program.id
                                                ? 'border-purple-500 bg-purple-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-semibold text-gray-900">{program.name}</h3>
                                                <span className="text-purple-600 font-bold">From ${program.price}</span>
                                            </div>
                                            <p className="text-gray-600 text-sm mb-3">{program.description}</p>
                                            <div className="text-xs text-gray-500 space-y-1">
                                                <div>Duration: {program.duration}</div>
                                                <div>Participants: {program.minParticipants}-{program.maxParticipants}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {errors.programType && <p className="text-red-500 text-sm mt-1">{errors.programType}</p>}
                            </div>

                            {/* Participant Count */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Expected Number of Participants *
                                    </label>
                                    <input
                                        type="number"
                                        name="participantCount"
                                        value={formData.participantCount}
                                        onChange={handleInputChange}
                                        min="1"
                                        max="500"
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.participantCount ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                        placeholder="Number of participants"
                                    />
                                    {errors.participantCount && <p className="text-red-500 text-sm mt-1">{errors.participantCount}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Session Frequency *
                                    </label>
                                    <select
                                        name="frequency"
                                        value={formData.frequency}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.frequency ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                    >
                                        <option value="">Select frequency</option>
                                        {frequencies.map(freq => (
                                            <option key={freq.id} value={freq.id}>{freq.name}</option>
                                        ))}
                                    </select>
                                    {errors.frequency && <p className="text-red-500 text-sm mt-1">{errors.frequency}</p>}
                                </div>
                            </div>

                            {/* Objectives */}
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Program Objectives *
                                </label>
                                <textarea
                                    name="objectives"
                                    value={formData.objectives}
                                    onChange={handleInputChange}
                                    rows={4}
                                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.objectives ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                    placeholder="What do you hope to achieve with this program? (e.g., reduce stress, improve team bonding, enhance productivity...)"
                                />
                                {errors.objectives && <p className="text-red-500 text-sm mt-1">{errors.objectives}</p>}
                            </div>

                            {/* Current Wellness Program */}
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Does your company currently have a wellness program?
                                </label>
                                <div className="flex space-x-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="hasWellnessProgram"
                                            value="yes"
                                            checked={formData.hasWellnessProgram === 'yes'}
                                            onChange={handleInputChange}
                                            className="mr-2"
                                        />
                                        Yes
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="hasWellnessProgram"
                                            value="no"
                                            checked={formData.hasWellnessProgram === 'no'}
                                            onChange={handleInputChange}
                                            className="mr-2"
                                        />
                                        No
                                    </label>
                                </div>
                            </div>

                            {/* Previous Experience */}
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Previous Yoga/Wellness Experience
                                </label>
                                <textarea
                                    name="previousExperience"
                                    value={formData.previousExperience}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="Tell us about any previous yoga or wellness programs your team has participated in..."
                                />
                            </div>

                            <div className="flex justify-between mt-8">
                                <Button variant="outline" onClick={() => setStep(1)}>
                                    Previous
                                </Button>
                                <Button onClick={handleNext} className="bg-purple-600 hover:bg-purple-700">
                                    Next Step
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Schedule & Logistics */}
                    {step === 3 && (
                        <div className="bg-white rounded-xl shadow-lg p-8">
                            <div className="text-center mb-8">
                                <Calendar className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                                <h2 className="text-2xl font-bold text-gray-900">Schedule & Logistics</h2>
                                <p className="text-gray-600">Set up your program schedule</p>
                            </div>

                            {/* Preferred Days */}
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-gray-700 mb-4">
                                    Preferred Days *
                                </label>
                                <div className="grid grid-cols-5 gap-3">
                                    {weekDays.map((day) => (
                                        <button
                                            key={day}
                                            type="button"
                                            onClick={() => handleArrayToggle('preferredDays', day)}
                                            className={`p-3 text-sm font-medium rounded-lg border-2 transition-all ${formData.preferredDays.includes(day)
                                                ? 'border-purple-500 bg-purple-50 text-purple-700'
                                                : 'border-gray-200 text-gray-700 hover:border-gray-300'
                                                }`}
                                        >
                                            {day.slice(0, 3)}
                                        </button>
                                    ))}
                                </div>
                                {errors.preferredDays && <p className="text-red-500 text-sm mt-1">{errors.preferredDays}</p>}
                            </div>

                            {/* Preferred Times */}
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-gray-700 mb-4">
                                    Preferred Times *
                                </label>
                                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                                    {timeSlots.map((time) => (
                                        <button
                                            key={time}
                                            type="button"
                                            onClick={() => handleArrayToggle('preferredTimes', time)}
                                            className={`p-3 text-sm font-medium rounded-lg border-2 transition-all ${formData.preferredTimes.includes(time)
                                                ? 'border-purple-500 bg-purple-50 text-purple-700'
                                                : 'border-gray-200 text-gray-700 hover:border-gray-300'
                                                }`}
                                        >
                                            {time}
                                        </button>
                                    ))}
                                </div>
                                {errors.preferredTimes && <p className="text-red-500 text-sm mt-1">{errors.preferredTimes}</p>}
                            </div>

                            {/* Timezone and Start Date */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Timezone *
                                    </label>
                                    <select
                                        name="timezone"
                                        value={formData.timezone}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.timezone ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                    >
                                        <option value="">Select timezone</option>
                                        <option value="UTC-8">Pacific Time (UTC-8)</option>
                                        <option value="UTC-7">Mountain Time (UTC-7)</option>
                                        <option value="UTC-6">Central Time (UTC-6)</option>
                                        <option value="UTC-5">Eastern Time (UTC-5)</option>
                                        <option value="UTC+0">GMT (UTC+0)</option>
                                        <option value="UTC+1">Central European Time (UTC+1)</option>
                                        <option value="UTC+5:30">India Standard Time (UTC+5:30)</option>
                                        <option value="UTC+8">Singapore Time (UTC+8)</option>
                                        <option value="UTC+9">Japan Time (UTC+9)</option>
                                    </select>
                                    {errors.timezone && <p className="text-red-500 text-sm mt-1">{errors.timezone}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Preferred Start Date *
                                    </label>
                                    <input
                                        type="date"
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleInputChange}
                                        min={new Date().toISOString().split('T')[0]}
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.startDate ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                    />
                                    {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
                                </div>
                            </div>

                            {/* Location */}
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Session Location *
                                </label>
                                <select
                                    name="location"
                                    value={formData.location}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.location ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                >
                                    <option value="">Select location preference</option>
                                    <option value="on-site">On-site at our office</option>
                                    <option value="virtual">Virtual/Online sessions</option>
                                    <option value="hybrid">Hybrid (mix of on-site and virtual)</option>
                                    <option value="external">External venue (we'll arrange)</option>
                                </select>
                                {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
                            </div>

                            {/* Budget Range */}
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Budget Range (Monthly)
                                </label>
                                <select
                                    name="budget"
                                    value={formData.budget}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="">Select budget range</option>
                                    <option value="under-500">Under $500</option>
                                    <option value="500-1000">$500 - $1,000</option>
                                    <option value="1000-2500">$1,000 - $2,500</option>
                                    <option value="2500-5000">$2,500 - $5,000</option>
                                    <option value="5000-10000">$5,000 - $10,000</option>
                                    <option value="over-10000">Over $10,000</option>
                                    <option value="flexible">Flexible/To be discussed</option>
                                </select>
                            </div>

                            {/* Special Requests */}
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Special Requirements or Requests
                                </label>
                                <textarea
                                    name="specialRequests"
                                    value={formData.specialRequests}
                                    onChange={handleInputChange}
                                    rows={4}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="Any specific requirements, equipment needs, accessibility considerations, or special requests..."
                                />
                            </div>

                            {/* Price Estimate */}
                            {formData.programType && formData.participantCount && formData.frequency && (
                                <div className="bg-purple-50 rounded-lg p-6 mb-8">
                                    <h3 className="font-semibold text-gray-900 mb-4">Estimated Investment</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span>Program:</span>
                                            <span>{programTypes.find(p => p.id === formData.programType)?.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Participants:</span>
                                            <span>{formData.participantCount}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Frequency:</span>
                                            <span>{frequencies.find(f => f.id === formData.frequency)?.name}</span>
                                        </div>
                                        <div className="border-t pt-2 mt-2">
                                            <div className="flex justify-between font-semibold text-lg">
                                                <span>Estimated Monthly Cost:</span>
                                                <span className="text-purple-600">${calculateEstimatedPrice()}</span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                *Final pricing will be customized based on your specific requirements
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between mt-8">
                                <Button variant="outline" onClick={() => setStep(2)}>
                                    Previous
                                </Button>
                                <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                                    Submit Request
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Success */}
                    {step === 4 && !loading && (
                        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>

                            <h2 className="text-3xl font-bold text-gray-900 mb-4">Request Submitted Successfully!</h2>
                            <p className="text-gray-600 mb-8">
                                Thank you for your interest in our Corporate Wellness Program! Our team will review your requirements and get back to you within 1 business day with a customized proposal.
                            </p>

                            <div className="bg-purple-50 rounded-lg p-6 mb-8">
                                <h3 className="font-semibold text-gray-900 mb-4">What Happens Next?</h3>
                                <div className="space-y-3 text-sm text-gray-700 text-left">
                                    <div className="flex items-center">
                                        <Users className="w-4 h-4 text-purple-600 mr-2" />
                                        <span>Our corporate wellness specialist will review your requirements</span>
                                    </div>
                                    <div className="flex items-center">
                                        <Mail className="w-4 h-4 text-purple-600 mr-2" />
                                        <span>You'll receive a detailed proposal within 1 business day</span>
                                    </div>
                                    <div className="flex items-center">
                                        <Phone className="w-4 h-4 text-purple-600 mr-2" />
                                        <span>We'll schedule a consultation call to discuss your program</span>
                                    </div>
                                    <div className="flex items-center">
                                        <Calendar className="w-4 h-4 text-purple-600 mr-2" />
                                        <span>Once approved, we'll coordinate the program schedule</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Button
                                    onClick={() => window.location.href = '/'}
                                    className="bg-purple-600 hover:bg-purple-700 mr-4"
                                >
                                    Return to Home
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => window.location.href = '/contact'}
                                >
                                    Contact Us Directly
                                </Button>
                            </div>
                        </div>
                    )}

                    {loading && (
                        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                            <LoadingSpinner size="lg" />
                            <p className="text-gray-600 mt-4">Submitting your corporate wellness request...</p>
                        </div>
                    )}
                </form>
            </div>
        </div>
    )
}