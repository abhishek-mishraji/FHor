const listeners = new Set()

let sessionState = {
  user: null,
  isAuthenticated: false,
  isSessionExpired: false,
  reason: null,
}

const notifyListeners = () => {
  listeners.forEach((listener) => listener(sessionState))
}

const sessionService = {
  getSession() {
    return sessionState
  },

  subscribe(listener) {
    listeners.add(listener)

    return () => listeners.delete(listener)
  },

  setSession(user) {
    sessionState = {
      user,
      isAuthenticated: Boolean(user),
      isSessionExpired: false,
      reason: null,
    }

    notifyListeners()
  },

  clearSession(reason = null) {
    sessionState = {
      user: null,
      isAuthenticated: false,
      isSessionExpired: false,
      reason,
    }

    notifyListeners()
  },

  expireSession(reason = 'Your session has expired. Please sign in again.') {
    sessionState = {
      user: null,
      isAuthenticated: false,
      isSessionExpired: true,
      reason,
    }

    notifyListeners()
  },
}

export default sessionService
