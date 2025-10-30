import { ref, readonly } from 'vue'

// Global state for application navigation tracking
const applicationNavigationHistory = ref([])
const lastApplicationCard = ref(null)

export const useApplicationNavigation = () => {
  // Mark application card navigation
  const markApplicationCardNavigation = (applicationName) => {
    if (!applicationName) return
    
    const timestamp = Date.now()
    const navigation = {
      applicationName,
      timestamp,
      type: 'application_card'
    }
    
    // Add to history
    applicationNavigationHistory.value.unshift(navigation)
    
    // Keep only last 50 navigations
    if (applicationNavigationHistory.value.length > 50) {
      applicationNavigationHistory.value = applicationNavigationHistory.value.slice(0, 50)
    }
    
    // Update last application card
    lastApplicationCard.value = navigation
    
    // Debug log
  }
  
  // Get navigation history
  const getNavigationHistory = () => {
    return applicationNavigationHistory.value
  }
  
  // Get last application card
  const getLastApplicationCard = () => {
    return lastApplicationCard.value
  }
  
  // Clear navigation history
  const clearNavigationHistory = () => {
    applicationNavigationHistory.value = []
    lastApplicationCard.value = null
  }
  
  // Get recent applications (last 10)
  const getRecentApplications = () => {
    const recent = applicationNavigationHistory.value
      .filter(nav => nav.type === 'application_card')
      .slice(0, 10)
      .map(nav => nav.applicationName)
    
    // Remove duplicates while preserving order
    return [...new Set(recent)]
  }
  
  // Check if application was recently accessed
  const wasRecentlyAccessed = (applicationName, minutesThreshold = 30) => {
    if (!applicationName) return false
    
    const threshold = minutesThreshold * 60 * 1000 // Convert to milliseconds
    const now = Date.now()
    
    return applicationNavigationHistory.value.some(nav => 
      nav.applicationName === applicationName && 
      nav.type === 'application_card' &&
      (now - nav.timestamp) < threshold
    )
  }
  
  return {
    // State
    applicationNavigationHistory: readonly(applicationNavigationHistory),
    lastApplicationCard: readonly(lastApplicationCard),
    
    // Methods
    markApplicationCardNavigation,
    getNavigationHistory,
    getLastApplicationCard,
    clearNavigationHistory,
    getRecentApplications,
    wasRecentlyAccessed
  }
}
