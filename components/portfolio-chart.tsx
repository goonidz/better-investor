'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Holding } from './holdings-table'

interface PortfolioChartProps {
  holdings: Holding[]
  viewMode: 'holdings' | 'sectors'
}

// Monochromatic palette
const COLORS = [
  '#18181b',
  '#3f3f46',
  '#52525b',
  '#71717a',
  '#a1a1aa',
  '#d4d4d8',
]

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const percentage = ((payload[0].value / payload[0].payload.total) * 100).toFixed(1)
    return (
      <div className="bg-zinc-900 text-white px-3 py-2 rounded-lg text-sm shadow-xl">
        <p className="font-medium">{payload[0].name}</p>
        <p className="text-zinc-400">
          €{payload[0].value.toLocaleString('en-US', { minimumFractionDigits: 2 })} · {percentage}%
        </p>
      </div>
    )
  }
  return null
}

export function PortfolioChart({ holdings, viewMode }: PortfolioChartProps) {
  if (holdings.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-zinc-400">
        No data
      </div>
    )
  }

  // Calculate value: prefer current_value, then current_price * qty, then avg_price * qty
  const getValue = (h: Holding) => {
    if (h.current_value) return h.current_value
    if (h.current_price) return h.quantity * h.current_price
    if (h.avg_price) return h.quantity * h.avg_price
    return 0
  }

  const total = holdings.reduce((sum, h) => sum + getValue(h), 0)

  let chartData: { name: string; value: number; total: number }[]

  if (viewMode === 'sectors') {
    // Aggregate by sector
    const sectorMap = new Map<string, number>()
    
    holdings.forEach(h => {
      const sector = h.sector || 'Other'
      const value = getValue(h)
      sectorMap.set(sector, (sectorMap.get(sector) || 0) + value)
    })

    chartData = Array.from(sectorMap.entries())
      .map(([name, value]) => ({ name, value, total }))
      .sort((a, b) => b.value - a.value)
  } else {
    // Group by holdings
    chartData = holdings
      .map(h => ({
        name: h.name,
        value: getValue(h),
        total
      }))
      .sort((a, b) => b.value - a.value)
  }

  const top5 = chartData.slice(0, 5)
  const othersValue = chartData.slice(5).reduce((sum, item) => sum + item.value, 0)

  const finalData = othersValue > 0 
    ? [...top5, { name: 'Others', value: othersValue, total }]
    : top5

  return (
    <div className="h-full flex items-center">
      <div className="w-1/2 h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={finalData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {finalData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="w-1/2 pl-8 space-y-2">
        {finalData.map((item, index) => {
          const percentage = ((item.value / total) * 100).toFixed(1)
          return (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-zinc-600 truncate max-w-[120px]">{item.name}</span>
              </div>
              <span className="font-medium text-zinc-900">{percentage}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
