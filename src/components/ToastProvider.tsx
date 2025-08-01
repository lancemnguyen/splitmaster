"use client"

import type React from "react"
import { createContext, useState, useCallback } from "react"
import { Text, StyleSheet, Animated } from "react-native"
import { Ionicons } from "@expo/vector-icons"

type ToastType = "success" | "error" | "info"

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined)

interface ToastProviderProps {
  children: React.ReactNode
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toast, setToast] = useState<{
    message: string
    type: ToastType
    visible: boolean
  } | null>(null)

  const [fadeAnim] = useState(new Animated.Value(0))
  const [slideAnim] = useState(new Animated.Value(-100))

  const showToast = useCallback(
    (message: string, type: ToastType = "info", duration = 3000) => {
      setToast({ message, type, visible: true })

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start()

      setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setToast(null)
        })
      }, duration)
    },
    [fadeAnim, slideAnim],
  )

  const getToastStyle = (type: ToastType) => {
    switch (type) {
      case "success":
        return { backgroundColor: "#16a34a", icon: "checkmark-circle" }
      case "error":
        return { backgroundColor: "#dc2626", icon: "alert-circle" }
      default:
        return { backgroundColor: "#2563eb", icon: "information-circle" }
    }
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              backgroundColor: getToastStyle(toast.type).backgroundColor,
            },
          ]}
        >
          <Ionicons name={getToastStyle(toast.type).icon as any} size={20} color="white" />
          <Text style={styles.toastText}>{toast.message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  )
}

const styles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    zIndex: 1000,
    gap: 12,
  },
  toastText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
})
