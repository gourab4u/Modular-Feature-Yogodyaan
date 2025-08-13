// Timezone utility functions for class assignment management

export interface TimezoneInfo {
  label: string
  value: string
  offset: string
  popular?: boolean
}

// Common timezones with user-friendly labels
export const COMMON_TIMEZONES: TimezoneInfo[] = [
  // Popular Indian timezones
  { label: 'India Standard Time (IST)', value: 'Asia/Kolkata', offset: '+05:30', popular: true },
  { label: 'India - Delhi', value: 'Asia/Delhi', offset: '+05:30', popular: true },
  { label: 'India - Mumbai', value: 'Asia/Mumbai', offset: '+05:30', popular: true },
  
  // Other popular timezones
  { label: 'UTC', value: 'UTC', offset: '+00:00', popular: true },
  { label: 'US Eastern Time', value: 'America/New_York', offset: '-05:00', popular: true },
  { label: 'US Pacific Time', value: 'America/Los_Angeles', offset: '-08:00', popular: true },
  { label: 'UK Time', value: 'Europe/London', offset: '+00:00', popular: true },
  
  // Asian timezones
  { label: 'Singapore Time', value: 'Asia/Singapore', offset: '+08:00' },
  { label: 'Japan Time', value: 'Asia/Tokyo', offset: '+09:00' },
  { label: 'China Time', value: 'Asia/Shanghai', offset: '+08:00' },
  { label: 'Dubai Time', value: 'Asia/Dubai', offset: '+04:00' },
  
  // European timezones
  { label: 'Central European Time', value: 'Europe/Berlin', offset: '+01:00' },
  { label: 'Paris Time', value: 'Europe/Paris', offset: '+01:00' },
  
  // Australian timezones
  { label: 'Sydney Time', value: 'Australia/Sydney', offset: '+11:00' },
  { label: 'Melbourne Time', value: 'Australia/Melbourne', offset: '+11:00' },
]

/**
 * Get the user's current timezone
 */
export const getUserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata'
}

/**
 * Format a date and time in a specific timezone
 */
export const formatDateTimeInTimezone = (
  date: Date,
  timezone: string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }
): string => {
  return new Intl.DateTimeFormat('en-US', {
    ...options,
    timeZone: timezone
  }).format(date)
}

/**
 * Convert a date and time from one timezone to another
 */
export const convertTimezone = (
  dateString: string,
  timeString: string,
  _fromTimezone: string,
  toTimezone: string
): { date: string; time: string; datetime: Date } => {
  // Create a date object in the source timezone
  const sourceDateTime = new Date(`${dateString}T${timeString}`)
  
  // Convert to target timezone
  const targetDate = new Date(sourceDateTime.toLocaleString('en-US', { timeZone: toTimezone }))
  
  return {
    date: targetDate.toISOString().split('T')[0],
    time: targetDate.toTimeString().split(' ')[0].substring(0, 5),
    datetime: targetDate
  }
}

/**
 * Create a timezone-aware datetime string
 */
export const createTimezoneAwareDatetime = (
  date: string,
  time: string,
  timezone: string
): string => {
  const datetime = `${date}T${time}:00`
  return new Date(datetime + getTimezoneOffset(timezone)).toISOString()
}

/**
 * Get timezone offset string (e.g., "+05:30")
 */
export const getTimezoneOffset = (timezone: string): string => {
  const now = new Date()
  const utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000)
  const target = new Date(utc.toLocaleString('en-US', { timeZone: timezone }))
  const diff = target.getTime() - utc.getTime()
  
  const hours = Math.floor(Math.abs(diff) / 3600000)
  const minutes = Math.floor((Math.abs(diff) % 3600000) / 60000)
  const sign = diff >= 0 ? '+' : '-'
  
  return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

/**
 * Get timezone display name
 */
export const getTimezoneDisplayName = (timezone: string): string => {
  const timezoneInfo = COMMON_TIMEZONES.find(tz => tz.value === timezone)
  return timezoneInfo?.label || timezone
}

/**
 * Convert stored assignment time to user's local timezone
 */
export const convertAssignmentToLocalTime = (
  assignmentDate: string,
  assignmentTime: string,
  storedTimezone: string,
  userTimezone?: string
): { localDate: string; localTime: string; displayString: string } => {
  const targetTimezone = userTimezone || getUserTimezone()
  
  // If same timezone, no conversion needed
  if (storedTimezone === targetTimezone) {
    return {
      localDate: assignmentDate,
      localTime: assignmentTime,
      displayString: `${assignmentDate} ${assignmentTime}`
    }
  }
  
  // Convert timezone
  const converted = convertTimezone(assignmentDate, assignmentTime, storedTimezone, targetTimezone)
  
  return {
    localDate: converted.date,
    localTime: converted.time,
    displayString: `${converted.date} ${converted.time} (${getTimezoneDisplayName(targetTimezone)})`
  }
}

/**
 * Generate time slots for a full 24-hour day
 */
export const generate24HourTimeSlots = (intervalMinutes: number = 30): string[] => {
  const slots: string[] = []
  
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      slots.push(timeString)
    }
  }
  
  return slots
}

/**
 * Get weekday names in different formats
 */
export const WEEKDAY_NAMES = {
  short: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  long: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  minimal: ['S', 'M', 'T', 'W', 'T', 'F', 'S']
}

/**
 * Get weekday name by index
 */
export const getWeekdayName = (dayIndex: number, format: 'short' | 'long' | 'minimal' = 'long'): string => {
  return WEEKDAY_NAMES[format][dayIndex] || 'Unknown'
}

/**
 * Format time for display with AM/PM
 */
export const formatTimeWithAMPM = (time: string): string => {
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}

/**
 * Check if a date/time conflicts with existing assignments
 */
export const checkTimeConflict = (
  newDate: string,
  newStartTime: string,
  newEndTime: string,
  existingAssignments: Array<{
    date: string
    start_time: string
    end_time: string
    instructor_id: string
  }>,
  instructorId: string
): boolean => {
  return existingAssignments.some(assignment => {
    if (assignment.date !== newDate || assignment.instructor_id !== instructorId) {
      return false
    }
    
    const newStart = new Date(`2000-01-01T${newStartTime}`)
    const newEnd = new Date(`2000-01-01T${newEndTime}`)
    const existingStart = new Date(`2000-01-01T${assignment.start_time}`)
    const existingEnd = new Date(`2000-01-01T${assignment.end_time}`)
    
    // Check for overlap
    return (newStart < existingEnd && newEnd > existingStart)
  })
}