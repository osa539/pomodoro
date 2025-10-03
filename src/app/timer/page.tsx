
"use client"
import { useState, useRef, useEffect } from 'react'
import * as cocoSsd from '@tensorflow-models/coco-ssd'
import '@tensorflow/tfjs'
import { useAuth } from '../../contexts/AuthContext'
import { dbOperations } from '../../../lib/database'

const FOCUS = 'Focus'
const BREAK = 'Break'

type DetectionStatus = 'Loading' | 'Studying' | 'Distracted'

function formatTime(secs: number) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}


export default function Timer() {
  const { user } = useAuth()
  const [sessionType, setSessionType] = useState<typeof FOCUS | typeof BREAK>(FOCUS)
  const [focusDuration, setFocusDuration] = useState(25)
  const [breakDuration, setBreakDuration] = useState(5)
  const [secondsLeft, setSecondsLeft] = useState(focusDuration * 60)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Sound for alarm
  const alarmRef = useRef<HTMLAudioElement | null>(null)

  // Webcam
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [webcamEnabled, setWebcamEnabled] = useState(false)
  const [webcamError, setWebcamError] = useState<string | null>(null)
  const [showVideo, setShowVideo] = useState(true) // Always show video container
  
  // Object Detection
  const [detectionStatus, setDetectionStatus] = useState<DetectionStatus>('Loading')
  const [detectedObjects, setDetectedObjects] = useState<string[]>([])
  const modelRef = useRef<cocoSsd.ObjectDetection | null>(null)
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [distractedSeconds, setDistractedSeconds] = useState(0)
  const [studyingSeconds, setStudyingSeconds] = useState(0)

  // Request notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      Notification.requestPermission()
    }
  }, [])

  // Webcam setup
  useEffect(() => {
    let stream: MediaStream | null = null
    let mounted = true

    const startWebcam = async () => {
      // Small delay to ensure video element is mounted
      await new Promise(resolve => setTimeout(resolve, 100))
      
      try {
        console.log('🎥 Step 1: Requesting webcam access...')
        console.log('🎥 videoRef.current:', videoRef.current)
        
        if (!videoRef.current) {
          console.error('❌ Video element not found in DOM!')
          setWebcamError('Video element not ready')
          return
        }
        
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 }
          },
          audio: false 
        })
        
        console.log('✅ Step 2: Webcam access granted!')
        console.log('✅ Stream:', stream)
        console.log('✅ Video tracks:', stream.getVideoTracks())
        console.log('✅ Track settings:', stream.getVideoTracks()[0]?.getSettings())
        
        if (!mounted) {
          console.log('⚠️ Component unmounted, stopping stream')
          stream.getTracks().forEach(track => track.stop())
          return
        }

        if (videoRef.current) {
          console.log('📹 Step 3: Setting srcObject on video element...')
          videoRef.current.srcObject = stream
          
          // Try to play immediately
          try {
            await videoRef.current.play()
            console.log('✅ Step 4: Video playing successfully!')
            setWebcamEnabled(true)
            setWebcamError(null)
          } catch (playErr) {
            console.error('❌ Error playing video:', playErr)
            setWebcamError('Could not play video')
          }
        }
      } catch (err: any) {
        console.error('❌ Error accessing webcam:', err)
        console.error('❌ Error name:', err.name)
        console.error('❌ Error message:', err.message)
        setWebcamError(`Camera error: ${err.message || 'Unknown error'}`)
        setWebcamEnabled(false)
      }
    }

    startWebcam()

    return () => {
      mounted = false
      if (stream) {
        console.log('🛑 Stopping webcam stream')
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  // Load COCO-SSD model
  useEffect(() => {
    const loadModel = async () => {
      try {
        console.log('🤖 Loading COCO-SSD model...')
        const model = await cocoSsd.load()
        modelRef.current = model
        console.log('✅ COCO-SSD model loaded successfully!')
      } catch (err) {
        console.error('❌ Error loading model:', err)
      }
    }
    loadModel()
  }, [])

  // Object detection loop (every 5 seconds)
  useEffect(() => {
    if (!webcamEnabled || !modelRef.current || !videoRef.current) {
      return
    }

    const detectObjects = async () => {
      if (!videoRef.current || !modelRef.current) return

      try {
        const predictions = await modelRef.current.detect(videoRef.current)
        console.log('🔍 Detected objects:', predictions.map(p => `${p.class} (${Math.round(p.score * 100)}%)`))
        
        const objectNames = predictions.map(p => p.class)
        setDetectedObjects(objectNames)

        // Enhanced distraction detection - look for multiple indicators
        const distractionIndicators = [
          'cell phone',
          'phone', 
          'remote',
          'book',
          'laptop',
          'keyboard',
          'mouse',
          'cup',
          'bottle'
        ]
        
        const hasDistraction = objectNames.some(obj => {
          const objLower = obj.toLowerCase()
          return distractionIndicators.some(indicator => objLower.includes(indicator))
        })
        
        // Check for person/face (studying indicator)
        const hasPerson = objectNames.some(obj => 
          obj.includes('person')
        )

        // More lenient detection logic
        if (hasDistraction && hasPerson) {
          // If person is present with objects, check if they're looking at screen
          // For now, we'll use a more nuanced approach
          const highConfidencePhone = predictions.some(p => 
            (p.class.includes('cell phone') || p.class.includes('phone')) && p.score > 0.5
          )
          
          if (highConfidencePhone) {
            setDetectionStatus('Distracted')
            console.log('📱 Phone detected with high confidence - Distracted!')
          } else {
            setDetectionStatus('Studying')
            console.log('📚 Person present, low distraction confidence - Studying!')
          }
        } else if (hasPerson && !hasDistraction) {
          setDetectionStatus('Studying')
          console.log('📚 Person detected, no distractions - Studying!')
        } else if (!hasPerson) {
          // No person detected - assume they're away/distracted
          setDetectionStatus('Distracted')
          console.log('🚫 No person detected - Distracted!')
        } else {
          // Default to studying
          setDetectionStatus('Studying')
        }
      } catch (err) {
        console.error('❌ Detection error:', err)
      }
    }

    // Run detection immediately
    detectObjects()

    // Then run every 5 seconds
    detectionIntervalRef.current = setInterval(detectObjects, 5000)

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current)
      }
    }
  }, [webcamEnabled])

  // Track studying and distracted time (only during focus sessions)
  useEffect(() => {
    if (!isRunning || sessionType !== FOCUS) return

    const trackingInterval = setInterval(() => {
      if (detectionStatus === 'Studying') {
        setStudyingSeconds(prev => prev + 1)
        console.log('📚 +1 studying second')
      } else if (detectionStatus === 'Distracted') {
        setDistractedSeconds(prev => prev + 1)
        console.log('📱 +1 distracted second')
      }
    }, 1000)

    return () => clearInterval(trackingInterval)
  }, [isRunning, sessionType, detectionStatus])

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev > 0) return prev - 1
        // Session ended
        if (sessionType === FOCUS) {
          // Save to Supabase database with actual studying and distracted time
          const actualStudyingMinutes = Math.floor(studyingSeconds / 60)
          const actualDistractedMinutes = Math.floor(distractedSeconds / 60)
          
          // Only save if user is authenticated
          if (user) {
            const sessionData = {
              user_id: user.id,
              duration: studyingSeconds, // Save studying time in seconds
              completed_at: new Date().toISOString(),
              session_type: 'focus' as const,
              distractions_detected: actualDistractedMinutes,
              was_completed: true
            }
            
            console.log('💾 Saving session to database:', sessionData)
            
            // Save to database asynchronously
            dbOperations.createSession(sessionData).then(result => {
              if (result) {
                console.log('✅ Session saved successfully!')
              } else {
                console.error('❌ Failed to save session')
              }
            }).catch(error => {
              console.error('❌ Error saving session:', error)
            })
          } else {
            console.log('⚠️ User not authenticated, session not saved')
          }
          
          // Reset counters
          setDistractedSeconds(0)
          setStudyingSeconds(0)
          // Play alarm sound
          if (alarmRef.current) alarmRef.current.play()
          // Show browser notification
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('Focus session complete!', {
              body: `Take a break for ${breakDuration} minutes.`
            })
          }
          setSessionType(BREAK)
          return breakDuration * 60
        } else {
          // Play alarm sound
          if (alarmRef.current) alarmRef.current.play()
          // Show browser notification
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('Break ended!', {
              body: `Start your next focus session for ${focusDuration} minutes.`
            })
          }
          setSessionType(FOCUS)
          return focusDuration * 60
        }
      })
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, sessionType, focusDuration, breakDuration])

  useEffect(() => {
    setSecondsLeft(sessionType === FOCUS ? focusDuration * 60 : breakDuration * 60)
    setIsRunning(false)
  }, [sessionType, focusDuration, breakDuration])

  const handleStart = () => {
    setIsRunning(true)
    // Only reset counters if starting fresh (not resuming from pause)
    if (secondsLeft === (sessionType === FOCUS ? focusDuration * 60 : breakDuration * 60)) {
      setDistractedSeconds(0)
      setStudyingSeconds(0)
      console.log('▶️ Timer started fresh - counters reset')
    } else {
      console.log('▶️ Timer resumed - counters preserved')
    }
  }
  const handlePause = () => {
    setIsRunning(false)
    console.log('⏸️ Timer paused - counters preserved')
  }
  const handleReset = () => {
    setIsRunning(false)
    setSecondsLeft(sessionType === FOCUS ? focusDuration * 60 : breakDuration * 60)
    setDistractedSeconds(0)
    setStudyingSeconds(0)
    console.log('🔄 Timer reset - counters cleared')
  }

  // Handlers for custom durations
  const handleFocusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(1, Math.min(60, Number(e.target.value)))
    setFocusDuration(val)
    if (sessionType === FOCUS) setSecondsLeft(val * 60)
  }
  const handleBreakChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(1, Math.min(30, Number(e.target.value)))
    setBreakDuration(val)
    if (sessionType === BREAK) setSecondsLeft(val * 60)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950 relative">
      <audio ref={alarmRef} src="/alarm.mp3" preload="auto" />
      
      {/* Debug Info */}
      <div className="fixed top-4 left-4 z-50 bg-black/75 text-white px-3 py-2 rounded text-xs font-mono">
        Webcam: {webcamEnabled ? '✅ Enabled' : '❌ Disabled'}
        {webcamError && <div className="text-red-400">Error: {webcamError}</div>}
      </div>
      
      {/* Webcam Preview - Always render video element */}
      <div className="fixed top-20 right-4 sm:right-8 z-50 group">
        <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white dark:border-gray-700 bg-gray-900">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-40 h-32 sm:w-48 sm:h-36 object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
          {webcamEnabled && (
            <>
              <div className="absolute top-2 left-2 bg-red-500 w-3 h-3 rounded-full animate-pulse"></div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-xs text-center font-medium">Live</p>
              </div>
            </>
          )}
          {!webcamEnabled && (
            <div className="absolute inset-0 flex items-center justify-center text-white text-xs">
              <div className="text-center">
                <div>📹</div>
                <div>Initializing...</div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {webcamError && (
        <div className="fixed top-20 right-4 sm:right-8 z-50">
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-2 rounded-lg shadow-lg text-sm">
            {webcamError}
          </div>
        </div>
      )}

      <div className="w-full max-w-lg mx-auto rounded-2xl shadow-2xl bg-white dark:bg-gray-900 p-10 flex flex-col items-center border border-gray-200 dark:border-gray-800">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-10 tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          🍅 Pomodoro Timer
        </h1>
        <div className="mb-12 relative flex items-center justify-center w-80 h-80">
          {/* Progress Ring */}
          <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 200 200">
            {/* Background ring */}
            <circle
              cx="100"
              cy="100"
              r="75"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-gray-200 dark:text-gray-800"
            />
            {/* Progress ring */}
            <circle
              cx="100"
              cy="100"
              r="75"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 75}
              strokeDashoffset={
                ((sessionType === FOCUS ? focusDuration * 60 : breakDuration * 60) - secondsLeft) /
                (sessionType === FOCUS ? focusDuration * 60 : breakDuration * 60) * (2 * Math.PI * 75)
              }
              className={`${sessionType === FOCUS ? 'text-blue-500 dark:text-blue-400' : 'text-green-500 dark:text-green-400'} transition-all duration-1000`}
              style={{ 
                filter: 'drop-shadow(0 0 6px currentColor)',
                strokeDasharray: `${2 * Math.PI * 75}`,
                strokeDashoffset: ((sessionType === FOCUS ? focusDuration * 60 : breakDuration * 60) - secondsLeft) / (sessionType === FOCUS ? focusDuration * 60 : breakDuration * 60) * (2 * Math.PI * 75)
              }}
            />
          </svg>
          <div className="relative z-10 flex flex-col items-center justify-center max-w-[200px]">
            <span className="text-6xl font-black text-gray-900 dark:text-white tracking-tight tabular-nums text-center" style={{ fontFamily: 'ui-monospace, monospace', letterSpacing: '0.02em' }}>
              {formatTime(secondsLeft)}
            </span>
            <span className="mt-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">
              {sessionType === FOCUS ? '🎯 Focus Mode' : '☕ Break Time'}
            </span>
          </div>
        </div>

        {/* Detection Status Badge */}
        {webcamEnabled && (
          <div className="mb-6">
            {detectionStatus === 'Loading' ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium">
                <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Loading AI...</span>
              </div>
            ) : detectionStatus === 'Studying' ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 border-2 border-green-500 text-green-700 dark:text-green-400 text-sm font-semibold shadow-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>📚 Studying</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-100 dark:bg-red-900/30 border-2 border-red-500 text-red-700 dark:text-red-400 text-sm font-semibold shadow-lg animate-pulse">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>📱 Distracted</span>
              </div>
            )}
            
            {/* Show studying vs distracted time - ONLY during focus mode */}
            {sessionType === FOCUS && (studyingSeconds > 0 || distractedSeconds > 0) && (
              <div className="mt-4 flex gap-6 justify-center bg-gray-50 dark:bg-gray-800 rounded-xl p-4 shadow-inner">
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Studying</span>
                  </div>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400 tabular-nums">{formatTime(studyingSeconds)}</span>
                </div>
                <div className="w-px bg-gray-300 dark:bg-gray-600"></div>
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Distracted</span>
                  </div>
                  <span className="text-2xl font-bold text-red-600 dark:text-red-400 tabular-nums">{formatTime(distractedSeconds)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex space-x-3 mb-6">
          <button
            className={`px-8 py-4 rounded-xl text-white text-base font-bold shadow-lg transition-all transform ${
              isRunning 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 hover:scale-105 hover:shadow-xl active:scale-95'
            } focus:outline-none focus:ring-4 focus:ring-green-300`}
            onClick={handleStart}
            disabled={isRunning}
          >
            ▶️ Start
          </button>
          <button
            className={`px-8 py-4 rounded-xl text-white text-base font-bold shadow-lg transition-all transform ${
              !isRunning 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-orange-500 to-yellow-600 hover:from-orange-600 hover:to-yellow-700 hover:scale-105 hover:shadow-xl active:scale-95'
            } focus:outline-none focus:ring-4 focus:ring-orange-300`}
            onClick={handlePause}
            disabled={!isRunning}
          >
            ⏸️ Pause
          </button>
          <button
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-red-500 to-pink-600 text-white text-base font-bold shadow-lg hover:from-red-600 hover:to-pink-700 transition-all transform hover:scale-105 hover:shadow-xl active:scale-95 focus:outline-none focus:ring-4 focus:ring-red-300"
            onClick={handleReset}
          >
            🔄 Reset
          </button>
        </div>
        {/* Settings Card */}
        <div className="w-full mt-6">
          <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 shadow-lg p-6 flex flex-col items-center border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-5 flex items-center gap-2">
              ⚙️ Duration Settings
            </h2>
            <div className="flex space-x-8">
              <div className="flex flex-col items-center">
                <label htmlFor="focus" className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">🎯 Focus</label>
                <input
                  id="focus"
                  type="number"
                  min={1}
                  max={60}
                  value={focusDuration}
                  onChange={handleFocusChange}
                  className="block w-24 px-4 py-3 rounded-xl border-2 border-blue-300 dark:border-blue-600 focus:ring-4 focus:ring-blue-200 focus:border-blue-500 text-center text-xl font-bold bg-white dark:bg-gray-700 dark:text-white shadow-sm transition-all"
                  disabled={isRunning}
                />
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">minutes</span>
              </div>
              <div className="flex flex-col items-center">
                <label htmlFor="break" className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">☕ Break</label>
                <input
                  id="break"
                  type="number"
                  min={1}
                  max={30}
                  value={breakDuration}
                  onChange={handleBreakChange}
                  className="block w-24 px-4 py-3 rounded-xl border-2 border-green-300 dark:border-green-600 focus:ring-4 focus:ring-green-200 focus:border-green-500 text-center text-xl font-bold bg-white dark:bg-gray-700 dark:text-white shadow-sm transition-all"
                  disabled={isRunning}
                />
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">minutes</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}