"use client"
import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { dbOperations, PomodoroSession } from '../../../lib/database'

interface UserStats {
  todayMinutes: number
  todaySessions: number
  weekMinutes: number
  monthMinutes: number
  totalMinutes: number
  totalSessions: number
  averageSessionLength: number
  streak: number
}

export default function Profile() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<PomodoroSession[]>([])
  const [userStats, setUserStats] = useState<UserStats>({
    todayMinutes: 0,
    todaySessions: 0,
    weekMinutes: 0,
    monthMinutes: 0,
    totalMinutes: 0,
    totalSessions: 0,
    averageSessionLength: 0,
    streak: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        
        const [stats, recentSessions] = await Promise.all([
          dbOperations.getUserStats(user.id),
          dbOperations.getUserSessions(user.id, 20)
        ])
        
        setUserStats(stats)
        setSessions(recentSessions)
      } catch (error) {
        console.error('Error fetching user data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [user])

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950 pt-8 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-3xl mb-4">
              
            </div>
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Sign In Required
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Please sign in to view your profile and statistics
            </p>
            <a 
              href="/auth"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Sign In
            </a>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950 pt-8 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading your profile...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950 pt-8 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-3xl mb-4">
            
          </div>
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Profile
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Track your productivity and view your stats
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl shadow-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Today</h2>
              <div className="text-3xl"></div>
            </div>
            <div className="text-4xl font-black mb-2">
              {userStats.todayMinutes}
            </div>
            <p className="text-blue-100">Minutes focused</p>
            <div className="text-sm text-blue-200 mt-2">
              {userStats.todaySessions} sessions
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl shadow-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">This Week</h2>
              <div className="text-3xl"></div>
            </div>
            <div className="text-4xl font-black mb-2">
              {userStats.weekMinutes}
            </div>
            <p className="text-green-100">Minutes focused</p>
            <div className="text-sm text-green-200 mt-2">
              {Math.round(userStats.weekMinutes / 60 * 10) / 10} hours
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl shadow-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Average</h2>
              <div className="text-3xl"></div>
            </div>
            <div className="text-4xl font-black mb-2">
              {userStats.averageSessionLength}
            </div>
            <p className="text-orange-100">Min per session</p>
            <div className="text-sm text-orange-200 mt-2">
              From {userStats.totalSessions} sessions
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl shadow-2xl p-8 text-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Total Focus Time</h2>
              <div className="text-4xl"></div>
            </div>
            <div className="text-7xl font-black mb-2 tracking-tight">
              {Math.round(userStats.totalMinutes / 60 * 10) / 10}
            </div>
            <p className="text-purple-100 text-lg">
              Hours of focused work
            </p>
            <div className="mt-6 pt-6 border-t border-purple-300/30">
              <div className="flex justify-between text-sm">
                <span>Total Sessions</span>
                <span className="font-bold">{userStats.totalSessions}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl shadow-2xl p-8 text-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">This Month</h2>
              <div className="text-4xl"></div>
            </div>
            <div className="text-7xl font-black mb-2 tracking-tight">
              {userStats.monthMinutes}
            </div>
            <p className="text-indigo-100 text-lg">
              Minutes this month
            </p>
            <div className="mt-6 pt-6 border-t border-indigo-300/30">
              <div className="flex justify-between text-sm">
                <span>Hours</span>
                <span className="font-bold">{Math.round(userStats.monthMinutes / 60 * 10) / 10}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
             Recent Sessions
          </h2>
          {sessions.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {sessions.filter(s => s.session_type === 'focus').slice(0, 10).map((session) => (
                <div 
                  key={session.id}
                  className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        Focus Session
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(session.completed_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 dark:text-white">
                      {Math.round(session.duration / 60)} min
                    </p>
                    {session.distractions_detected > 0 && (
                      <p className="text-sm text-orange-500">
                        {session.distractions_detected} distractions
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
              <div className="text-6xl mb-4"></div>
              <p className="text-xl">No sessions yet. Start your first Pomodoro timer!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
