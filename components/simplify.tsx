"use client";

import { useMemo } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, TrendingDown } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Balance } from "@/lib/supabase";

interface SimplifyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balances: Balance[];
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
}: SimplifyDialogProps) {
  const isMobile = useIsMobile();

  const venmoLink = isMobile ? "venmo://" : "https://venmo.com";
  const paypalLink = isMobile ? "paypal://" : "https://paypal.com";

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const { transactions, savings } = useMemo(() => {
    const creditors = balances
      .filter((b) => b.balance > 0.01)
      .map((b) => ({ ...b }))
      .sort((a, b) => b.balance - a.balance);

    const debtors = balances
      .filter((b) => b.balance < -0.01)
      .map((b) => ({ ...b, balance: Math.abs(b.balance) }))
      .sort((a, b) => b.balance - a.balance);

    const transactions: Transaction[] = [];
    let creditorIndex = 0;
    let debtorIndex = 0;

    while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
      const creditor = creditors[creditorIndex];
      const debtor = debtors[debtorIndex];

      const transactionAmount = Math.min(creditor.balance, debtor.balance);

      if (transactionAmount > 0.01) {
        transactions.push({
          from: debtor.member_name,
          to: creditor.member_name,
          amount: transactionAmount,
        });

        creditor.balance -= transactionAmount;
        debtor.balance -= transactionAmount;
      }

      if (creditor.balance <= 0.01) creditorIndex++;
      if (debtor.balance <= 0.01) debtorIndex++;
    }

    const totalDebtors = balances.filter((b) => b.balance < -0.01).length;
    const totalCreditors = balances.filter((b) => b.balance > 0.01).length;
    const naiveTransactions = totalDebtors * totalCreditors;
    const savings = Math.max(0, naiveTransactions - transactions.length);

    return { transactions, savings };
  }, [balances]);

  return (
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

              <div className="space-y-3">
                {transactions.map((transaction, index) => (
                  <Card key={index}>
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
              <p className="text-gray-500">Everyone's balances are even.</p>
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
  );
}
