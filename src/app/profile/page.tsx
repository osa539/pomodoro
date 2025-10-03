"use client"
import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface Session {
  date: string
  focusMinutes: number
  distractedMinutes: number
}

interface ChartData {
  date: string
  focusMinutes: number
}

export default function Profile() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [totalPomodoroHours, setTotalPomodoroHours] = useState(0)
  const [totalFocusHours, setTotalFocusHours] = useState(0)
  const [chartData, setChartData] = useState<ChartData[]>([])

  useEffect(() => {
    // Fetch sessions from localStorage
    const storedSessions = localStorage.getItem('pomodoro_sessions')
    if (storedSessions) {
      const parsedSessions: Session[] = JSON.parse(storedSessions)
      setSessions(parsedSessions)

      // Calculate total hours
      const totalFocusMinutes = parsedSessions.reduce((sum, session) => sum + session.focusMinutes, 0)
      const totalDistractedMinutes = parsedSessions.reduce((sum, session) => sum + session.distractedMinutes, 0)
      const totalMinutes = totalFocusMinutes + totalDistractedMinutes

      setTotalPomodoroHours(Math.round((totalMinutes / 60) * 10) / 10) // Round to 1 decimal
      setTotalFocusHours(Math.round((totalFocusMinutes / 60) * 10) / 10)

      // Prepare chart data for last 7 days
      const last7Days = getLast7Days()
      const chartDataMap = new Map<string, number>()

      // Initialize all days with 0
      last7Days.forEach(day => {
        chartDataMap.set(day, 0)
      })

      // Aggregate focus minutes by day
      parsedSessions.forEach(session => {
        const sessionDate = new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        const dayKey = last7Days.find(day => day === sessionDate)
        if (dayKey) {
          chartDataMap.set(dayKey, (chartDataMap.get(dayKey) || 0) + session.focusMinutes)
        }
      })

      // Convert to array for Recharts
      const chartDataArray = last7Days.map(day => ({
        date: day,
        focusMinutes: chartDataMap.get(day) || 0
      }))

      setChartData(chartDataArray)
    }
  }, [])

  const getLast7Days = (): string[] => {
    const days: string[] = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      days.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
    }
    return days
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950 pt-8 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-3xl mb-4">
            👤
          </div>
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Profile
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Track your productivity and view your stats
          </p>
        </div>
        
        {/* Statistics Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Total Pomodoro Hours */}
          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl shadow-2xl p-8 text-white transform hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Total Pomodoro Hours</h2>
              <div className="text-4xl">🍅</div>
            </div>
            <div className="text-7xl font-black mb-2 tracking-tight">
              {totalPomodoroHours}
            </div>
            <p className="text-purple-100 text-lg">
              Hours spent in Pomodoro sessions
            </p>
            <div className="mt-6 pt-6 border-t border-purple-300/30">
              <div className="flex justify-between text-sm">
                <span>Total Sessions</span>
                <span className="font-bold">{sessions.length}</span>
              </div>
            </div>
          </div>

          {/* Total Focus Hours */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl shadow-2xl p-8 text-white transform hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Total Focus Hours</h2>
              <div className="text-4xl">📚</div>
            </div>
            <div className="text-7xl font-black mb-2 tracking-tight">
              {totalFocusHours}
            </div>
            <p className="text-green-100 text-lg">
              Hours of actual focused work
            </p>
            <div className="mt-6 pt-6 border-t border-green-300/30">
              <div className="flex justify-between text-sm">
                <span>Productivity Rate</span>
                <span className="font-bold">
                  {totalPomodoroHours > 0 ? Math.round((totalFocusHours / totalPomodoroHours) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            📈 Focus Minutes - Last 7 Days
          </h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis 
                  dataKey="date" 
                  stroke="#6B7280"
                  style={{ fontSize: '14px', fontWeight: 'bold' }}
                />
                <YAxis 
                  stroke="#6B7280"
                  style={{ fontSize: '14px', fontWeight: 'bold' }}
                  label={{ value: 'Minutes', angle: -90, position: 'insideLeft', style: { fill: '#6B7280' } }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: 'none', 
                    borderRadius: '12px',
                    color: '#fff',
                    padding: '12px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                  }}
                  labelStyle={{ color: '#9CA3AF', fontWeight: 'bold' }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="circle"
                />
                <Line 
                  type="monotone" 
                  dataKey="focusMinutes" 
                  stroke="#10B981" 
                  strokeWidth={4}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, fill: '#059669' }}
                  name="Focus Minutes"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-xl">No data yet. Complete some Pomodoro sessions to see your progress!</p>
            </div>
          )}
        </div>

        {/* Recent Sessions */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            🕐 Recent Sessions
          </h2>
          {sessions.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {sessions.slice(-10).reverse().map((session, index) => (
                <div 
                  key={index}
                  className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(session.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {session.focusMinutes}m
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Focused</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {session.distractedMinutes}m
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Distracted</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <div className="text-6xl mb-4">🎯</div>
              <p className="text-xl">No sessions yet. Start your first Pomodoro session!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}