import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native"
import type { Balance } from "../lib/supabase"

interface Props {
  visible: boolean
  onClose: () => void
  balances: Balance[]
}

interface Transaction {
  from: string
  to: string
  amount: number
}

export default function SimplifyModal({ visible, onClose, balances }: Props) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const calculateSimplifiedTransactions = (): { transactions: Transaction[]; savings: number } => {
    // Create working copies of balances
    const creditors = balances
      .filter((b) => b.balance > 0.01)
      .map((b) => ({ ...b }))
      .sort((a, b) => b.balance - a.balance)

    const debtors = balances
      .filter((b) => b.balance < -0.01)
      .map((b) => ({ ...b, balance: Math.abs(b.balance) }))
      .sort((a, b) => b.balance - a.balance)

    const transactions: Transaction[] = []
    let creditorIndex = 0
    let debtorIndex = 0

    while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
      const creditor = creditors[creditorIndex]
      const debtor = debtors[debtorIndex]

      const transactionAmount = Math.min(creditor.balance, debtor.balance)

      if (transactionAmount > 0.01) {
        transactions.push({
          from: debtor.member_name,
          to: creditor.member_name,
          amount: transactionAmount,
        })

        creditor.balance -= transactionAmount
        debtor.balance -= transactionAmount
      }

      if (creditor.balance < 0.01) creditorIndex++
      if (debtor.balance < 0.01) debtorIndex++
    }

    const totalDebtors = balances.filter((b) => b.balance < -0.01).length
    const totalCreditors = balances.filter((b) => b.balance > 0.01).length
    const naiveTransactions = Math.min(totalDebtors * totalCreditors, totalDebtors + totalCreditors - 1)
    const savings = Math.max(0, naiveTransactions - transactions.length)

    return { transactions, savings }
  }

  const { transactions, savings } = calculateSimplifiedTransactions()

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Simplify Transactions</Text>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {transactions.length > 0 ? (
              <>
                <View style={styles.optimizationResult}>
                  <Text style={styles.optimizationTitle}>Optimization Result</Text>
                  {savings > 0 && (
                    <View style={styles.savingsBadge}>
                      <Text style={styles.savingsText}>
                        Saved {savings} transaction{savings !== 1 ? "s" : ""}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.optimizationDescription}>
                    {transactions.length} transaction{transactions.length !== 1 ? "s" : ""} needed to settle all debts
                  </Text>
                </View>

                <Text style={styles.sectionTitle}>Simplified Transactions:</Text>

                {transactions.map((transaction, index) => (
                  <View key={index} style={styles.transactionCard}>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.fromText}>{transaction.from}</Text>
                      <Text style={styles.paysText}>pays</Text>
                      <Text style={styles.toText}>{transaction.to}</Text>
                    </View>
                    <Text style={styles.amountText}>{formatCurrency(transaction.amount)}</Text>
                  </View>
                ))}

                <View style={styles.tip}>
                  <Text style={styles.tipText}>
                    💡 This is the most efficient way to settle all debts with the minimum number of transactions.
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.allSettled}>
                <Text style={styles.allSettledEmoji}>✅</Text>
                <Text style={styles.allSettledTitle}>All Settled Up!</Text>
                <Text style={styles.allSettledDescription}>Everyone's balances are already even.</Text>
                <Text style={styles.allSettledSubtext}>No transactions needed.</Text>
              </View>
            )}
          </ScrollView>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 24,
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 20,
    textAlign: "center",
  },
  content: {
    maxHeight: 400,
  },
  optimizationResult: {
    backgroundColor: "#eff6ff",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  optimizationTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e40af",
    marginBottom: 8,
  },
  savingsBadge: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#166534",
  },
  optimizationDescription: {
    fontSize: 14,
    color: "#1d4ed8",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 16,
  },
  transactionCard: {
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  transactionInfo: {
    flex: 1,
  },
  fromText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },
  paysText: {
    fontSize: 12,
    color: "#6b7280",
    marginVertical: 2,
  },
  toText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },
  amountText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#059669",
  },
  tip: {
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  tipText: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
  },
  allSettled: {
    alignItems: "center",
    paddingVertical: 32,
  },
  allSettledEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  allSettledTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
  },
  allSettledDescription: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 4,
  },
  allSettledSubtext: {
    fontSize: 14,
    color: "#9ca3af",
  },
  closeButton: {
    backgroundColor: "#2563eb",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
})
