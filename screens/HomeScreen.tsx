"use client"

import { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../App"
import { createGroup, getGroupByCode } from "../lib/database"
import { useToast } from "../hooks/useToast"

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Home">

interface Props {
  navigation: HomeScreenNavigationProp
}

export default function HomeScreen({ navigation }: Props) {
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
        navigation.navigate("Group", { groupId: group.id })
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
        navigation.navigate("Group", { groupId: group.id })
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
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoid}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>👥</Text>
            </View>
            <Text style={styles.title}>WiseSplit</Text>
            <Text style={styles.subtitle}>Split expenses with friends, simplified</Text>
          </View>

          <View style={styles.cardContainer}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Create New Group</Text>
              <Text style={styles.cardDescription}>Start a new expense group and invite friends</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Group Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Weekend Trip, Roommates"
                  value={groupName}
                  onChangeText={setGroupName}
                  onSubmitEditing={handleCreateGroup}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handleCreateGroup}
                disabled={isCreating}
              >
                <Text style={styles.primaryButtonText}>{isCreating ? "Creating..." : "Create Group"}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Join Existing Group</Text>
              <Text style={styles.cardDescription}>Enter the group code to join an existing group</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Group Code</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., ABC123"
                  value={groupCode}
                  onChangeText={(text) => setGroupCode(text.toUpperCase())}
                  onSubmitEditing={handleJoinGroup}
                  autoCapitalize="characters"
                />
              </View>

              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={handleJoinGroup}
                disabled={isJoining}
              >
                <Text style={styles.secondaryButtonText}>{isJoining ? "Joining..." : "Join Group"}</Text>
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
    backgroundColor: "#f0f9ff",
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  iconContainer: {
    width: 60,
    height: 60,
    backgroundColor: "#2563eb",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  iconText: {
    fontSize: 24,
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
  cardContainer: {
    flex: 1,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 20,
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
    backgroundColor: "white",
  },
  button: {
    borderRadius: 8,
    padding: 16,
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
    color: "#6b7280",
    marginTop: 20,
  },
})
