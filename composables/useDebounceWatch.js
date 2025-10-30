import { watch } from 'vue'

/**
 * Debounced watch utility for performance optimization
 * @param {Function|Array} source - Watch source(s)
 * @param {Function} callback - Callback function
 * @param {Object} options - Watch options with debounce delay
 */
export function useDebounceWatch(source, callback, options = {}) {
  const { debounce = 300, ...watchOptions } = options
  let timeoutId = null
  
  const debouncedCallback = (...args) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    timeoutId = setTimeout(() => {
      try {
        callback(...args)
      } catch {
        //
      }
      timeoutId = null
    }, debounce)
  }
  
  const stopWatcher = watch(source, debouncedCallback, {
    deep: false, // Default to shallow watching for performance
    ...watchOptions
  })
  
  // Cleanup function
  const cleanup = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    stopWatcher()
  }
  
  return cleanup
}

/**
 * Create a memoized computed property
 * @param {Function} getter - Computed getter function  
 * @param {number} ttl - Time to live in milliseconds
 */
export function useMemoizedComputed(getter, ttl = 5000) {
  let cache = null
  let lastComputed = 0
  
  return () => {
    const now = Date.now()
    
    if (!cache || (now - lastComputed) > ttl) {
      try {
        cache = getter()
        lastComputed = now
      } catch {
        return cache || null
      }
    }
    
    return cache
  }
}

/**
 * Find which property changed between two objects
 * @param {Object} newValues - New values object
 * @param {Object} oldValues - Old values object  
 * @returns {string|null} - Property name that changed
 */
export function findChangedProperty(newValues, oldValues) {
  if (!oldValues) return null
  
  for (const key in newValues) {
    if (newValues[key] !== oldValues[key]) {
      return key
    }
  }
  
  return null
}

/**
 * Fast shallow comparison - much more performant than JSON.stringify
 * @param {Object} obj1 - First object to compare
 * @param {Object} obj2 - Second object to compare
 * @returns {boolean} - True if objects are different
 */
export function hasObjectChanged(obj1, obj2) {
  if (!obj1 || !obj2) return obj1 !== obj2
  
  const keys1 = Object.keys(obj1)
  const keys2 = Object.keys(obj2)
  
  if (keys1.length !== keys2.length) return true
  
  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) return true
  }
  
  return false
}

/**
 * Optimized deep comparison for arrays (faster than JSON.stringify)
 * @param {Array} arr1 - First array
 * @param {Array} arr2 - Second array
 * @returns {boolean} - True if arrays are different
 */
export function hasArrayChanged(arr1, arr2) {
  if (!arr1 || !arr2) return arr1 !== arr2
  if (arr1.length !== arr2.length) return true
  
  for (let i = 0; i < arr1.length; i++) {
    if (typeof arr1[i] === 'object' && typeof arr2[i] === 'object') {
      if (hasObjectChanged(arr1[i], arr2[i])) return true
    } else if (arr1[i] !== arr2[i]) {
      return true
    }
  }
  
  return false
}

/**
 * Simple debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}