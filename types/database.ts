export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

type Relationship = { foreignKeyName: string; columns: string[]; isOneToOne: boolean; referencedRelation: string; referencedColumns: string[] }
type Table<Row, Insert = Partial<Row>, Update = Partial<Insert>, Relationships extends Relationship[] = []> = {
  Row: Row
  Insert: Insert
  Update: Update
  Relationships: Relationships
}

export interface Database {
  public: {
    Tables: {
      profiles: Table<{
        id: string; email: string; full_name: string | null; avatar_url: string | null
        phone: string | null; address: string | null; city: string | null; state: string | null
        zip_code: string | null; timezone: string; created_at: string; updated_at: string
      }>
      pets: Table<{
        id: string; user_id: string; name: string; species: string; breed: string | null
        date_of_birth: string | null; microchip_id: string | null; weight: number | null
        medical_notes: string | null; avatar_url: string | null; photo_url: string | null
        is_dewormed: boolean; deworming_date: string | null; deworming_location: string | null
        created_at: string; updated_at: string
      }>
      vaccinations: Table<{
        id: string; pet_id: string; vaccine_name: string; vaccine_type: 'core' | 'non-core' | 'booster'
        date_administered: string; expiry_date: string | null; next_due_date: string | null; status: string
        clinic_name: string | null; vet_name: string | null; batch_number: string | null
        certificate_url: string | null; notes: string | null; is_verified: boolean | null
        provenance: 'owner_reported'; created_at: string; updated_at: string
      }, Partial<{
        id: string; pet_id: string; vaccine_name: string; vaccine_type: 'core' | 'non-core' | 'booster'
        date_administered: string; expiry_date: string | null; next_due_date: string | null; status: string
        clinic_name: string | null; vet_name: string | null; batch_number: string | null
        certificate_url: string | null; notes: string | null; is_verified: boolean | null
        provenance: 'owner_reported'; created_at: string; updated_at: string
      }>, Partial<{
        id: string; pet_id: string; vaccine_name: string; vaccine_type: 'core' | 'non-core' | 'booster'
        date_administered: string; expiry_date: string | null; next_due_date: string | null; status: string
        clinic_name: string | null; vet_name: string | null; batch_number: string | null
        certificate_url: string | null; notes: string | null; is_verified: boolean | null
        provenance: 'owner_reported'; created_at: string; updated_at: string
      }>, [{ foreignKeyName: 'vaccinations_pet_id_fkey'; columns: ['pet_id']; isOneToOne: false; referencedRelation: 'pets'; referencedColumns: ['id'] }]>
      medical_records: Table<{
        id: string; pet_id: string; record_type: string; date: string; title: string; occurred_on: string
        description: string | null; provider_name: string | null; file_url: string | null
        created_at: string; updated_at: string
      }>
      medical_record_attachments: Table<{
        id: string; record_id: string; storage_path: string; mime_type: string
        byte_size: number; original_name: string; created_at: string
      }>
      reminders: Table<{
        id: string; user_id: string; pet_id: string | null; source_type: string | null
        source_id: string | null; title: string; notes: string | null; due_at: string
        recurrence: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'; status: 'scheduled' | 'completed' | 'dismissed'
        channels: string[]; created_at: string; updated_at: string
      }>
      notification_deliveries: Table<{
        id: string; reminder_id: string; channel: string; scheduled_for: string
        status: 'pending' | 'sent' | 'failed'; attempted_at: string | null
        provider_message_id: string | null; error_message: string | null; created_at: string
      }>
      telegram_connections: Table<{
        id: string; user_id: string; chat_id: string | null; telegram_username: string | null
        connection_token_hash: string | null; token_expires_at: string | null
        connected_at: string | null; revoked_at: string | null; created_at: string; updated_at: string
      }>
      share_links: Table<{
        id: string; owner_id: string; pet_id: string; token_hash: string
        allowed_sections: string[]; expires_at: string | null; revoked_at: string | null
        last_accessed_at: string | null; created_at: string
      }>
      audit_logs: Table<{
        id: string; pet_id: string; action: string; user_id: string
        details: Json | null; created_at: string
      }>
    }
    Views: Record<string, never>
    Functions: {
      resolve_pet_share: {
        Args: { p_token_hash: string }
        Returns: Json
      }
      delete_current_account: {
        Args: Record<string, never>
        Returns: undefined
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
