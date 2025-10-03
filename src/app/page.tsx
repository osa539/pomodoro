import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950 pt-8 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
            Welcome to Pomodoro Timer
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto">
            Boost your productivity with the Pomodoro Technique
          </p>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          {/* Feature Cards */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="text-4xl mb-4">🏠</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Home</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Your dashboard and overview of productivity stats
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="text-4xl mb-4">⏱️</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Timer</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Focus sessions with customizable work and break intervals
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Leaderboard</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Compare your productivity with friends and stay motivated
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="text-4xl mb-4">👤</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Profile</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Manage your settings and view detailed analytics
            </p>
          </div>
        </div>
        
        <div className="mt-20 text-center">
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-8 sm:p-12 max-w-3xl mx-auto shadow-xl">
            <h2 className="text-3xl sm:text-4xl font-semibold text-blue-900 dark:text-blue-100 mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-blue-800 dark:text-blue-200 mb-8 leading-relaxed">
              The Pomodoro Technique helps you manage time by breaking work into intervals, 
              traditionally 25 minutes in length, separated by short breaks. Stay focused, 
              track your progress, and achieve your goals!
            </p>
            <Link href="/timer">
              <button className="bg-blue-600 dark:bg-blue-500 text-white px-8 py-4 rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                Start Your First Session →
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}