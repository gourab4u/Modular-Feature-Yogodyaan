import { BarChart3, Calendar, CheckSquare, Filter, List, Plus, RefreshCw, Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { useClassAssignmentData, useFormHandler } from './hooks'
import { 
    AssignmentForm, 
    AssignmentListView, 
    CalendarView, 
    AnalyticsView, 
    AdvancedFilters,
    ClassDetailsPopup, 
    Button 
} from './components'
import { 
    ClassAssignment, 
    ConflictDetails, 
    Filters 
} from './types'
import { 
    timeToMinutes, 
    getAssignmentType,
    formatTime
} from './utils'
import { supabase } from './lib/supabase'
import { AssignmentCreationService } from './services/assignmentCreation'

export function ClassAssignmentManager() {
    // Data fetching hook
    const {
        assignments,
        weeklySchedules,
        scheduleTemplates,
        classTypes,
        packages,
        userProfiles,
        bookings,
        loading,
        loadingStates,
        setLoadingStates,
        fetchData
    } = useClassAssignmentData()

    // Form handling hook with conflict checking
    const {
        formData,
        errors,
        conflictWarning,
        setConflictWarning,
        handleInputChange,
        handleTimeChange,
        handleDurationChange,
        validateForm,
        resetForm
    } = useFormHandler(checkForConflicts)

    // UI state
    const [showAssignForm, setShowAssignForm] = useState(false)
    const [saving, setSaving] = useState(false)
    const [activeView, setActiveView] = useState<'list' | 'calendar' | 'analytics'>('list')
    const [showFilters, setShowFilters] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [filters, setFilters] = useState<Filters>({
        dateRange: { start: '', end: '' },
        assignmentTypes: [],
        classStatus: [],
        paymentStatus: [],
        instructors: [],
        classTypes: [],
        packages: [],
        clientName: '',
        weeklyClasses: false
    })

    // Selection state for multi-delete
    const [selectedAssignments, setSelectedAssignments] = useState<Set<string>>(new Set())
    const [isSelectMode, setIsSelectMode] = useState(false)

    // Class details popup state
    const [selectedClassDetails, setSelectedClassDetails] = useState<ClassAssignment | null>(null)
    const [showClassDetailsPopup, setShowClassDetailsPopup] = useState(false)

    const instructors = userProfiles

    const createDateInTimeZone = (dateString: string) => {
        return new Date(dateString + 'T00:00:00')
    }

    // Enhanced conflict checking function
    function checkForConflicts() {
        if (!formData.instructor_id || !formData.date || !formData.start_time || !formData.end_time) {
            setConflictWarning(null)
            return
        }

        setLoadingStates(prev => ({ ...prev, checkingConflicts: true }))

        const proposedStart = timeToMinutes(formData.start_time)
        const proposedEnd = timeToMinutes(formData.end_time)
        const proposedDate = createDateInTimeZone(formData.date)
        const proposedDayOfWeek = proposedDate.getDay()

        // Enhanced conflict detection
        const conflicts: ConflictDetails[] = []

        // 1. Check instructor conflicts with existing assignments
        const conflictingAssignments = assignments.filter(assignment => {
            if (assignment.instructor_id !== formData.instructor_id) return false
            if (assignment.date !== formData.date) return false
            if (assignment.class_status === 'cancelled') return false

            const assignmentStart = timeToMinutes(assignment.start_time || '')
            const assignmentEnd = timeToMinutes(assignment.end_time || '')

            return (proposedStart < assignmentEnd && proposedEnd > assignmentStart)
        })

        if (conflictingAssignments.length > 0) {
            conflicts.push({
                hasConflict: true,
                conflictingClass: conflictingAssignments[0],
                message: `Instructor has another class at ${formatTime(conflictingAssignments[0].start_time)} - ${formatTime(conflictingAssignments[0].end_time)}`,
                conflictType: 'instructor',
                severity: 'error'
            })
        }

        // 2. Check instructor conflicts with weekly schedules
        const conflictingSchedules = weeklySchedules.filter(schedule => {
            if (schedule.instructor_id !== formData.instructor_id) return false
            if (schedule.day_of_week !== proposedDayOfWeek) return false
            if (!schedule.is_active) return false

            const scheduleStart = timeToMinutes(schedule.start_time)
            const scheduleEnd = timeToMinutes(schedule.end_time)

            return (proposedStart < scheduleEnd && proposedEnd > scheduleStart)
        })

        if (conflictingSchedules.length > 0) {
            conflicts.push({
                hasConflict: true,
                conflictingClass: conflictingSchedules[0],
                message: `Instructor has a weekly class scheduled at ${formatTime(conflictingSchedules[0].start_time)} - ${formatTime(conflictingSchedules[0].end_time)}`,
                conflictType: 'instructor',
                severity: 'warning',
                suggestions: ['Consider scheduling at a different time', 'Check if the weekly class can be moved']
            })
        }

        // 3. Check for timing issues
        const duration = proposedEnd - proposedStart
        if (duration < 30) {
            conflicts.push({
                hasConflict: true,
                message: 'Class duration should be at least 30 minutes',
                conflictType: 'timing',
                severity: 'warning'
            })
        } else if (duration > 180) {
            conflicts.push({
                hasConflict: true,
                message: 'Class duration over 3 hours is unusual',
                conflictType: 'timing',
                severity: 'warning'
            })
        }

        // 4. Check for early morning or late evening classes
        if (proposedStart < 360) { // Before 6 AM
            conflicts.push({
                hasConflict: true,
                message: 'Very early morning class (before 6 AM)',
                conflictType: 'timing',
                severity: 'warning'
            })
        } else if (proposedEnd > 1320) { // After 10 PM
            conflicts.push({
                hasConflict: true,
                message: 'Late evening class (after 10 PM)',
                conflictType: 'timing',
                severity: 'warning'
            })
        }

        // 5. Check weekend scheduling
        if (proposedDayOfWeek === 0 || proposedDayOfWeek === 6) { // Sunday or Saturday
            conflicts.push({
                hasConflict: true,
                message: `Weekend class scheduled for ${proposedDayOfWeek === 0 ? 'Sunday' : 'Saturday'}`,
                conflictType: 'timing',
                severity: 'warning'
            })
        }

        // Process conflicts and set the most severe one
        const errorConflicts = conflicts.filter(c => c.severity === 'error')
        const warningConflicts = conflicts.filter(c => c.severity === 'warning')

        setLoadingStates(prev => ({ ...prev, checkingConflicts: false }))

        if (errorConflicts.length > 0) {
            setConflictWarning(errorConflicts[0])
        } else if (warningConflicts.length > 0) {
            // Show the first warning-level conflict
            setConflictWarning(warningConflicts[0])
        } else {
            setConflictWarning(null)
        }
    }

    // Check for conflicts when relevant fields change
    useEffect(() => {
        if (formData.assignment_type === 'adhoc') {
            checkForConflicts()
        }
    }, [formData.instructor_id, formData.date, formData.start_time, formData.end_time, assignments, weeklySchedules])

    // Enhanced filtering and search functionality
    const filteredAssignments = useMemo(() => {
        return assignments.filter(assignment => {
            // Search term filter
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase()
                const matchesSearch = 
                    assignment.class_type?.name?.toLowerCase().includes(searchLower) ||
                    assignment.instructor_profile?.full_name?.toLowerCase().includes(searchLower) ||
                    assignment.client_name?.toLowerCase().includes(searchLower) ||
                    assignment.notes?.toLowerCase().includes(searchLower)
                
                if (!matchesSearch) return false
            }

            // Date range filter
            if (filters.dateRange.start && assignment.date < filters.dateRange.start) return false
            if (filters.dateRange.end && assignment.date > filters.dateRange.end) return false

            // Weekly classes filter
            if (filters.weeklyClasses && assignment.schedule_type !== 'weekly') return false

            // Class status filter
            if (filters.classStatus.length > 0 && assignment.class_status && !filters.classStatus.includes(assignment.class_status)) return false

            // Payment status filter
            if (filters.paymentStatus.length > 0 && assignment.payment_status && !filters.paymentStatus.includes(assignment.payment_status)) return false

            // Assignment type filter
            if (filters.assignmentTypes.length > 0) {
                const assignmentType = getAssignmentType(assignment)
                if (!filters.assignmentTypes.includes(assignmentType)) return false
            }

            // Instructor filter
            if (filters.instructors.length > 0 && !filters.instructors.includes(assignment.instructor_id)) return false

            // Class types filter
            if (filters.classTypes.length > 0 && assignment.class_type_id && !filters.classTypes.includes(assignment.class_type_id)) return false

            // Client name filter
            if (filters.clientName && assignment.client_name && !assignment.client_name.toLowerCase().includes(filters.clientName.toLowerCase())) return false

            return true
        })
    }, [assignments, searchTerm, filters])

    // Group assignments by recurring patterns
    const groupedAssignments = useMemo(() => {
        const groups = new Map<string, {
            key: string
            type: string
            assignments: ClassAssignment[]
            groupInfo: {
                instructor_name: string
                class_type_name: string
                total_revenue: number
                assignment_count: number
                client_name?: string
                pattern_description?: string
            }
        }>()

        filteredAssignments.forEach(assignment => {
            // Create group keys based on assignment type
            let groupKey: string
            let groupType: string

            switch (assignment.schedule_type) {
                case 'weekly':
                    // Group by instructor + class type + recurring pattern
                    groupKey = `weekly_${assignment.instructor_id}_${assignment.class_type_id}`
                    groupType = 'weekly'
                    break
                case 'monthly':
                    // Group by instructor + class type + client (monthly sessions for same client)
                    groupKey = `monthly_${assignment.instructor_id}_${assignment.class_type_id}_${assignment.client_name || 'unknown'}`
                    groupType = 'monthly'
                    break
                case 'crash':
                    // Group by instructor + class type + client + assigned date range (crash courses typically span days/weeks)
                    const datePrefix = assignment.date.substring(0, 7) // Group by year-month
                    groupKey = `crash_${assignment.instructor_id}_${assignment.class_type_id}_${assignment.client_name || 'unknown'}_${datePrefix}`
                    groupType = 'crash_course'
                    break
                case 'adhoc':
                default:
                    // Don't group adhoc assignments - each is individual
                    groupKey = `adhoc_${assignment.id}`
                    groupType = 'adhoc'
                    break
            }

            if (!groups.has(groupKey)) {
                groups.set(groupKey, {
                    key: groupKey,
                    type: groupType,
                    assignments: [],
                    groupInfo: {
                        instructor_name: assignment.instructor_profile?.full_name || 'Unknown Instructor',
                        class_type_name: assignment.class_type?.name || 'Unknown Class',
                        total_revenue: 0,
                        assignment_count: 0,
                        client_name: assignment.client_name,
                        pattern_description: groupType === 'weekly' ? 'Weekly Recurring' : 
                                           groupType === 'monthly' ? 'Monthly Package' :
                                           groupType === 'crash_course' ? 'Crash Course' : undefined
                    }
                })
            }

            const group = groups.get(groupKey)!
            group.assignments.push(assignment)
            group.groupInfo.total_revenue += assignment.payment_amount
            group.groupInfo.assignment_count += 1

            // Sort assignments within each group by date
            group.assignments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        })

        // Convert to array format with group metadata
        return Array.from(groups.values())
            .sort((a, b) => {
                const typeOrder: Record<string, number> = {
                    'weekly': 1,
                    'monthly': 2,
                    'crash_course': 3,
                    'adhoc': 4
                }

                // Sort groups by type priority and then by date
                const typeDiff = (typeOrder[a.type] || 999) - (typeOrder[b.type] || 999)
                if (typeDiff !== 0) return typeDiff

                // Get first assignment date for each group
                const aFirstDate = a.assignments[0]?.date || ''
                const bFirstDate = b.assignments[0]?.date || ''

                // Within same type, sort by first assignment date (newest first)
                return new Date(bFirstDate).getTime() - new Date(aFirstDate).getTime()
            })
    }, [filteredAssignments])

    // Assignment actions
    const openClassDetails = (assignment: ClassAssignment) => {
        setSelectedClassDetails(assignment)
        setShowClassDetailsPopup(true)
    }

    const closeClassDetails = () => {
        setSelectedClassDetails(null)
        setShowClassDetailsPopup(false)
    }

    const deleteAssignment = async (assignmentId: string, assignmentTitle: string) => {
        if (!confirm(`Are you sure you want to delete "${assignmentTitle}"?`)) return

        try {
            setLoadingStates(prev => ({ ...prev, deletingAssignment: true }))

            const { error } = await supabase
                .from('class_assignments')
                .delete()
                .eq('id', assignmentId)

            if (error) throw error

            // Refresh data to update the UI
            await fetchData()

            // Show success message
            console.log('Assignment deleted successfully')
        } catch (error) {
            console.error('Error deleting assignment:', error)
            alert('Failed to delete assignment. Please try again.')
        } finally {
            setLoadingStates(prev => ({ ...prev, deletingAssignment: false }))
        }
    }

    // Bulk delete functionality
    const deleteBulkAssignments = async () => {
        if (selectedAssignments.size === 0) return

        const assignmentTitles = Array.from(selectedAssignments)
            .slice(0, 3) // Show first 3 assignments
            .map(id => {
                const assignment = assignments.find(a => a.id === id)
                return assignment ? `${assignment.class_type?.name || 'Class'} on ${assignment.date}` : 'Assignment'
            })

        const displayText = selectedAssignments.size > 3 
            ? `${assignmentTitles.join(', ')} and ${selectedAssignments.size - 3} more`
            : assignmentTitles.join(', ')

        if (!confirm(`Are you sure you want to delete ${selectedAssignments.size} assignment${selectedAssignments.size !== 1 ? 's' : ''}?\n\n${displayText}`)) return

        try {
            setLoadingStates(prev => ({ ...prev, deletingAssignment: true }))

            const { error } = await supabase
                .from('class_assignments')
                .delete()
                .in('id', Array.from(selectedAssignments))

            if (error) throw error

            // Clear selections and refresh data
            setSelectedAssignments(new Set())
            setIsSelectMode(false)
            await fetchData()

            // Show success message
            console.log(`${selectedAssignments.size} assignments deleted successfully`)
        } catch (error) {
            console.error('Error deleting assignments:', error)
            alert('Failed to delete assignments. Please try again.')
        } finally {
            setLoadingStates(prev => ({ ...prev, deletingAssignment: false }))
        }
    }

    // Selection handling
    const toggleAssignmentSelection = (assignmentId: string) => {
        const newSelected = new Set(selectedAssignments)
        if (newSelected.has(assignmentId)) {
            newSelected.delete(assignmentId)
        } else {
            newSelected.add(assignmentId)
        }
        setSelectedAssignments(newSelected)
    }

    const selectAllFilteredAssignments = () => {
        const allIds = new Set(filteredAssignments.map(a => a.id))
        setSelectedAssignments(allIds)
    }

    const clearAllSelections = () => {
        setSelectedAssignments(new Set())
    }

    const toggleSelectMode = () => {
        setIsSelectMode(!isSelectMode)
        if (isSelectMode) {
            clearAllSelections()
        }
    }

    // Enhanced create assignment function
    const createAssignment = async () => {
        if (!validateForm()) return

        try {
            setSaving(true)
            setLoadingStates(prev => ({ ...prev, creatingAssignment: true }))

            const result = await AssignmentCreationService.createAssignment(formData, packages)

            await fetchData()
            resetForm()
            setShowAssignForm(false)

            console.log(`Successfully created ${result.count} assignment${result.count !== 1 ? 's' : ''}`)
        } catch (error) {
            console.error('Error creating assignment:', error)
            alert(`Failed to create assignment: ${error.message || 'Please try again.'}`)
        } finally {
            setSaving(false)
            setLoadingStates(prev => ({ ...prev, creatingAssignment: false }))
        }
    }

    // Filter management
    const clearAllFilters = () => {
        setFilters({
            dateRange: { start: '', end: '' },
            assignmentTypes: [],
            classStatus: [],
            paymentStatus: [],
            instructors: [],
            classTypes: [],
            packages: [],
            clientName: '',
            weeklyClasses: false
        })
        setSearchTerm('')
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Class Assignment Manager</h1>
                    <p className="text-gray-600">Manage class assignments, schedules, and payments</p>
                </div>
                <div className="flex items-center space-x-3">
                    <Button variant="outline" size="sm" onClick={() => fetchData()} disabled={loadingStates.fetchingData}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${loadingStates.fetchingData ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button onClick={() => setShowAssignForm(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        New Assignment
                    </Button>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="mb-6 space-y-4">
                <div className="flex items-center space-x-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search assignments..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <Button variant="outline" onClick={() => setShowFilters(true)}>
                        <Filter className="w-4 h-4 mr-2" />
                        Filters
                        {Object.values(filters).some(filter => 
                            Array.isArray(filter) ? filter.length > 0 : 
                            typeof filter === 'object' ? Object.values(filter).some(v => v) :
                            filter
                        ) && (
                            <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                                Active
                            </span>
                        )}
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-lg shadow">
                {/* View Toggle */}
                <div className="border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex space-x-1">
                            <button
                                onClick={() => setActiveView('list')}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center ${
                                    activeView === 'list' 
                                        ? 'bg-blue-100 text-blue-700' 
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <List className="w-4 h-4 mr-1" />
                                List
                            </button>
                            <button
                                onClick={() => setActiveView('calendar')}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center ${
                                    activeView === 'calendar' 
                                        ? 'bg-blue-100 text-blue-700' 
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <Calendar className="w-4 h-4 mr-1" />
                                Calendar
                            </button>
                            <button
                                onClick={() => setActiveView('analytics')}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center ${
                                    activeView === 'analytics' 
                                        ? 'bg-blue-100 text-blue-700' 
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <BarChart3 className="w-4 h-4 mr-1" />
                                Analytics
                            </button>
                        </div>

                        {activeView === 'list' && (
                            <div className="flex items-center space-x-3">
                                {filteredAssignments.length > 0 && (
                                    <span className="text-sm text-gray-500">
                                        {filteredAssignments.length} assignment{filteredAssignments.length !== 1 ? 's' : ''}
                                    </span>
                                )}
                                <Button variant="outline" size="sm" onClick={toggleSelectMode}>
                                    {isSelectMode ? (
                                        <>
                                            <X className="w-4 h-4 mr-1" />
                                            Cancel Select
                                        </>
                                    ) : (
                                        <>
                                            <CheckSquare className="w-4 h-4 mr-1" />
                                            Select Multiple
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Bulk Actions Toolbar */}
                    {isSelectMode && selectedAssignments.size > 0 && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-blue-900">
                                    {selectedAssignments.size} assignment{selectedAssignments.size !== 1 ? 's' : ''} selected
                                </span>
                                <div className="flex items-center space-x-2">
                                    <Button variant="outline" size="sm" onClick={clearAllSelections}>
                                        Clear
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={selectAllFilteredAssignments}>
                                        Select All
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={deleteBulkAssignments}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        Delete Selected
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className={activeView === 'analytics' ? '' : 'p-6'}>
                    {activeView === 'list' && (
                        <AssignmentListView
                            loading={loading}
                            groupedAssignments={groupedAssignments}
                            isSelectMode={isSelectMode}
                            selectedAssignments={selectedAssignments}
                            onToggleSelection={toggleAssignmentSelection}
                            onDeleteAssignment={deleteAssignment}
                            onOpenClassDetails={openClassDetails}
                        />
                    )}

                    {activeView === 'calendar' && (
                        <CalendarView
                            assignments={filteredAssignments}
                            isSelectMode={isSelectMode}
                            selectedAssignments={selectedAssignments}
                            onToggleSelection={toggleAssignmentSelection}
                            onDeleteAssignment={deleteAssignment}
                            onOpenClassDetails={openClassDetails}
                        />
                    )}

                    {activeView === 'analytics' && (
                        <AnalyticsView
                            assignments={assignments}
                            instructors={instructors}
                        />
                    )}
                </div>
            </div>

            {/* Assignment Form Modal */}
            <AssignmentForm
                isVisible={showAssignForm}
                formData={formData}
                errors={errors}
                conflictWarning={conflictWarning}
                classTypes={classTypes}
                packages={packages}
                instructors={instructors}
                scheduleTemplates={scheduleTemplates}
                bookings={bookings}
                saving={saving}
                onClose={() => setShowAssignForm(false)}
                onSubmit={createAssignment}
                onInputChange={handleInputChange}
                onTimeChange={handleTimeChange}
                onDurationChange={handleDurationChange}
            />

            {/* Advanced Filters Modal */}
            <AdvancedFilters
                isVisible={showFilters}
                filters={filters}
                classTypes={classTypes}
                instructors={instructors}
                packages={packages}
                onFiltersChange={setFilters}
                onClose={() => setShowFilters(false)}
                onClearAll={clearAllFilters}
            />

            {/* Class Details Popup */}
            <ClassDetailsPopup
                assignment={selectedClassDetails}
                isVisible={showClassDetailsPopup}
                onClose={closeClassDetails}
            />
        </div>
    )
}

export default ClassAssignmentManager