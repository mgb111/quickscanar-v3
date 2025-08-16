'use client'

interface ProgressBarProps {
  label: string
  value: number
  maxValue?: number
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow'
  showPercentage?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function ProgressBar({ 
  label, 
  value, 
  maxValue = 100, 
  color = 'blue',
  showPercentage = true,
  size = 'md'
}: ProgressBarProps) {
  const percentage = Math.min((value / maxValue) * 100, 100)
  
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    purple: 'bg-purple-600',
    orange: 'bg-orange-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-600'
  }

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {showPercentage && (
          <span className="text-sm text-gray-500">{percentage.toFixed(1)}%</span>
        )}
      </div>
      <div className={`w-full bg-gray-200 rounded-full ${sizeClasses[size]}`}>
        <div 
          className={`${colorClasses[color]} ${sizeClasses[size]} rounded-full transition-all duration-300 ease-in-out`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  )
}
