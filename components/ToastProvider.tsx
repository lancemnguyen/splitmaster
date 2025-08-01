"use client"

import type React from "react"
import { createContext, useState, useCallback } from "react"
import { View, Text, StyleSheet } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

interface Toast {
  id: string
  message: string
  type: "success" | "error" | "info"
}

interface ToastContextType {
  showToast: (message: string, type: "success" | "error" | "info") => void
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: "success" | "error" | "info") => {
    const id = Date.now().toString()
    const newToast: Toast = { id, message, type }

    setToasts((prev) => [...prev, newToast])

    // Auto remove after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 3000)
  }, [])

  const getToastStyle = (type: string) => {
    switch (type) {
      case "success":
        return { backgroundColor: "#10b981" }
      case "error":
        return { backgroundColor: "#ef4444" }
      default:
        return { backgroundColor: "#3b82f6" }
    }
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.length > 0 && (
        <SafeAreaView style={styles.toastContainer} pointerEvents="none">
          {toasts.map((toast) => (
            <View key={toast.id} style={[styles.toast, getToastStyle(toast.type)]}>
              <Text style={styles.toastText}>{toast.message}</Text>
            </View>
          ))}
        </SafeAreaView>
      )}
    </ToastContext.Provider>
  )
}

const styles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 20,
  },
  toast: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toastText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
})
