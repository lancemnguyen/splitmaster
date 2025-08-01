"use client"

import { useState } from "react"
import { Modal, View, StyleSheet, SafeAreaView } from "react-native"
import { Button, Input, Header } from "react-native-elements"
import Icon from "react-native-vector-icons/MaterialIcons"
import Toast from "react-native-toast-message"
import { addMember } from "../lib/database"

interface AddMemberModalProps {
  visible: boolean
  onClose: () => void
  groupId: string
  onSuccess: () => void
}

export default function AddMemberModal({ visible, onClose, groupId, onSuccess }: AddMemberModalProps) {
  const [name, setName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please enter a name",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const member = await addMember(groupId, name.trim())
      if (member) {
        Toast.show({
          type: "success",
          text1: "Success",
          text2: `${member.name} added to the group`,
        })
        setName("")
        onSuccess()
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to add member. Name might already exist.",
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

  const handleClose = () => {
    setName("")
    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <Header
          centerComponent={{
            text: "Add New Member",
            style: { color: "#fff", fontSize: 18, fontWeight: "bold" },
          }}
          rightComponent={<Icon name="close" size={24} color="#fff" onPress={handleClose} />}
          backgroundColor="#2196F3"
        />

        <View style={styles.content}>
          <Input
            label="Name"
            placeholder="Enter member name"
            value={name}
            onChangeText={setName}
            containerStyle={styles.inputContainer}
            autoFocus
          />

          <View style={styles.buttonContainer}>
            <Button
              title="Cancel"
              onPress={handleClose}
              buttonStyle={[styles.button, styles.cancelButton]}
              titleStyle={styles.cancelButtonText}
            />
            <Button
              title={isSubmitting ? "Adding..." : "Add Member"}
              onPress={handleSubmit}
              loading={isSubmitting}
              buttonStyle={[styles.button, styles.submitButton]}
            />
          </View>
        </View>
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
    marginBottom: 30,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15,
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
