import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Registration = {
  id: string
  name: string
  email: string
  phone: string
  age: number
  created_at: string
  status: 'pending' | 'approved' | 'rejected'
}

export type Payment = {
  id: string
  registration_id: string
  email: string
  payment_code: string
  amount: number
  proof_url?: string
  created_at: string
  status: 'pending' | 'approved' | 'rejected'
}

export type TestResult = {
  id: string
  payment_id: string
  email: string
  payment_code: string
  test_date: string
  duration: string
  omission_errors: number
  commission_errors: number
  response_time: number
  variability: number
  status: 'in_progress' | 'completed'
}