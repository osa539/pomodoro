import { supabase } from './supabase';

export interface PomodoroSession {
  id: string;
  user_id: string;
  duration: number;
  completed_at: string;
  session_type: 'focus' | 'short_break' | 'long_break';
  distractions_detected: number;
  was_completed: boolean;
  created_at: string;
}

export interface UserProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  total_study_time: number;
  total_sessions: number;
  longest_streak: number;
  current_streak: number;
  last_session_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeaderboardEntry {
  id: string;
  display_name: string;
  total_study_time: number;
  total_sessions: number;
  rank: number;
}

// Database operations
export const dbOperations = {
  // User Profile operations
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    return data;
  },

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
    const { error } = await supabase
      .from('user_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
    return true;
  },

  // Session operations
  async createSession(session: Omit<PomodoroSession, 'id' | 'created_at'>): Promise<PomodoroSession | null> {
    const { data, error } = await supabase
      .from('pomodoro_sessions')
      .insert(session)
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
      return null;
    }
    return data;
  },

  async getUserSessions(userId: string, limit: number = 50): Promise<PomodoroSession[]> {
    const { data, error } = await supabase
      .from('pomodoro_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching user sessions:', error);
      return [];
    }
    return data || [];
  },

  async getUserSessionsToday(userId: string): Promise<PomodoroSession[]> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('pomodoro_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('completed_at', `${today}T00:00:00.000Z`)
      .lt('completed_at', `${today}T23:59:59.999Z`)
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('Error fetching today sessions:', error);
      return [];
    }
    return data || [];
  },

  // Leaderboard operations
  async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, display_name, total_study_time, total_sessions')
      .order('total_study_time', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }

    // Add rank to each entry
    return (data || []).map((entry, index) => ({
      ...entry,
      display_name: entry.display_name || 'Anonymous',
      rank: index + 1
    }));
  },

  async getUserRank(userId: string): Promise<number> {
    // Get user's total study time
    const userProfile = await this.getUserProfile(userId);
    if (!userProfile) return 0;

    // Count users with more study time
    const { count, error } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .gt('total_study_time', userProfile.total_study_time);

    if (error) {
      console.error('Error calculating user rank:', error);
      return 0;
    }

    return (count || 0) + 1;
  },

  // Statistics
  async getUserStats(userId: string): Promise<{
    todayMinutes: number;
    todaySessions: number;
    weekMinutes: number;
    monthMinutes: number;
    totalMinutes: number;
    totalSessions: number;
    averageSessionLength: number;
    streak: number;
  }> {
    const profile = await this.getUserProfile(userId);
    const todaySessions = await this.getUserSessionsToday(userId);

    // Calculate today's stats
    const todayMinutes = todaySessions.reduce((total, session) => total + Math.round(session.duration / 60), 0);
    const todaySessionsCount = todaySessions.filter(s => s.session_type === 'focus').length;

    // Calculate week stats
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const { data: weekSessions } = await supabase
      .from('pomodoro_sessions')
      .select('duration')
      .eq('user_id', userId)
      .gte('completed_at', weekAgo.toISOString());

    const weekMinutes = (weekSessions || []).reduce((total, session) => total + Math.round(session.duration / 60), 0);

    // Calculate month stats
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    const { data: monthSessions } = await supabase
      .from('pomodoro_sessions')
      .select('duration')
      .eq('user_id', userId)
      .gte('completed_at', monthAgo.toISOString());

    const monthMinutes = (monthSessions || []).reduce((total, session) => total + Math.round(session.duration / 60), 0);

    const totalMinutes = Math.round((profile?.total_study_time || 0) / 60);
    const totalSessions = profile?.total_sessions || 0;
    const averageSessionLength = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;

    return {
      todayMinutes,
      todaySessions: todaySessionsCount,
      weekMinutes,
      monthMinutes,
      totalMinutes,
      totalSessions,
      averageSessionLength,
      streak: profile?.current_streak || 0
    };
  }
};