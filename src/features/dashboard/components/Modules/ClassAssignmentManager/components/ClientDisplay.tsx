import { ChevronDown, ChevronRight, Users, Mail, Hash } from 'lucide-react'
import { useState } from 'react'
import { ClassAssignment, getPrimaryClientDisplay, getBookingDetails } from '../types'

interface ClientDisplayProps {
    assignment: ClassAssignment
    compact?: boolean
    className?: string
}

export function ClientDisplay({ assignment, compact = false, className = '' }: ClientDisplayProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const primaryDisplay = getPrimaryClientDisplay(assignment)
    const bookingDetails = getBookingDetails(assignment)
    
    if (!primaryDisplay) {
        return null
    }

    // If only one booking or in compact mode, show simple display
    if (bookingDetails.length <= 1 || compact) {
        return (
            <div className={`flex items-center text-sm text-gray-600 ${className}`}>
                <Users className="w-4 h-4 mr-1 flex-shrink-0" />
                <span className="truncate">{primaryDisplay}</span>
            </div>
        )
    }

    // Multiple bookings - show expandable display
    return (
        <div className={className}>
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors w-full text-left group"
            >
                <Users className="w-4 h-4 mr-1 flex-shrink-0" />
                <span className="truncate mr-2">{primaryDisplay}</span>
                {isExpanded ? (
                    <ChevronDown className="w-3 h-3 flex-shrink-0 group-hover:text-blue-600" />
                ) : (
                    <ChevronRight className="w-3 h-3 flex-shrink-0 group-hover:text-blue-600" />
                )}
            </button>
            
            {isExpanded && (
                <div className="mt-2 ml-5 space-y-2 bg-gray-50 rounded-md p-3 border border-gray-200">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Booking Details ({bookingDetails.length} clients)
                    </div>
                    {bookingDetails.map((detail, index) => (
                        <div key={detail.bookingId} className="bg-white rounded border border-gray-200 p-2">
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center">
                                        <Users className="w-3 h-3 mr-1 text-blue-600 flex-shrink-0" />
                                        <span className="font-medium text-gray-900 text-sm truncate">
                                            {detail.name}
                                        </span>
                                        {index === 0 && (
                                            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                                                Primary
                                            </span>
                                        )}
                                    </div>
                                    {detail.email && (
                                        <div className="flex items-center mt-1">
                                            <Mail className="w-3 h-3 mr-1 text-gray-400 flex-shrink-0" />
                                            <span className="text-xs text-gray-600 truncate">{detail.email}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center mt-1">
                                        <Hash className="w-3 h-3 mr-1 text-gray-400 flex-shrink-0" />
                                        <span className="text-xs font-mono text-gray-500 truncate">
                                            {detail.bookingId}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}