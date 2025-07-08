import React, { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface ClockSelectorProps {
  value: string;
  onChange: (time: string) => void;
  label?: string;
  error?: string;
}

export default function ClockSelector({ value, onChange, label, error }: ClockSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState(12);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial value
  useEffect(() => {
    if (value) {
      const [hours, minutes] = value.split(':').map(Number);
      const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      setSelectedHour(hour12);
      setSelectedMinute(minutes);
      setPeriod(hours >= 12 ? 'PM' : 'AM');
    }
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTime = (hour: number, minute: number, period: 'AM' | 'PM') => {
    const hour24 = period === 'AM' ? (hour === 12 ? 0 : hour) : (hour === 12 ? 12 : hour + 12);
    return `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const formatDisplayTime = (hour: number, minute: number, period: 'AM' | 'PM') => {
    return `${hour}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const handleTimeSelect = (hour: number, minute: number, newPeriod: 'AM' | 'PM') => {
    setSelectedHour(hour);
    setSelectedMinute(minute);
    setPeriod(newPeriod);
    const timeString = formatTime(hour, minute, newPeriod);
    onChange(timeString);
    setIsOpen(false);
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Clock className="w-4 h-4 inline mr-1" />
          {label}
        </label>
      )}
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left bg-white ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          {value ? formatDisplayTime(selectedHour, selectedMinute, period) : 'Select time'}
          <Clock className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-80 bg-white border border-gray-300 rounded-lg shadow-lg">
            <div className="p-4">
              <div className="flex justify-center mb-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatDisplayTime(selectedHour, selectedMinute, period)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {/* Hours */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 text-center">Hour</h4>
                  <div className="grid grid-cols-3 gap-1 max-h-32 overflow-y-auto">
                    {hours.map(hour => (
                      <button
                        key={hour}
                        type="button"
                        onClick={() => handleTimeSelect(hour, selectedMinute, period)}
                        className={`p-2 text-sm rounded hover:bg-blue-50 ${
                          selectedHour === hour ? 'bg-blue-500 text-white' : 'text-gray-700'
                        }`}
                      >
                        {hour}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Minutes */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 text-center">Minute</h4>
                  <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto">
                    {minutes.map(minute => (
                      <button
                        key={minute}
                        type="button"
                        onClick={() => handleTimeSelect(selectedHour, minute, period)}
                        className={`p-2 text-sm rounded hover:bg-blue-50 ${
                          selectedMinute === minute ? 'bg-blue-500 text-white' : 'text-gray-700'
                        }`}
                      >
                        {minute.toString().padStart(2, '0')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* AM/PM */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 text-center">Period</h4>
                  <div className="space-y-1">
                    {['AM', 'PM'].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handleTimeSelect(selectedHour, selectedMinute, p as 'AM' | 'PM')}
                        className={`w-full p-2 text-sm rounded hover:bg-blue-50 ${
                          period === p ? 'bg-blue-500 text-white' : 'text-gray-700'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const timeString = formatTime(selectedHour, selectedMinute, period);
                    onChange(timeString);
                    setIsOpen(false);
                  }}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Select
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      
      {value && (
        <p className="text-sm text-gray-600 mt-1">
          Selected: {formatDisplayTime(selectedHour, selectedMinute, period)}
        </p>
      )}
    </div>
  );
}