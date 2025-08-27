import { DollarSign, TrendingUp, Calendar, BarChart3, Download } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../../shared/components/ui/Button'

interface EarningsOverviewProps {
  monthlyEarnings: any[]
  yearlyEarnings: any[]
  loading: boolean
}

export function EarningsOverview({ monthlyEarnings, yearlyEarnings, loading }: EarningsOverviewProps) {
  const [viewType, setViewType] = useState<'monthly' | 'yearly'>('monthly')

  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  const currentYearEarnings = yearlyEarnings?.find(y => y.year === currentYear)
  const currentMonthEarnings = monthlyEarnings?.find(m => 
    m.month === currentMonth && m.year === currentYear
  )

  const handleExport = () => {
    const data = viewType === 'monthly' ? monthlyEarnings : yearlyEarnings
    const csvContent = viewType === 'monthly' 
      ? "Month,Year,Classes,Total Earnings,Paid,Pending\n" +
        data?.map(item => 
          `${item.month},${item.year},${item.total_classes},${item.total_earnings},${item.paid_earnings},${item.pending_earnings}`
        ).join('\n')
      : "Year,Classes,Total Earnings,Paid,Pending\n" +
        data?.map(item => 
          `${item.year},${item.total_classes},${item.total_earnings},${item.paid_earnings},${item.pending_earnings}`
        ).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `earnings_${viewType}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-slate-600 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-slate-600 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Earnings Overview</h2>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
            <button
              onClick={() => setViewType('monthly')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                viewType === 'monthly'
                  ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-slate-400'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setViewType('yearly')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                viewType === 'yearly'
                  ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-slate-400'
              }`}
            >
              Yearly
            </button>
          </div>
          <Button
            onClick={handleExport}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Current Period Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                This {viewType === 'monthly' ? 'Month' : 'Year'}
              </p>
              <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                ₹{viewType === 'monthly' 
                  ? (currentMonthEarnings?.total_earnings || 0).toLocaleString()
                  : (currentYearEarnings?.total_earnings || 0).toLocaleString()
                }
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Classes Taught</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {viewType === 'monthly' 
                  ? currentMonthEarnings?.total_classes || 0
                  : currentYearEarnings?.total_classes || 0
                }
              </p>
            </div>
            <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Paid</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                ₹{viewType === 'monthly' 
                  ? (currentMonthEarnings?.paid_earnings || 0).toLocaleString()
                  : (currentYearEarnings?.paid_earnings || 0).toLocaleString()
                }
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Pending</p>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                ₹{viewType === 'monthly' 
                  ? (currentMonthEarnings?.pending_earnings || 0).toLocaleString()
                  : (currentYearEarnings?.pending_earnings || 0).toLocaleString()
                }
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          {viewType === 'monthly' ? 'Monthly' : 'Yearly'} Breakdown
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-600">
                <th className="text-left py-2 text-gray-600 dark:text-slate-400">
                  {viewType === 'monthly' ? 'Month' : 'Year'}
                </th>
                <th className="text-right py-2 text-gray-600 dark:text-slate-400">Classes</th>
                <th className="text-right py-2 text-gray-600 dark:text-slate-400">Total</th>
                <th className="text-right py-2 text-gray-600 dark:text-slate-400">Paid</th>
                <th className="text-right py-2 text-gray-600 dark:text-slate-400">Pending</th>
              </tr>
            </thead>
            <tbody>
              {(viewType === 'monthly' ? monthlyEarnings : yearlyEarnings)?.map((item, index) => (
                <tr key={index} className="border-b border-gray-100 dark:border-slate-600 last:border-0">
                  <td className="py-2 font-medium text-gray-900 dark:text-white">
                    {viewType === 'monthly' 
                      ? `${new Date(2024, item.month - 1).toLocaleDateString('en', { month: 'long' })} ${item.year}`
                      : item.year
                    }
                  </td>
                  <td className="text-right py-2 text-gray-600 dark:text-slate-400">
                    {item.total_classes}
                  </td>
                  <td className="text-right py-2 font-medium text-gray-900 dark:text-white">
                    ₹{item.total_earnings.toLocaleString()}
                  </td>
                  <td className="text-right py-2 text-emerald-600 dark:text-emerald-400">
                    ₹{item.paid_earnings.toLocaleString()}
                  </td>
                  <td className="text-right py-2 text-orange-600 dark:text-orange-400">
                    ₹{item.pending_earnings.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {(!monthlyEarnings?.length && !yearlyEarnings?.length) && (
          <div className="text-center py-8 text-gray-500 dark:text-slate-400">
            No earnings data available yet.
          </div>
        )}
      </div>
    </div>
  )
}