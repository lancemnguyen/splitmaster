"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateExpense, getExpenseSplits } from "@/lib/database";
import type { Member, Expense, ExpenseSplit } from "@/lib/supabase";
import { ExpenseForm } from "./expense-form";
import { useFormSubmission } from "@/hooks/use-form-submission";
import { useEffect, useState } from "react";

interface EditExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: Expense | null;
  members: Member[];
  onSuccess: () => void;
}

export function EditExpenseDialog({
  open,
  onOpenChange,
  expense,
  members,
  onSuccess,
}: EditExpenseDialogProps) {
  const [expenseSplits, setExpenseSplits] = useState<ExpenseSplit[]>([]);
  const [loadingSplits, setLoadingSplits] = useState(false);

  const { handleSubmit, isSubmitting } = useFormSubmission(
    async (data: any) => {
      if (!expense) return null;
      return await updateExpense(
        expense.id,
        data.description,
        data.amount,
        data.paidBy,
        data.splits,
        data.category,
        data.splitMethod,
        data.splitConfig
      );
    },
    {
      successMessage: "Expense updated successfully",
      failureMessage: "Failed to update expense",
      onSuccess: () => {
        onOpenChange(false);
        onSuccess();
      },
    }
  );

  useEffect(() => {
    if (expense && open) {
      setLoadingSplits(true);
      getExpenseSplits(expense.id).then((splits) => {
        setExpenseSplits(splits);
        setLoadingSplits(false);
      });
    }
  }, [expense, open]);

  if (!expense) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
        </DialogHeader>
        {loadingSplits ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <ExpenseForm
            expense={expense}
            expenseSplits={expenseSplits}
            members={members}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            onOpenChange={onOpenChange}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
