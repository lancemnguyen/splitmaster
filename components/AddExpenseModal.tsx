"use client"

import { useState } from "react"
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { Picker } from "@react-native-picker/picker"
import { addExpense } from "../lib/database"
import type { Member } from "../lib/supabase"
import { useToast } from "../hooks/useToast"

interface Props {
  visible: boolean
  onClose: () => void
  groupId: string
  members: Member[]
  onSuccess: () => void
}

export default function AddExpenseModal({ visible, onClose, groupId, members, onSuccess }: Props) {
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [paidBy, setPaidBy] = useState("")
  const [category, setCategory] = useState("General")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { showToast } = useToast()

  const categories = [
    "General",
    "Food",
    "Transportation",
    "Entertainment",
    "Accommodation",
    "Shopping",
    "Utilities",
    "Other",
  ]

  const resetForm = () => {
    setDescription("")
    setAmount("")
    setPaidBy("")
    setCategory("General")
  }

  const handleSubmit = async () => {
    if (!description.trim() || !amount || !paidBy) {
      showToast("Please fill in all required fields", "error")
      return
    }

    const amountNum = Number.parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast("Please enter a valid amount", "error")
      return
    }

    setIsSubmitting(true)
    try {
      // For simplicity, split equally among all members
      const splitAmount = amountNum / members.length
      const splits = members.map((member) => ({
        memberId: member.id,
        amount: splitAmount,
      }))

      const expense = await addExpense(groupId, description.trim(), amountNum, paidBy, splits, category)

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

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.overlay}>
        <View style={styles.modal}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Add New Expense</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Dinner at restaurant"
                value={description}
                onChangeText={setDescription}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Amount *</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.pickerContainer}>
                <Picker selectedValue={category} onValueChange={setCategory} style={styles.picker}>
                  {categories.map((cat) => (
                    <Picker.Item key={cat} label={cat} value={cat} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Paid by *</Text>
              <View style={styles.pickerContainer}>
                <Picker selectedValue={paidBy} onValueChange={setPaidBy} style={styles.picker}>
                  <Picker.Item label="Select who paid" value="" />
                  {members.map((member) => (
                    <Picker.Item key={member.id} label={member.name} value={member.id} />
                  ))}
                </Picker>
              </View>
            </View>

            <Text style={styles.splitNote}>💡 This expense will be split equally among all members</Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.disabledButton]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                <Text style={styles.submitButtonText}>{isSubmitting ? "Adding..." : "Add Expense"}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
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
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: {
    height: 50,
  },
  splitNote: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 20,
    fontStyle: "italic",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#2563eb",
    alignItems: "center",
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  },
})
