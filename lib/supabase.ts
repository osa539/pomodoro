import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface User {
  id: string
  email: string
  username: string
  created_at: string
}

export interface Session {
  id: string
  user_id: string
  date: string
  focus_minutes: number
  distracted_minutes: number
  created_at: string
}

export interface LeaderboardEntry {
  user_id: string
  username: string
  total_focus_minutes: number
  total_sessions: number
  rank: number
}