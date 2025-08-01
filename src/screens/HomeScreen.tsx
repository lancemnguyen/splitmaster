"use client"

import { useState } from "react"
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from "react-native"
import { Button, Card, Input } from "react-native-elements"
import Icon from "react-native-vector-icons/MaterialIcons"
import { useNavigation } from "@react-navigation/native"
import type { StackNavigationProp } from "@react-navigation/stack"
import Toast from "react-native-toast-message"
import { createGroup, getGroupByCode } from "../lib/database"
import type { RootStackParamList } from "../navigation/AppNavigator"

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, "Home">

export default function HomeScreen() {
  const [groupName, setGroupName] = useState("")
  const [groupCode, setGroupCode] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const navigation = useNavigation<HomeScreenNavigationProp>()

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please enter a group name",
      })
      return
    }

    setIsCreating(true)
    try {
      const group = await createGroup(groupName.trim())
      if (group) {
        Toast.show({
          type: "success",
          text1: "Success",
          text2: `Group created! Code: ${group.code}`,
        })
        navigation.navigate("Group", { groupId: group.id })
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to create group",
        })
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Something went wrong",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleJoinGroup = async () => {
    if (!groupCode.trim()) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please enter a group code",
      })
      return
    }

    setIsJoining(true)
    try {
      const group = await getGroupByCode(groupCode.trim())
      if (group) {
        navigation.navigate("Group", { groupId: group.id })
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Group not found. Please check the code.",
        })
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Something went wrong",
      })
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Icon name="group" size={40} color="#fff" />
          </View>
          <Text style={styles.title}>WiseSplit</Text>
          <Text style={styles.subtitle}>Split expenses with friends, simplified</Text>
        </View>

        <View style={styles.content}>
          <Card containerStyle={styles.card}>
            <View style={styles.cardHeader}>
              <Icon name="add" size={20} color="#2196F3" />
              <Text style={styles.cardTitle}>Create New Group</Text>
            </View>
            <Text style={styles.cardDescription}>Start a new expense group and invite friends</Text>
            <Input
              placeholder="e.g., Weekend Trip, Roommates"
              value={groupName}
              onChangeText={setGroupName}
              containerStyle={styles.inputContainer}
              inputStyle={styles.input}
            />
            <Button
              title={isCreating ? "Creating..." : "Create Group"}
              onPress={handleCreateGroup}
              loading={isCreating}
              buttonStyle={styles.primaryButton}
              icon={<Icon name="arrow-forward" size={20} color="#fff" />}
              iconRight
            />
          </Card>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <Card containerStyle={styles.card}>
            <View style={styles.cardHeader}>
              <Icon name="group" size={20} color="#2196F3" />
              <Text style={styles.cardTitle}>Join Existing Group</Text>
            </View>
            <Text style={styles.cardDescription}>Enter the group code to join an existing group</Text>
            <Input
              placeholder="e.g., ABC123"
              value={groupCode}
              onChangeText={(text) => setGroupCode(text.toUpperCase())}
              containerStyle={styles.inputContainer}
              inputStyle={[styles.input, styles.upperCase]}
              autoCapitalize="characters"
            />
            <Button
              title={isJoining ? "Joining..." : "Join Group"}
              onPress={handleJoinGroup}
              loading={isJoining}
              buttonStyle={styles.secondaryButton}
              titleStyle={styles.secondaryButtonText}
              icon={<Icon name="arrow-forward" size={20} color="#2196F3" />}
              iconRight
            />
          </Card>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>No sign-up required • Free to use • Share expenses easily</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  iconContainer: {
    backgroundColor: "#2196F3",
    padding: 15,
    borderRadius: 50,
    marginBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  content: {
    flex: 1,
  },
  card: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 10,
  },
  cardDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    fontSize: 16,
  },
  upperCase: {
    textTransform: "uppercase",
  },
  primaryButton: {
    backgroundColor: "#2196F3",
    borderRadius: 8,
    paddingVertical: 12,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderColor: "#2196F3",
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: "#2196F3",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },
  dividerText: {
    marginHorizontal: 15,
    fontSize: 12,
    color: "#999",
    textTransform: "uppercase",
  },
  footer: {
    alignItems: "center",
    marginTop: 30,
  },
  footerText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
  },
})
