import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../../shared/lib/supabase'

interface MonthlyEarnings {
  month: number
  year: number
  total_classes: number
  total_earnings: number
  paid_earnings: number
  pending_earnings: number
}

interface YearlyEarnings {
  year: number
  total_classes: number
  total_earnings: number
  paid_earnings: number
  pending_earnings: number
}

export function useInstructorEarnings(instructorId?: string) {
  const [monthlyEarnings, setMonthlyEarnings] = useState<MonthlyEarnings[]>([])
  const [yearlyEarnings, setYearlyEarnings] = useState<YearlyEarnings[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const calculateEarnings = useCallback(async () => {
    if (!instructorId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Fetch all class assignments for the instructor
      const { data: assignments, error: fetchError } = await supabase
        .from('class_assignments')
        .select('*')
        .eq('instructor_id', instructorId)
        .not('date', 'is', null)

      if (fetchError) {
        throw fetchError
      }

      // Calculate monthly earnings
      const monthlyMap = new Map<string, MonthlyEarnings>()
      const yearlyMap = new Map<number, YearlyEarnings>()

      assignments?.forEach(assignment => {
        const date = new Date(assignment.date)
        const month = date.getMonth() + 1
        const year = date.getFullYear()
        const monthKey = `${year}-${month}`

        const amount = parseFloat(assignment.payment_amount) || 0
        const isPaid = assignment.payment_status === 'paid'

        // Monthly calculations
        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, {
            month,
            year,
            total_classes: 0,
            total_earnings: 0,
            paid_earnings: 0,
            pending_earnings: 0
          })
        }

        const monthlyData = monthlyMap.get(monthKey)!
        monthlyData.total_classes += 1
        monthlyData.total_earnings += amount

        if (isPaid) {
          monthlyData.paid_earnings += amount
        } else {
          monthlyData.pending_earnings += amount
        }

        // Yearly calculations
        if (!yearlyMap.has(year)) {
          yearlyMap.set(year, {
            year,
            total_classes: 0,
            total_earnings: 0,
            paid_earnings: 0,
            pending_earnings: 0
          })
        }

        const yearlyData = yearlyMap.get(year)!
        yearlyData.total_classes += 1
        yearlyData.total_earnings += amount

        if (isPaid) {
          yearlyData.paid_earnings += amount
        } else {
          yearlyData.pending_earnings += amount
        }
      })

      // Convert maps to arrays and sort
      const monthlyArray = Array.from(monthlyMap.values()).sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year
        return b.month - a.month
      })

      const yearlyArray = Array.from(yearlyMap.values()).sort((a, b) => b.year - a.year)

      setMonthlyEarnings(monthlyArray)
      setYearlyEarnings(yearlyArray)

    } catch (err: any) {
      console.error('Error calculating earnings:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [instructorId])

  const getEarningsForPeriod = (year: number, month?: number) => {
    if (month) {
      return monthlyEarnings.find(e => e.year === year && e.month === month)
    } else {
      return yearlyEarnings.find(e => e.year === year)
    }
  }

  const getTotalLifetimeEarnings = () => {
    return yearlyEarnings.reduce((total, year) => total + year.total_earnings, 0)
  }

  const getTotalPaidEarnings = () => {
    return yearlyEarnings.reduce((total, year) => total + year.paid_earnings, 0)
  }

  const getTotalPendingEarnings = () => {
    return yearlyEarnings.reduce((total, year) => total + year.pending_earnings, 0)
  }

  const getTotalClassesTaught = () => {
    return yearlyEarnings.reduce((total, year) => total + year.total_classes, 0)
  }

  useEffect(() => {
    calculateEarnings()
  }, [calculateEarnings])

  return {
    monthlyEarnings,
    yearlyEarnings,
    loading,
    error,
    refetch: calculateEarnings,
    getEarningsForPeriod,
    getTotalLifetimeEarnings,
    getTotalPaidEarnings,
    getTotalPendingEarnings,
    getTotalClassesTaught
  }
}