import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase env variables are not set. Auth and history will not work.')
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '')

export type Database = {
  calculations: {
    id: string
    user_id: string
    name: string
    notes: string
    scenario: string
    inputs: Record<string, unknown>
    result: Record<string, unknown>
    created_at: string
  }
}
