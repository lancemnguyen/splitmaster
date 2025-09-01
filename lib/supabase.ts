import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

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
  split_method: string
  split_config?: Record<string, any>
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

export type Settlement = {
  id: string
  group_id: string
  from_member_id: string
  to_member_id: string
  amount: number
  created_at: string
}