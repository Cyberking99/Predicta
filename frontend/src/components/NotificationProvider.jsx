"use client"

import { createContext, useContext } from "react"
import { useContractEvents } from "../../hooks/staking/useContractEvents"

// Create context
const NotificationContext = createContext(null)

// Provider component
export function NotificationProvider({ children }) {
  const contractEvents = useContractEvents()

  return <NotificationContext.Provider value={contractEvents}>{children}</NotificationContext.Provider>
}

// Hook to use the notification context
export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}
