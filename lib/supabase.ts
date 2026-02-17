import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          address: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      pets: {
        Row: {
          id: string
          user_id: string
          name: string
          species: string
          breed: string | null
          date_of_birth: string | null
          weight: number | null
          microchip_id: string | null
          photo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['pets']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['pets']['Insert']>
      }
      vaccinations: {
        Row: {
          id: string
          pet_id: string
          user_id: string
          vaccine_name: string
          vaccination_date: string
          expiry_date: string | null
          next_due_date: string
          clinic_name: string | null
          notes: string | null
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['vaccinations']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['vaccinations']['Insert']>
      }
      medical_records: {
        Row: {
          id: string
          pet_id: string
          user_id: string
          record_type: string
          record_date: string
          description: string
          clinic_name: string | null
          document_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['medical_records']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['medical_records']['Insert']>
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string
          action: string
          table_name: string
          record_id: string
          old_values: Record<string, any> | null
          new_values: Record<string, any> | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'>
        Update: never
      }
    }
  }
}
