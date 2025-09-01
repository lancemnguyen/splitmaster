"use client";

import { useEffect, Fragment, useState } from "react";
import { getExpenseSplits } from "@/lib/database";
import type { Expense, ExpenseSplit, Member } from "@/lib/supabase";

interface ExpenseSplitInfoProps {
  expense: Expense;
  members: Member[];
  isExpanded: boolean;
}

export function ExpenseSplitInfo({
  expense,
  members,
  isExpanded,
}: ExpenseSplitInfoProps) {
  const [splits, setSplits] = useState<ExpenseSplit[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSplits = async () => {
    if (splits.length === 0) {
      setLoading(true);
      const expenseSplits = await getExpenseSplits(expense.id);
      setSplits(expenseSplits);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isExpanded) {
      loadSplits();
    }
  }, [isExpanded]);
  

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getPercentage = (splitAmount: number) => {
    return ((splitAmount / expense.amount) * 100).toFixed(1);
  };

  if (!isExpanded) {
    return null;
  }

  return (
    <div className="bg-gray-100 rounded-md p-3 text-xs mt-2 w-fit">
      {loading ? (
        <div className="flex items-center justify-center py-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-[1fr_auto] items-center gap-x-8 gap-y-1">
          {splits.map((split) => {
            const member = members.find((m) => m.id === split.member_id);
            return (
              <Fragment key={split.id}>
                <span>{member?.name || "Unknown"}</span>
                <div className="flex items-center justify-self-end gap-2">
                  <span>{formatCurrency(split.amount)}</span>
                  {expense.split_method === "percentage" && (
                    <span className="text-gray-500">
                      ({getPercentage(split.amount)}%)
                    </span>
                  )}
                </div>
              </Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}
