"use client"

import { useState, useEffect } from "react"
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, RefreshControl } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../App"
import { getGroup, getMembers, getExpenses, getBalances, deleteExpense, removeMember } from "../lib/database"
import type { Group, Member, Expense, Balance } from "../lib/supabase"
import { useToast } from "../hooks/useToast"
import AddExpenseModal from "../components/AddExpenseModal"
import AddMemberModal from "../components/AddMemberModal"
import SimplifyModal from "../components/SimplifyModal"

type Props = NativeStackScreenProps<RootStackParamList, "Group">

export default function GroupScreen({ route, navigation }: Props) {
  const { groupId } = route.params
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [balances, setBalances] = useState<Balance[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [showSimplify, setShowSimplify] = useState(false)
  const [totalExpenses, setTotalExpenses] = useState(0)
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

      // Calculate total expenses
      const total = expensesData.reduce((sum, expense) => sum + expense.amount, 0)
      setTotalExpenses(total)

      // Update navigation title
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
    Alert.alert(
      "Remove Member",
      `Are you sure you want to remove ${member.name} from the group? This action cannot be undone.`,
      [
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
      ],
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return "#059669"
    if (balance < 0) return "#dc2626"
    return "#6b7280"
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading group...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!group) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Group not found</Text>
          <Text style={styles.errorSubtext}>The group you're looking for doesn't exist.</Text>
        </View>
      </SafeAreaView>
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
          <Text style={styles.groupName}>{group.name}</Text>
          <View style={styles.groupCodeContainer}>
            <Text style={styles.groupCodeLabel}>Group Code: </Text>
            <Text style={styles.groupCode}>{group.code}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => setShowAddMember(true)}
          >
            <Text style={styles.secondaryButtonText}>Add Member</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.primaryButton]} onPress={() => setShowAddExpense(true)}>
            <Text style={styles.primaryButtonText}>Add Expense</Text>
          </TouchableOpacity>
        </View>

        {/* Balances Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Balances</Text>
            <TouchableOpacity style={styles.simplifyButton} onPress={() => setShowSimplify(true)}>
              <Text style={styles.simplifyButtonText}>Simplify</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.cardContent}>
            {balances.map((balance) => (
              <View key={balance.member_id} style={styles.balanceRow}>
                <Text style={styles.memberName}>{balance.member_name}</Text>
                <Text style={[styles.balanceAmount, { color: getBalanceColor(balance.balance) }]}>
                  {formatCurrency(balance.balance)}
                </Text>
              </View>
            ))}
            {balances.length === 0 && <Text style={styles.emptyText}>No members yet</Text>}
          </View>
        </View>

        {/* Total Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Group Total</Text>
          <View style={styles.totalContainer}>
            <Text style={styles.totalAmount}>{formatCurrency(totalExpenses)}</Text>
            <Text style={styles.totalLabel}>Total expenses</Text>
          </View>
        </View>

        {/* Members Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Members ({members.length})</Text>
          <View style={styles.cardContent}>
            {members.map((member) => (
              <View key={member.id} style={styles.memberRow}>
                <View style={styles.memberInfo}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>{member.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <Text style={styles.memberName}>{member.name}</Text>
                </View>
                <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveMember(member)}>
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Expenses Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Expenses ({expenses.length})</Text>
          <View style={styles.cardContent}>
            {expenses.map((expense) => (
              <View key={expense.id} style={styles.expenseRow}>
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseDescription}>{expense.description}</Text>
                  <Text style={styles.expenseDetails}>
                    Paid by {expense.paid_by_member?.name} • {formatCurrency(expense.amount)}
                  </Text>
                  <Text style={styles.expenseDate}>{new Date(expense.created_at).toLocaleDateString()}</Text>
                </View>
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteExpense(expense.id)}>
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            ))}
            {expenses.length === 0 && (
              <View style={styles.emptyExpenses}>
                <Text style={styles.emptyText}>No expenses yet</Text>
                <Text style={styles.emptySubtext}>Add your first expense to get started</Text>
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
    backgroundColor: "#f9fafb",
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
    fontSize: 16,
    color: "#6b7280",
  },
  errorText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 16,
    color: "#6b7280",
  },
  header: {
    padding: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  groupName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
  },
  groupCodeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  groupCodeLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  groupCode: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2563eb",
  },
  actionButtons: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#2563eb",
  },
  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  secondaryButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
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
  cardContent: {
    gap: 12,
  },
  simplifyButton: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  simplifyButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  memberName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1f2937",
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: "600",
  },
  totalContainer: {
    alignItems: "center",
    paddingVertical: 16,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2563eb",
  },
  totalLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  memberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  memberInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  memberAvatar: {
    width: 32,
    height: 32,
    backgroundColor: "#dbeafe",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2563eb",
  },
  removeButton: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  removeButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#dc2626",
  },
  expenseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 8,
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
  deleteButton: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 12,
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#dc2626",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "#6b7280",
    paddingVertical: 20,
  },
  emptyExpenses: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 4,
  },
})
