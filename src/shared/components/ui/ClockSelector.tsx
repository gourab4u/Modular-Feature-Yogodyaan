import React from 'react';
import { Clock } from 'lucide-react';

interface ClockSelectorProps {
  value: string;
  onChange: (time: string) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
}

export const ClockSelector: React.FC<ClockSelectorProps> = ({
  value,
  onChange,
  label,
  error,
  disabled = false
}) => {
  // Generate time options in 15-minute intervals
  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayTime = formatTimeForDisplay(timeString);
        times.push({ value: timeString, label: displayTime });
      }
    }
    return times;
  };

  const formatTimeForDisplay = (timeString: string) => {
    if (!timeString) return '';
    
    try {
      const [hours, minutes] = timeString.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes);
      
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return timeString;
    }
  };

  const timeOptions = generateTimeOptions();

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          <Clock className="w-4 h-4 inline mr-1" />
          {label}
        </label>
      )}
      
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            error ? 'border-red-500' : 'border-gray-300'
          } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
        >
          <option value="">Select time</option>
          {timeOptions.map(({ value: timeValue, label: timeLabel }) => (
            <option key={timeValue} value={timeValue}>
              {timeLabel}
            </option>
          ))}
        </select>
        
        {/* Alternative: Manual time input */}
        <input
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`absolute inset-0 w-full h-full opacity-0 cursor-pointer ${
            disabled ? 'cursor-not-allowed' : ''
          }`}
        />
      </div>

      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
      
      {value && (
        <p className="text-sm text-gray-600 mt-1">
          Selected: {formatTimeForDisplay(value)}
        </p>
      )}
    </div>
  );
};

export default ClockSelector;