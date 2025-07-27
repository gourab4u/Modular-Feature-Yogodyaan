import { Calendar, ChevronDown, ChevronUp, Clock, Mail, Phone, Search, Star, User, Users, Video } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../../../shared/components/ui/Button'
import { LoadingSpinner } from '../../../shared/components/ui/LoadingSpinner'
import { supabase } from '../../../shared/lib/supabase'
import { useAuth } from '../../auth/contexts/AuthContext'

interface ClassPackage {
    id: string
    name: string
    description: string | null
    class_count: number
    price: number
    validity_days: number
    class_type_restrictions: string[] | null
    is_active: boolean
    type: string | null
    duration: string | null
    course_type: string | null
}

export function BookOneOnOne() {
    const { user } = useAuth()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [classPackages, setClassPackages] = useState<ClassPackage[]>([])
    const [loadingPackages, setLoadingPackages] = useState(true)
    const [packageSearch, setPackageSearch] = useState('')
    const [selectedPackage, setSelectedPackage] = useState<ClassPackage | null>(null)
    const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
    const [courseTypeFilter, setCourseTypeFilter] = useState<'all' | 'regular' | 'crash'>('all')

    const [formData, setFormData] = useState({
        // Personal Info
        firstName: '',
        lastName: '',
        email: user?.email || '',
        phone: '',
        timezone: '',

        // Session Details
        packageType: '',
        experienceLevel: '',
        goals: '',
        healthConditions: '',
        preferredDays: [] as string[],
        preferredTimes: [] as string[],

        // Schedule
        startDate: '',

        // Special Requirements
        specialRequests: '',
        emergencyContact: '',
        emergencyPhone: ''
    })

    // Fetch class packages from database
    useEffect(() => {
        fetchClassPackages()
    }, [])

    const fetchClassPackages = async () => {
        try {
            setLoadingPackages(true)
            const { data, error } = await supabase
                .from('class_packages')
                .select('*')
                .eq('is_active', true)
                .eq('type', 'individual')
                .order('price')

            if (error) {
                throw error
            }

            setClassPackages(data || [])
        } catch (error) {
            console.error('Error fetching class packages:', error)
            setErrors({ classPackages: 'Failed to load class packages. Please refresh the page.' })
        } finally {
            setLoadingPackages(false)
        }
    }

    // Filter class packages based on search and course type filter
    const filteredPackages = classPackages.filter(pkg => {
        const matchesSearch = pkg.name.toLowerCase().includes(packageSearch.toLowerCase()) ||
            (pkg.description && pkg.description.toLowerCase().includes(packageSearch.toLowerCase()))

        const matchesCourseType = courseTypeFilter === 'all' || pkg.course_type === courseTypeFilter

        return matchesSearch && matchesCourseType
    })

    const calculatePricePerClass = (pkg: ClassPackage) => {
        if (pkg.course_type === 'crash') {
            return null // Don't show per-class price for crash courses
        }
        return Math.round(pkg.price / pkg.class_count)
    }

    const toggleCardExpansion = (packageId: string) => {
        const newExpanded = new Set(expandedCards)
        if (newExpanded.has(packageId)) {
            newExpanded.delete(packageId)
        } else {
            newExpanded.add(packageId)
        }
        setExpandedCards(newExpanded)
    }

    const truncateDescription = (description: string, maxLength: number = 100) => {
        if (description.length <= maxLength) return description
        return description.substring(0, maxLength) + '...'
    }

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

    const handlePackageSelect = (classPackage: ClassPackage) => {
        setSelectedPackage(classPackage)
        setFormData(prev => ({ ...prev, packageType: classPackage.id }))
        if (errors.packageType) {
            setErrors(prev => ({ ...prev, packageType: '' }))
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
                if (!formData.packageType) newErrors.packageType = 'Please select a package'
                if (!formData.experienceLevel) newErrors.experienceLevel = 'Please select your experience level'
                if (!formData.goals.trim()) newErrors.goals = 'Please share your goals'
                break
            case 3:
                console.log('Selected package:', selectedPackage)
                console.log('Package course_type:', selectedPackage?.course_type)
                if (formData.preferredDays.length === 0) newErrors.preferredDays = 'Please select at least one preferred day'
                if (formData.preferredTimes.length === 0) newErrors.preferredTimes = 'Please select at least one preferred time'
                if (!formData.startDate) newErrors.startDate = 'Please select a start date'
                console.log('Step 3 validation - Form data:', formData)
                console.log('Step 3 validation - Errors found:', newErrors)
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

    // Save form data to localStorage before redirecting to login
    const saveFormDataAndRedirect = () => {
        const formDataToSave = {
            ...formData,
            selectedPackage,
            selectedStep: step,
            courseTypeFilter,
            expandedCards: Array.from(expandedCards)
        }
        localStorage.setItem('pendingBookingData', JSON.stringify(formDataToSave))
        window.location.href = '/login?redirect=/book/individual'
    }

    // Restore form data after login
    useEffect(() => {
        if (user) {
            const savedData = localStorage.getItem('pendingBookingData')
            if (savedData) {
                try {
                    const parsedData = JSON.parse(savedData)
                    setFormData({
                        firstName: parsedData.firstName || '',
                        lastName: parsedData.lastName || '',
                        email: parsedData.email || user.email || '',
                        phone: parsedData.phone || '',
                        timezone: parsedData.timezone || '',
                        packageType: parsedData.packageType || '',
                        experienceLevel: parsedData.experienceLevel || '',
                        goals: parsedData.goals || '',
                        healthConditions: parsedData.healthConditions || '',
                        preferredDays: parsedData.preferredDays || [],
                        preferredTimes: parsedData.preferredTimes || [],
                        startDate: parsedData.startDate || '',
                        specialRequests: parsedData.specialRequests || '',
                        emergencyContact: parsedData.emergencyContact || '',
                        emergencyPhone: parsedData.emergencyPhone || ''
                    })
                    setSelectedPackage(parsedData.selectedPackage || null)
                    setStep(parsedData.selectedStep || 1)
                    setCourseTypeFilter(parsedData.courseTypeFilter || 'all')
                    setExpandedCards(new Set(parsedData.expandedCards || []))

                    // Clear saved data
                    localStorage.removeItem('pendingBookingData')
                } catch (error) {
                    console.error('Error restoring form data:', error)
                }
            }
        }
    }, [user])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Check if user is authenticated
        if (!user) {
            // Save form data and redirect to login
            saveFormDataAndRedirect()
            return
        }

        console.log('handleSubmit called!')
        console.log('Form submission prevented, validating step 3...')

        if (!validateStep(3)) {
            console.log('Validation failed!')
            return
        }

        console.log('Validation passed, proceeding with submission...')

        try {
            setLoading(true)
            console.log('Loading set to true')

            console.log('Selected package:', selectedPackage)
            console.log('Form data:', formData)

            const bookingData = {
                // Required fields from your schema
                user_id: user.id, // Now we know user exists
                class_name: `1-on-1 ${selectedPackage?.name}`,
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
                price: selectedPackage?.price || 0,
                session_duration: 60, // Default duration
                participants_count: 1,
                equipment_needed: false,
                class_package_id: selectedPackage?.id || null,

                // Store health conditions in booking_notes
                booking_notes: formData.healthConditions ? `Health Conditions: ${formData.healthConditions}` : null
            }

            console.log('Submitting booking data:', bookingData)
            console.log('Auth user:', user)
            console.log('User ID being sent:', user.id)
            console.log('Booking data user_id:', bookingData.user_id)

            const { data, error } = await supabase
                .from('bookings')
                .insert([bookingData])
                .select()

            if (error) {
                console.error('Supabase error:', error)
                throw error
            }

            console.log('Successfully inserted:', data)
            setStep(4) // Success step
        } catch (error: any) {
            console.error('Full error:', error)
            setErrors({ general: error.message || 'An error occurred while booking your session.' })
        } finally {
            setLoading(false)
            console.log('Loading set to false')
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
            {/* Header */}
            <div className="bg-white shadow-sm">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-gray-900">Book Your Personal Yoga Session</h1>
                        <p className="text-gray-600 mt-2">Personalized guidance tailored to your needs</p>

                        {/* Login prompt for unauthenticated users */}
                        {!user && (
                            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-blue-800 text-sm">
                                    <span className="font-medium">Note:</span> You'll need to log in to complete your booking.
                                    <button
                                        onClick={() => window.location.href = '/login'}
                                        className="ml-2 text-blue-600 underline hover:text-blue-800"
                                    >
                                        Log in now
                                    </button>
                                </p>
                            </div>
                        )}
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
                            <span className="text-xs text-gray-500">Package</span>
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

                {errors.classPackages && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-600 text-sm">{errors.classPackages}</p>
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

                    {/* Step 2: Package Selection */}
                    {step === 2 && (
                        <div className="bg-white rounded-xl shadow-lg p-8">
                            <div className="text-center mb-8">
                                <Star className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                                <h2 className="text-2xl font-bold text-gray-900">Choose Your Package</h2>
                                <p className="text-gray-600">Select the perfect package for your yoga journey</p>
                            </div>

                            {/* Package Selection */}
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-gray-700 mb-4">
                                    Available Packages *
                                </label>

                                {loadingPackages ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                        <span className="ml-2 text-gray-600">Loading packages...</span>
                                    </div>
                                ) : (
                                    <>
                                        {/* Search Bar and Filter Toggle */}
                                        <div className="flex flex-col sm:flex-row gap-4 mb-4">
                                            {/* Search Bar */}
                                            <div className="relative flex-1">
                                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Search packages..."
                                                    value={packageSearch}
                                                    onChange={(e) => setPackageSearch(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>

                                            {/* Course Type Filter Toggle */}
                                            <div className="flex bg-gray-100 rounded-lg p-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setCourseTypeFilter('all')}
                                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${courseTypeFilter === 'all'
                                                            ? 'bg-white text-blue-600 shadow-sm'
                                                            : 'text-gray-600 hover:text-gray-900'
                                                        }`}
                                                >
                                                    All
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setCourseTypeFilter('regular')}
                                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${courseTypeFilter === 'regular'
                                                            ? 'bg-white text-blue-600 shadow-sm'
                                                            : 'text-gray-600 hover:text-gray-900'
                                                        }`}
                                                >
                                                    Regular
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setCourseTypeFilter('crash')}
                                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${courseTypeFilter === 'crash'
                                                            ? 'bg-white text-blue-600 shadow-sm'
                                                            : 'text-gray-600 hover:text-gray-900'
                                                        }`}
                                                >
                                                    Crash
                                                </button>
                                            </div>
                                        </div>

                                        {/* Package Cards */}
                                        <div className="grid gap-4 max-h-96 overflow-y-auto">
                                            {filteredPackages.length === 0 ? (
                                                <div className="text-center py-8 text-gray-500">
                                                    {packageSearch ? 'No packages found matching your search.' : 'No packages available.'}
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 gap-4">
                                                    {filteredPackages.map((pkg) => {
                                                        const isExpanded = expandedCards.has(pkg.id)
                                                        const isSelected = selectedPackage?.id === pkg.id

                                                        return (
                                                            <div
                                                                key={pkg.id}
                                                                className={`border-2 rounded-lg transition-all duration-200 hover:shadow-md ${isSelected
                                                                        ? 'border-blue-500 bg-blue-50 shadow-md'
                                                                        : 'border-gray-200 hover:border-blue-300'
                                                                    }`}
                                                            >
                                                                <div
                                                                    onClick={() => handlePackageSelect(pkg)}
                                                                    className="p-6 cursor-pointer"
                                                                >
                                                                    <div className="flex justify-between items-start mb-3">
                                                                        <h3 className="font-semibold text-gray-900 text-lg">{pkg.name}</h3>
                                                                        <div className="text-right">
                                                                            <span className="text-blue-600 font-bold text-xl">₹{pkg.price}</span>
                                                                            {pkg.course_type === 'regular' && calculatePricePerClass(pkg) && (
                                                                                <div className="text-sm text-gray-500">
                                                                                    From ₹{calculatePricePerClass(pkg)}/class
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {pkg.description && (
                                                                        <div className="mb-3">
                                                                            <p className="text-gray-600 text-sm">
                                                                                {isExpanded ? pkg.description : truncateDescription(pkg.description)}
                                                                            </p>
                                                                            {pkg.description.length > 100 && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation()
                                                                                        toggleCardExpansion(pkg.id)
                                                                                    }}
                                                                                    className="text-blue-600 text-sm font-medium mt-1 flex items-center hover:text-blue-700"
                                                                                >
                                                                                    {isExpanded ? (
                                                                                        <>Show Less <ChevronUp className="w-3 h-3 ml-1" /></>
                                                                                    ) : (
                                                                                        <>Show More <ChevronDown className="w-3 h-3 ml-1" /></>
                                                                                    )}
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    )}

                                                                    <div className="flex flex-wrap gap-3 items-center text-sm text-gray-600">
                                                                        <span className="flex items-center">
                                                                            <Users className="w-4 h-4 mr-1" />
                                                                            {pkg.class_count} {pkg.class_count === 1 ? 'Class' : 'Classes'}
                                                                        </span>

                                                                        {pkg.course_type === 'crash' && pkg.duration ? (
                                                                            <span className="flex items-center">
                                                                                <Clock className="w-4 h-4 mr-1" />
                                                                                {pkg.duration}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="flex items-center">
                                                                                <Clock className="w-4 h-4 mr-1" />
                                                                                {pkg.validity_days} Days Validity
                                                                            </span>
                                                                        )}

                                                                        <span className={`text-xs px-2 py-1 rounded ${pkg.course_type === 'crash'
                                                                                ? 'bg-orange-100 text-orange-800'
                                                                                : 'bg-green-100 text-green-800'
                                                                            }`}>
                                                                            {pkg.course_type === 'crash' ? 'Crash Course' : 'Regular Course'}
                                                                        </span>

                                                                        {pkg.class_type_restrictions && pkg.class_type_restrictions.length > 0 && (
                                                                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                                                Specific Classes Only
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    {isSelected && (
                                                                        <div className="mt-3 flex justify-end">
                                                                            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                                                                <div className="w-2 h-2 bg-white rounded-full"></div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}

                                {errors.packageType && <p className="text-red-500 text-sm mt-1">{errors.packageType}</p>}
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

                    {/* Step 3: Schedule */}
                    {step === 3 && (
                        <div className="bg-white rounded-xl shadow-lg p-8">
                            <div className="text-center mb-8">
                                <Calendar className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                                <h2 className="text-2xl font-bold text-gray-900">Schedule Your Sessions</h2>
                                <p className="text-gray-600">Choose your preferred schedule</p>
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

                            {/* Package Summary */}
                            {selectedPackage && (
                                <div className="bg-gray-50 rounded-lg p-6 mb-8">
                                    <h3 className="font-semibold text-gray-900 mb-4">Package Summary</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span>Package:</span>
                                            <span>{selectedPackage.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Course Type:</span>
                                            <span className="capitalize">{selectedPackage.course_type}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Classes:</span>
                                            <span>{selectedPackage.class_count} {selectedPackage.class_count === 1 ? 'Class' : 'Classes'}</span>
                                        </div>
                                        {selectedPackage.course_type === 'crash' && selectedPackage.duration ? (
                                            <div className="flex justify-between">
                                                <span>Duration:</span>
                                                <span>{selectedPackage.duration}</span>
                                            </div>
                                        ) : (
                                            <div className="flex justify-between">
                                                <span>Validity:</span>
                                                <span>{selectedPackage.validity_days} Days</span>
                                            </div>
                                        )}
                                        <div className="border-t pt-2 mt-2">
                                            <div className="flex justify-between font-semibold text-lg">
                                                <span>Total:</span>
                                                <span className="text-blue-600">₹{selectedPackage.price}</span>
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