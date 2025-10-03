"use client"
import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { dbOperations, LeaderboardEntry } from '../../../lib/database'

export default function Leaderboard() {
  const { user } = useAuth()
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([])
  const [userRank, setUserRank] = useState<number>(0)
  const [userStats, setUserStats] = useState<{
    totalMinutes: number;
    totalSessions: number;
  }>({ totalMinutes: 0, totalSessions: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        setLoading(true)
        
        // Fetch leaderboard
        const leaderboard = await dbOperations.getLeaderboard(10)
        setLeaderboardData(leaderboard)
        
        // Fetch user's rank and stats if authenticated
        if (user) {
          const [rank, stats] = await Promise.all([
            dbOperations.getUserRank(user.id),
            dbOperations.getUserStats(user.id)
          ])
          setUserRank(rank)
          setUserStats({
            totalMinutes: stats.totalMinutes,
            totalSessions: stats.totalSessions
          })
        }
      } catch (error) {
        console.error('Error fetching leaderboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboardData()
  }, [user])

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇'
      case 2: return '🥈'
      case 3: return '🥉'
      default: return `${rank}️⃣`
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950 pt-8 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading leaderboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950 pt-8 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            🏆 Leaderboard
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            See how you stack up against other Pomodoro masters
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
          <div className="px-6 py-5 bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700">
            <h3 className="text-xl font-bold text-white">Top Performers</h3>
          </div>
          
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {leaderboardData.length > 0 ? (
              leaderboardData.map((entry) => (
                <div 
                  key={entry.id}
                  className={`px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    user && entry.id === user.id ? 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center mb-2 sm:mb-0">
                    <div className="text-3xl mr-4">{getRankEmoji(entry.rank)}</div>
                    <div>
                      <div className={`font-semibold text-lg ${
                        user && entry.id === user.id 
                          ? 'text-blue-900 dark:text-blue-100' 
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {user && entry.id === user.id ? 'You' : entry.display_name}
                      </div>
                      <div className={`text-sm ${
                        user && entry.id === user.id 
                          ? 'text-blue-600 dark:text-blue-300' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {entry.total_sessions} sessions completed
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-12 sm:ml-0">
                    <div className={`text-xl font-bold ${
                      user && entry.id === user.id 
                        ? 'text-blue-900 dark:text-blue-100' 
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {Math.round(entry.total_study_time / 60).toLocaleString()} min
                    </div>
                    <div className={`text-sm ${
                      user && entry.id === user.id 
                        ? 'text-blue-600 dark:text-blue-300' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      Focus time
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center">
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                  {user ? 'No data yet. Complete some focus sessions to appear on the leaderboard!' : 'Sign in to see the leaderboard!'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Stats Summary - Only show if user is authenticated */}
        {user && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {userRank > 0 ? `${userRank}${userRank === 1 ? 'st' : userRank === 2 ? 'nd' : userRank === 3 ? 'rd' : 'th'}` : '-'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Your Rank</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {userStats.totalMinutes}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Minutes</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {userStats.totalSessions}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Sessions</div>
            </div>
          </div>
        )}

        {/* Call to action for non-authenticated users */}
        {!user && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Join the Competition!
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Sign up to track your progress and compete with other Pomodoro users
            </p>
            <a 
              href="/auth"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Get Started
            </a>
          </div>
        )}
      </div>
    </div>
  )
}