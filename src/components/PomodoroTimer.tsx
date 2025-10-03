import { useEffect, useRef, useState } from 'react'

const FOCUS_DEFAULT = 25
const BREAK_DEFAULT = 5

const PomodoroTimer = () => {
  const [focusDuration, setFocusDuration] = useState(FOCUS_DEFAULT)
  const [breakDuration, setBreakDuration] = useState(BREAK_DEFAULT)
  const [isFocus, setIsFocus] = useState(true)
  const [secondsLeft, setSecondsLeft] = useState(focusDuration * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [sessions, setSessions] = useState<number[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Load sessions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('pomodoro_sessions')
    if (saved) setSessions(JSON.parse(saved))
  }, [])

  // Save sessions to localStorage
  useEffect(() => {
    localStorage.setItem('pomodoro_sessions', JSON.stringify(sessions))
  }, [sessions])

  // Update timer when durations change
  useEffect(() => {
    setSecondsLeft(isFocus ? focusDuration * 60 : breakDuration * 60)
  }, [focusDuration, breakDuration, isFocus])

  // Timer logic
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev > 0) return prev - 1
        // Session complete
        if (isFocus) {
          setSessions((prevSessions) => [...prevSessions, focusDuration])
        }
        setIsFocus((prev) => !prev)
        return isFocus ? breakDuration * 60 : focusDuration * 60
      })
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, isFocus, focusDuration, breakDuration])

  // Format time mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // Handlers
  const handleStart = () => setIsRunning(true)
  const handlePause = () => setIsRunning(false)
  const handleReset = () => {
    setIsRunning(false)
    setSecondsLeft(isFocus ? focusDuration * 60 : breakDuration * 60)
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 mt-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {isFocus ? 'Focus Session' : 'Break'}
        </h2>
        <div className="text-5xl font-mono font-bold text-gray-900 mb-4">
          {formatTime(secondsLeft)}
        </div>
        <div className="flex justify-center space-x-4 mb-4">
          <button
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
            onClick={handleStart}
            disabled={isRunning}
          >
            Start
          </button>
          <button
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            onClick={handlePause}
            disabled={!isRunning}
          >
            Pause
          </button>
          <button
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
            onClick={handleReset}
          >
            Reset
          </button>
        </div>
        <div className="flex justify-center space-x-6 mb-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Focus (min)</label>
            <input
              type="number"
              min={1}
              max={60}
              value={focusDuration}
              onChange={e => setFocusDuration(Number(e.target.value))}
              className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
              disabled={isRunning}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Break (min)</label>
            <input
              type="number"
              min={1}
              max={30}
              value={breakDuration}
              onChange={e => setBreakDuration(Number(e.target.value))}
              className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
              disabled={isRunning}
            />
          </div>
        </div>
      </div>
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Completed Sessions</h3>
        <ul className="list-disc list-inside text-gray-700">
          {sessions.length === 0 ? (
            <li>No sessions yet</li>
          ) : (
            sessions.map((duration, idx) => (
              <li key={idx}>Focus: {duration} min</li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}

export default PomodoroTimer
