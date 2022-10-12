let isLocalStorageAvailableCached: boolean

export const isLocalStorageAvailable = () => {
  if (isLocalStorageAvailableCached !== undefined) {
    return isLocalStorageAvailableCached
  }

  try {
    const testKey = 'mdslides_test'
    localStorage.setItem(testKey, testKey)
    localStorage.removeItem(testKey)
    isLocalStorageAvailableCached = true
    return true
  } catch {
    isLocalStorageAvailableCached = false
    return false
  }
}

export const isMac = /Mac/.test(navigator.platform)
