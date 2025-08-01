import AsyncStorage from "@react-native-async-storage/async-storage"
import { createClient } from "@supabase/supabase-js"
import "react-native-url-polyfill/auto"

const supabaseUrl = "YOUR_SUPABASE_URL"
const supabaseAnonKey = "YOUR_SUPABASE_ANON_KEY"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

export type Group = {
  id: string
  name: string
  code: string
  created_at: string
}

export type Member = {
  id: string
  group_id: string
  name: string
  created_at: string
}

export type Expense = {
  id: string
  group_id: string
  description: string
  amount: number
  paid_by: string
  category: string
  created_at: string
  updated_at: string
  paid_by_member?: Member
}

export type ExpenseSplit = {
  id: string
  expense_id: string
  member_id: string
  amount: number
  member?: Member
}

export type Balance = {
  member_id: string
  member_name: string
  balance: number
}
