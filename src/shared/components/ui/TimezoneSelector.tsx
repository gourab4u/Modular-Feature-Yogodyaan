import { Globe, Clock } from 'lucide-react'
import { COMMON_TIMEZONES, getTimezoneDisplayName } from '../../utils/timezoneUtils'

interface TimezoneSelectorProps {
  value: string
  onChange: (timezone: string) => void
  disabled?: boolean
  showCurrentTime?: boolean
}

export function TimezoneSelector({ 
  value, 
  onChange, 
  disabled = false, 
  showCurrentTime = true 
}: TimezoneSelectorProps) {
  const currentTime = showCurrentTime ? getCurrentTimeInTimezone(value) : null
  
  const popularTimezones = COMMON_TIMEZONES.filter(tz => tz.popular)
  const otherTimezones = COMMON_TIMEZONES.filter(tz => !tz.popular)

  function getCurrentTimeInTimezone(timezone: string): string {
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(new Date())
    } catch {
      return 'Invalid timezone'
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Globe className="w-4 h-4 text-gray-500" />
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Timezone
        </label>
        {currentTime && (
          <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
            <Clock className="w-3 h-3" />
            <span>{currentTime}</span>
          </div>
        )}
      </div>
      
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {/* Popular Timezones */}
        <optgroup label="Popular Timezones">
          {popularTimezones.map(tz => (
            <option key={tz.value} value={tz.value}>
              {tz.label} ({tz.offset})
            </option>
          ))}
        </optgroup>
        
        {/* Other Timezones */}
        <optgroup label="Other Timezones">
          {otherTimezones.map(tz => (
            <option key={tz.value} value={tz.value}>
              {tz.label} ({tz.offset})
            </option>
          ))}
        </optgroup>
      </select>
      
      <div className="text-xs text-gray-500 dark:text-gray-400">
        Selected: {getTimezoneDisplayName(value)}
        {showCurrentTime && currentTime && ` • Current time: ${currentTime}`}
      </div>
    </div>
  )
}