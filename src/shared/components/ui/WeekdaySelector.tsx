import { Check } from 'lucide-react'

interface WeekdaySelectorProps {
  selectedDays: number[]
  onSelectionChange: (days: number[]) => void
  disabled?: boolean
}

const WEEKDAYS = [
  { value: 0, short: 'Sun', long: 'Sunday' },
  { value: 1, short: 'Mon', long: 'Monday' },
  { value: 2, short: 'Tue', long: 'Tuesday' },
  { value: 3, short: 'Wed', long: 'Wednesday' },
  { value: 4, short: 'Thu', long: 'Thursday' },
  { value: 5, short: 'Fri', long: 'Friday' },
  { value: 6, short: 'Sat', long: 'Saturday' }
]

export function WeekdaySelector({ selectedDays, onSelectionChange, disabled = false }: WeekdaySelectorProps) {
  const toggleDay = (dayValue: number) => {
    if (disabled) return
    
    const isSelected = selectedDays.includes(dayValue)
    let newSelection: number[]
    
    if (isSelected) {
      newSelection = selectedDays.filter(day => day !== dayValue)
    } else {
      newSelection = [...selectedDays, dayValue].sort()
    }
    
    onSelectionChange(newSelection)
  }

  const getSelectedDaysText = () => {
    if (selectedDays.length === 0) return 'No days selected'
    if (selectedDays.length === 7) return 'Every day'
    
    const dayNames = selectedDays
      .map(dayValue => WEEKDAYS.find(d => d.value === dayValue)?.short)
      .filter(Boolean)
      .join(', ')
    
    return dayNames
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-7 gap-2">
        {WEEKDAYS.map(day => {
          const isSelected = selectedDays.includes(day.value)
          
          return (
            <button
              key={day.value}
              type="button"
              onClick={() => toggleDay(day.value)}
              disabled={disabled}
              className={`
                relative flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-200
                ${disabled 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'cursor-pointer hover:scale-105'
                }
                ${isSelected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
              title={day.long}
            >
              {isSelected && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              )}
              
              <div className="text-xs font-medium mb-1">
                {day.short}
              </div>
              
              <div className={`
                w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold
                ${isSelected
                  ? 'border-blue-500 bg-blue-500 text-white'
                  : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'
                }
              `}>
                {day.short[0]}
              </div>
            </button>
          )
        })}
      </div>
      
      <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
        Selected: <span className="font-medium">{getSelectedDaysText()}</span>
      </div>
    </div>
  )
}