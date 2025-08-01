"use client"

import { useState, useEffect } from "react"
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { addExpense } from "../lib/database"
import type { Member } from "../lib/supabase"
import { useToast } from "../hooks/useToast"

interface AddExpenseModalProps {
  visible: boolean
  onClose: () => void
  groupId: string
  members: Member[]
  onSuccess: () => void
}

export default function AddExpenseModal({ visible, onClose, groupId, members, onSuccess }: AddExpenseModalProps) {
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [paidBy, setPaidBy] = useState("")
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    if (members.length > 0 && selectedMembers.length === 0) {
      setSelectedMembers(members.map((member) => member.id))
    }
    if (members.length > 0 && !paidBy) {
      setPaidBy(members[0].id)
    }
  }, [members, visible])

  const handleSubmit = async () => {
    if (!description.trim() || !amount || !paidBy || selectedMembers.length === 0) {
      showToast("Please fill in all required fields", "error")
      return
    }

    const totalAmount = Number.parseFloat(amount)
    if (isNaN(totalAmount) || totalAmount <= 0) {
      showToast("Please enter a valid amount", "error")
      return
    }

    setIsSubmitting(true)
    try {
      const splitAmount = totalAmount / selectedMembers.length
      const splits = selectedMembers.map((memberId) => ({
        memberId,
        amount: splitAmount,
      }))

      const expense = await addExpense(groupId, description.trim(), totalAmount, paidBy, splits)

      if (expense) {
        showToast("Expense added successfully", "success")
        resetForm()
        onClose()
        onSuccess()
      } else {
        showToast("Failed to add expense", "error")
      }
    } catch (error) {
      showToast("Something went wrong", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setDescription("")
    setAmount("")
    setPaidBy(members.length > 0 ? members[0].id : "")
    setSelectedMembers(members.map((member) => member.id))
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const toggleMember = (memberId: string) => {
    if (selectedMembers.includes(memberId)) {
      setSelectedMembers(selectedMembers.filter((id) => id !== memberId))
    } else {
      setSelectedMembers([...selectedMembers, memberId])
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Add New Expense</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.field}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Dinner at restaurant"
                value={description}
                onChangeText={setDescription}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Amount *</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Paid by *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.memberSelector}>
                {members.map((member) => (
                  <TouchableOpacity
                    key={member.id}
                    style={[styles.memberOption, paidBy === member.id && styles.selectedMemberOption]}
                    onPress={() => setPaidBy(member.id)}
                  >
                    <Text style={[styles.memberOptionText, paidBy === member.id && styles.selectedMemberOptionText]}>
                      {member.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Split between *</Text>
              <View style={styles.membersList}>
                {members.map((member) => (
                  <TouchableOpacity key={member.id} style={styles.memberItem} onPress={() => toggleMember(member.id)}>
                    <View style={styles.memberInfo}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{member.name.charAt(0).toUpperCase()}</Text>
                      </View>
                      <Text style={styles.memberName}>{member.name}</Text>
                    </View>
                    <View style={[styles.checkbox, selectedMembers.includes(member.id) && styles.checkedCheckbox]}>
                      {selectedMembers.includes(member.id) && <Ionicons name="checkmark" size={16} color="white" />}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {selectedMembers.length > 0 && amount && (
              <View style={styles.preview}>
                <Text style={styles.previewTitle}>Split Preview:</Text>
                {selectedMembers.map((memberId) => {
                  const member = members.find((m) => m.id === memberId)
                  const splitAmount = Number.parseFloat(amount) / selectedMembers.length
                  return (
                    <View key={memberId} style={styles.previewItem}>
                      <Text style={styles.previewName}>{member?.name}</Text>
                      <Text style={styles.previewAmount}>${isNaN(splitAmount) ? "0.00" : splitAmount.toFixed(2)}</Text>
                    </View>
                  )
                })}
              </View>
            )}

            <View style={styles.buttons}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.submitButton]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.submitButtonText}>Add Expense</Text>
                )}
              </TouchableOpacity>
            </View>
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
    maxHeight: "90%",
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
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  memberSelector: {
    flexDirection: "row",
  },
  memberOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    marginRight: 8,
  },
  selectedMemberOption: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  memberOptionText: {
    color: "#6b7280",
    fontSize: 14,
  },
  selectedMemberOptionText: {
    color: "white",
  },
  membersList: {
    gap: 12,
  },
  memberItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  memberInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
  memberName: {
    fontSize: 16,
    color: "#1f2937",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  checkedCheckbox: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  preview: {
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  previewItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  previewName: {
    fontSize: 14,
    color: "#6b7280",
  },
  previewAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  submitButton: {
    backgroundColor: "#2563eb",
  },
  cancelButtonText: {
    color: "#6b7280",
    fontWeight: "600",
  },
  submitButtonText: {
    color: "white",
    fontWeight: "600",
  },
})
