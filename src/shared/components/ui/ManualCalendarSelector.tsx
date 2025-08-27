import { Calendar, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from './Button'

interface ManualClassSelection {
  date: string
  start_time: string
  end_time: string
  timezone: string
}

interface ManualCalendarSelectorProps {
  selections: ManualClassSelection[]
  onSelectionsChange: (selections: ManualClassSelection[]) => void
  timezone: string
  requiredCount: number
  maxDate?: string
  minDate?: string
}

export function ManualCalendarSelector({
  selections,
  onSelectionsChange,
  timezone,
  requiredCount,
  maxDate,
  minDate
}: ManualCalendarSelectorProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedStartTime, setSelectedStartTime] = useState<string>('')
  const [selectedEndTime, setSelectedEndTime] = useState<string>('')
  const [isSelecting, setIsSelecting] = useState(false)

  // Generate 24-hour time slots with 30-minute intervals
  const timeSlots = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2)
    const minute = (i % 2) * 30
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  })

  // Get days in current month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay()) // Start from Sunday
    
    const days = []
    const currentDay = new Date(startDate)
    
    while (days.length < 42) { // 6 weeks
      days.push(new Date(currentDay))
      currentDay.setDate(currentDay.getDate() + 1)
    }
    
    return days
  }

  const days = getDaysInMonth(currentDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const formatTimeWithAMPM = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
  }

  const isDateDisabled = (date: Date) => {
    const dateStr = formatDate(date)
    if (minDate && dateStr < minDate) return true
    if (maxDate && dateStr > maxDate) return true
    if (date < today) return true
    return false
  }

  const isDateSelected = (date: Date) => {
    const dateStr = formatDate(date)
    return selections.some(selection => selection.date === dateStr)
  }

  const getSelectionCountForDate = (date: Date) => {
    const dateStr = formatDate(date)
    return selections.filter(selection => selection.date === dateStr).length
  }

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return
    
    const dateStr = formatDate(date)
    setSelectedDate(dateStr)
    setIsSelecting(true)
    setSelectedStartTime('')
    setSelectedEndTime('')
  }

  const handleAddSelection = () => {
    if (!selectedDate || !selectedStartTime || !selectedEndTime) return
    
    const newSelection: ManualClassSelection = {
      date: selectedDate,
      start_time: selectedStartTime,
      end_time: selectedEndTime,
      timezone
    }
    
    const updatedSelections = [...selections, newSelection]
    onSelectionsChange(updatedSelections)
    
    // Reset form
    setIsSelecting(false)
    setSelectedDate('')
    setSelectedStartTime('')
    setSelectedEndTime('')
  }

  const handleRemoveSelection = (index: number) => {
    const updatedSelections = selections.filter((_, i) => i !== index)
    onSelectionsChange(updatedSelections)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1))
    setCurrentDate(newDate)
  }

  const isTimeSlotValid = () => {
    if (!selectedStartTime || !selectedEndTime) return false
    return selectedStartTime < selectedEndTime
  }

  const getTimeConflicts = () => {
    if (!selectedDate || !selectedStartTime || !selectedEndTime) return []
    
    return selections.filter(selection => {
      if (selection.date !== selectedDate) return false
      
      const newStart = new Date(`2000-01-01T${selectedStartTime}`)
      const newEnd = new Date(`2000-01-01T${selectedEndTime}`)
      const existingStart = new Date(`2000-01-01T${selection.start_time}`)
      const existingEnd = new Date(`2000-01-01T${selection.end_time}`)
      
      return (newStart < existingEnd && newEnd > existingStart)
    })
  }

  return (
    <div className="space-y-6">
      {/* Selection Summary */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="font-medium text-blue-900 dark:text-blue-100">
              Manual Class Selection
            </span>
          </div>
          <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
            {selections.length} / {requiredCount} classes selected
          </div>
        </div>
        
        {selections.length !== requiredCount && (
          <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
            {selections.length < requiredCount 
              ? `Please select ${requiredCount - selections.length} more class${requiredCount - selections.length !== 1 ? 'es' : ''}`
              : `Please remove ${selections.length - requiredCount} selection${selections.length - requiredCount !== 1 ? 's' : ''}`
            }
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Select Dates
            </h3>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                ‹
              </Button>
              <span className="text-sm font-medium px-3">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
              >
                ›
              </Button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => {
                const isCurrentMonth = day.getMonth() === currentDate.getMonth()
                const isToday = day.toDateString() === new Date().toDateString()
                const isDisabled = isDateDisabled(day)
                const isSelected = isDateSelected(day)
                const selectionCount = getSelectionCountForDate(day)

                return (
                  <button
                    key={index}
                    onClick={() => handleDateClick(day)}
                    disabled={isDisabled}
                    className={`
                      relative h-10 text-sm rounded-md transition-colors
                      ${!isCurrentMonth ? 'text-gray-300 dark:text-gray-600' : ''}
                      ${isToday ? 'ring-2 ring-blue-500' : ''}
                      ${isDisabled 
                        ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer'
                      }
                      ${isSelected 
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 font-medium' 
                        : 'text-gray-900 dark:text-gray-100'
                      }
                    `}
                  >
                    {day.getDate()}
                    {selectionCount > 0 && (
                      <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {selectionCount}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Time Selection & Selected Classes */}
        <div className="space-y-4">
          {/* Time Selection Form */}
          {isSelecting && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                Add Class for {selectedDate}
              </h4>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Start Time
                    </label>
                    <select
                      value={selectedStartTime}
                      onChange={(e) => setSelectedStartTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Select start time</option>
                      {timeSlots.map(time => (
                        <option key={time} value={time}>
                          {formatTimeWithAMPM(time)}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      End Time
                    </label>
                    <select
                      value={selectedEndTime}
                      onChange={(e) => setSelectedEndTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Select end time</option>
                      {timeSlots.map(time => (
                        <option key={time} value={time}>
                          {formatTimeWithAMPM(time)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {getTimeConflicts().length > 0 && (
                  <div className="text-sm text-red-600 dark:text-red-400">
                    Time conflict with existing selection(s)
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button
                    onClick={handleAddSelection}
                    disabled={!isTimeSlotValid() || getTimeConflicts().length > 0}
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Class
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsSelecting(false)}
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Selected Classes List */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                Selected Classes ({selections.length})
              </h4>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {selections.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No classes selected yet
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {selections.map((selection, index) => (
                    <div key={index} className="p-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {new Date(selection.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {formatTimeWithAMPM(selection.start_time)} - {formatTimeWithAMPM(selection.end_time)}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveSelection(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}