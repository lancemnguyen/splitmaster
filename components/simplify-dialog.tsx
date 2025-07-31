"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, TrendingDown } from "lucide-react"
import type { Balance } from "@/lib/supabase"

interface SimplifyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  balances: Balance[]
}

interface Transaction {
  from: string
  to: string
  amount: number
}

export function SimplifyDialog({ open, onOpenChange, balances }: SimplifyDialogProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  // Calculate simplified transactions using greedy algorithm
  const calculateSimplifiedTransactions = (): { transactions: Transaction[]; savings: number } => {
    // Create working copies of balances
    const creditors = balances
      .filter((b) => b.balance > 0.01) // Only include significant positive balances
      .map((b) => ({ ...b }))
      .sort((a, b) => b.balance - a.balance) // Sort by balance descending

    const debtors = balances
      .filter((b) => b.balance < -0.01) // Only include significant negative balances
      .map((b) => ({ ...b, balance: Math.abs(b.balance) })) // Make balance positive for easier calculation
      .sort((a, b) => b.balance - a.balance) // Sort by debt descending

    const transactions: Transaction[] = []
    let creditorIndex = 0
    let debtorIndex = 0

    // Greedy algorithm to minimize transactions
    while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
      const creditor = creditors[creditorIndex]
      const debtor = debtors[debtorIndex]

      // Calculate the transaction amount (minimum of what's owed and what's due)
      const transactionAmount = Math.min(creditor.balance, debtor.balance)

      if (transactionAmount > 0.01) {
        // Only create transaction if amount is significant
        transactions.push({
          from: debtor.member_name,
          to: creditor.member_name,
          amount: transactionAmount,
        })

        // Update balances
        creditor.balance -= transactionAmount
        debtor.balance -= transactionAmount
      }

      // Move to next creditor or debtor if current one is settled
      if (creditor.balance < 0.01) creditorIndex++
      if (debtor.balance < 0.01) debtorIndex++
    }

    // Calculate savings (naive approach would be each debtor pays each creditor they owe)
    const totalDebtors = balances.filter((b) => b.balance < -0.01).length
    const totalCreditors = balances.filter((b) => b.balance > 0.01).length
    const naiveTransactions = Math.min(totalDebtors * totalCreditors, totalDebtors + totalCreditors - 1)
    const savings = Math.max(0, naiveTransactions - transactions.length)

    return { transactions, savings }
  }

  const { transactions, savings } = calculateSimplifiedTransactions()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Simplify Transactions
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {transactions.length > 0 ? (
            <>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-900">Optimization Result</span>
                  {savings > 0 && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Saved {savings} transaction{savings !== 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-blue-700">
                  {transactions.length} transaction{transactions.length !== 1 ? "s" : ""} needed to settle all debts
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Simplified Transactions:</h3>
                {transactions.map((transaction, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="text-sm">
                            <div className="font-medium">{transaction.from}</div>
                            <div className="text-gray-500">pays</div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                          <div className="text-sm">
                            <div className="font-medium">{transaction.to}</div>
                            <div className="text-gray-500">receives</div>
                          </div>
                        </div>
                        <div className="text-lg font-semibold text-green-600">{formatCurrency(transaction.amount)}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600 text-center">
                  💡 This is the most efficient way to settle all debts with the minimum number of transactions.
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingDown className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">All Settled Up!</h3>
              <p className="text-gray-500">Everyone's balances are already even.</p>
              <p className="text-sm text-gray-400 mt-1">No transactions needed.</p>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
