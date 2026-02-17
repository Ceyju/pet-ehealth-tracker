import { create } from 'zustand'
import { supabase } from './supabase'

export interface User {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
}

interface AuthStore {
  user: User | null
  loading: boolean
  error: string | null
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, fullName: string) => Promise<void>
  logout: () => Promise<void>
  fetchUser: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: false,
  error: null,

  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  login: async (email: string, password: string) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        set({ user: profile as User, loading: false })
      }
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
      throw error
    }
  },

  signup: async (email: string, password: string, fullName: string) => {
    set({ loading: true, error: null })
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) throw authError

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              email,
              full_name: fullName,
            },
          ])

        if (profileError) throw profileError

        const profile: User = {
          id: authData.user.id,
          email,
          full_name: fullName,
          phone: null,
          address: null,
          city: null,
          state: null,
          zip_code: null,
        }

        set({ user: profile, loading: false })
      }
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
      throw error
    }
  },

  logout: async () => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      set({ user: null, loading: false })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
      throw error
    }
  },

  fetchUser: async () => {
    set({ loading: true })
    try {
      const { data } = await supabase.auth.getSession()

      if (data.session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.session.user.id)
          .single()

        set({ user: profile as User, loading: false })
      } else {
        set({ user: null, loading: false })
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      set({ user: null, loading: false })
    }
  },
}))
