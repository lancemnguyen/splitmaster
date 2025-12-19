"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";import {
  AlertTriangle,
  ArrowRight,
  Check,
  Loader2,
  TrendingDown,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { addSettlement } from "@/lib/database";
import { toast } from "@/hooks/use-toast";
import type { Balance } from "@/lib/supabase";

interface SimplifyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balances: Balance[];
  groupId: string;
  onSuccess: () => void;
}

interface Transaction {
  from: string;
  to: string;
  amount: number;
}

export function SimplifyDialog({
  open,
  onOpenChange,
  balances,
  groupId,
  onSuccess,
}: SimplifyDialogProps) {
  const [isSettling, setIsSettling] = useState<number | null>(null);
  const [transactionToConfirm, setTransactionToConfirm] = useState<{
    transaction: Transaction;
    index: number;
  } | null>(null);
  const isMobile = useIsMobile();

  const venmoLink = isMobile ? "venmo://" : "https://venmo.com";
  const paypalLink = isMobile ? "paypal://" : "https://paypal.com";

  const membersMap = useMemo(() => {
    const map = new Map<string, string>();
    balances.forEach((b) => map.set(b.member_name, b.member_id));
    return map;
  }, [balances]);

  const handleSettle = async (transaction: Transaction, index: number) => {
    setIsSettling(index);
    const fromMemberId = membersMap.get(transaction.from);
    const toMemberId = membersMap.get(transaction.to);

    if (!fromMemberId || !toMemberId) {
      toast({
        title: "Error",
        description: "Could not find member information to create settlement.",
        variant: "destructive",
      });
      setIsSettling(null);
      return;
    }

    const settlement = await addSettlement({
      groupId,
      fromMemberId,
      toMemberId,
      amount: transaction.amount,
    });

    if (settlement) {
      toast({ title: "Success", description: "Settlement recorded." });
      onSuccess();
      onOpenChange(false);
    } else {
      toast({
        title: "Error",
        description: "Failed to record settlement.",
        variant: "destructive",
      });
    }
    setIsSettling(null);
  };

  const handleConfirmSettle = async () => {
    if (!transactionToConfirm) return;

    await handleSettle(
      transactionToConfirm.transaction,
      transactionToConfirm.index
    );
    setTransactionToConfirm(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const { transactions, savings } = useMemo(() => {
    // Calculate simplified transactions using greedy algorithm
    // Create working copies of balances
    const creditors = balances
      .filter((b) => b.balance > 0.01) // Only include significant positive balances
      .map((b) => ({ ...b }))
      .sort((a, b) => b.balance - a.balance); // Sort by balance descending

    const debtors = balances
      .filter((b) => b.balance < -0.01) // Only include significant negative balances
      .map((b) => ({ ...b, balance: Math.abs(b.balance) })) // Make balance positive for easier calculation
      .sort((a, b) => b.balance - a.balance); // Sort by debt descending

    const transactions: Transaction[] = [];
    let creditorIndex = 0;
    let debtorIndex = 0;

    // Greedy algorithm to minimize transactions
    while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
      const creditor = creditors[creditorIndex];
      const debtor = debtors[debtorIndex];

      // Calculate the transaction amount (minimum of what's owed and what's due)
      const transactionAmount = Math.min(creditor.balance, debtor.balance);

      if (transactionAmount > 0.01) {
        // Only create transaction if amount is significant
        transactions.push({
          from: debtor.member_name,
          to: creditor.member_name,
          amount: transactionAmount,
        });

        // Update balances
        creditor.balance -= transactionAmount;
        debtor.balance -= transactionAmount;
      }

      // Move to next creditor or debtor if current one is settled
      if (creditor.balance < 0.01) creditorIndex++;
      if (debtor.balance < 0.01) debtorIndex++;
    }

    // Calculate savings (naive approach would be each debtor pays each creditor they owe)
    const totalDebtors = balances.filter((b) => b.balance < -0.01).length;
    const totalCreditors = balances.filter((b) => b.balance > 0.01).length;
    const naiveTransactions = totalDebtors * totalCreditors;
    const savings = Math.max(0, naiveTransactions - transactions.length);

    return { transactions, savings };
  }, [balances]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-emerald-600" />
            {savings > 0 ? (
              <span>
                {`Reduced by ${savings} transaction${savings !== 1 ? "s" : ""}`}
              </span>
            ) : (
              "Simplified Transactions"
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {transactions.length > 0 ? (
            <>
              <div className="bg-yellow-100/60 p-3 rounded-lg border border-yellow-200/80">
                <p className="text-xs sm:text-sm text-yellow-700">
                  {transactions.length} transaction
                  {transactions.length !== 1 ? "s" : ""} needed to settle all
                  debts
                </p>
              </div>

              <p className="text-xs sm:text-sm text-muted-foreground px-1 text-right">
                Click the checkmark to settle up after all expenses are in and you have paid.
              </p>

              <div className="space-y-3">
                {transactions.map((transaction, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Card className="flex-grow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-sm">
                              {transaction.from}
                            </span>
                            <div className="flex flex-col items-center">
                              <ArrowRight className="h-4 w-12 text-gray-400" />
                              <span className="text-xs text-gray-500 -mt-1">
                                pays
                              </span>
                            </div>
                            <span className="font-medium text-sm">
                              {transaction.to}
                            </span>
                          </div>
                          <div className="text-lg font-semibold text-green-600">
                            {formatCurrency(transaction.amount)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setTransactionToConfirm({ transaction, index })
                      }
                      disabled={isSettling !== null}
                      className="px-2.5"
                      aria-label={`Settle transaction from ${transaction.from} to ${transaction.to}`}
                    >
                      {isSettling === index ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600 text-center">
                  💡 This is the most efficient way to settle all debts with the
                  minimum number of transactions.
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingDown className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">
                All Settled Up!
              </h3>
              <p className="text-gray-500">
                Everyone's balances are even.
              </p>
              <p className="text-sm text-gray-400 mt-1">
                No transactions needed.
              </p>
            </div>
          )}

          <div className="pt-4 border-t">
            {transactions.length > 0 && (
              <div className="text-center mb-4">
                <span className="text-sm text-muted-foreground">
                  Settle up with
                </span>
                <div className="flex justify-center items-center gap-4 mt-1">
                  <a
                    href={paypalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-opacity hover:opacity-80"
                  >
                    <Image
                      src="/paypal-icon.png"
                      alt="PayPal"
                      width={36}
                      height={36}
                      className="object-contain"
                    />
                  </a>
                  <a
                    href={venmoLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-opacity hover:opacity-80"
                  >
                    <Image
                      src="/venmo-icon.png"
                      alt="Venmo"
                      width={36}
                      height={36}
                      className="object-contain"
                    />
                  </a>
                </div>
              </div>
            )}
            <div className="flex justify-end">
              <Button
                onClick={() => onOpenChange(false)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={!!transactionToConfirm}
        onOpenChange={(open) => !open && setTransactionToConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader className="text-center">
            <AlertDialogTitle className="flex items-center justify-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              Mark transaction as settled?
            </AlertDialogTitle>
          </AlertDialogHeader>
          {transactionToConfirm && (
            <div className="font-semibold bg-gray-100 dark:bg-gray-800 p-3 rounded-md text-gray-800 dark:text-gray-200 text-center">
              {transactionToConfirm.transaction.from}{" "}
              <span className="font-normal">paid</span>{" "}
              {transactionToConfirm.transaction.to}
              <span className="font-bold text-green-600 ml-4">
                {formatCurrency(transactionToConfirm.transaction.amount)}
              </span>
            </div>
          )}
          <AlertDialogDescription className="flex items-center justify-center gap-1">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex justify-end space-x-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setTransactionToConfirm(null)}
              disabled={isSettling !== null}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSettle}
              disabled={isSettling !== null}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSettling === transactionToConfirm?.index ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Confirm"
              )}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
