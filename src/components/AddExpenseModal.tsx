"use client"

import React, { useState } from "react"
import { Modal, View, Text, StyleSheet, SafeAreaView, ScrollView, Switch } from "react-native"
import { Button, Input, Header, CheckBox } from "react-native-elements"
import { Picker } from "@react-native-picker/picker"
import Icon from "react-native-vector-icons/MaterialIcons"
import Toast from "react-native-toast-message"
import { addExpense } from "../lib/database"
import type { Member } from "../lib/supabase"

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
  const [category, setCategory] = useState("General")
  const [splitType, setSplitType] = useState<"equal" | "custom">("equal")
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [customSplits, setCustomSplits] = useState<{ [memberId: string]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  React.useEffect(() => {
    if (visible && members.length > 0 && selectedMembers.length === 0) {
      // Initially select all members when modal opens
      setSelectedMembers(members.map((member) => member.id))
    }
  }, [visible, members])

  const calculateSplits = () => {
    const totalAmount = Number.parseFloat(amount)
    if (!totalAmount || selectedMembers.length === 0) return []

    const splits: { memberId: string; amount: number }[] = []

    if (splitType === "equal") {
      const splitAmount = totalAmount / selectedMembers.length
      selectedMembers.forEach((memberId) => {
        splits.push({ memberId, amount: splitAmount })
      })
    } else {
      selectedMembers.forEach((memberId) => {
        const splitAmount = Number.parseFloat(customSplits[memberId] || "0")
        splits.push({ memberId, amount: splitAmount })
      })
    }

    return splits
  }

  const validateSplits = () => {
    const totalAmount = Number.parseFloat(amount)
    const splits = calculateSplits()
    const totalSplit = splits.reduce((sum, split) => sum + split.amount, 0)

    if (splitType === "custom") {
      return Math.abs(totalSplit - totalAmount) < 0.01
    }

    return true
  }

  const handleSubmit = async () => {
    if (!description.trim() || !amount || !paidBy || selectedMembers.length === 0) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please fill in all required fields",
      })
      return
    }

    if (!validateSplits()) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Split amounts don't add up correctly",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const splits = calculateSplits()
      const expense = await addExpense(groupId, description.trim(), Number.parseFloat(amount), paidBy, splits, category)

      if (expense) {
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Expense added successfully",
        })
        resetForm()
        onSuccess()
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to add expense",
        })
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Something went wrong",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setDescription("")
    setAmount("")
    setPaidBy("")
    setCategory("General")
    setSplitType("equal")
    setSelectedMembers(members.map((member) => member.id))
    setCustomSplits({})
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleMemberToggle = (memberId: string, checked: boolean) => {
    if (checked) {
      setSelectedMembers([...selectedMembers, memberId])
    } else {
      setSelectedMembers(selectedMembers.filter((id) => id !== memberId))
      const newCustomSplits = { ...customSplits }
      delete newCustomSplits[memberId]
      setCustomSplits(newCustomSplits)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <Header
          centerComponent={{
            text: "Add New Expense",
            style: { color: "#fff", fontSize: 18, fontWeight: "bold" },
          }}
          rightComponent={<Icon name="close" size={24} color="#fff" onPress={handleClose} />}
          backgroundColor="#2196F3"
        />

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Input
            label="Description *"
            placeholder="e.g., Dinner at restaurant"
            value={description}
            onChangeText={setDescription}
            containerStyle={styles.inputContainer}
          />

          <Input
            label="Amount *"
            placeholder="0.00"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            containerStyle={styles.inputContainer}
          />

          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Category</Text>
            <Picker selectedValue={category} onValueChange={setCategory} style={styles.picker}>
              {categories.map((cat) => (
                <Picker.Item key={cat} label={cat} value={cat} />
              ))}
            </Picker>
          </View>

          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Paid by *</Text>
            <Picker selectedValue={paidBy} onValueChange={setPaidBy} style={styles.picker}>
              <Picker.Item label="Select who paid" value="" />
              {members.map((member) => (
                <Picker.Item key={member.id} label={member.name} value={member.id} />
              ))}
            </Picker>
          </View>

          <View style={styles.splitTypeContainer}>
            <Text style={styles.sectionTitle}>Split Type</Text>
            <View style={styles.switchContainer}>
              <Text>Equal Split</Text>
              <Switch
                value={splitType === "custom"}
                onValueChange={(value) => setSplitType(value ? "custom" : "equal")}
              />
              <Text>Custom Split</Text>
            </View>
          </View>

          <View style={styles.membersContainer}>
            <Text style={styles.sectionTitle}>Who's involved? *</Text>
            {members.map((member) => (
              <View key={member.id} style={styles.memberRow}>
                <CheckBox
                  title={member.name}
                  checked={selectedMembers.includes(member.id)}
                  onPress={() => handleMemberToggle(member.id, !selectedMembers.includes(member.id))}
                  containerStyle={styles.checkboxContainer}
                />
                {selectedMembers.includes(member.id) && splitType === "custom" && (
                  <Input
                    placeholder="0.00"
                    value={customSplits[member.id] || ""}
                    onChangeText={(text) =>
                      setCustomSplits({
                        ...customSplits,
                        [member.id]: text,
                      })
                    }
                    keyboardType="numeric"
                    containerStyle={styles.customSplitInput}
                  />
                )}
              </View>
            ))}
          </View>

          {/* Split Preview */}
          {selectedMembers.length > 0 && amount && (
            <View style={styles.previewContainer}>
              <Text style={styles.sectionTitle}>Split Preview</Text>
              {calculateSplits().map((split) => {
                const member = members.find((m) => m.id === split.memberId)
                return (
                  <View key={split.memberId} style={styles.previewRow}>
                    <Text>{member?.name}</Text>
                    <Text>${split.amount.toFixed(2)}</Text>
                  </View>
                )
              })}
              <View style={styles.previewTotal}>
                <Text style={styles.previewTotalText}>Total: ${Number.parseFloat(amount).toFixed(2)}</Text>
              </View>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <Button
              title="Cancel"
              onPress={handleClose}
              buttonStyle={[styles.button, styles.cancelButton]}
              titleStyle={styles.cancelButtonText}
            />
            <Button
              title={isSubmitting ? "Adding..." : "Add Expense"}
              onPress={handleSubmit}
              loading={isSubmitting}
              buttonStyle={[styles.button, styles.submitButton]}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  pickerContainer: {
    marginBottom: 20,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#86939e",
    marginBottom: 10,
  },
  picker: {
    backgroundColor: "#fff",
    borderRadius: 8,
  },
  splitTypeContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 15,
  },
  membersContainer: {
    marginBottom: 20,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  checkboxContainer: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 0,
    padding: 0,
    margin: 0,
  },
  customSplitInput: {
    width: 100,
  },
  previewContainer: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
  previewTotal: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 10,
    marginTop: 10,
  },
  previewTotalText: {
    fontWeight: "bold",
    textAlign: "right",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderColor: "#ccc",
    borderWidth: 1,
  },
  cancelButtonText: {
    color: "#666",
  },
  submitButton: {
    backgroundColor: "#2196F3",
  },
})
