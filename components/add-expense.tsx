"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { addExpense } from "@/lib/database"
import type { Member } from "@/lib/supabase"
import { ExpenseForm } from "./expense-form"
import { useFormSubmission } from "@/hooks/use-form-submission"

interface AddExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: string
  members: Member[]
  onSuccess: () => void
}

export function AddExpenseDialog({ open, onOpenChange, groupId, members, onSuccess }: AddExpenseDialogProps) {
  const { handleSubmit, isSubmitting } = useFormSubmission(
    async (data: any) => {
      return await addExpense(
        groupId,
        data.description,
        data.amount,
        data.paidBy,
        data.splits,
        data.category,
        data.splitMethod,
        data.splitConfig,
      )
    },
    {
      successMessage: "Expense added successfully",
      failureMessage: "Failed to add expense",
      onSuccess: () => {
        onOpenChange(false)
        onSuccess()
      },
    },
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
        </DialogHeader>
        <ExpenseForm
          members={members}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          onOpenChange={onOpenChange}
        />
      </DialogContent>
    </Dialog>
  )
}
