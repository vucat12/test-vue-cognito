import { authHandlerCognito } from './authHandlerCognito'
import { authHandlerDev } from './authHandlerDev'

/**
 * Authentication Handler Factory with Runtime Toggle
 * 
 * Supports both environment-based and runtime switching:
 * - Environment: VITE_AUTH_MODE ('dev' | 'cognito')
 * - Runtime: useAuthHandler('dev') or useAuthHandler('cognito')
 * - Console: window.APP.useAuthHandler('dev')
 */

// Determine initial handler based on environment
const authMode = import.meta.env.VITE_AUTH_MODE
const isDevelopment = import.meta.env.DEV ||
  import.meta.env.MODE === 'development' ||
  import.meta.env.NODE_ENV === 'development'

const shouldUseDev = authMode === 'dev' || (authMode !== 'cognito' && isDevelopment)

// Default to appropriate handler based on environment
let currentHandler = shouldUseDev ? authHandlerDev : authHandlerCognito

// Log initial handler selection
if (shouldUseDev) {
  console.log('[AUTH] Initial: Using development handler (bypassing Cognito)')
  if (authMode === 'dev') {
    console.log('[AUTH] → Forced by VITE_AUTH_MODE=dev')
  } else {
    console.log('[AUTH] → Auto-detected development mode')
  }
} else {
  console.log('[AUTH] Initial: Using production Cognito handler')
  if (authMode === 'cognito') {
    console.log('[AUTH] → Forced by VITE_AUTH_MODE=cognito')
  } else {
    console.log('[AUTH] → Auto-detected production mode')
  }
}

export function getAuthHandler() {
  return currentHandler
}

export function useAuthHandler(type) {
  if (type === 'dev') {
    currentHandler = authHandlerDev
    console.log('[AUTH] Switched to: Development handler (bypassing Cognito)')
  } else if (type === 'cognito') {
    currentHandler = authHandlerCognito
    console.log('[AUTH] Switched to: Production Cognito handler')
  } else {
    console.warn('[AUTH] Invalid handler type. Use "dev" or "cognito"')
    return currentHandler
  }
  return currentHandler
}

// Export default handler for backward compatibility
export const authHandler = getAuthHandler()

// Re-export for explicit imports if needed
export { authHandlerDev, authHandlerCognito }

// Expose toggle in console for testing
if (typeof window !== 'undefined') {
  window.APP = window.APP || {}
  window.APP.useAuthHandler = useAuthHandler
  window.APP.getAuthHandler = getAuthHandler

  // Add helper to show current handler
  window.APP.getCurrentAuthMode = () => {
    const current = currentHandler === authHandlerDev ? 'dev' : 'cognito'
    console.log(`[AUTH] Current handler: ${current}`)
    return current
  }

  console.log('[AUTH] Console commands available:')
  console.log('  window.APP.useAuthHandler("dev")     - Switch to dev mode')
  console.log('  window.APP.useAuthHandler("cognito") - Switch to Cognito mode')
  console.log('  window.APP.getCurrentAuthMode()      - Show current mode')
}

