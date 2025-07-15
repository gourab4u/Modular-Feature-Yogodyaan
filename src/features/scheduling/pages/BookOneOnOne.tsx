import { Calendar, Mail, Phone, Star, User, Video } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../../shared/components/ui/Button'
import { LoadingSpinner } from '../../../shared/components/ui/LoadingSpinner'
import { supabase } from '../../../shared/lib/supabase'
import { useAuth } from '../../auth/contexts/AuthContext'

export function BookOneOnOne() {
    const { user } = useAuth()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})

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
        preferredDays: [] as string[],
        preferredTimes: [] as string[],

        // Package Selection
        packageType: '',
        startDate: '',

        // Special Requirements
        specialRequests: '',
        emergencyContact: '',
        emergencyPhone: ''
    })

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
    ]

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
    ]

    const timeSlots = [
        '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM',
        '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM',
        '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM'
    ]

    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

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
                if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
                if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
                if (!formData.email.trim()) newErrors.email = 'Email is required'
                if (!formData.phone.trim()) newErrors.phone = 'Phone number is required'
                if (!formData.timezone.trim()) newErrors.timezone = 'Timezone is required'
                break
            case 2:
                if (!formData.sessionType) newErrors.sessionType = 'Please select a session type'
                if (!formData.experienceLevel) newErrors.experienceLevel = 'Please select your experience level'
                if (!formData.goals.trim()) newErrors.goals = 'Please share your goals'
                break
            case 3:
                if (formData.preferredDays.length === 0) newErrors.preferredDays = 'Please select at least one preferred day'
                if (formData.preferredTimes.length === 0) newErrors.preferredTimes = 'Please select at least one preferred time'
                if (!formData.packageType) newErrors.packageType = 'Please select a package'
                if (!formData.startDate) newErrors.startDate = 'Please select a start date'
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

    // Update the handleSubmit function with more debugging:

    const handleSubmit = async (e: React.FormEvent) => {
        console.log('handleSubmit called!') // Debug log
        e.preventDefault()
        console.log('Form submission prevented, validating step 3...') // Debug log

        if (!validateStep(3)) {
            console.log('Validation failed!') // Debug log
            return
        }

        console.log('Validation passed, proceeding with submission...') // Debug log

        try {
            setLoading(true)
            console.log('Loading set to true') // Debug log

            const selectedSession = sessionTypes.find(s => s.id === formData.sessionType)
            const selectedPackage = packages.find(p => p.id === formData.packageType)

            console.log('Selected session:', selectedSession) // Debug log
            console.log('Selected package:', selectedPackage) // Debug log
            console.log('Form data:', formData) // Debug log

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
            }

            console.log('Submitting booking data:', bookingData) // Debug log

            const { data, error } = await supabase
                .from('bookings')
                .insert([bookingData])
                .select()

            if (error) {
                console.error('Supabase error:', error) // Debug log
                throw error
            }

            console.log('Successfully inserted:', data) // Debug log
            setStep(4) // Success step
        } catch (error: any) {
            console.error('Full error:', error) // Debug log
            setErrors({ general: error.message || 'An error occurred while booking your session.' })
        } finally {
            setLoading(false)
            console.log('Loading set to false') // Debug log
        }
    }

    const calculatePrice = () => {
        const selectedSession = sessionTypes.find(s => s.id === formData.sessionType)
        const selectedPackage = packages.find(p => p.id === formData.packageType)

        if (!selectedSession || !selectedPackage) return 0

        if (selectedPackage.id === 'monthly') return 299

        const basePrice = selectedSession.price * (selectedPackage.sessions as number)
        const discount = basePrice * (selectedPackage.discount / 100)
        return basePrice - discount
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
            {/* Header */}
            <div className="bg-white shadow-sm">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-gray-900">Book Your Personal Yoga Session</h1>
                        <p className="text-gray-600 mt-2">Personalized guidance tailored to your needs</p>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-8">
                        <div className="flex items-center justify-center space-x-4">
                            {[1, 2, 3, 4].map((stepNumber) => (
                                <div key={stepNumber} className="flex items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= stepNumber
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-600'
                                        }`}>
                                        {step > stepNumber ? '✓' : stepNumber}
                                    </div>
                                    {stepNumber < 4 && (
                                        <div className={`w-16 h-1 mx-2 ${step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
                                            }`} />
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-center space-x-20 mt-2">
                            <span className="text-xs text-gray-500">Personal Info</span>
                            <span className="text-xs text-gray-500">Session Type</span>
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
                    {/* Step 1: Personal Information */}
                    {step === 1 && (
                        <div className="bg-white rounded-xl shadow-lg p-8">
                            <div className="text-center mb-8">
                                <User className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                                <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
                                <p className="text-gray-600">Tell us about yourself</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        First Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.firstName ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                        placeholder="Enter your first name"
                                    />
                                    {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Last Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.lastName ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                        placeholder="Enter your last name"
                                    />
                                    {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
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
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                        placeholder="Enter your email"
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
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.phone ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                        placeholder="Enter your phone number"
                                    />
                                    {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Timezone *
                                    </label>
                                    <select
                                        name="timezone"
                                        value={formData.timezone}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.timezone ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                    >
                                        <option value="">Select your timezone</option>
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
                            </div>

                            <div className="flex justify-end mt-8">
                                <Button onClick={handleNext} className="px-8 py-3">
                                    Next Step
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Session Details */}
                    {step === 2 && (
                        <div className="bg-white rounded-xl shadow-lg p-8">
                            <div className="text-center mb-8">
                                <Star className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                                <h2 className="text-2xl font-bold text-gray-900">Session Details</h2>
                                <p className="text-gray-600">Choose your preferred session type</p>
                            </div>

                            {/* Session Type Selection */}
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-gray-700 mb-4">
                                    Session Type *
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {sessionTypes.map((session) => (
                                        <div
                                            key={session.id}
                                            onClick={() => setFormData(prev => ({ ...prev, sessionType: session.id }))}
                                            className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${formData.sessionType === session.id
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-semibold text-gray-900">{session.name}</h3>
                                                <span className="text-blue-600 font-bold">${session.price}</span>
                                            </div>
                                            <p className="text-gray-600 text-sm mb-2">{session.description}</p>
                                            <p className="text-gray-500 text-xs">{session.duration}</p>
                                        </div>
                                    ))}
                                </div>
                                {errors.sessionType && <p className="text-red-500 text-sm mt-1">{errors.sessionType}</p>}
                            </div>

                            {/* Experience Level */}
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Experience Level *
                                </label>
                                <select
                                    name="experienceLevel"
                                    value={formData.experienceLevel}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.experienceLevel ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                >
                                    <option value="">Select your experience level</option>
                                    <option value="beginner">Beginner (0-6 months)</option>
                                    <option value="intermediate">Intermediate (6 months - 2 years)</option>
                                    <option value="advanced">Advanced (2+ years)</option>
                                    <option value="expert">Expert/Teacher</option>
                                </select>
                                {errors.experienceLevel && <p className="text-red-500 text-sm mt-1">{errors.experienceLevel}</p>}
                            </div>

                            {/* Goals */}
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    What are your goals? *
                                </label>
                                <textarea
                                    name="goals"
                                    value={formData.goals}
                                    onChange={handleInputChange}
                                    rows={4}
                                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.goals ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                    placeholder="Tell us about your yoga goals, what you hope to achieve..."
                                />
                                {errors.goals && <p className="text-red-500 text-sm mt-1">{errors.goals}</p>}
                            </div>

                            {/* Health Conditions */}
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Health Conditions or Injuries
                                </label>
                                <textarea
                                    name="healthConditions"
                                    value={formData.healthConditions}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Please mention any health conditions, injuries, or physical limitations we should be aware of..."
                                />
                            </div>

                            <div className="flex justify-between mt-8">
                                <Button variant="outline" onClick={() => setStep(1)}>
                                    Previous
                                </Button>
                                <Button onClick={handleNext}>
                                    Next Step
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Schedule & Package */}
                    {step === 3 && (
                        <div className="bg-white rounded-xl shadow-lg p-8">
                            <div className="text-center mb-8">
                                <Calendar className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                                <h2 className="text-2xl font-bold text-gray-900">Schedule & Package</h2>
                                <p className="text-gray-600">Choose your preferred schedule and package</p>
                            </div>

                            {/* Preferred Days */}
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-gray-700 mb-4">
                                    Preferred Days *
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {weekDays.map((day) => (
                                        <button
                                            key={day}
                                            type="button"
                                            onClick={() => handleArrayToggle('preferredDays', day)}
                                            className={`p-3 text-sm font-medium rounded-lg border-2 transition-all ${formData.preferredDays.includes(day)
                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
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
                                <div className="grid grid-cols-3 md:grid-cols-5 gap-3 max-h-40 overflow-y-auto">
                                    {timeSlots.map((time) => (
                                        <button
                                            key={time}
                                            type="button"
                                            onClick={() => handleArrayToggle('preferredTimes', time)}
                                            className={`p-2 text-sm font-medium rounded-lg border-2 transition-all ${formData.preferredTimes.includes(time)
                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                : 'border-gray-200 text-gray-700 hover:border-gray-300'
                                                }`}
                                        >
                                            {time}
                                        </button>
                                    ))}
                                </div>
                                {errors.preferredTimes && <p className="text-red-500 text-sm mt-1">{errors.preferredTimes}</p>}
                            </div>

                            {/* Package Selection */}
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-gray-700 mb-4">
                                    Choose Package *
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {packages.map((pkg) => (
                                        <div
                                            key={pkg.id}
                                            onClick={() => setFormData(prev => ({ ...prev, packageType: pkg.id }))}
                                            className={`relative p-6 border-2 rounded-lg cursor-pointer transition-all ${formData.packageType === pkg.id
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            {pkg.popular && (
                                                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                                                    <span className="bg-blue-600 text-white px-3 py-1 text-xs font-medium rounded-full">
                                                        Most Popular
                                                    </span>
                                                </div>
                                            )}
                                            <h3 className="font-semibold text-gray-900 mb-2">{pkg.name}</h3>
                                            <p className="text-gray-600 text-sm mb-2">{pkg.description}</p>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-500 text-sm">
                                                    {pkg.sessions} session{pkg.sessions !== 1 && pkg.sessions !== 'unlimited' ? 's' : ''}
                                                </span>
                                                {pkg.discount > 0 && (
                                                    <span className="text-green-600 font-medium text-sm">
                                                        {pkg.discount}% off
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {errors.packageType && <p className="text-red-500 text-sm mt-1">{errors.packageType}</p>}
                            </div>

                            {/* Start Date */}
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Preferred Start Date *
                                </label>
                                <input
                                    type="date"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleInputChange}
                                    min={new Date().toISOString().split('T')[0]}
                                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.startDate ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                />
                                {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
                            </div>

                            {/* Special Requests */}
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Special Requests
                                </label>
                                <textarea
                                    name="specialRequests"
                                    value={formData.specialRequests}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Any special requests or preferences..."
                                />
                            </div>

                            {/* Price Summary */}
                            {formData.sessionType && formData.packageType && (
                                <div className="bg-gray-50 rounded-lg p-6 mb-8">
                                    <h3 className="font-semibold text-gray-900 mb-4">Price Summary</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span>Session Type:</span>
                                            <span>{sessionTypes.find(s => s.id === formData.sessionType)?.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Package:</span>
                                            <span>{packages.find(p => p.id === formData.packageType)?.name}</span>
                                        </div>
                                        <div className="border-t pt-2 mt-2">
                                            <div className="flex justify-between font-semibold text-lg">
                                                <span>Total:</span>
                                                <span className="text-blue-600">${calculatePrice()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between mt-8">
                                <Button variant="outline" onClick={() => setStep(2)}>
                                    Previous
                                </Button>
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                                    Submit Booking
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Confirmation */}
                    {step === 4 && !loading && (
                        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>

                            <h2 className="text-3xl font-bold text-gray-900 mb-4">Booking Submitted!</h2>
                            <p className="text-gray-600 mb-8">
                                Thank you for booking with us! We'll review your request and send you a confirmation email within 24 hours with your session details and payment instructions.
                            </p>

                            <div className="bg-blue-50 rounded-lg p-6 mb-8">
                                <h3 className="font-semibold text-gray-900 mb-4">What's Next?</h3>
                                <div className="space-y-3 text-sm text-gray-700 text-left">
                                    <div className="flex items-center">
                                        <Mail className="w-4 h-4 text-blue-600 mr-2" />
                                        <span>You'll receive a confirmation email within 24 hours</span>
                                    </div>
                                    <div className="flex items-center">
                                        <Video className="w-4 h-4 text-blue-600 mr-2" />
                                        <span>We'll send you the video call link before your session</span>
                                    </div>
                                    <div className="flex items-center">
                                        <Phone className="w-4 h-4 text-blue-600 mr-2" />
                                        <span>Our team may call to discuss your specific needs</span>
                                    </div>
                                </div>
                            </div>

                            <Button onClick={() => window.location.href = '/'}>
                                Return to Home
                            </Button>
                        </div>
                    )}

                    {loading && (
                        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                            <LoadingSpinner size="lg" />
                            <p className="text-gray-600 mt-4">Submitting your booking...</p>
                        </div>
                    )}
                </form>
            </div>
        </div>
    )
}