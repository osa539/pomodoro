
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
    setDistractedSeconds(0) // Reset counters when starting
    setStudyingSeconds(0)
    console.log('▶️ Timer started - counters reset')
  }
  const handlePause = () => setIsRunning(false)
  const handleReset = () => {
    setIsRunning(false)
    setSecondsLeft(sessionType === FOCUS ? focusDuration * 60 : breakDuration * 60)
    setDistractedSeconds(0) // Reset counters
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

      <div className="w-full max-w-md mx-auto rounded-xl shadow-2xl bg-white dark:bg-gray-900 p-8 flex flex-col items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 tracking-tight">Pomodoro Timer</h1>
        <div className="mb-12 relative flex items-center justify-center w-72 h-72">
          {/* Progress Ring */}
          <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 90}
              strokeDashoffset={
                ((sessionType === FOCUS ? focusDuration * 60 : breakDuration * 60) - secondsLeft) /
                (sessionType === FOCUS ? focusDuration * 60 : breakDuration * 60) * (2 * Math.PI * 90)
              }
              className="text-blue-600 dark:text-blue-400 transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-7xl font-mono font-bold text-gray-900 dark:text-white tracking-wider">
              {formatTime(secondsLeft)}
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
            {/* Show detected objects in debug mode */}
            {detectedObjects.length > 0 && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Detected: {detectedObjects.slice(0, 3).join(', ')}
              </div>
            )}
            
            {/* Show studying vs distracted time */}
            {isRunning && sessionType === FOCUS && (
              <div className="mt-4 flex gap-4 justify-center">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-gray-700 dark:text-gray-300">
                    Studying: <strong className="text-green-600 dark:text-green-400">{formatTime(studyingSeconds)}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-gray-700 dark:text-gray-300">
                    Distracted: <strong className="text-red-600 dark:text-red-400">{formatTime(distractedSeconds)}</strong>
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex space-x-4 mb-8">
          <button
            className="px-6 py-3 rounded-xl bg-green-600 text-white text-lg font-semibold shadow hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-400"
            onClick={handleStart}
            disabled={isRunning}
          >
            Start
          </button>
          <button
            className="px-6 py-3 rounded-xl bg-gray-600 text-white text-lg font-semibold shadow hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
            onClick={handlePause}
            disabled={!isRunning}
          >
            Pause
          </button>
          <button
            className="px-6 py-3 rounded-xl bg-red-600 text-white text-lg font-semibold shadow hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
            onClick={handleReset}
          >
            Reset
          </button>
        </div>
        <div className="mt-4 text-center">
          <span className="inline-block px-6 py-2 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 font-medium text-lg shadow">
            {sessionType}
          </span>
        </div>
        {/* Settings Card */}
        <div className="w-full mt-8">
          <div className="rounded-xl bg-gray-50 dark:bg-gray-800 shadow p-6 flex flex-col items-center">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Settings</h2>
            <div className="flex space-x-6">
              <div>
                <label htmlFor="focus" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Focus (minutes)</label>
                <input
                  id="focus"
                  type="number"
                  min={1}
                  max={60}
                  value={focusDuration}
                  onChange={handleFocusChange}
                  className="block w-20 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 text-center text-lg bg-white dark:bg-gray-700 dark:text-white shadow-sm"
                  disabled={isRunning}
                />
              </div>
              <div>
                <label htmlFor="break" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Break (minutes)</label>
                <input
                  id="break"
                  type="number"
                  min={1}
                  max={30}
                  value={breakDuration}
                  onChange={handleBreakChange}
                  className="block w-20 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 text-center text-lg bg-white dark:bg-gray-700 dark:text-white shadow-sm"
                  disabled={isRunning}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}