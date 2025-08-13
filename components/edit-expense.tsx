"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { updateExpense, getExpenseSplits } from "@/lib/database"
import type { Member, Expense } from "@/lib/supabase"
import { ExpenseForm } from "./expense-form"
import { useFormSubmission } from "@/hooks/use-form-submission"
import { useEffect } from "react"

interface EditExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense: Expense | null
  members: Member[]
  onSuccess: () => void
}

export function EditExpenseDialog({ open, onOpenChange, expense, members, onSuccess }: EditExpenseDialogProps) {
  const { handleSubmit, isSubmitting } = useFormSubmission(
    async (data: any) => {
      if (!expense) return null
      return await updateExpense(
        expense.id,
        data.description,
        data.amount,
        data.paidBy,
        data.splits,
        data.category,
      )
    },
    {
      successMessage: "Expense updated successfully",
      failureMessage: "Failed to update expense",
      onSuccess: () => {
        onOpenChange(false)
        onSuccess()
      },
    },
  )

  // This useEffect is still needed to load initial expense data into the form
  // as the form itself doesn't handle async data loading.
  useEffect(() => {
    if (expense && open) {
      // This part needs to be handled by the parent or passed down to ExpenseForm
      // if ExpenseForm is to be truly self-contained for editing.
      // For now, assuming ExpenseForm will receive `expense` prop and handle its own state init.
    }
  }, [expense, open])

  if (!expense) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
        </DialogHeader>
        <ExpenseForm
          expense={expense}
          members={members}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          onOpenChange={onOpenChange}
        />
      </DialogContent>
    </Dialog>
  )
}
