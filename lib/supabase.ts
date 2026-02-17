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
          avatar_url: string | null       
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      pets: {
        Row: {
          id: string
          user_id: string
          name: string
          species: 'dog' | 'cat' | 'rabbit' | 'hamster' | 'guinea_pig' | 'bird' | 'reptile' | 'other'
          breed: string | null
          date_of_birth: string | null
          microchip_id: string | null
          weight: number | null
          medical_notes: string | null    
          avatar_url: string | null       
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
          vaccine_name: string
          vaccine_type: 'core' | 'non-core' | 'booster'
          date_administered: string
          next_due_date: string | null
          status: 'pending' | 'upcoming' | 'overdue' | 'completed'
          clinic_name: string | null
          vet_name: string | null                         
          batch_number: string | null                     
          certificate_url: string | null                  
          notes: string | null
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
          record_type: 'checkup' | 'lab_test' | 'surgery' | 'vaccination' | 'dental' | 'other'
          date: string     
          description: string | null
          file_url: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['medical_records']['Row'], 'id' | 'created_at'>
        Update: never
      }
      audit_logs: {
        Row: {
          id: string
          pet_id: string
          action: 'vaccination_added' | 'vaccination_updated' | 'vaccination_deleted' | 'record_added' | 'record_deleted' | 'pet_added' | 'pet_updated' | 'pet_deleted'  // ✅ typed enum
          user_id: string
          details: Record<string, any> | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'>
        Update: never  // ✅ audit_logs is append-only
      }
    }
  }
}