const safeStorage = typeof window !== 'undefined' ? window.localStorage : null

export const storageKeys = {
  sidebarCollapsed: 'hor.sidebar.collapsed',
}

export const readStorageValue = (key, fallbackValue = null) => {
  if (!safeStorage) {
    return fallbackValue
  }

  try {
    const rawValue = safeStorage.getItem(key)

    if (rawValue === null) {
      return fallbackValue
    }

    return JSON.parse(rawValue)
  } catch {
    return fallbackValue
  }
}

export const writeStorageValue = (key, value) => {
  if (!safeStorage) {
    return
  }

  try {
    safeStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore non-critical UI persistence failures.
  }
}
