import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import type { Balance } from "../lib/supabase"

interface SimplifyModalProps {
  visible: boolean
  onClose: () => void
  balances: Balance[]
}

interface Transaction {
  from: string
  to: string
  amount: number
}

export default function SimplifyModal({ visible, onClose, balances }: SimplifyModalProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const calculateSimplifiedTransactions = (): { transactions: Transaction[]; savings: number } => {
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
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Simplify Transactions</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {transactions.length > 0 ? (
              <>
                <View style={styles.resultCard}>
                  <View style={styles.resultHeader}>
                    <Text style={styles.resultTitle}>Optimization Result</Text>
                    {savings > 0 && (
                      <View style={styles.savingsBadge}>
                        <Text style={styles.savingsText}>
                          Saved {savings} transaction{savings !== 1 ? "s" : ""}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.resultDescription}>
                    {transactions.length} transaction{transactions.length !== 1 ? "s" : ""} needed to settle all debts
                  </Text>
                </View>

                <Text style={styles.sectionTitle}>Simplified Transactions:</Text>
                <View style={styles.transactionsList}>
                  {transactions.map((transaction, index) => (
                    <View key={index} style={styles.transactionItem}>
                      <View style={styles.transactionFlow}>
                        <View style={styles.personContainer}>
                          <Text style={styles.personName}>{transaction.from}</Text>
                          <Text style={styles.personRole}>pays</Text>
                        </View>
                        <Ionicons name="arrow-forward" size={20} color="#6b7280" />
                        <View style={styles.personContainer}>
                          <Text style={styles.personName}>{transaction.to}</Text>
                          <Text style={styles.personRole}>receives</Text>
                        </View>
                      </View>
                      <Text style={styles.transactionAmount}>{formatCurrency(transaction.amount)}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.tipCard}>
                  <Text style={styles.tipText}>
                    💡 This is the most efficient way to settle all debts with the minimum number of transactions.
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.allSettled}>
                <View style={styles.allSettledIcon}>
                  <Ionicons name="checkmark-circle" size={48} color="#16a34a" />
                </View>
                <Text style={styles.allSettledTitle}>All Settled Up!</Text>
                <Text style={styles.allSettledText}>Everyone's balances are already even.</Text>
                <Text style={styles.allSettledSubtext}>No transactions needed.</Text>
              </View>
            )}

            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
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
    padding: 20,
  },
  modal: {
    backgroundColor: "white",
    borderRadius: 12,
    width: "100%",
    maxWidth: 500,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  content: {
    padding: 20,
  },
  resultCard: {
    backgroundColor: "#dbeafe",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e40af",
  },
  savingsBadge: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  savingsText: {
    fontSize: 12,
    color: "#16a34a",
    fontWeight: "600",
  },
  resultDescription: {
    fontSize: 14,
    color: "#1e40af",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 16,
  },
  transactionsList: {
    gap: 12,
    marginBottom: 20,
  },
  transactionItem: {
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  transactionFlow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  personContainer: {
    flex: 1,
    alignItems: "center",
  },
  personName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },
  personRole: {
    fontSize: 12,
    color: "#6b7280",
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#16a34a",
    textAlign: "center",
  },
  tipCard: {
    backgroundColor: "#f3f4f6",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  tipText: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
  },
  allSettled: {
    alignItems: "center",
    paddingVertical: 40,
  },
  allSettledIcon: {
    marginBottom: 16,
  },
  allSettledTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
  },
  allSettledText: {
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
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
})
