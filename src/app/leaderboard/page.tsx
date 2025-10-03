export default function Leaderboard() {
  const leaderboardData = [
    { rank: 1, emoji: '🥇', name: 'Alex Chen', sessions: 42, minutes: 1050 },
    { rank: 2, emoji: '🥈', name: 'Sarah Wilson', sessions: 38, minutes: 950 },
    { rank: 3, emoji: '🥉', name: 'Mike Johnson', sessions: 35, minutes: 875 },
    { rank: 4, emoji: '4️⃣', name: 'Emma Davis', sessions: 32, minutes: 800 },
    { rank: 5, emoji: '5️⃣', name: 'James Brown', sessions: 30, minutes: 750 },
  ]

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
            <h3 className="text-xl font-bold text-white">Weekly Rankings</h3>
          </div>
          
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {leaderboardData.map((entry) => (
              <div 
                key={entry.rank}
                className="px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center mb-2 sm:mb-0">
                  <div className="text-3xl mr-4">{entry.emoji}</div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white text-lg">{entry.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{entry.sessions} sessions completed</div>
                  </div>
                </div>
                <div className="text-right ml-12 sm:ml-0">
                  <div className="text-xl font-bold text-gray-900 dark:text-white">{entry.minutes.toLocaleString()} min</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Focus time</div>
                </div>
              </div>
            ))}
            
            {/* Current User */}
            <div className="px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-blue-50 dark:bg-blue-900/30 border-t-4 border-blue-500">
              <div className="flex items-center mb-2 sm:mb-0">
                <div className="text-3xl mr-4">🎯</div>
                <div>
                  <div className="font-bold text-blue-900 dark:text-blue-100 text-lg">You</div>
                  <div className="text-sm text-blue-600 dark:text-blue-300">28 sessions completed</div>
                </div>
              </div>
              <div className="text-right ml-12 sm:ml-0">
                <div className="text-xl font-bold text-blue-900 dark:text-blue-100">700 min</div>
                <div className="text-sm text-blue-600 dark:text-blue-300">Focus time</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">12th</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Your Rank</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">+5</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">From Last Week</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">156</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Users</div>
          </div>
        </div>
      </div>
    </div>
  )
}