"use client"
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the hash fragment from the URL (contains auth tokens)
        const hashFragment = window.location.hash.substring(1)
        const params = new URLSearchParams(hashFragment)
        
        if (params.get('type') === 'signup') {
          // This is an email confirmation
          const { data, error } = await supabase.auth.getSession()
          
          if (error) {
            console.error('Error during auth callback:', error)
            router.push('/auth?error=' + encodeURIComponent(error.message))
            return
          }

          if (data.session) {
            // User is successfully verified and logged in
            router.push('/timer')
          } else {
            // Something went wrong
            router.push('/auth?error=' + encodeURIComponent('Authentication failed'))
          }
        } else {
          // Other auth types, redirect to timer
          router.push('/timer')
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        router.push('/auth?error=' + encodeURIComponent('Authentication failed'))
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🍅</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Verifying your account...
        </h1>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-gray-600 dark:text-gray-300 mt-4">
          Please wait while we confirm your email address.
        </p>
      </div>
    </div>
  )
}