import { ChevronLeft, ChevronRight, Users } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../../shared/components/ui/Button'
import { supabase } from '../../../shared/lib/supabase'
import { useAuth } from '../../auth/contexts/AuthContext'

export function BookClass() {
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<any>({})

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    country: '',
    classType: '',
    groupSize: '',
    message: ''
  })

  const timeSlots = [
    '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM',
    '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM',
    '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM'
  ]

  const countries = [
    'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany',
    'France', 'India', 'Singapore', 'Japan', 'Brazil', 'Mexico',
    'South Africa', 'Nigeria', 'Other'
  ]

  const classTypes = [
    'Hatha Yoga', 'Vinyasa Flow', 'Power Yoga', 'Restorative Yoga',
    'Meditation', 'Breathwork', 'Corporate Wellness', 'Beginner Friendly'
  ]

  // Calendar functionality
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const isDateAvailable = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date >= today
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev: any) => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: any = {}

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid'
    if (!formData.country) newErrors.country = 'Country is required'
    if (!formData.classType) newErrors.classType = 'Class type is required'
    if (!formData.groupSize) newErrors.groupSize = 'Group size is required'
    if (!selectedDate) newErrors.date = 'Please select a date'
    if (!selectedTime) newErrors.time = 'Please select a time'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

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
        status: 'confirmed'
      }

      const { error } = await supabase
        .from('bookings')
        .insert([bookingData])

      if (error) {
        throw error
      }

      // Reset form and show success
      setFormData({
        fullName: '',
        email: '',
        country: '',
        classType: '',
        groupSize: '',
        message: ''
      })
      setSelectedDate('')
      setSelectedTime('')
      setShowBookingForm(false)

      alert('Booking confirmed! You will receive a confirmation email shortly.')
    } catch (error: any) {
      setErrors({ general: error.message || 'An error occurred while booking your class.' })
    } finally {
      setLoading(false)
    }
  }

  const canProceedToBooking = selectedDate && selectedTime

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-green-50 py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">Book Your Private Group Class</h1>
          <p className="text-xl text-gray-600 leading-relaxed mb-8">
            Create a memorable yoga experience for your group! Whether it's for your team, family, friends, or special occasion,
            we'll design a personalized session that brings everyone together in wellness and mindfulness.
          </p>

          {/* Group Classes Motivation */}
          <div className="bg-white rounded-xl shadow-lg p-6 mx-auto max-w-2xl border-l-4 border-blue-500">
            <div className="flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-blue-500 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">Strengthen Bonds Through Yoga</h3>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Whether it's team building, celebrating a special occasion, or simply sharing mindfulness with loved ones,
              our private group sessions create lasting memories while nurturing wellness together.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!showBookingForm ? (
          <div className="space-y-12">
            {/* Calendar */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Select Date</h2>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2 mb-4">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {getDaysInMonth(currentMonth).map((date, index) => (
                    <div key={index} className="aspect-square">
                      {date && (
                        <button
                          onClick={() => isDateAvailable(date) && setSelectedDate(formatDate(date))}
                          disabled={!isDateAvailable(date)}
                          className={`w-full h-full rounded-lg text-sm font-medium transition-all duration-200 ${selectedDate === formatDate(date)
                              ? 'bg-blue-500 text-white shadow-lg'
                              : isDateAvailable(date)
                                ? 'hover:bg-blue-50 text-gray-900'
                                : 'text-gray-300 cursor-not-allowed'
                            }`}
                        >
                          {date.getDate()}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Time Selection */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Select Time</h2>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 ${selectedTime === time
                          ? 'bg-blue-500 text-white shadow-lg'
                          : 'bg-gray-50 text-gray-900 hover:bg-blue-50 border border-gray-200'
                        }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  * All times are in your local timezone. We'll coordinate the actual session time based on your location.
                </p>
              </div>
            </div>

            {/* Proceed Button */}
            <div className="text-center">
              <Button
                onClick={() => setShowBookingForm(true)}
                disabled={!canProceedToBooking}
                className={`px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-300 ${canProceedToBooking
                    ? 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
              >
                Proceed to Booking Details
              </Button>
            </div>
          </div>
        ) : (
          /* Booking Form */
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center mb-8">
                <button
                  onClick={() => setShowBookingForm(false)}
                  className="flex items-center text-blue-600 hover:text-blue-700 transition-colors mr-4"
                >
                  <ChevronLeft className="w-5 h-5 mr-1" />
                  Back
                </button>
                <h2 className="text-3xl font-bold text-gray-900">Confirm Booking</h2>
              </div>

              {/* Booking Summary */}
              <div className="bg-blue-50 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service:</span>
                    <span className="font-medium">Private Group Class</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{new Date(selectedDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time:</span>
                    <span className="font-medium">{selectedTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">60-90 minutes</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {errors.general && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-600 text-sm">{errors.general}</p>
                  </div>
                )}

                <div>
                  <label htmlFor="groupSize" className="block text-sm font-medium text-gray-700 mb-1">
                    Group Size *
                  </label>
                  <select
                    id="groupSize"
                    name="groupSize"
                    value={formData.groupSize}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.groupSize ? 'border-red-500' : 'border-gray-300'
                      }`}
                  >
                    <option value="">Select group size</option>
                    <option value="2-5">2-5 people</option>
                    <option value="6-10">6-10 people</option>
                    <option value="11-15">11-15 people</option>
                    <option value="16-20">16-20 people</option>
                    <option value="20+">20+ people</option>
                  </select>
                  {errors.groupSize && <p className="text-red-500 text-sm mt-1">{errors.groupSize}</p>}
                </div>

                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.fullName ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="Enter your full name"
                  />
                  {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="Enter your email address"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                    Country *
                  </label>
                  <select
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.country ? 'border-red-500' : 'border-gray-300'
                      }`}
                  >
                    <option value="">Select your country</option>
                    {countries.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                  {errors.country && <p className="text-red-500 text-sm mt-1">{errors.country}</p>}
                </div>

                <div>
                  <label htmlFor="classType" className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Class Type *
                  </label>
                  <select
                    id="classType"
                    name="classType"
                    value={formData.classType}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.classType ? 'border-red-500' : 'border-gray-300'
                      }`}
                  >
                    <option value="">Select class type</option>
                    {classTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {errors.classType && <p className="text-red-500 text-sm mt-1">{errors.classType}</p>}
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Special Requirements & Goals
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Tell us about your group's experience level, specific goals, occasion details, or any special requirements..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <Button
                  type="submit"
                  loading={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-all duration-300"
                >
                  {loading ? 'Confirming Booking...' : 'Confirm Booking'}
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}