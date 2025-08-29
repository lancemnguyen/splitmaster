import { supabase } from "./supabase";
import type { Group, Member, Expense, ExpenseSplit, Balance } from "./supabase";

// Group operations
export async function createGroup(name: string): Promise<Group | null> {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();

  const { data, error } = await supabase
    .from("groups")
    .insert({ name, code })
    .select()
    .single();

  if (error) {
    console.error("Error creating group:", error);
    return null;
  }

  return data;
}

export async function getGroupByCode(code: string): Promise<Group | null> {
  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .eq("code", code.toUpperCase())
    .single();

  if (error) return null;
  return data;
}

export async function getGroup(id: string): Promise<Group | null> {
  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export async function updateGroupName(
  groupId: string,
  name: string
): Promise<boolean> {
  const { error } = await supabase
    .from("groups")
    .update({ name })
    .eq("id", groupId);

  if (error) {
    console.error("Error updating group name:", error);
    return false;
  }

  return true;
}

// Member operations
export async function addMember(
  groupId: string,
  name: string
): Promise<Member | null> {
  const { data, error } = await supabase
    .from("members")
    .insert({ group_id: groupId, name })
    .select()
    .single();

  if (error) {
    console.error("Error adding member:", error);
    return null;
  }

  return data;
}

export async function getMembers(groupId: string): Promise<Member[]> {
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("group_id", groupId)
    .order("name");

  if (error) return [];
  return data || [];
}

export async function updateMemberName(
  memberId: string,
  name: string
): Promise<boolean> {
  const { error } = await supabase
    .from("members")
    .update({ name })
    .eq("id", memberId);

  if (error) {
    console.error("Error updating member name:", error);
    return false;
  }

  return true;
}

export async function removeMember(memberId: string): Promise<boolean> {
  // First check if member has any expenses or splits
  const { data: expenses } = await supabase
    .from("expenses")
    .select("id")
    .eq("paid_by", memberId)
    .limit(1);
  const { data: splits } = await supabase
    .from("expense_splits")
    .select("id")
    .eq("member_id", memberId)
    .limit(1);

  if (expenses && expenses.length > 0) {
    console.error("Cannot remove member: has expenses");
    return false;
  }

  if (splits && splits.length > 0) {
    console.error("Cannot remove member: involved in expense splits");
    return false;
  }

  const { error } = await supabase.from("members").delete().eq("id", memberId);

  if (error) {
    console.error("Error removing member:", error);
    return false;
  }

  return true;
}

// Expense operations
export async function addExpense(
  groupId: string,
  description: string,
  amount: number,
  paidBy: string,
  splits: { memberId: string; amount: number }[],
  category = "General",
  splitMethod = "equal",
  splitConfig = {}
): Promise<Expense | null> {
  const { data: expense, error: expenseError } = await supabase
    .from("expenses")
    .insert({
      group_id: groupId,
      description,
      amount,
      paid_by: paidBy,
      category,
      split_method: splitMethod,
      split_config: splitConfig,
    })
    .select()
    .single();

  if (expenseError) {
    console.error("Error adding expense:", expenseError);
    return null;
  }

  // Add splits
  const splitData = splits.map((split) => ({
    expense_id: expense.id,
    member_id: split.memberId,
    amount: split.amount,
  }));

  const { error: splitError } = await supabase
    .from("expense_splits")
    .insert(splitData);

  if (splitError) {
    console.error("Error adding splits:", splitError);
    return null;
  }

  return expense;
}

export async function getExpenses(groupId: string): Promise<Expense[]> {
  const { data, error } = await supabase
    .from("expenses")
    .select(
      `
      *,
      paid_by_member:members!expenses_paid_by_fkey(*)
    `
    )
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data || [];
}

export async function getExpenseSplits(
  expenseId: string
): Promise<ExpenseSplit[]> {
  const { data, error } = await supabase
    .from("expense_splits")
    .select(
      `
      *,
      member:members(*)
    `
    )
    .eq("expense_id", expenseId);

  if (error) return [];
  return data || [];
}

export async function updateExpense(
  expenseId: string,
  description: string,
  amount: number,
  paidBy: string,
  splits: { memberId: string; amount: number }[],
  category = "General",
  splitMethod = "equal",
  splitConfig = {}
): Promise<boolean> {
  // Update expense
  const { error: expenseError } = await supabase
    .from("expenses")
    .update({
      description,
      amount,
      paid_by: paidBy,
      category,
      updated_at: new Date().toISOString(),
      split_method: splitMethod,
      split_config: splitConfig,
    })
    .eq("id", expenseId);

  if (expenseError) {
    console.error("Error updating expense:", expenseError);
    return false;
  }

  // Delete existing splits
  await supabase.from("expense_splits").delete().eq("expense_id", expenseId);

  // Add new splits
  const splitData = splits.map((split) => ({
    expense_id: expenseId,
    member_id: split.memberId,
    amount: split.amount,
  }));

  const { error: splitError } = await supabase
    .from("expense_splits")
    .insert(splitData);

  if (splitError) {
    console.error("Error updating splits:", splitError);
    return false;
  }

  return true;
}

export async function deleteExpense(expenseId: string): Promise<boolean> {
  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", expenseId);

  if (error) {
    console.error("Error deleting expense:", error);
    return false;
  }

  return true;
}

// Balance calculations
export async function getBalances(groupId: string): Promise<Balance[]> {
  const members = await getMembers(groupId);
  const expenses = await getExpenses(groupId);

  const balances: { [memberId: string]: number } = {};

  // Initialize balances
  members.forEach((member) => {
    balances[member.id] = 0;
  });

  // Calculate balances
  for (const expense of expenses) {
    // Add amount paid
    if (balances[expense.paid_by] !== undefined) {
      balances[expense.paid_by] += expense.amount;
    }

    // Subtract splits
    const splits = await getExpenseSplits(expense.id);
    splits.forEach((split) => {
      if (balances[split.member_id] !== undefined) {
        balances[split.member_id] -= split.amount;
      }
    });
  }

  return members.map((member) => ({
    member_id: member.id,
    member_name: member.name,
    balance: balances[member.id] || 0,
  }));
}
