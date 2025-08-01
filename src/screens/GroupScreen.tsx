"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import * as Clipboard from "expo-clipboard"
import { getGroup, getMembers, getExpenses, getBalances, deleteExpense, removeMember } from "../lib/database"
import type { Group, Member, Expense, Balance } from "../lib/supabase"
import { useToast } from "../hooks/useToast"
import AddExpenseModal from "../components/AddExpenseModal"
import AddMemberModal from "../components/AddMemberModal"
import SimplifyModal from "../components/SimplifyModal"

export default function GroupScreen({ route, navigation }) {
  const { groupId } = route.params

  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [balances, setBalances] = useState<Balance[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [totalExpenses, setTotalExpenses] = useState(0)

  const [showAddExpense, setShowAddExpense] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [showSimplify, setShowSimplify] = useState(false)

  const { showToast } = useToast()

  const loadData = async () => {
    try {
      const [groupData, membersData, expensesData, balancesData] = await Promise.all([
        getGroup(groupId),
        getMembers(groupId),
        getExpenses(groupId),
        getBalances(groupId),
      ])

      setGroup(groupData)
      setMembers(membersData)
      setExpenses(expensesData)
      setBalances(balancesData)

      const total = expensesData.reduce((sum, expense) => sum + expense.amount, 0)
      setTotalExpenses(total)

      if (groupData) {
        navigation.setOptions({ title: groupData.name })
      }
    } catch (error) {
      showToast("Failed to load group data", "error")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [groupId])

  const onRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  const handleDeleteExpense = (expenseId: string) => {
    Alert.alert("Delete Expense", "Are you sure you want to delete this expense?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const success = await deleteExpense(expenseId)
          if (success) {
            showToast("Expense deleted successfully", "success")
            loadData()
          } else {
            showToast("Failed to delete expense", "error")
          }
        },
      },
    ])
  }

  const handleRemoveMember = (member: Member) => {
    Alert.alert("Remove Member", `Are you sure you want to remove ${member.name} from the group?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          const success = await removeMember(member.id)
          if (success) {
            showToast(`${member.name} removed from the group`, "success")
            loadData()
          } else {
            showToast("Cannot remove member. They may have expenses or be involved in splits.", "error")
          }
        },
      },
    ])
  }

  const copyGroupCode = async () => {
    if (group) {
      await Clipboard.setStringAsync(group.code)
      showToast("Group code copied to clipboard", "success")
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return "#16a34a"
    if (balance < 0) return "#dc2626"
    return "#6b7280"
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading group...</Text>
      </View>
    )
  }

  if (!group) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Group not found</Text>
        <Text style={styles.errorText}>The group you're looking for doesn't exist.</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.codeContainer} onPress={copyGroupCode}>
            <Text style={styles.codeLabel}>Group Code:</Text>
            <View style={styles.code}>
              <Text style={styles.codeText}>{group.code}</Text>
              <Ionicons name="copy" size={16} color="#6b7280" />
            </View>
          </TouchableOpacity>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => setShowAddMember(true)}
            >
              <Ionicons name="person-add" size={20} color="#2563eb" />
              <Text style={styles.secondaryButtonText}>Member</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => setShowAddExpense(true)}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.primaryButtonText}>Expense</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Total */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Group Total</Text>
          <Text style={styles.totalAmount}>{formatCurrency(totalExpenses)}</Text>
        </View>

        {/* Balances */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Balances</Text>
            <TouchableOpacity style={styles.simplifyButton} onPress={() => setShowSimplify(true)}>
              <Ionicons name="shuffle" size={16} color="#2563eb" />
              <Text style={styles.simplifyText}>Simplify</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.balancesList}>
            {balances.map((balance) => (
              <View key={balance.member_id} style={styles.balanceItem}>
                <View style={styles.memberInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{balance.member_name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <Text style={styles.memberName}>{balance.member_name}</Text>
                </View>
                <Text style={[styles.balanceAmount, { color: getBalanceColor(balance.balance) }]}>
                  {formatCurrency(balance.balance)}
                </Text>
              </View>
            ))}
            {balances.length === 0 && <Text style={styles.emptyText}>No members yet</Text>}
          </View>
        </View>

        {/* Members */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Members ({members.length})</Text>
          <View style={styles.membersList}>
            {members.map((member) => (
              <View key={member.id} style={styles.memberItem}>
                <View style={styles.memberInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{member.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <Text style={styles.memberName}>{member.name}</Text>
                </View>
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleRemoveMember(member)}>
                  <Ionicons name="trash" size={16} color="#dc2626" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Expenses */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Expenses ({expenses.length})</Text>
          <View style={styles.expensesList}>
            {expenses.map((expense) => (
              <View key={expense.id} style={styles.expenseItem}>
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseDescription}>{expense.description}</Text>
                  <Text style={styles.expenseDetails}>
                    Paid by {expense.paid_by_member?.name} • {formatCurrency(expense.amount)}
                  </Text>
                  <Text style={styles.expenseDate}>{new Date(expense.created_at).toLocaleDateString()}</Text>
                </View>
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteExpense(expense.id)}>
                  <Ionicons name="trash" size={16} color="#dc2626" />
                </TouchableOpacity>
              </View>
            ))}
            {expenses.length === 0 && (
              <View style={styles.emptyExpenses}>
                <Ionicons name="receipt" size={48} color="#d1d5db" />
                <Text style={styles.emptyTitle}>No expenses yet</Text>
                <Text style={styles.emptyText}>Add your first expense to get started</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Modals */}
      <AddExpenseModal
        visible={showAddExpense}
        onClose={() => setShowAddExpense(false)}
        groupId={groupId}
        members={members}
        onSuccess={loadData}
      />

      <AddMemberModal
        visible={showAddMember}
        onClose={() => setShowAddMember(false)}
        groupId={groupId}
        onSuccess={loadData}
      />

      <SimplifyModal visible={showSimplify} onClose={() => setShowSimplify(false)} balances={balances} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    color: "#6b7280",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
  },
  errorText: {
    color: "#6b7280",
    textAlign: "center",
  },
  header: {
    backgroundColor: "white",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  codeContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  codeLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  code: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  codeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: "#2563eb",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  primaryButtonText: {
    color: "white",
    fontWeight: "600",
  },
  secondaryButtonText: {
    color: "#2563eb",
    fontWeight: "600",
  },
  totalCard: {
    backgroundColor: "white",
    margin: 20,
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  totalLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2563eb",
  },
  card: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  simplifyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  simplifyText: {
    color: "#2563eb",
    fontWeight: "600",
  },
  balancesList: {
    gap: 12,
  },
  balanceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2563eb",
  },
  memberInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  memberName: {
    fontSize: 16,
    color: "#1f2937",
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: "600",
  },
  membersList: {
    gap: 12,
  },
  memberItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  deleteButton: {
    padding: 8,
  },
  expensesList: {
    gap: 16,
  },
  expenseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  expenseDetails: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 2,
  },
  expenseDate: {
    fontSize: 12,
    color: "#9ca3af",
  },
  emptyExpenses: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
    marginTop: 12,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
  },
})
