"use client"

import { useState, useCallback } from "react"
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Alert, RefreshControl, Clipboard } from "react-native"
import { Button, Card, ListItem, Badge } from "react-native-elements"
import Icon from "react-native-vector-icons/MaterialIcons"
import { useRoute, type RouteProp, useFocusEffect } from "@react-navigation/native"
import Toast from "react-native-toast-message"
import { getGroup, getMembers, getExpenses, getBalances, deleteExpense } from "../lib/database"
import type { Group, Member, Expense, Balance } from "../lib/supabase"
import type { RootStackParamList } from "../navigation/AppNavigator"
import AddExpenseModal from "../components/AddExpenseModal"
import AddMemberModal from "../components/AddMemberModal"

type GroupScreenRouteProp = RouteProp<RootStackParamList, "Group">

export default function GroupScreen() {
  const route = useRoute<GroupScreenRouteProp>()
  const { groupId } = route.params

  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [balances, setBalances] = useState<Balance[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [totalExpenses, setTotalExpenses] = useState(0)

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
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load group data",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadData()
    }, [groupId]),
  )

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
            Toast.show({
              type: "success",
              text1: "Success",
              text2: "Expense deleted successfully",
            })
            loadData()
          } else {
            Toast.show({
              type: "error",
              text1: "Error",
              text2: "Failed to delete expense",
            })
          }
        },
      },
    ])
  }

  const copyGroupCode = () => {
    if (group) {
      Clipboard.setString(group.code)
      Toast.show({
        type: "success",
        text1: "Copied!",
        text2: "Group code copied to clipboard",
      })
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return "#4CAF50"
    if (balance < 0) return "#F44336"
    return "#666"
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
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Group not found</Text>
          <Text style={styles.errorText}>The group you're looking for doesn't exist.</Text>
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
            <Button
              title={group.code}
              onPress={copyGroupCode}
              buttonStyle={styles.codeButton}
              titleStyle={styles.codeButtonText}
              icon={<Icon name="content-copy" size={16} color="#2196F3" />}
              iconRight
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            title="Add Member"
            onPress={() => setShowAddMember(true)}
            buttonStyle={[styles.actionButton, styles.secondaryButton]}
            titleStyle={styles.secondaryButtonText}
            icon={<Icon name="person-add" size={20} color="#2196F3" />}
          />
          <Button
            title="Add Expense"
            onPress={() => setShowAddExpense(true)}
            buttonStyle={[styles.actionButton, styles.primaryButton]}
            icon={<Icon name="add" size={20} color="#fff" />}
          />
        </View>

        {/* Total Expenses Card */}
        <Card containerStyle={styles.card}>
          <Text style={styles.cardTitle}>Group Total</Text>
          <Text style={styles.totalAmount}>{formatCurrency(totalExpenses)}</Text>
          <Text style={styles.totalLabel}>Total expenses</Text>
        </Card>

        {/* Balances Card */}
        <Card containerStyle={styles.card}>
          <Text style={styles.cardTitle}>Balances</Text>
          {balances.length > 0 ? (
            balances.map((balance) => (
              <ListItem key={balance.member_id} containerStyle={styles.listItem}>
                <ListItem.Content>
                  <ListItem.Title style={styles.memberName}>{balance.member_name}</ListItem.Title>
                </ListItem.Content>
                <Text style={[styles.balanceAmount, { color: getBalanceColor(balance.balance) }]}>
                  {formatCurrency(balance.balance)}
                </Text>
              </ListItem>
            ))
          ) : (
            <Text style={styles.emptyText}>No members yet</Text>
          )}
        </Card>

        {/* Members Card */}
        <Card containerStyle={styles.card}>
          <Text style={styles.cardTitle}>Members ({members.length})</Text>
          {members.map((member) => (
            <ListItem key={member.id} containerStyle={styles.listItem}>
              <View style={styles.memberAvatar}>
                <Text style={styles.memberAvatarText}>{member.name.charAt(0).toUpperCase()}</Text>
              </View>
              <ListItem.Content>
                <ListItem.Title>{member.name}</ListItem.Title>
              </ListItem.Content>
            </ListItem>
          ))}
        </Card>

        {/* Expenses Card */}
        <Card containerStyle={styles.card}>
          <Text style={styles.cardTitle}>Recent Expenses ({expenses.length})</Text>
          {expenses.length > 0 ? (
            expenses.map((expense) => (
              <ListItem key={expense.id} containerStyle={styles.listItem}>
                <ListItem.Content>
                  <View style={styles.expenseHeader}>
                    <ListItem.Title style={styles.expenseDescription}>{expense.description}</ListItem.Title>
                    <Badge
                      value={expense.category}
                      badgeStyle={styles.categoryBadge}
                      textStyle={styles.categoryBadgeText}
                    />
                  </View>
                  <ListItem.Subtitle style={styles.expenseSubtitle}>
                    Paid by {expense.paid_by_member?.name} • {formatCurrency(expense.amount)}
                  </ListItem.Subtitle>
                  <Text style={styles.expenseDate}>{new Date(expense.created_at).toLocaleDateString()}</Text>
                </ListItem.Content>
                <Button
                  onPress={() => handleDeleteExpense(expense.id)}
                  buttonStyle={styles.deleteButton}
                  icon={<Icon name="delete" size={20} color="#F44336" />}
                />
              </ListItem>
            ))
          ) : (
            <View style={styles.emptyExpenses}>
              <Icon name="receipt" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No expenses yet</Text>
              <Text style={styles.emptySubText}>Add your first expense to get started</Text>
            </View>
          )}
        </Card>
      </ScrollView>

      {/* Modals */}
      <AddExpenseModal
        visible={showAddExpense}
        onClose={() => setShowAddExpense(false)}
        groupId={groupId}
        members={members}
        onSuccess={() => {
          setShowAddExpense(false)
          loadData()
        }}
      />

      <AddMemberModal
        visible={showAddMember}
        onClose={() => setShowAddMember(false)}
        groupId={groupId}
        onSuccess={() => {
          setShowAddMember(false)
          loadData()
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
    color: "#666",
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
    color: "#333",
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  header: {
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  groupName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  groupCodeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  groupCodeLabel: {
    fontSize: 14,
    color: "#666",
  },
  codeButton: {
    backgroundColor: "transparent",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  codeButtonText: {
    color: "#2196F3",
    fontSize: 14,
    marginRight: 5,
  },
  actionButtons: {
    flexDirection: "row",
    padding: 20,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
  },
  primaryButton: {
    backgroundColor: "#2196F3",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderColor: "#2196F3",
    borderWidth: 1,
  },
  secondaryButtonText: {
    color: "#2196F3",
  },
  card: {
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2196F3",
    textAlign: "center",
    marginBottom: 5,
  },
  totalLabel: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  listItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  memberName: {
    fontSize: 16,
    fontWeight: "500",
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: "bold",
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  memberAvatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  expenseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  categoryBadgeText: {
    color: "#1976d2",
    fontSize: 12,
  },
  expenseSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  expenseDate: {
    fontSize: 12,
    color: "#999",
  },
  deleteButton: {
    backgroundColor: "transparent",
    padding: 8,
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    fontSize: 16,
    marginTop: 10,
  },
  emptySubText: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
    marginTop: 5,
  },
  emptyExpenses: {
    alignItems: "center",
    paddingVertical: 30,
  },
})
