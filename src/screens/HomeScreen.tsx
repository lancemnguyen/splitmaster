"use client"

import { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { createGroup, getGroupByCode } from "../lib/database"
import { useToast } from "../hooks/useToast"

export default function HomeScreen({ navigation }) {
  const [groupName, setGroupName] = useState("")
  const [groupCode, setGroupCode] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const { showToast } = useToast()

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      showToast("Please enter a group name", "error")
      return
    }

    setIsCreating(true)
    try {
      const group = await createGroup(groupName.trim())
      if (group) {
        showToast(`Group created! Code: ${group.code}`, "success")
        navigation.navigate("Group", {
          groupId: group.id,
          groupName: group.name,
        })
      } else {
        showToast("Failed to create group", "error")
      }
    } catch (error) {
      showToast("Something went wrong", "error")
    } finally {
      setIsCreating(false)
    }
  }

  const handleJoinGroup = async () => {
    if (!groupCode.trim()) {
      showToast("Please enter a group code", "error")
      return
    }

    setIsJoining(true)
    try {
      const group = await getGroupByCode(groupCode.trim())
      if (group) {
        navigation.navigate("Group", {
          groupId: group.id,
          groupName: group.name,
        })
      } else {
        showToast("Group not found. Please check the code.", "error")
      }
    } catch (error) {
      showToast("Something went wrong", "error")
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="people" size={40} color="white" />
            </View>
            <Text style={styles.title}>WiseSplit</Text>
            <Text style={styles.subtitle}>Split expenses with friends, simplified</Text>
          </View>

          <View style={styles.content}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="add-circle" size={24} color="#2563eb" />
                <Text style={styles.cardTitle}>Create New Group</Text>
              </View>
              <Text style={styles.cardDescription}>Start a new expense group and invite friends</Text>

              <TextInput
                style={styles.input}
                placeholder="e.g., Weekend Trip, Roommates"
                value={groupName}
                onChangeText={setGroupName}
                onSubmitEditing={handleCreateGroup}
              />

              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handleCreateGroup}
                disabled={isCreating}
              >
                {isCreating ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Create Group</Text>
                    <Ionicons name="arrow-forward" size={20} color="white" />
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="people" size={24} color="#2563eb" />
                <Text style={styles.cardTitle}>Join Existing Group</Text>
              </View>
              <Text style={styles.cardDescription}>Enter the group code to join an existing group</Text>

              <TextInput
                style={styles.input}
                placeholder="e.g., ABC123"
                value={groupCode}
                onChangeText={(text) => setGroupCode(text.toUpperCase())}
                onSubmitEditing={handleJoinGroup}
                autoCapitalize="characters"
              />

              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={handleJoinGroup}
                disabled={isJoining}
              >
                {isJoining ? (
                  <ActivityIndicator color="#2563eb" />
                ) : (
                  <>
                    <Text style={[styles.buttonText, styles.secondaryButtonText]}>Join Group</Text>
                    <Ionicons name="arrow-forward" size={20} color="#2563eb" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.footer}>No sign-up required • Free to use • Share expenses easily</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 40,
  },
  iconContainer: {
    backgroundColor: "#2563eb",
    padding: 20,
    borderRadius: 50,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
  },
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginLeft: 12,
  },
  cardDescription: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: "#f9fafb",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
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
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  secondaryButtonText: {
    color: "#2563eb",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e5e7eb",
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 12,
    color: "#9ca3af",
    fontWeight: "500",
  },
  footer: {
    textAlign: "center",
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 20,
  },
})
