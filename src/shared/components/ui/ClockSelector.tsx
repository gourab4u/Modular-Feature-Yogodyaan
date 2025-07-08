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

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          <Clock className="w-4 h-4 inline mr-1" />
          {label}
        </label>
      )}
      
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
      />

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

export default ClockSelector;</1:invoke>