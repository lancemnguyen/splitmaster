"use client";

import { useState, useEffect, Fragment } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { getExpenseSplits } from "@/lib/database";
import type { Expense, ExpenseSplit, Member } from "@/lib/supabase";

interface ExpenseSplitInfoProps {
  expense: Expense;
  members: Member[];
}

export function ExpenseSplitInfo({ expense, members }: ExpenseSplitInfoProps) {
  const [splits, setSplits] = useState<ExpenseSplit[]>([]);
  const [showDetails, setShowDetails] = useState(false);
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
    if (showDetails) {
      loadSplits();
    }
  }, [showDetails]);

  const getSplitMethodDisplay = () => {
    switch (expense.split_method) {
      case "percentage":
        return "Split by %";
      case "amount":
        return "Split by amount";
      case "equal":
      default:
        return "Split equally";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getPercentage = (splitAmount: number) => {
    return ((splitAmount / expense.amount) * 100).toFixed(1);
  };

  return (
    <div className="mt-2">
      <div className="flex w-full max-w-[240px] items-center justify-between mb-2">
        <Badge variant="secondary" className="text-xs font-normal">
          {getSplitMethodDisplay()}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="h-6 px-2 text-xs"
        >
          {showDetails ? (
            <>
              Hide details <ChevronUp className="h-3 w-3 ml-1" />
            </>
          ) : (
            <>
              Show details <ChevronDown className="h-3 w-3 ml-1" />
            </>
          )}
        </Button>
      </div>

      {showDetails && (
        <div className="bg-gray-100 rounded-md p-3 text-xs w-fit">
          {loading ? (
            <div className="flex items-center justify-center py-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-[1fr_auto] items-center gap-x-8 gap-y-1">
              <div className="font-medium text-gray-700 mb-2 col-span-2">
                Split breakdown:
              </div>
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
      )}
    </div>
  );
}
