export const isLocalStorageAvailable = () => {
  try {
    const testKey = 'mdslides_test'
    localStorage.setItem(testKey, testKey)
    localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

export const isMac = /Mac/.test(navigator.platform)
